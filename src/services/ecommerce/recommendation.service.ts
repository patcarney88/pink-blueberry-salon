import { prisma } from '@/lib/db/prisma'
import { RecommendationType } from '@prisma/client'

export interface RecommendationContext {
  customerId?: string
  productId?: string
  sessionId?: string
  limit?: number
}

export class RecommendationEngine {
  /**
   * Get personalized product recommendations for a customer
   */
  async getPersonalizedRecommendations(
    customerId: string,
    limit: number = 10
  ) {
    // Get customer's purchase history
    const purchaseHistory = await this.getCustomerPurchaseHistory(customerId)

    // Get customer's browsing history
    const browsingHistory = await this.getCustomerBrowsingHistory(customerId)

    // Get customer's cart items
    const cartItems = await this.getCustomerCartItems(customerId)

    // Calculate affinity scores
    const affinityScores = await this.calculateAffinityScores(
      purchaseHistory,
      browsingHistory,
      cartItems
    )

    // Get collaborative filtering recommendations
    const collaborativeRecs = await this.getCollaborativeFilteringRecommendations(
      customerId,
      purchaseHistory
    )

    // Get content-based recommendations
    const contentRecs = await this.getContentBasedRecommendations(
      affinityScores
    )

    // Combine and rank recommendations
    const recommendations = await this.combineAndRankRecommendations(
      [...collaborativeRecs, ...contentRecs],
      affinityScores,
      limit
    )

    // Store recommendations for tracking
    await this.storeRecommendations(customerId, recommendations, 'PERSONALIZED')

    return recommendations
  }

  /**
   * Get frequently bought together recommendations
   */
  async getFrequentlyBoughtTogether(
    productId: string,
    limit: number = 5
  ) {
    // Get order items that include this product
    const ordersWithProduct = await prisma.ecommerceOrderItem.findMany({
      where: { product_id: productId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    })

    // Count co-occurrences
    const coOccurrences = new Map<string, number>()

    for (const orderItem of ordersWithProduct) {
      for (const item of orderItem.order.items) {
        if (item.product_id !== productId) {
          const count = coOccurrences.get(item.product_id) || 0
          coOccurrences.set(item.product_id, count + 1)
        }
      }
    }

    // Sort by frequency
    const sorted = Array.from(coOccurrences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)

    // Get product details
    const recommendations = await Promise.all(
      sorted.map(async ([prodId, count]) => {
        const product = await prisma.ecommerceProduct.findUnique({
          where: { id: prodId },
        })
        return {
          product,
          score: count / ordersWithProduct.length, // Confidence score
          reason: `Frequently bought together (${count} times)`,
        }
      })
    )

    // Store recommendations
    await this.storeRecommendations(null, recommendations, 'BOUGHT_TOGETHER', productId)

    return recommendations
  }

  /**
   * Get trending products recommendations
   */
  async getTrendingProducts(
    tenantId: string,
    limit: number = 10
  ) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get recent product views
    const recentViews = await prisma.productView.groupBy({
      by: ['product_id'],
      where: {
        created_at: { gte: sevenDaysAgo },
      },
      _count: {
        product_id: true,
      },
      orderBy: {
        _count: {
          product_id: 'desc',
        },
      },
      take: limit * 2, // Get more to filter
    })

    // Get recent purchases
    const recentPurchases = await prisma.ecommerceOrderItem.groupBy({
      by: ['product_id'],
      where: {
        order: {
          created_at: { gte: sevenDaysAgo },
          status: 'DELIVERED',
        },
      },
      _count: {
        product_id: true,
      },
      _sum: {
        quantity: true,
      },
    })

    // Calculate trending score
    const trendingScores = new Map<string, number>()

    for (const view of recentViews) {
      const viewScore = view._count.product_id * 0.3 // View weight
      trendingScores.set(view.product_id, viewScore)
    }

    for (const purchase of recentPurchases) {
      const currentScore = trendingScores.get(purchase.product_id) || 0
      const purchaseScore = (purchase._sum.quantity || 0) * 1.0 // Purchase weight
      trendingScores.set(purchase.product_id, currentScore + purchaseScore)
    }

    // Sort and get top products
    const topProducts = Array.from(trendingScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)

    // Get product details
    const recommendations = await Promise.all(
      topProducts.map(async ([productId, score]) => {
        const product = await prisma.ecommerceProduct.findUnique({
          where: { id: productId },
        })
        return {
          product,
          score: score / Math.max(...trendingScores.values()), // Normalize
          reason: 'Currently trending',
        }
      })
    )

    return recommendations
  }

  /**
   * Get similar products using content-based filtering
   */
  async getSimilarProducts(
    productId: string,
    limit: number = 8
  ) {
    const sourceProduct = await prisma.ecommerceProduct.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    })

    if (!sourceProduct) return []

    // Find products with similar attributes
    const similarProducts = await prisma.ecommerceProduct.findMany({
      where: {
        id: { not: productId },
        AND: [
          // Same category
          sourceProduct.category_id ? { category_id: sourceProduct.category_id } : {},
          // Similar price range (±30%)
          {
            price: {
              gte: sourceProduct.price.toNumber() * 0.7,
              lte: sourceProduct.price.toNumber() * 1.3,
            },
          },
          // Same type
          { type: sourceProduct.type },
          // Active products only
          { status: 'ACTIVE' },
        ],
      },
      take: limit * 2,
    })

    // Calculate similarity scores
    const scoredProducts = similarProducts.map(product => {
      let score = 0

      // Brand similarity
      if (product.brand === sourceProduct.brand) score += 0.3

      // Tag similarity
      const sourceTags = new Set(sourceProduct.tags)
      const commonTags = product.tags.filter(tag => sourceTags.has(tag))
      score += (commonTags.length / Math.max(sourceTags.size, 1)) * 0.4

      // Price similarity
      const priceDiff = Math.abs(
        product.price.toNumber() - sourceProduct.price.toNumber()
      )
      const priceScore = 1 - (priceDiff / sourceProduct.price.toNumber())
      score += priceScore * 0.3

      return {
        product,
        score,
        reason: 'Similar product',
      }
    })

    // Sort by score and take top results
    const recommendations = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // Store recommendations
    await this.storeRecommendations(null, recommendations, 'SIMILAR_PRODUCTS', productId)

    return recommendations
  }

  // Helper methods

  private async getCustomerPurchaseHistory(customerId: string) {
    return await prisma.ecommerceOrder.findMany({
      where: {
        customer_id: customerId,
        status: 'DELIVERED',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
    })
  }

  private async getCustomerBrowsingHistory(customerId: string) {
    return await prisma.productView.findMany({
      where: {
        customer_id: customerId,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100,
    })
  }

  private async getCustomerCartItems(customerId: string) {
    const cart = await prisma.cart.findFirst({
      where: {
        customer_id: customerId,
        status: 'ACTIVE',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return cart?.items || []
  }

  private async calculateAffinityScores(
    purchaseHistory: any[],
    browsingHistory: any[],
    cartItems: any[]
  ) {
    const scores = new Map<string, number>()

    // Categories affinity
    const categoryScores = new Map<string, number>()

    // Process purchases (highest weight)
    for (const order of purchaseHistory) {
      for (const item of order.items) {
        if (item.product.category_id) {
          const current = categoryScores.get(item.product.category_id) || 0
          categoryScores.set(item.product.category_id, current + 2.0)
        }
      }
    }

    // Process browsing (medium weight)
    for (const view of browsingHistory) {
      if (view.product?.category_id) {
        const current = categoryScores.get(view.product.category_id) || 0
        categoryScores.set(view.product.category_id, current + 0.5)
      }
    }

    // Process cart (high weight)
    for (const item of cartItems) {
      if (item.product?.category_id) {
        const current = categoryScores.get(item.product.category_id) || 0
        categoryScores.set(item.product.category_id, current + 1.5)
      }
    }

    return categoryScores
  }

  private async getCollaborativeFilteringRecommendations(
    customerId: string,
    purchaseHistory: any[]
  ) {
    // Find customers with similar purchase patterns
    const purchasedProductIds = new Set(
      purchaseHistory.flatMap(order =>
        order.items.map((item: any) => item.product_id)
      )
    )

    // Find other customers who bought the same products
    const similarCustomers = await prisma.ecommerceOrder.findMany({
      where: {
        customer_id: { not: customerId },
        status: 'DELIVERED',
        items: {
          some: {
            product_id: {
              in: Array.from(purchasedProductIds),
            },
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      take: 100,
    })

    // Count products bought by similar customers
    const productCounts = new Map<string, number>()

    for (const order of similarCustomers) {
      for (const item of order.items) {
        if (!purchasedProductIds.has(item.product_id)) {
          const count = productCounts.get(item.product_id) || 0
          productCounts.set(item.product_id, count + 1)
        }
      }
    }

    // Get top products
    const topProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)

    // Get product details
    const recommendations = await Promise.all(
      topProducts.map(async ([productId, count]) => {
        const product = await prisma.ecommerceProduct.findUnique({
          where: { id: productId },
        })
        return {
          product,
          score: count / similarCustomers.length,
          reason: 'Customers like you also bought',
        }
      })
    )

    return recommendations.filter(r => r.product)
  }

  private async getContentBasedRecommendations(
    affinityScores: Map<string, number>
  ) {
    if (affinityScores.size === 0) return []

    // Get top categories
    const topCategories = Array.from(affinityScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoryId]) => categoryId)

    // Get products from top categories
    const products = await prisma.ecommerceProduct.findMany({
      where: {
        category_id: { in: topCategories },
        status: 'ACTIVE',
      },
      orderBy: [
        { average_rating: 'desc' },
        { purchase_count: 'desc' },
      ],
      take: 20,
    })

    // Score products based on category affinity
    const recommendations = products.map(product => ({
      product,
      score: (affinityScores.get(product.category_id!) || 0) /
             Math.max(...affinityScores.values()),
      reason: 'Based on your interests',
    }))

    return recommendations
  }

  private async combineAndRankRecommendations(
    recommendations: any[],
    affinityScores: Map<string, number>,
    limit: number
  ) {
    // Remove duplicates and combine scores
    const productMap = new Map<string, any>()

    for (const rec of recommendations) {
      if (!rec.product) continue

      const productId = rec.product.id
      const existing = productMap.get(productId)

      if (existing) {
        // Combine scores
        existing.score = (existing.score + rec.score) / 2
      } else {
        productMap.set(productId, rec)
      }
    }

    // Apply diversity to avoid category concentration
    const diversifiedRecs = this.applyDiversity(
      Array.from(productMap.values()),
      limit
    )

    return diversifiedRecs
  }

  private applyDiversity(recommendations: any[], limit: number) {
    const selected: any[] = []
    const categoryCount = new Map<string, number>()
    const maxPerCategory = Math.ceil(limit / 3)

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score)

    for (const rec of recommendations) {
      const categoryId = rec.product?.category_id
      const count = categoryCount.get(categoryId) || 0

      // Limit items per category for diversity
      if (count < maxPerCategory) {
        selected.push(rec)
        categoryCount.set(categoryId, count + 1)
      }

      if (selected.length >= limit) break
    }

    return selected
  }

  private async storeRecommendations(
    customerId: string | null,
    recommendations: any[],
    type: RecommendationType,
    sourceProductId?: string
  ) {
    const records = recommendations.map(rec => ({
      tenant_id: rec.product?.tenant_id,
      source_product_id: sourceProductId,
      recommended_product_id: rec.product?.id,
      customer_id: customerId,
      type,
      confidence_score: rec.score,
      reason: rec.reason,
      is_active: true,
    }))

    await prisma.productRecommendation.createMany({
      data: records,
      skipDuplicates: true,
    })
  }
}