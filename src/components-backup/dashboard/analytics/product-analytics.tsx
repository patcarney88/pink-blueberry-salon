'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts'
import { Package, TrendingUp, AlertCircle, ShoppingCart, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// Product sales data
const productSalesData = [
  { month: 'Jan', professional: 12500, retail: 8500, total: 21000 },
  { month: 'Feb', professional: 13200, retail: 9100, total: 22300 },
  { month: 'Mar', professional: 14500, retail: 10200, total: 24700 },
  { month: 'Apr', professional: 15800, retail: 11500, total: 27300 },
  { month: 'May', professional: 16500, retail: 12800, total: 29300 },
  { month: 'Jun', professional: 17200, retail: 13500, total: 30700 },
  { month: 'Jul', professional: 17800, retail: 14200, total: 32000 },
  { month: 'Aug', professional: 18500, retail: 15100, total: 33600 },
  { month: 'Sep', professional: 17900, retail: 14500, total: 32400 },
  { month: 'Oct', professional: 18200, retail: 14800, total: 33000 },
  { month: 'Nov', professional: 19100, retail: 15600, total: 34700 },
  { month: 'Dec', professional: 20500, retail: 17200, total: 37700 }
]

// Top products
const topProducts = [
  { name: 'Olaplex Treatment Set', sales: 4850, units: 242, margin: 68, trend: 'up' },
  { name: 'Kerastase Shampoo', sales: 3920, units: 196, margin: 62, trend: 'up' },
  { name: 'Moroccan Oil Treatment', sales: 3580, units: 179, margin: 71, trend: 'stable' },
  { name: 'Dyson Airwrap', sales: 3200, units: 8, margin: 25, trend: 'up' },
  { name: 'Color Wow Dream Coat', sales: 2850, units: 190, margin: 65, trend: 'down' },
  { name: 'Redken Color Extend', sales: 2680, units: 134, margin: 58, trend: 'up' },
  { name: 'L\'Oreal Professional', sales: 2450, units: 163, margin: 55, trend: 'stable' },
  { name: 'GHD Platinum Styler', sales: 2200, units: 11, margin: 30, trend: 'stable' }
]

// Category breakdown
const categoryBreakdown = [
  { category: 'Hair Care', value: 35, revenue: 125650, growth: 18 },
  { category: 'Styling Products', value: 25, revenue: 89750, growth: 22 },
  { category: 'Color Treatment', value: 20, revenue: 71800, growth: 15 },
  { category: 'Tools & Equipment', value: 12, revenue: 43080, growth: 8 },
  { category: 'Accessories', value: 8, revenue: 28720, growth: 12 }
]

// Inventory metrics
const inventoryData = [
  { category: 'Hair Care', stockLevel: 85, turnover: 12.5, daysOnHand: 29 },
  { category: 'Styling Products', stockLevel: 72, turnover: 15.2, daysOnHand: 24 },
  { category: 'Color Treatment', stockLevel: 68, turnover: 8.5, daysOnHand: 43 },
  { category: 'Tools & Equipment', stockLevel: 92, turnover: 3.2, daysOnHand: 114 },
  { category: 'Accessories', stockLevel: 78, turnover: 18.5, daysOnHand: 20 }
]

// Brand performance
const brandPerformance = [
  { brand: 'Olaplex', sales: 42500, growth: 25, satisfaction: 96 },
  { brand: 'Kerastase', sales: 38200, growth: 18, satisfaction: 94 },
  { brand: 'Moroccan Oil', sales: 31500, growth: 12, satisfaction: 92 },
  { brand: 'Redken', sales: 28900, growth: 15, satisfaction: 89 },
  { brand: 'L\'Oreal Pro', sales: 26300, growth: 8, satisfaction: 87 },
  { brand: 'Dyson', sales: 24800, growth: 35, satisfaction: 98 },
  { brand: 'GHD', sales: 19500, growth: 5, satisfaction: 90 }
]

// Price point analysis
const pricePointData = [
  { range: '$0-25', units: 450, revenue: 8550 },
  { range: '$26-50', units: 380, revenue: 14250 },
  { range: '$51-100', units: 220, revenue: 16500 },
  { range: '$101-200', units: 85, revenue: 12750 },
  { range: '$200+', units: 32, revenue: 11200 }
]

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export function ProductAnalytics() {
  // Key metrics
  const totalRevenue = 359000
  const avgOrderValue = 127
  const productMargin = 62.5
  const inventoryTurnover = 11.6
  const topSellerGrowth = 22
  const stockoutRate = 3.2
  const returnRate = 1.8
  const attachmentRate = 45

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Product Analytics</CardTitle>
            <CardDescription>
              Product performance, inventory management, and sales insights
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Product Revenue</p>
              <p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</p>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">+{topSellerGrowth}% YoY</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Gross Margin</p>
              <p className="text-2xl font-bold">{productMargin}%</p>
              <div className="flex items-center gap-1 text-blue-600">
                <ArrowUpRight className="h-3 w-3" />
                <span className="text-xs">+3.5% vs last year</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            {/* Sales Trend Chart */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productSalesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Total Sales"
                  />
                  <Line
                    type="monotone"
                    dataKey="professional"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Professional"
                  />
                  <Line
                    type="monotone"
                    dataKey="retail"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="Retail"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sales Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Order Value</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">${avgOrderValue}</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+12%</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attachment Rate</span>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{attachmentRate}%</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+8%</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Units/Month</span>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">1,167</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+15%</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Return Rate</span>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{returnRate}%</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowDownRight className="h-3 w-3" />
                  <span className="text-xs">-0.5%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Products */}
              <div>
                <h3 className="text-sm font-medium mb-4">Best Selling Products</h3>
                <div className="space-y-3">
                  {topProducts.slice(0, 6).map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-6">#{index + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.units} units • {product.margin}% margin
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">${(product.sales / 1000).toFixed(1)}K</span>
                        {product.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {product.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Performance */}
              <div>
                <h3 className="text-sm font-medium mb-4">Category Performance</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, value }) => `${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{category.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">${(category.revenue / 1000).toFixed(0)}K</span>
                        <Badge variant="outline" className="text-xs">
                          +{category.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            {/* Inventory Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">Inventory Turnover</p>
                <p className="text-xl font-bold">{inventoryTurnover}x</p>
                <p className="text-xs text-green-600">Healthy</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">Stockout Rate</p>
                <p className="text-xl font-bold">{stockoutRate}%</p>
                <p className="text-xs text-orange-600">Monitor</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">Avg Days on Hand</p>
                <p className="text-xl font-bold">32</p>
                <p className="text-xs text-blue-600">Optimal</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">Dead Stock</p>
                <p className="text-xl font-bold">$2.8K</p>
                <p className="text-xs text-red-600">Action needed</p>
              </div>
            </div>

            {/* Inventory by Category */}
            <div>
              <h3 className="text-sm font-medium mb-4">Inventory Health by Category</h3>
              <div className="space-y-3">
                {inventoryData.map((item) => (
                  <div key={item.category} className="p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{item.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.turnover}x turnover • {item.daysOnHand} days on hand
                        </p>
                      </div>
                      <Badge variant={item.stockLevel > 80 ? "default" : item.stockLevel > 60 ? "secondary" : "destructive"}>
                        {item.stockLevel}% stock
                      </Badge>
                    </div>
                    <Progress value={item.stockLevel} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brands" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    dataKey="growth"
                    name="Growth %"
                    unit="%"
                    className="text-xs"
                    label={{ value: 'Growth Rate (%)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="satisfaction"
                    name="Satisfaction"
                    unit="%"
                    className="text-xs"
                    label={{ value: 'Customer Satisfaction (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <ZAxis type="number" dataKey="sales" range={[100, 500]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter
                    name="Brands"
                    data={brandPerformance}
                    fill="hsl(var(--primary))"
                  >
                    {brandPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Brand Rankings */}
            <div>
              <h3 className="text-sm font-medium mb-3">Brand Performance Rankings</h3>
              <div className="space-y-2">
                {brandPerformance.map((brand, index) => (
                  <div key={brand.brand} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{brand.brand}</p>
                        <p className="text-xs text-muted-foreground">
                          {brand.satisfaction}% satisfaction
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${(brand.sales / 1000).toFixed(1)}K</p>
                      <Badge variant={brand.growth > 15 ? "default" : "secondary"} className="text-xs">
                        +{brand.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {/* Price Point Analysis */}
            <div>
              <h3 className="text-sm font-medium mb-4">Price Point Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pricePointData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="units" fill="hsl(var(--primary))" name="Units Sold" />
                    <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--chart-2))" name="Revenue" opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Top Opportunities
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>• Dyson products showing 35% growth</li>
                  <li>• Professional line margin at 68%</li>
                  <li>• Attachment rate improved 8%</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Areas to Improve
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>• Dead stock value at $2.8K</li>
                  <li>• Color treatment turnover low</li>
                  <li>• $200+ segment underperforming</li>
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Strategic Recommendations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="text-sm">
                  <p className="font-medium">Inventory Optimization</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reduce color treatment stock by 20% to improve turnover
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Premium Strategy</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bundle high-margin professional products with services
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Brand Focus</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expand Dyson and Olaplex offerings based on growth trends
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Dead Stock Clearance</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Implement 30% discount on slow-moving items this month
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}