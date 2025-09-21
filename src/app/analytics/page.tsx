'use client'

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/20 to-pink-50/20 dark:from-gray-900 dark:via-purple-950/20 dark:to-pink-950/20">
      {/* Navigation */}
      <nav className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </Link>
              <span className="text-gray-400">|</span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Business Analytics
              </h1>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </nav>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
    </div>
  )
}