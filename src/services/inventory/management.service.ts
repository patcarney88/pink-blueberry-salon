import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface InventoryAlert {
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'EXPIRING'
  productId: string
  productName: string
  currentLevel: number
  threshold: number
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendation: string
}

export interface PredictiveOrder {
  productId: string
  predictedDemand: number
  currentStock: number
  recommendedOrder: number
  confidence: number
  leadTime: number
  reorderDate: Date
}

export class InventoryManagementService {
  /**
   * AI-powered predictive inventory management
   */
  async predictInventoryNeeds(
    branchId: string,
    daysAhead: number = 30
  ): Promise<PredictiveOrder[]> {
    // Get historical consumption data
    const historicalData = await this.getHistoricalConsumption(branchId, 90)

    // Get current inventory levels
    const currentInventory = await prisma.inventory.findMany({
      where: { branch_id: branchId },
      include: { product: true },
    })

    const predictions: PredictiveOrder[] = []

    for (const item of currentInventory) {
      // Calculate consumption rate using time-series analysis
      const consumptionRate = this.calculateConsumptionRate(
        historicalData.filter(h => h.product_id === item.product_id)
      )

      // Apply seasonality adjustments
      const seasonalFactor = this.getSeasonalityFactor(new Date())

      // Calculate predicted demand
      const predictedDemand = Math.ceil(
        consumptionRate * daysAhead * seasonalFactor
      )

      // Factor in safety stock
      const safetyStock = this.calculateSafetyStock(
        consumptionRate,
        item.product.reorder_point || 10
      )

      // Calculate recommended order quantity
      const recommendedOrder = Math.max(
        0,
        predictedDemand + safetyStock - item.quantity_available
      )

      // Calculate confidence score based on data quality
      const confidence = this.calculateConfidenceScore(
        historicalData.filter(h => h.product_id === item.product_id)
      )

      // Estimate lead time and reorder date
      const leadTime = item.product.metadata?.leadTime || 7
      const reorderDate = this.calculateReorderDate(
        item.quantity_available,
        consumptionRate,
        item.product.reorder_point || 10
      )

      predictions.push({
        productId: item.product_id,
        predictedDemand,
        currentStock: item.quantity_available,
        recommendedOrder,
        confidence,
        leadTime,
        reorderDate,
      })
    }

    return predictions.sort((a, b) =>
      a.reorderDate.getTime() - b.reorderDate.getTime()
    )
  }

  /**
   * Real-time inventory tracking with alerts
   */
  async trackInventory(branchId: string): Promise<InventoryAlert[]> {
    const inventory = await prisma.inventory.findMany({
      where: { branch_id: branchId },
      include: { product: true },
    })

    const alerts: InventoryAlert[] = []

    for (const item of inventory) {
      const product = item.product

      // Check for low stock
      if (item.quantity_available <= (product.min_stock_level || 0)) {
        alerts.push({
          type: item.quantity_available === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          productId: product.id,
          productName: product.name,
          currentLevel: item.quantity_available,
          threshold: product.min_stock_level || 0,
          urgency: this.calculateUrgency(item.quantity_available, product.min_stock_level || 0),
          recommendation: `Reorder ${product.reorder_quantity || 50} units immediately`,
        })
      }

      // Check for overstock
      if (product.max_stock_level && item.quantity_available > product.max_stock_level) {
        alerts.push({
          type: 'OVERSTOCK',
          productId: product.id,
          productName: product.name,
          currentLevel: item.quantity_available,
          threshold: product.max_stock_level,
          urgency: 'LOW',
          recommendation: `Consider promotions to reduce excess inventory`,
        })
      }

      // Check for expiring products (if applicable)
      if (product.metadata?.expiryDate) {
        const expiryDate = new Date(product.metadata.expiryDate as string)
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntilExpiry <= 30) {
          alerts.push({
            type: 'EXPIRING',
            productId: product.id,
            productName: product.name,
            currentLevel: item.quantity_available,
            threshold: 30,
            urgency: daysUntilExpiry <= 7 ? 'CRITICAL' : 'HIGH',
            recommendation: `Product expires in ${daysUntilExpiry} days. Prioritize sales.`,
          })
        }
      }
    }

    return alerts.sort((a, b) => {
      const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })
  }

  /**
   * Optimize inventory levels using AI
   */
  async optimizeInventoryLevels(branchId: string) {
    const inventory = await prisma.inventory.findMany({
      where: { branch_id: branchId },
      include: {
        product: true,
        movements: {
          orderBy: { created_at: 'desc' },
          take: 100,
        },
      },
    })

    const optimizations = []

    for (const item of inventory) {
      // Calculate optimal stock levels
      const optimalLevels = this.calculateOptimalStockLevels(item)

      // Update product with optimized levels
      await prisma.product.update({
        where: { id: item.product_id },
        data: {
          min_stock_level: optimalLevels.min,
          max_stock_level: optimalLevels.max,
          reorder_point: optimalLevels.reorderPoint,
          reorder_quantity: optimalLevels.reorderQuantity,
        },
      })

      optimizations.push({
        productId: item.product_id,
        productName: item.product.name,
        currentMin: item.product.min_stock_level,
        currentMax: item.product.max_stock_level,
        optimizedMin: optimalLevels.min,
        optimizedMax: optimalLevels.max,
        potentialSavings: this.calculatePotentialSavings(item, optimalLevels),
      })
    }

    return optimizations
  }

  /**
   * Automated reordering system
   */
  async processAutomaticReorders(branchId: string) {
    const itemsToReorder = await prisma.inventory.findMany({
      where: {
        branch_id: branchId,
        quantity_available: {
          lte: prisma.inventory.fields.product.reorder_point,
        },
      },
      include: { product: true },
    })

    const orders = []

    for (const item of itemsToReorder) {
      if (!item.product.reorder_quantity) continue

      // Create purchase order
      const order = await this.createPurchaseOrder({
        branchId,
        productId: item.product_id,
        quantity: item.product.reorder_quantity,
        supplier: item.product.supplier,
        estimatedCost: item.product.cost_price.mul(item.product.reorder_quantity),
      })

      orders.push(order)

      // Send notification
      await this.notifyReorder(item, order)
    }

    return orders
  }

  /**
   * Track product movement and usage patterns
   */
  async analyzeProductMovement(
    productId: string,
    startDate: Date,
    endDate: Date
  ) {
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        inventory: {
          product_id: productId,
        },
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        inventory: {
          include: {
            product: true,
            branch: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    })

    // Analyze movement patterns
    const analysis = {
      totalIn: 0,
      totalOut: 0,
      totalAdjustments: 0,
      averageDailyUsage: 0,
      peakUsageDay: null as Date | null,
      minUsageDay: null as Date | null,
      turnoverRate: 0,
      stockoutDays: 0,
      wastage: 0,
    }

    const dailyUsage = new Map<string, number>()

    for (const movement of movements) {
      const dateKey = movement.created_at.toISOString().split('T')[0]

      switch (movement.movement_type) {
        case 'IN':
          analysis.totalIn += movement.quantity
          break
        case 'OUT':
          analysis.totalOut += Math.abs(movement.quantity)
          dailyUsage.set(
            dateKey,
            (dailyUsage.get(dateKey) || 0) + Math.abs(movement.quantity)
          )
          break
        case 'ADJUSTMENT':
          analysis.totalAdjustments += movement.quantity
          if (movement.quantity < 0) {
            analysis.wastage += Math.abs(movement.quantity)
          }
          break
      }
    }

    // Calculate average daily usage
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    analysis.averageDailyUsage = analysis.totalOut / days

    // Find peak and min usage days
    if (dailyUsage.size > 0) {
      const sortedUsage = Array.from(dailyUsage.entries()).sort(
        (a, b) => b[1] - a[1]
      )
      analysis.peakUsageDay = new Date(sortedUsage[0][0])
      analysis.minUsageDay = new Date(sortedUsage[sortedUsage.length - 1][0])
    }

    // Calculate turnover rate
    const averageInventory = await this.getAverageInventory(productId, startDate, endDate)
    if (averageInventory > 0) {
      analysis.turnoverRate = analysis.totalOut / averageInventory
    }

    return analysis
  }

  // Helper methods

  private async getHistoricalConsumption(branchId: string, days: number) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await prisma.inventoryMovement.findMany({
      where: {
        inventory: {
          branch_id: branchId,
        },
        movement_type: 'OUT',
        created_at: { gte: startDate },
      },
      include: {
        inventory: true,
      },
    })
  }

  private calculateConsumptionRate(movements: any[]): number {
    if (movements.length === 0) return 0

    const totalConsumption = movements.reduce(
      (sum, m) => sum + Math.abs(m.quantity),
      0
    )

    const days = this.getDateRange(movements)
    return totalConsumption / days
  }

  private getDateRange(movements: any[]): number {
    if (movements.length === 0) return 1

    const dates = movements.map(m => m.created_at.getTime())
    const minDate = Math.min(...dates)
    const maxDate = Math.max(...dates)

    return Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)))
  }

  private getSeasonalityFactor(date: Date): number {
    const month = date.getMonth()

    // Simplified seasonality - adjust based on actual business patterns
    const seasonalFactors = [
      0.8,  // January
      0.9,  // February
      1.0,  // March
      1.1,  // April
      1.2,  // May
      1.3,  // June
      1.2,  // July
      1.1,  // August
      1.0,  // September
      1.1,  // October
      1.3,  // November
      1.5,  // December (holiday season)
    ]

    return seasonalFactors[month]
  }

  private calculateSafetyStock(consumptionRate: number, reorderPoint: number): number {
    // Safety stock = Z × σLT × √LT
    // Simplified calculation - should use actual standard deviation
    const zScore = 1.65 // 95% service level
    const leadTimeVariability = 0.2 // 20% variability
    const leadTime = 7 // days

    return Math.ceil(
      zScore * (consumptionRate * leadTimeVariability) * Math.sqrt(leadTime)
    )
  }

  private calculateConfidenceScore(historicalData: any[]): number {
    if (historicalData.length === 0) return 0

    // Factors affecting confidence:
    // 1. Amount of historical data
    // 2. Consistency of consumption pattern
    // 3. Recency of data

    const dataPoints = Math.min(historicalData.length / 30, 1) * 0.4
    const consistency = this.calculateConsistencyScore(historicalData) * 0.4
    const recency = this.calculateRecencyScore(historicalData) * 0.2

    return Math.round((dataPoints + consistency + recency) * 100)
  }

  private calculateConsistencyScore(data: any[]): number {
    if (data.length < 2) return 0

    const quantities = data.map(d => Math.abs(d.quantity))
    const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length
    const stdDev = Math.sqrt(variance)
    const cv = stdDev / mean // Coefficient of variation

    // Lower CV means more consistent
    return Math.max(0, 1 - cv)
  }

  private calculateRecencyScore(data: any[]): number {
    if (data.length === 0) return 0

    const now = Date.now()
    const weights = data.map(d => {
      const age = (now - d.created_at.getTime()) / (1000 * 60 * 60 * 24)
      return Math.exp(-age / 30) // Exponential decay over 30 days
    })

    return weights.reduce((a, b) => a + b, 0) / data.length
  }

  private calculateReorderDate(
    currentStock: number,
    consumptionRate: number,
    reorderPoint: number
  ): Date {
    if (consumptionRate === 0) return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    const daysUntilReorder = Math.max(0, (currentStock - reorderPoint) / consumptionRate)
    const reorderDate = new Date()
    reorderDate.setDate(reorderDate.getDate() + Math.floor(daysUntilReorder))

    return reorderDate
  }

  private calculateUrgency(current: number, threshold: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const ratio = current / Math.max(threshold, 1)

    if (ratio === 0) return 'CRITICAL'
    if (ratio <= 0.25) return 'HIGH'
    if (ratio <= 0.5) return 'MEDIUM'
    return 'LOW'
  }

  private calculateOptimalStockLevels(inventory: any) {
    const movements = inventory.movements || []
    const consumptionRate = this.calculateConsumptionRate(movements)
    const leadTime = inventory.product.metadata?.leadTime || 7

    // Economic Order Quantity (EOQ) calculation
    const annualDemand = consumptionRate * 365
    const orderingCost = 50 // Cost per order
    const holdingCost = inventory.product.cost_price.toNumber() * 0.25 // 25% of product cost

    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)

    return {
      min: Math.ceil(consumptionRate * leadTime * 1.5), // 50% safety margin
      max: Math.ceil(eoq + (consumptionRate * leadTime * 2)),
      reorderPoint: Math.ceil(consumptionRate * leadTime * 1.5),
      reorderQuantity: Math.ceil(eoq),
    }
  }

  private calculatePotentialSavings(inventory: any, optimalLevels: any): number {
    const currentHoldingCost =
      ((inventory.product.min_stock_level || 0) + (inventory.product.max_stock_level || 0)) / 2 *
      inventory.product.cost_price.toNumber() * 0.25

    const optimalHoldingCost =
      (optimalLevels.min + optimalLevels.max) / 2 *
      inventory.product.cost_price.toNumber() * 0.25

    return Math.max(0, currentHoldingCost - optimalHoldingCost)
  }

  private async getAverageInventory(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Simplified average inventory calculation
    // In production, would track daily inventory levels
    const inventory = await prisma.inventory.findFirst({
      where: { product_id: productId },
    })

    return inventory?.quantity_on_hand || 0
  }

  private async createPurchaseOrder(data: any) {
    // Create purchase order record
    // Implementation depends on your purchase order model
    return {
      id: 'PO-' + Date.now(),
      ...data,
      status: 'PENDING',
      createdAt: new Date(),
    }
  }

  private async notifyReorder(inventory: any, order: any) {
    // Send notification about automatic reorder
    console.log(`Automatic reorder created for ${inventory.product.name}`)
  }
}