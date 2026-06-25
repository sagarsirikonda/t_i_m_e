import React, { useState } from 'react'
import { getSpeedOption } from '../utils/speedLabels.js'
import SpeedSelector, { SpeedLegend } from './SpeedSelector.jsx'
import PillSelector from './PillSelector.jsx'
import SaveButton from './SaveButton.jsx'

// Daily entry card with inline edit
export function DailyEntryCard({ entry, onSave }) {
  const [editing, setEditing] = useState(false)
  const [speed, setSpeed] = useState(entry.speed)
  const [confidence, setConfidence] = useState(entry.confidence)
  const [note, setNote] = useState(entry.note || '')
  const [expanded, setExpanded] = useState(false)

  const opt = getSpeedOption(entry.speed)

  async function handleSave() {
    await onSave(entry.date, { speed, confidence, note })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
        <p className="font-mono text-sm mb-3" style={{ color: '#1A1A18' }}>{entry.date}</p>
        <SpeedSelector value={speed} onChange={setSpeed} />
        <SpeedLegend />
        <div className="flex gap-2 mt-3">
          {[{ value: true, label: 'Yes, clear' }, { value: false, label: 'Not sure' }].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setConfidence(opt.value)}
              className="px-3 text-sm rounded font-sans"
              style={{
                height: '36px',
                background: confidence === opt.value ? '#3D3A8C' : '#FFFFFF',
                color: confidence === opt.value ? '#FFFFFF' : '#1A1A18',
                border: confidence === opt.value ? '1px solid #3D3A8C' : '1px solid #E8E6DF',
              }}
            >{opt.label}</button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          maxLength={280}
          rows={2}
          placeholder="Note (optional)"
          className="w-full mt-3 p-2 text-sm font-sans rounded resize-none outline-none"
          style={{ border: '1px solid #E8E6DF', background: '#FAFAF9' }}
        />
        <div className="flex gap-2 mt-2">
          <SaveButton onSave={handleSave} label="Update" updateLabel="Update" />
          <button
            onClick={() => setEditing(false)}
            className="flex-1 text-sm font-sans rounded"
            style={{ height: '44px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}
          >Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm mb-1" style={{ color: '#1A1A18' }}>{entry.date}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium"
              style={{ background: opt.color, color: opt.textColor }}
            >{opt.symbol} {opt.label}</span>
            <span className="text-xs font-sans" style={{ color: '#9E9E8E' }}>
              {entry.confidence ? 'clear' : 'uncertain'}
            </span>
          </div>
          {entry.note && (
            <div className="mt-1">
              <p
                className="text-sm font-sans mt-1 cursor-pointer"
                style={{
                  color: '#555550',
                  display: '-webkit-box',
                  WebkitLineClamp: expanded ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: expanded ? 'visible' : 'hidden',
                }}
                onClick={() => setExpanded(!expanded)}
              >
                {entry.note}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-sans shrink-0"
          style={{ color: '#3D3A8C' }}
        >Edit</button>
      </div>
    </div>
  )
}

// Weekly entry card with inline edit
export function WeeklyEntryCard({ entry, onSave }) {
  const [editing, setEditing] = useState(false)
  const [speed, setSpeed] = useState(entry.speed)
  const [consistency, setConsistency] = useState(entry.consistency)
  const [note, setNote] = useState(entry.note || '')

  const opt = getSpeedOption(entry.speed)

  const consistencyOptions = [
    { value: 'consistent', label: 'Consistent' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'shifted', label: 'Shifted midweek' },
  ]

  async function handleSave() {
    await onSave(entry.weekKey, { speed, consistency, note, weekKey: entry.weekKey, weekLabel: entry.weekLabel })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
        <p className="font-mono text-sm mb-1">{entry.weekKey}</p>
        <p className="text-xs font-sans mb-3" style={{ color: '#9E9E8E' }}>{entry.weekLabel}</p>
        <SpeedSelector value={speed} onChange={setSpeed} />
        <SpeedLegend />
        <div className="mt-3">
          <PillSelector options={consistencyOptions} value={consistency} onChange={setConsistency} />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          rows={2}
          placeholder="Note (optional)"
          className="w-full mt-3 p-2 text-sm font-sans rounded resize-none outline-none"
          style={{ border: '1px solid #E8E6DF', background: '#FAFAF9' }}
        />
        <div className="flex gap-2 mt-2">
          <SaveButton onSave={handleSave} label="Update" updateLabel="Update" />
          <button onClick={() => setEditing(false)} className="flex-1 text-sm font-sans rounded" style={{ height: '44px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm mb-1">{entry.weekKey}</p>
          <p className="text-xs font-sans mb-1" style={{ color: '#9E9E8E' }}>{entry.weekLabel}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ background: opt.color, color: opt.textColor }}>{opt.symbol} {opt.label}</span>
            {entry.consistency && <span className="text-xs font-sans" style={{ color: '#9E9E8E' }}>{entry.consistency}</span>}
          </div>
          {entry.note && <p className="text-sm font-sans mt-1" style={{ color: '#555550' }}>{entry.note}</p>}
        </div>
        <button onClick={() => setEditing(true)} className="text-xs font-sans shrink-0" style={{ color: '#3D3A8C' }}>Edit</button>
      </div>
    </div>
  )
}

// Monthly entry card with inline edit
export function MonthlyEntryCard({ entry, onSave }) {
  const [editing, setEditing] = useState(false)
  const [speed, setSpeed] = useState(entry.speed)
  const [trend, setTrend] = useState(entry.trend)
  const [comparedToLast, setComparedToLast] = useState(entry.comparedToLast)
  const [note, setNote] = useState(entry.note || '')

  const opt = getSpeedOption(entry.speed)

  const trendOptions = [
    { value: 'accelerating', label: 'Accelerating' },
    { value: 'decelerating', label: 'Decelerating' },
    { value: 'flat', label: 'Flat' },
    { value: 'irregular', label: 'Irregular' },
  ]

  const comparedOptions = [
    { value: 'faster', label: 'Faster than last month' },
    { value: 'slower', label: 'Slower than last month' },
    { value: 'similar', label: 'Similar to last month' },
  ]

  async function handleSave() {
    await onSave(entry.monthKey, { speed, trend, comparedToLast, note, monthKey: entry.monthKey, monthLabel: entry.monthLabel })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
        <p className="font-mono text-sm mb-1">{entry.monthKey}</p>
        <SpeedSelector value={speed} onChange={setSpeed} />
        <SpeedLegend />
        <div className="mt-3"><PillSelector options={trendOptions} value={trend} onChange={setTrend} /></div>
        <div className="mt-3"><PillSelector options={comparedOptions} value={comparedToLast} onChange={setComparedToLast} /></div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          rows={2}
          placeholder="Note (optional)"
          className="w-full mt-3 p-2 text-sm font-sans rounded resize-none outline-none"
          style={{ border: '1px solid #E8E6DF', background: '#FAFAF9' }}
        />
        <div className="flex gap-2 mt-2">
          <SaveButton onSave={handleSave} label="Update" updateLabel="Update" />
          <button onClick={() => setEditing(false)} className="flex-1 text-sm font-sans rounded" style={{ height: '44px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm mb-1">{entry.monthKey}</p>
          <p className="text-xs font-sans mb-1" style={{ color: '#9E9E8E' }}>{entry.monthLabel}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ background: opt.color, color: opt.textColor }}>{opt.symbol} {opt.label}</span>
            {entry.trend && <span className="text-xs font-sans" style={{ color: '#9E9E8E' }}>{entry.trend}</span>}
            {entry.comparedToLast && <span className="text-xs font-sans" style={{ color: '#9E9E8E' }}>{entry.comparedToLast}</span>}
          </div>
          {entry.note && <p className="text-sm font-sans mt-1" style={{ color: '#555550' }}>{entry.note}</p>}
        </div>
        <button onClick={() => setEditing(true)} className="text-xs font-sans shrink-0" style={{ color: '#3D3A8C' }}>Edit</button>
      </div>
    </div>
  )
}
