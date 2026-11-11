import React from 'react'

interface ProgressBarProps {
  value: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  size = 'md',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value))

  const getBarColor = () => {
    if (clamped < 30) return 'bg-red-500'
    if (clamped < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const heightClass = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }[size]

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-600 font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-semibold text-gray-700">{clamped.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
