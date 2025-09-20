'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area
} from 'recharts'
import { Users, Clock, DollarSign, Award, TrendingUp, Calendar, Star, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// Staff performance data
const staffPerformanceData = [
  { name: 'Sarah Johnson', bookings: 145, revenue: 21750, rating: 4.9, utilization: 92 },
  { name: 'Michael Chen', bookings: 132, revenue: 19800, rating: 4.8, utilization: 88 },
  { name: 'Emily Davis', bookings: 128, revenue: 18560, rating: 4.9, utilization: 85 },
  { name: 'James Wilson', bookings: 118, revenue: 17700, rating: 4.7, utilization: 82 },
  { name: 'Anna Martinez', bookings: 112, revenue: 16800, rating: 4.8, utilization: 78 },
  { name: 'David Brown', bookings: 105, revenue: 15750, rating: 4.6, utilization: 75 },
  { name: 'Lisa Anderson', bookings: 98, revenue: 14700, rating: 4.9, utilization: 72 },
  { name: 'Robert Taylor', bookings: 95, revenue: 14250, rating: 4.7, utilization: 70 }
]

// Utilization over time
const utilizationTrendData = [
  { week: 'W1', target: 80, actual: 78, bookings: 285 },
  { week: 'W2', target: 80, actual: 82, bookings: 298 },
  { week: 'W3', target: 80, actual: 85, bookings: 312 },
  { week: 'W4', target: 80, actual: 83, bookings: 305 },
  { week: 'W5', target: 80, actual: 87, bookings: 325 },
  { week: 'W6', target: 80, actual: 89, bookings: 338 },
  { week: 'W7', target: 80, actual: 86, bookings: 320 },
  { week: 'W8', target: 80, actual: 88, bookings: 332 }
]

// Skills matrix
const skillsData = [
  { skill: 'Hair Cutting', proficiency: 92 },
  { skill: 'Coloring', proficiency: 88 },
  { skill: 'Styling', proficiency: 95 },
  { skill: 'Treatments', proficiency: 85 },
  { skill: 'Extensions', proficiency: 72 },
  { skill: 'Customer Service', proficiency: 94 },
  { skill: 'Product Knowledge', proficiency: 87 },
  { skill: 'Upselling', proficiency: 78 }
]

// Staff scheduling efficiency
const schedulingData = [
  { day: 'Monday', scheduled: 8, actual: 7.5, overtime: 0 },
  { day: 'Tuesday', scheduled: 9, actual: 8.8, overtime: 0 },
  { day: 'Wednesday', scheduled: 9, actual: 9.2, overtime: 0.2 },
  { day: 'Thursday', scheduled: 10, actual: 10.5, overtime: 0.5 },
  { day: 'Friday', scheduled: 12, actual: 12.8, overtime: 0.8 },
  { day: 'Saturday', scheduled: 12, actual: 13.2, overtime: 1.2 },
  { day: 'Sunday', scheduled: 6, actual: 5.8, overtime: 0 }
]

// Training & certifications
const trainingData = [
  { name: 'Advanced Coloring', completed: 6, total: 8, percentage: 75 },
  { name: 'Balayage Mastery', completed: 5, total: 8, percentage: 62.5 },
  { name: 'Customer Excellence', completed: 8, total: 8, percentage: 100 },
  { name: 'Product Expertise', completed: 7, total: 8, percentage: 87.5 },
  { name: 'Safety & Hygiene', completed: 8, total: 8, percentage: 100 }
]

// Commission structure
const commissionData = [
  { tier: '0-10K', rate: 35, staff: 2 },
  { tier: '10K-15K', rate: 40, staff: 3 },
  { tier: '15K-20K', rate: 45, staff: 2 },
  { tier: '20K+', rate: 50, staff: 1 }
]

export function StaffAnalytics() {
  // Key metrics
  const totalStaff = 8
  const avgUtilization = 80.5
  const avgRating = 4.8
  const totalRevenue = 138810
  const avgRevenuePerStaff = 17351
  const overtimeHours = 12.5
  const trainingCompletion = 85

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
            <CardTitle>Staff Analytics</CardTitle>
            <CardDescription>
              Team performance, productivity, and development metrics
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Team Size</p>
              <p className="text-2xl font-bold">{totalStaff}</p>
              <div className="flex items-center gap-1 text-blue-600">
                <Users className="h-3 w-3" />
                <span className="text-xs">Full capacity</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Avg Utilization</p>
              <p className="text-2xl font-bold">{avgUtilization}%</p>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">+5% vs target</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            {/* Staff Leaderboard */}
            <div>
              <h3 className="text-sm font-medium mb-3">Top Performers This Month</h3>
              <div className="space-y-3">
                {staffPerformanceData.slice(0, 5).map((staff, index) => (
                  <div key={staff.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{staff.bookings} bookings</span>
                          <span>${(staff.revenue / 1000).toFixed(1)}K revenue</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {staff.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={staff.utilization >= 85 ? "default" : "secondary"}>
                        {staff.utilization}% utilized
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Rating</span>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{avgRating}</p>
                <Progress value={avgRating * 20} className="mt-2" />
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue/Staff</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">${(avgRevenuePerStaff / 1000).toFixed(1)}K</p>
                <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Bookings</span>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">118</p>
                <p className="text-xs text-green-600 mt-1">+8% vs last month</p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Productivity</span>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">94%</p>
                <p className="text-xs text-blue-600 mt-1">Above target</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="utilization" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={utilizationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    name="Utilization %"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="target"
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Target %"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="bookings"
                    fill="hsl(var(--chart-2))"
                    opacity={0.5}
                    name="Total Bookings"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Utilization by Staff */}
            <div>
              <h3 className="text-sm font-medium mb-3">Individual Utilization Rates</h3>
              <div className="space-y-2">
                {staffPerformanceData.map((staff) => (
                  <div key={staff.name} className="flex items-center gap-3">
                    <p className="text-sm w-32 truncate">{staff.name}</p>
                    <div className="flex-1">
                      <Progress value={staff.utilization} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{staff.utilization}%</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Team Skills Overview</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillsData}>
                      <PolarGrid strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="skill" className="text-xs" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Proficiency"
                        dataKey="proficiency"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.5}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Skills Distribution</h3>
                {skillsData.map((skill) => (
                  <div key={skill.skill} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{skill.skill}</p>
                      <span className="text-sm font-medium">{skill.proficiency}%</span>
                    </div>
                    <Progress value={skill.proficiency} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schedulingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="scheduled" fill="hsl(var(--muted-foreground))" opacity={0.5} name="Scheduled Hours" />
                  <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual Hours" />
                  <Bar dataKey="overtime" fill="hsl(var(--destructive))" name="Overtime" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scheduling Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-xl font-bold">472</p>
                <p className="text-xs text-green-600">On budget</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">Overtime Hours</p>
                <p className="text-xl font-bold">{overtimeHours}</p>
                <p className="text-xs text-orange-600">Monitor</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">Coverage Rate</p>
                <p className="text-xl font-bold">98%</p>
                <p className="text-xs text-green-600">Excellent</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">Schedule Efficiency</p>
                <p className="text-xl font-bold">92%</p>
                <p className="text-xs text-blue-600">Good</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="development" className="space-y-4">
            {/* Training Progress */}
            <div>
              <h3 className="text-sm font-medium mb-4">Training & Certifications</h3>
              <div className="space-y-3">
                {trainingData.map((training) => (
                  <div key={training.name} className="p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{training.name}</p>
                      <Badge variant={training.percentage === 100 ? "default" : "secondary"}>
                        {training.completed}/{training.total} staff
                      </Badge>
                    </div>
                    <Progress value={training.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Commission Structure */}
            <div>
              <h3 className="text-sm font-medium mb-4">Commission Tiers</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {commissionData.map((tier) => (
                  <div key={tier.tier} className="p-3 rounded-lg bg-accent/30 text-center">
                    <p className="text-xs text-muted-foreground">{tier.tier}</p>
                    <p className="text-xl font-bold my-1">{tier.rate}%</p>
                    <p className="text-xs">{tier.staff} staff</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Development Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Training Completion</p>
                <p className="text-2xl font-bold text-green-600">{trainingCompletion}%</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Certified Staff</p>
                <p className="text-2xl font-bold text-blue-600">6/8</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Skill Growth</p>
                <p className="text-2xl font-bold text-purple-600">+15%</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}