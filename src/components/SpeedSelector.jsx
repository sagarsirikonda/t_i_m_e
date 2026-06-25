import React from 'react'
import { SPEED_OPTIONS } from '../utils/speedLabels.js'

export default function SpeedSelector({ value, onChange }) {
  return (
    <div className="flex gap-2 w-full">
      {SPEED_OPTIONS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded transition-opacity"
            style={{
              minHeight: '44px',
              background: selected ? opt.color : '#FFFFFF',
              color: selected ? opt.textColor : '#1A1A18',
              border: selected ? `1px solid ${opt.color}` : '1px solid #E8E6DF',
            }}
            aria-pressed={selected}
          >
            <span className="font-mono text-base font-medium">{opt.symbol}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SpeedLegend() {
  return (
    <div className="flex gap-2 w-full mt-1">
      {SPEED_OPTIONS.map((opt) => (
        <div key={opt.value} className="flex-1 text-center">
          <span className="text-xs text-gray-500 font-sans leading-tight block">{opt.label}</span>
        </div>
      ))}
    </div>
  )
}
