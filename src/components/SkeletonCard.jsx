import React from 'react'

export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="py-4 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded mb-2"
          style={{
            background: '#E8E6DF',
            width: i === 0 ? '40%' : i === lines - 1 ? '60%' : '80%',
          }}
        />
      ))}
    </div>
  )
}
