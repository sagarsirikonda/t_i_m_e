import React from 'react'

export default function PillSelector({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 rounded transition-colors font-sans text-sm"
            style={{
              height: '36px',
              background: selected ? '#3D3A8C' : '#FFFFFF',
              color: selected ? '#FFFFFF' : '#1A1A18',
              border: selected ? '1px solid #3D3A8C' : '1px solid #E8E6DF',
            }}
            aria-pressed={selected}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
