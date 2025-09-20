'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'
import { Star, TrendingUp, MessageSquare, ThumbsUp, Users } from 'lucide-react'

const satisfactionData = [
  { name: 'Overall', value: 92, fill: 'hsl(var(--primary))' }
]

const ratingDistribution = [
  { name: '5 Stars', value: 68, fill: 'hsl(var(--chart-1))' },
  { name: '4 Stars', value: 22, fill: 'hsl(var(--chart-2))' },
  { name: '3 Stars', value: 7, fill: 'hsl(var(--chart-3))' },
  { name: '2 Stars', value: 2, fill: 'hsl(var(--chart-4))' },
  { name: '1 Star', value: 1, fill: 'hsl(var(--destructive))' }
]

const feedbackCategories = [
  { category: 'Service Quality', score: 94, reviews: 234 },
  { category: 'Staff Friendliness', score: 96, reviews: 228 },
  { category: 'Cleanliness', score: 91, reviews: 198 },
  { category: 'Value for Money', score: 88, reviews: 185 },
  { category: 'Wait Time', score: 85, reviews: 167 }
]

export function CustomerSatisfaction() {
  const averageRating = 4.6
  const totalReviews = 812
  const npsScore = 72

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value}% of reviews
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customer Satisfaction</CardTitle>
            <CardDescription>
              Track customer feedback and satisfaction metrics
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            +5%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <div>
              <p className="text-2xl font-bold">{averageRating}</p>
              <p className="text-xs text-muted-foreground">
                Based on {totalReviews} reviews
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">NPS Score</p>
            <p className="text-2xl font-bold text-green-600">{npsScore}</p>
          </div>
        </div>

        {/* Satisfaction Gauge */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              data={satisfactionData}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: 'hsl(var(--muted))' }}
                dataKey="value"
                cornerRadius={10}
                fill="hsl(var(--primary))"
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground"
              >
                <tspan className="text-3xl font-bold">92%</tspan>
                <tspan x="50%" dy="1.5em" className="text-sm fill-muted-foreground">
                  Satisfaction
                </tspan>
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div>
          <p className="text-sm font-medium mb-3">Rating Distribution</p>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratingDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {ratingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Categories */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Feedback by Category</p>
          {feedbackCategories.map((category) => (
            <div key={category.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category.category}</span>
                <span className="font-medium">{category.score}%</span>
              </div>
              <Progress value={category.score} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {category.reviews} reviews
              </p>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-accent/50">
            <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Response Rate</p>
            <p className="text-sm font-medium">95%</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/50">
            <ThumbsUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Recommend</p>
            <p className="text-sm font-medium">89%</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/50">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Return Rate</p>
            <p className="text-sm font-medium">76%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}