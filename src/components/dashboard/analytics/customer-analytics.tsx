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
  RadialBarChart,
  RadialBar
} from 'recharts'
import { Users, UserPlus, Heart, Star, TrendingUp, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Customer growth data
const customerGrowthData = [
  { month: 'Jan', newCustomers: 45, returningCustomers: 285, totalActive: 330 },
  { month: 'Feb', newCustomers: 52, returningCustomers: 298, totalActive: 350 },
  { month: 'Mar', newCustomers: 68, returningCustomers: 315, totalActive: 383 },
  { month: 'Apr', newCustomers: 75, returningCustomers: 340, totalActive: 415 },
  { month: 'May', newCustomers: 82, returningCustomers: 365, totalActive: 447 },
  { month: 'Jun', newCustomers: 78, returningCustomers: 385, totalActive: 463 },
  { month: 'Jul', newCustomers: 85, returningCustomers: 402, totalActive: 487 },
  { month: 'Aug', newCustomers: 92, returningCustomers: 425, totalActive: 517 },
  { month: 'Sep', newCustomers: 88, returningCustomers: 445, totalActive: 533 },
  { month: 'Oct', newCustomers: 95, returningCustomers: 468, totalActive: 563 },
  { month: 'Nov', newCustomers: 105, returningCustomers: 485, totalActive: 590 },
  { month: 'Dec', newCustomers: 112, returningCustomers: 510, totalActive: 622 }
]

// Customer segment data
const customerSegments = [
  { segment: 'VIP (Monthly+)', value: 15, count: 93, avgSpend: 450 },
  { segment: 'Regulars (Bi-Weekly)', value: 25, count: 156, avgSpend: 280 },
  { segment: 'Frequent (Monthly)', value: 35, count: 218, avgSpend: 175 },
  { segment: 'Occasional', value: 20, count: 124, avgSpend: 95 },
  { segment: 'New (<3 visits)', value: 5, count: 31, avgSpend: 125 }
]

// Customer satisfaction metrics
const satisfactionData = [
  { category: 'Service Quality', score: 94, benchmark: 85 },
  { category: 'Staff Friendliness', score: 96, benchmark: 88 },
  { category: 'Value for Money', score: 88, benchmark: 82 },
  { category: 'Booking Experience', score: 91, benchmark: 80 },
  { category: 'Salon Ambiance', score: 93, benchmark: 86 },
  { category: 'Wait Times', score: 85, benchmark: 78 }
]

// Customer lifetime value cohorts
const lifetimeValueData = [
  { cohort: 'Q1 2023', month1: 125, month3: 380, month6: 750, month12: 1450 },
  { cohort: 'Q2 2023', month1: 135, month3: 415, month6: 820, month12: 1580 },
  { cohort: 'Q3 2023', month1: 145, month3: 445, month6: 880, month12: null },
  { cohort: 'Q4 2023', month1: 155, month3: 475, month6: null, month12: null },
  { cohort: 'Q1 2024', month1: 165, month3: null, month6: null, month12: null }
]

// Age demographics
const ageDistribution = [
  { age: '18-24', percentage: 12 },
  { age: '25-34', percentage: 28 },
  { age: '35-44', percentage: 32 },
  { age: '45-54', percentage: 18 },
  { age: '55+', percentage: 10 }
]

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export function CustomerAnalytics() {
  // Key metrics
  const totalCustomers = 622
  const monthlyActiveCustomers = 487
  const avgCustomerLifetime = 18 // months
  const netPromoterScore = 72
  const retentionRate = 82.5
  const churnRate = 17.5
  const avgLifetimeValue = 2850
  const avgVisitsPerYear = 8.5

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
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
            <CardTitle>Customer Analytics</CardTitle>
            <CardDescription>
              Customer insights, segmentation, and lifetime value analysis
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{totalCustomers}</p>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">+22% YoY</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Retention Rate</p>
              <p className="text-2xl font-bold">{retentionRate}%</p>
              <div className="flex items-center gap-1 text-blue-600">
                <ArrowUpRight className="h-3 w-3" />
                <span className="text-xs">+5.2% vs last year</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            <TabsTrigger value="lifetime">Lifetime Value</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Customer Growth Chart */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalActive"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Total Active"
                  />
                  <Line
                    type="monotone"
                    dataKey="returningCustomers"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Returning"
                  />
                  <Line
                    type="monotone"
                    dataKey="newCustomers"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="New"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Active</span>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{monthlyActiveCustomers}</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+15.2%</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Lifetime</span>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{avgCustomerLifetime}m</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+2.5 months</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">NPS Score</span>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{netPromoterScore}</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+8 points</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg LTV</span>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">${avgLifetimeValue}</p>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs">+18%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Customer Segments</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerSegments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ segment, value }) => `${segment}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {customerSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Segment Details</h3>
                {customerSegments.map((segment, index) => (
                  <div key={segment.segment} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{segment.segment}</p>
                        <p className="text-xs text-muted-foreground">
                          {segment.count} customers • ${segment.avgSpend} avg spend
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{segment.value}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="satisfaction" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={satisfactionData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis type="category" dataKey="category" className="text-xs" width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="score" fill="hsl(var(--primary))" name="Our Score" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="benchmark" fill="hsl(var(--muted-foreground))" name="Industry Avg" radius={[0, 4, 4, 0]} opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Satisfaction Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Overall Satisfaction</p>
                <p className="text-2xl font-bold text-green-600">92%</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Heart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Would Recommend</p>
                <p className="text-2xl font-bold text-blue-600">88%</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">5-Star Reviews</p>
                <p className="text-2xl font-bold text-purple-600">76%</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lifetime" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-4">Customer Lifetime Value by Cohort</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium">Cohort</th>
                      <th className="text-right p-2 text-sm font-medium">Month 1</th>
                      <th className="text-right p-2 text-sm font-medium">Month 3</th>
                      <th className="text-right p-2 text-sm font-medium">Month 6</th>
                      <th className="text-right p-2 text-sm font-medium">Month 12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifetimeValueData.map((cohort) => (
                      <tr key={cohort.cohort} className="border-b">
                        <td className="p-2 font-medium">{cohort.cohort}</td>
                        <td className="text-right p-2">${cohort.month1}</td>
                        <td className="text-right p-2">${cohort.month3}</td>
                        <td className="text-right p-2">
                          {cohort.month6 ? `$${cohort.month6}` : '-'}
                        </td>
                        <td className="text-right p-2">
                          {cohort.month12 ? `$${cohort.month12}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Retention & Churn */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <h4 className="text-sm font-medium mb-2">Retention Rate</h4>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-green-600">{retentionRate}%</p>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Target: 85%</p>
                    <Badge variant="outline" className="text-green-600">On Track</Badge>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                <h4 className="text-sm font-medium mb-2">Churn Rate</h4>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-red-600">{churnRate}%</p>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Target: &lt;15%</p>
                    <Badge variant="outline" className="text-red-600">Needs Work</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Age Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="age" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="percentage"
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Customer Insights</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-sm font-medium">Top Referral Source</p>
                    <p className="text-xs text-muted-foreground mt-1">Word of Mouth (42%)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-sm font-medium">Average Distance</p>
                    <p className="text-xs text-muted-foreground mt-1">5.2 miles from salon</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-sm font-medium">Preferred Booking</p>
                    <p className="text-xs text-muted-foreground mt-1">Online (68%) vs Phone (32%)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-sm font-medium">Peak Age Group</p>
                    <p className="text-xs text-muted-foreground mt-1">35-44 years (32%)</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}