import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { JobProgressItem } from '../../types'

interface JobProgressBarChartProps {
  data: JobProgressItem[]
}

const getBarColor = (progress: number): string => {
  if (progress < 30) return '#ef4444'
  if (progress < 70) return '#eab308'
  return '#22c55e'
}

const JobProgressBarChart: React.FC<JobProgressBarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Belum ada data
      </div>
    )
  }

  const truncated = data.slice(0, 10)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={truncated}
        layout="vertical"
        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 10 }}
          tickFormatter={(v: string) =>
            v.length > 18 ? `${v.substring(0, 18)}...` : v
          }
        />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Progress']}
          contentStyle={{ fontSize: '12px' }}
        />
        <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
          {truncated.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={getBarColor(entry.progress)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default JobProgressBarChart
