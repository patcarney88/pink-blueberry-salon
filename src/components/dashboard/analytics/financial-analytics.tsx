'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const revenueData = [
  { month: 'Jan', revenue: 125000, expenses: 45000, profit: 80000, lastYear: 105000 },
  { month: 'Feb', revenue: 132000, expenses: 48000, profit: 84000, lastYear: 110000 },
  { month: 'Mar', revenue: 145000, expenses: 52000, profit: 93000, lastYear: 120000 },
  { month: 'Apr', revenue: 158000, expenses: 55000, profit: 103000, lastYear: 135000 },
  { month: 'May', revenue: 168000, expenses: 58000, profit: 110000, lastYear: 145000 },
  { month: 'Jun', revenue: 175000, expenses: 60000, profit: 115000, lastYear: 150000 },
  { month: 'Jul', revenue: 182000, expenses: 62000, profit: 120000, lastYear: 155000 },
  { month: 'Aug', revenue: 190000, expenses: 65000, profit: 125000, lastYear: 160000 },
  { month: 'Sep', revenue: 178000, expenses: 61000, profit: 117000, lastYear: 152000 },
  { month: 'Oct', revenue: 185000, expenses: 63000, profit: 122000, lastYear: 158000 },
  { month: 'Nov', revenue: 195000, expenses: 66000, profit: 129000, lastYear: 165000 },
  { month: 'Dec', revenue: 210000, expenses: 70000, profit: 140000, lastYear: 175000 }
]

const categoryBreakdown = [
  { category: 'Hair Services', value: 45, revenue: 850000 },
  { category: 'Color Services', value: 25, revenue: 472500 },
  { category: 'Nail Services', value: 15, revenue: 283500 },
  { category: 'Spa Services', value: 10, revenue: 189000 },
  { category: 'Product Sales', value: 5, revenue: 94500 }
]

const expenseBreakdown = [
  { category: 'Staff Salaries', value: 40, amount: 312000 },
  { category: 'Product Costs', value: 20, amount: 156000 },
  { category: 'Rent & Utilities', value: 15, amount: 117000 },
  { category: 'Marketing', value: 10, amount: 78000 },
  { category: 'Equipment', value: 8, amount: 62400 },
  { category: 'Other', value: 7, amount: 54600 }
]

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export function FinancialAnalytics() {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('year')

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1)
  const yoyGrowth = 15.8

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = (entry: any) => {
    return `${entry.category}: ${entry.value}%`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Comprehensive financial metrics and trends
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</p>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">+{yoyGrowth}% YoY</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold">{profitMargin}%</p>
              <div className="flex items-center gap-1 text-blue-600">
                <Percent className="h-3 w-3" />
                <span className="text-xs">+2.3% vs last year</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="comparison">YoY Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Transaction</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">$127</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+8.5%</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gross Margin</span>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">73%</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+1.2%</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Operating Costs</span>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">$65K</p>
                <div className="flex items-center gap-1 text-red-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+5.2%</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">EBITDA</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">$142K</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+12.3%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Revenue by Category</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={100}
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
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Category Performance</h3>
                {categoryBreakdown.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(category.revenue / 1000).toFixed(0)}K revenue
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{category.value}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Expense Breakdown</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Expense Categories</h3>
                {expenseBreakdown.map((expense, index) => (
                  <div key={expense.category} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(expense.amount / 1000).toFixed(0)}K annually
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{expense.value}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="lastYear"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}