"use client"

import { ReactNode } from "react"

interface StatCard {
  title: string
  value: number | string
  icon: ReactNode
  color: string
  bgColor: string
  loading?: boolean
}

interface StatsCardsProps {
  stats: StatCard[]
  title?: string
  description?: string
  loading?: boolean
  gridCols?: string
}

export default function StatsCards({ stats, title, description, loading = false, gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }: StatsCardsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {title && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className={`grid ${gridCols} gap-4`}>
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {loading || stat.loading ? "..." : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
