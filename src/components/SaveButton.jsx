import React, { useState } from 'react'

export default function SaveButton({ onSave, label, updateLabel }) {
  const [state, setState] = useState('idle') // idle | saving | saved | error

  async function handleClick() {
    setState('saving')
    try {
      await onSave()
      setState('saved')
      setTimeout(() => setState('idle'), 2000)
    } catch (e) {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={state === 'saving'}
        className="w-full font-sans font-medium text-white rounded transition-opacity"
        style={{
          height: '44px',
          background: state === 'saving' ? '#6B68B0' : '#3D3A8C',
          borderRadius: '8px',
          opacity: state === 'saving' ? 0.7 : 1,
        }}
      >
        {state === 'saving' ? 'Saving...' : (updateLabel || label)}
      </button>

      {state === 'saved' && (
        <div
          className="flex items-center gap-1 mt-2 text-sm font-sans transition-opacity"
          style={{ color: '#2D7A4F' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 4" stroke="#2D7A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Saved
        </div>
      )}

      {state === 'error' && (
        <p className="mt-2 text-sm font-sans" style={{ color: '#C0392B' }}>
          Failed to save. Check your connection.
        </p>
      )}
    </div>
  )
}
