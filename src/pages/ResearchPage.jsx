import React, { useState, useMemo } from 'react'
import {
  ComposedChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { pearsonWithOffset, interpretCorrelation } from '../utils/correlationUtils.js'
import { exportAllDailyCSV, exportAllWeeklyCSV, exportAllMonthlyCSV } from '../utils/adminExportUtils.js'
import { getSpeedLabel, getSpeedColor, SPEED_OPTIONS } from '../utils/speedLabels.js'

const PARTICIPANT_COLORS = ['#4F46E5','#0D9488','#E85D4A','#D97706','#64748B','#7C3AED','#059669','#DC2626']
const Y_TICK_LABELS = { '-2': 'Slower', '-1': '', '0': 'Normal', '1': '', '2': 'Faster' }
const SPEED_BG = { '-2':'#1E3A5F', '-1':'#93B4D4', '0':'#9E9E8E', '1':'#E8C87A', '2':'#B5620A' }

function getTodayMinus(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toLocaleDateString('en-CA')
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-sans uppercase tracking-wider mb-3" style={{ color: '#9E9E8E', letterSpacing: '0.08em' }}>
      {children}
    </p>
  )
}

function ExportButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left text-sm font-sans py-2.5 flex items-center justify-between" style={{ color: '#3D3A8C' }}>
      <span>{label}</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v7M4 6.5l3 3 3-3M2 11h10" stroke="#3D3A8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function SpeedDot(props) {
  const { cx, cy, payload, dataKey } = props
  const val = payload?.[dataKey]
  if (val === undefined || val === null) return null
  return <circle cx={cx} cy={cy} r={3} fill={getSpeedColor(val)} stroke="#FAFAF9" strokeWidth={1} />
}

function CorrelationBar({ r }) {
  const abs = Math.abs(r)
  const pct = Math.round(abs * 100)
  const color = abs >= 0.7 ? '#2D7A4F' : abs >= 0.4 ? '#D97706' : '#9E9E8E'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-lg font-medium" style={{ color: '#1A1A18' }}>{r >= 0 ? '+' : ''}{r.toFixed(2)}</span>
        <span className="text-xs font-sans" style={{ color }}>{interpretCorrelation(r)}</span>
      </div>
      <div className="w-full rounded-full" style={{ height: 5, background: '#E8E6DF' }}>
        <div className="rounded-full" style={{ width: `${pct}%`, height: 5, background: color, transition: 'width 0.3s, background 0.3s' }} />
      </div>
    </div>
  )
}

// ── Heatmap ─────────────────────────────────────────────────────────────────
function ParticipantHeatmap({ participants, allDailyByUid, fromDate, toDate }) {
  const dates = useMemo(() => {
    const result = []
    const start = new Date(fromDate + 'T00:00:00')
    const end = new Date(toDate + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result.push(d.toLocaleDateString('en-CA'))
    }
    return result
  }, [fromDate, toDate])

  const cellW = Math.max(4, Math.min(9, Math.floor(400 / dates.length)))

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: (dates.length * (cellW + 1)) + 44 }}>
        {/* Month label row */}
        <div style={{ display: 'flex', paddingLeft: 38, marginBottom: 2 }}>
          {(() => {
            const groups = []
            let cur = null
            dates.forEach((d, i) => {
              const month = d.slice(0, 7)
              if (cur && cur.month === month) { cur.count++; cur.end = i }
              else { cur = { month, label: new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), start: i, end: i, count: 1 }; groups.push(cur) }
            })
            return groups.map((g) => (
              <div key={g.month} style={{ width: g.count * (cellW + 1) - 1, flexShrink: 0, overflow: 'hidden', borderLeft: '1px solid #C8C6BF', paddingLeft: 3 }}>
                <span style={{ fontSize: 9, color: '#555550', fontFamily: 'Inter', fontWeight: 500, whiteSpace: 'nowrap' }}>{g.label}</span>
              </div>
            ))
          })()}
        </div>
        {/* Day number row */}
        <div style={{ display: 'flex', paddingLeft: 38, marginBottom: 4 }}>
          {dates.map((d, i) => {
            const day = parseInt(d.slice(8))
            const show = day === 1 || day === 8 || day === 15 || day === 22
            return (
              <div key={d} style={{ width: cellW, marginRight: 1, flexShrink: 0, textAlign: 'center' }}>
                {show && <span style={{ fontSize: 8, color: '#9E9E8E', fontFamily: 'JetBrains Mono' }}>{day}</span>}
              </div>
            )
          })}
        </div>
        <div>
          {participants.map((p) => {
            const dayMap = {}
            ;(allDailyByUid[p.uid] || []).forEach((e) => { dayMap[e.date] = e.speed })
            return (
              <div key={p.uid} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ width: 36, fontSize: 9, fontFamily: 'JetBrains Mono', color: '#555550', flexShrink: 0, overflow: 'hidden', fontWeight: 500 }}>
                  {p.label}
                </span>
                {dates.map((d) => {
                  const val = dayMap[d]
                  return (
                    <div
                      key={d}
                      style={{
                        width: cellW, height: 14, marginRight: 1, borderRadius: 1, flexShrink: 0,
                        background: val !== undefined ? SPEED_BG[String(val)] : '#E8E6DF',
                        opacity: val !== undefined ? 1 : 0.25,
                      }}
                      title={val !== undefined ? `${p.label} · ${d}: ${getSpeedLabel(val)}` : `${p.label} · ${d}: no entry`}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingLeft: 38, flexWrap: 'wrap' }}>
          {SPEED_OPTIONS.map((opt) => (
            <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 1, background: SPEED_BG[String(opt.value)] }} />
              <span style={{ fontSize: 9, color: '#9E9E8E', fontFamily: 'Inter' }}>{opt.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 1, background: '#E8E6DF', opacity: 0.4 }} />
            <span style={{ fontSize: 9, color: '#9E9E8E', fontFamily: 'Inter' }}>No entry</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Average Signal ───────────────────────────────────────────────────────────
function AverageSignalChart({ participants, allDailyByUid, fromDate, toDate }) {
  const data = useMemo(() => {
    const dateMap = {}
    const start = new Date(fromDate + 'T00:00:00')
    const end = new Date(toDate + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateMap[d.toLocaleDateString('en-CA')] = []
    }
    participants.forEach((p) => {
      ;(allDailyByUid[p.uid] || []).forEach((e) => {
        if (dateMap[e.date] !== undefined) dateMap[e.date].push(e.speed)
      })
    })
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => {
        if (vals.length === 0) return { date, avg: null, min: null, max: null, count: 0 }
        const avg = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
        return { date, avg, min: Math.min(...vals), max: Math.max(...vals), count: vals.length }
      })
  }, [participants, allDailyByUid, fromDate, toDate])

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
        <ReferenceLine y={0} stroke="#C8C6BF" strokeWidth={1.5} />
        <XAxis dataKey="date"
          tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#9E9E8E' }}
          tickFormatter={(v) => {
            const d = new Date(v + 'T00:00:00')
            const day = d.getDate()
            return day === 1 || day === 15 ? `${d.toLocaleDateString('en-US', { month: 'short' })} ${day}` : ''
          }}
          interval={0}
        />
        <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]}
          tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }}
          tickFormatter={(v) => Y_TICK_LABELS[String(v)] || ''}
          width={42}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0]?.payload
            if (!d || d.avg === null) return null
            return (
              <div className="font-sans text-xs rounded p-2" style={{ background: '#FFFFFF', border: '1px solid #E8E6DF' }}>
                <p className="font-mono font-medium mb-1" style={{ color: '#1A1A18' }}>{label}</p>
                <p style={{ color: '#3D3A8C' }}>Avg: <span style={{ color: getSpeedColor(Math.round(d.avg)), fontWeight: 500 }}>{d.avg > 0 ? '+' : ''}{d.avg}</span></p>
                <p style={{ color: '#9E9E8E' }}>Range: {d.min} to {d.max}</p>
                <p style={{ color: '#9E9E8E' }}>{d.count} participant{d.count !== 1 ? 's' : ''}</p>
              </div>
            )
          }}
        />
        <Area type="monotone" dataKey="max" stroke="none" fill="#3D3A8C" fillOpacity={0.08} connectNulls={false} legendType="none" />
        <Area type="monotone" dataKey="min" stroke="none" fill="#FAFAF9" fillOpacity={1} connectNulls={false} legendType="none" />
        <Line type="monotone" dataKey="avg" stroke="#3D3A8C" strokeWidth={2}
          dot={(props) => {
            const val = props?.payload?.avg
            if (val === null || val === undefined) return null
            return <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={getSpeedColor(Math.round(val))} stroke="#FAFAF9" strokeWidth={1} />
          }}
          connectNulls={false}
          name="Average speed"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ── Correlation Matrix ───────────────────────────────────────────────────────
function CorrelationMatrix({ participants, allDailyByUid }) {
  const matrix = useMemo(() => {
    if (participants.length < 2) return null
    const result = {}
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const a = (allDailyByUid[participants[i].uid] || []).map(e => ({ date: e.date, speed: e.speed }))
        const b = (allDailyByUid[participants[j].uid] || []).map(e => ({ date: e.date, speed: e.speed }))
        const r = pearsonWithOffset(a, b, 0)
        const key = `${i}_${j}`
        result[key] = r ? r.r : null
      }
    }
    return result
  }, [participants, allDailyByUid])

  if (!matrix || participants.length < 2) {
    return <p className="text-sm font-sans py-4" style={{ color: '#9E9E8E' }}>Need at least 2 participants with overlapping data.</p>
  }

  function cellColor(r) {
    if (r === null) return { bg: '#F0EFE8', text: '#C8C6BF' }
    const abs = Math.abs(r)
    if (abs >= 0.7) return { bg: 'rgba(45,122,79,0.15)', text: '#2D7A4F' }
    if (abs >= 0.4) return { bg: 'rgba(217,119,6,0.12)', text: '#B45309' }
    return { bg: 'rgba(158,158,142,0.1)', text: '#9E9E8E' }
  }

  const cellSize = Math.max(28, Math.min(44, Math.floor(400 / (participants.length + 1))))
  const showLabel = cellSize >= 34

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block', minWidth: (participants.length + 1) * (cellSize + 2) }}>
        {/* Header row */}
        <div style={{ display: 'flex', marginBottom: 2, paddingLeft: cellSize + 2 }}>
          {participants.map((p) => (
            <div key={p.uid} style={{ width: cellSize, marginRight: 2, flexShrink: 0, textAlign: 'center' }}>
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: '#555550', fontWeight: 500 }}>{p.label}</span>
            </div>
          ))}
        </div>
        {/* Rows */}
        {participants.map((rowP, i) => (
          <div key={rowP.uid} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ width: cellSize, marginRight: 2, flexShrink: 0, textAlign: 'right', paddingRight: 6 }}>
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: '#555550', fontWeight: 500 }}>{rowP.label}</span>
            </div>
            {participants.map((colP, j) => {
              if (i === j) {
                return (
                  <div key={colP.uid} style={{ width: cellSize, height: cellSize, marginRight: 2, borderRadius: 3, flexShrink: 0, background: '#F0EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: '#C8C6BF', fontFamily: 'JetBrains Mono' }}>—</span>
                  </div>
                )
              }
              const key = i < j ? `${i}_${j}` : `${j}_${i}`
              const r = matrix[key]
              const { bg, text } = cellColor(r)
              return (
                <div
                  key={colP.uid}
                  style={{ width: cellSize, height: cellSize, marginRight: 2, borderRadius: 3, flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={r !== null ? `${rowP.label} vs ${colP.label}: ${r.toFixed(2)} (${interpretCorrelation(r)})` : 'Not enough data'}
                >
                  {showLabel && r !== null && (
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: text, fontWeight: 500 }}>
                      {r >= 0 ? '+' : ''}{r.toFixed(2)}
                    </span>
                  )}
                  {showLabel && r === null && (
                    <span style={{ fontSize: 9, color: '#C8C6BF' }}>—</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingLeft: cellSize + 2, flexWrap: 'wrap' }}>
          {[['rgba(45,122,79,0.15)', '#2D7A4F', '≥ 0.7 Strong'],
            ['rgba(217,119,6,0.12)', '#B45309', '0.4–0.7 Moderate'],
            ['rgba(158,158,142,0.1)', '#9E9E8E', '< 0.4 Weak']].map(([bg, text, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: bg, border: `1px solid ${text}22` }} />
              <span style={{ fontSize: 9, color: '#9E9E8E', fontFamily: 'Inter' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ResearchPage({ participantsHook }) {
  const { participants, allDailyByUid, allWeeklyByUid, allMonthlyByUid, loading, updateParticipantLabel } = participantsHook

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA')
  })
  const [toDate, setToDate] = useState(getTodayMinus(0))
  const [refUid, setRefUid] = useState('')
  const [cmpUid, setCmpUid] = useState('')
  const [offset, setOffset] = useState(0)
  const [editingLabel, setEditingLabel] = useState(null)
  const [labelInput, setLabelInput] = useState('')

  const { offsetData, scatterData, correlation } = useMemo(() => {
    if (!refUid || !cmpUid || refUid === cmpUid) return { offsetData: [], scatterData: [], correlation: null }
    const refSeries = (allDailyByUid[refUid] || []).map(e => ({ date: e.date, speed: e.speed }))
    const cmpSeries = (allDailyByUid[cmpUid] || []).map(e => ({ date: e.date, speed: e.speed }))
    const corr = pearsonWithOffset(refSeries, cmpSeries, offset)
    const start = new Date(fromDate + 'T00:00:00')
    const end = new Date(toDate + 'T00:00:00')
    const refMap = {}; refSeries.forEach(e => { refMap[e.date] = e.speed })
    const cmpMap = {}; cmpSeries.forEach(({ date, speed }) => {
      const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + offset)
      cmpMap[d.toLocaleDateString('en-CA')] = speed
    })
    const data = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toLocaleDateString('en-CA')
      data.push({ date: key, ref: refMap[key], cmp: cmpMap[key] })
    }
    const scatter = data.filter(d => d.ref !== undefined && d.ref !== null && d.cmp !== undefined && d.cmp !== null)
      .map(d => ({ x: d.ref, y: d.cmp, date: d.date }))
    return { offsetData: data, scatterData: scatter, correlation: corr }
  }, [refUid, cmpUid, offset, allDailyByUid, fromDate, toDate])

  const refParticipant = participants.find(p => p.uid === refUid)
  const cmpParticipant = participants.find(p => p.uid === cmpUid)

  function startEditLabel(p) { setEditingLabel(p.uid); setLabelInput(p.participantLabel || '') }
  async function saveLabel(uid) { await updateParticipantLabel(uid, labelInput.trim()); setEditingLabel(null) }

  const dateRangeSelector = (
    <div className="flex gap-3 mb-4">
      <div className="flex-1">
        <label className="text-xs font-sans block mb-1" style={{ color: '#9E9E8E' }}>From</label>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
          className="w-full px-2 text-xs font-mono rounded outline-none"
          style={{ height: '36px', border: '1px solid #E8E6DF', background: '#FFFFFF' }} />
      </div>
      <div className="flex-1">
        <label className="text-xs font-sans block mb-1" style={{ color: '#9E9E8E' }}>To</label>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
          className="w-full px-2 text-xs font-mono rounded outline-none"
          style={{ height: '36px', border: '1px solid #E8E6DF', background: '#FFFFFF' }} />
      </div>
    </div>
  )

  if (loading) return (
    <div className="pb-20 px-5 pt-4 max-w-[480px] mx-auto">
      <h1 className="font-serif text-2xl mb-4">Research</h1>
      <SkeletonCard lines={5} /><SkeletonCard lines={5} /><SkeletonCard lines={5} />
    </div>
  )

  return (
    <div className="pb-20 px-5 pt-4 max-w-[480px] mx-auto">
      <h1 className="font-serif text-2xl mb-4">Research</h1>

      {participants.length === 0 ? (
        <p className="text-sm font-sans py-8" style={{ color: '#9E9E8E' }}>No participants have logged data yet.</p>
      ) : (
        <>
          {/* A — Participants */}
          <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Participants ({participants.length})</SectionLabel>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#9E9E8E' }}>
                    <th className="text-left py-1.5 pr-3 font-medium">Label</th>
                    <th className="text-left py-1.5 pr-3 font-medium">Name</th>
                    <th className="text-left py-1.5 pr-3 font-medium">Days</th>
                    <th className="text-left py-1.5 font-medium">Last entry</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => (
                    <tr key={p.uid} style={{ borderTop: '1px solid #E8E6DF' }}>
                      <td className="py-2 pr-3">
                        {editingLabel === p.uid ? (
                          <div className="flex items-center gap-1">
                            <input value={labelInput} onChange={e => setLabelInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveLabel(p.uid); if (e.key === 'Escape') setEditingLabel(null) }}
                              className="font-mono text-xs px-1 rounded outline-none"
                              style={{ border: '1px solid #3D3A8C', width: 40 }} autoFocus />
                            <button onClick={() => saveLabel(p.uid)} className="text-xs" style={{ color: '#3D3A8C' }}>Save</button>
                          </div>
                        ) : (
                          <button onClick={() => startEditLabel(p)} className="font-mono font-medium" style={{ color: '#3D3A8C' }}>{p.label}</button>
                        )}
                      </td>
                      <td className="py-2 pr-3" style={{ color: '#1A1A18' }}>{p.displayName || '—'}</td>
                      <td className="py-2 pr-3 font-mono" style={{ color: '#555550' }}>{p.daysLogged}</td>
                      <td className="py-2 font-mono" style={{ color: '#555550' }}>{p.lastEntry || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* B — Heatmap */}
          <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Heatmap — all participants × days</SectionLabel>
            <p className="text-xs font-sans mb-3" style={{ color: '#9E9E8E' }}>
              Synchronized periods appear as vertical bands. Blue = slow, amber = fast.
            </p>
            {dateRangeSelector}
            <ParticipantHeatmap
              participants={participants}
              allDailyByUid={allDailyByUid}
              fromDate={fromDate}
              toDate={toDate}
            />
          </div>

          {/* C — Average Signal */}
          <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Average signal across all participants</SectionLabel>
            <p className="text-xs font-sans mb-3" style={{ color: '#9E9E8E' }}>
              Mean speed per day. Shaded band = spread (min–max). A clear wave here confirms group-level synchrony.
            </p>
            <AverageSignalChart
              participants={participants}
              allDailyByUid={allDailyByUid}
              fromDate={fromDate}
              toDate={toDate}
            />
          </div>

          {/* D — Correlation Matrix */}
          <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Correlation matrix (offset 0)</SectionLabel>
            <p className="text-xs font-sans mb-4" style={{ color: '#9E9E8E' }}>
              All participant pairs at zero offset. Green cells are worth investigating in the offset tool below.
            </p>
            <CorrelationMatrix participants={participants} allDailyByUid={allDailyByUid} />
          </div>

          {/* E — Offset Analysis */}
          <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Offset analysis — pair deep-dive</SectionLabel>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs font-sans block mb-1" style={{ color: '#9E9E8E' }}>Reference</label>
                <select value={refUid} onChange={e => setRefUid(e.target.value)}
                  className="w-full px-2 text-xs font-sans rounded outline-none"
                  style={{ height: '36px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}>
                  <option value="">Select...</option>
                  {participants.map(p => <option key={p.uid} value={p.uid}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-sans block mb-1" style={{ color: '#9E9E8E' }}>Compare with</label>
                <select value={cmpUid} onChange={e => setCmpUid(e.target.value)}
                  className="w-full px-2 text-xs font-sans rounded outline-none"
                  style={{ height: '36px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}>
                  <option value="">Select...</option>
                  {participants.filter(p => p.uid !== refUid).map(p => <option key={p.uid} value={p.uid}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {refUid && cmpUid && (
              <>
                <div className="mb-5">
                  <label className="text-xs font-sans block mb-2" style={{ color: '#9E9E8E' }}>
                    Shift {cmpParticipant?.label} by{' '}
                    <span className="font-mono font-medium" style={{ color: '#1A1A18' }}>
                      {offset > 0 ? `+${offset}` : offset} day{Math.abs(offset) !== 1 ? 's' : ''}
                    </span>
                  </label>
                  <input type="range" min={-3} max={3} step={1} value={offset}
                    onChange={e => setOffset(parseInt(e.target.value))}
                    className="w-full" style={{ accentColor: '#3D3A8C' }} />
                  <div className="flex justify-between text-xs font-mono mt-0.5" style={{ color: '#9E9E8E' }}>
                    <span>-3d</span><span>0</span><span>+3d</span>
                  </div>
                </div>

                <p className="text-xs font-sans mb-2" style={{ color: '#9E9E8E' }}>Timeline</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={offsetData} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                    <ReferenceLine y={0} stroke="#C8C6BF" strokeWidth={1.5} />
                    <XAxis dataKey="date"
                      tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#9E9E8E' }}
                      tickFormatter={v => { const d = new Date(v + 'T00:00:00'); const day = d.getDate(); return day === 1 || day === 15 ? `${d.toLocaleDateString('en-US', { month: 'short' })} ${day}` : '' }}
                      interval={0} />
                    <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]}
                      tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }}
                      tickFormatter={v => Y_TICK_LABELS[String(v)] || ''} width={42} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="font-sans text-xs rounded p-2" style={{ background: '#FFFFFF', border: '1px solid #E8E6DF' }}>
                          <p className="font-mono font-medium mb-1">{label}</p>
                          {payload.filter(p => p.value !== undefined && p.value !== null).map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5 mb-0.5">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
                              <span style={{ color: '#555550' }}>{p.name}:</span>
                              <span style={{ color: getSpeedColor(p.value), fontWeight: 500 }}>{getSpeedLabel(p.value)}</span>
                            </div>
                          ))}
                        </div>
                      )
                    }} />
                    <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 10, paddingTop: 6 }} />
                    <Line type="monotone" dataKey="ref" name={refParticipant?.label || 'Ref'}
                      stroke={PARTICIPANT_COLORS[0]} strokeWidth={1.5}
                      dot={<SpeedDot dataKey="ref" />} activeDot={{ r: 5 }} connectNulls={false} />
                    <Line type="monotone" dataKey="cmp"
                      name={`${cmpParticipant?.label || 'Cmp'} (${offset > 0 ? '+' : ''}${offset}d)`}
                      stroke={PARTICIPANT_COLORS[1]} strokeWidth={1.5} strokeDasharray="4 2"
                      dot={<SpeedDot dataKey="cmp" />} activeDot={{ r: 5 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>

                {scatterData.length >= 3 && (
                  <div className="mt-5">
                    <p className="text-xs font-sans mb-1" style={{ color: '#9E9E8E' }}>
                      Scatter — {refParticipant?.label} vs {cmpParticipant?.label}{offset !== 0 ? ` (${offset > 0 ? '+' : ''}${offset}d)` : ''}
                    </p>
                    <p className="text-xs font-sans mb-3" style={{ color: '#C8C6BF' }}>Diagonal cluster = alignment.</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <ScatterChart margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                        <ReferenceLine y={0} stroke="#C8C6BF" strokeWidth={1} />
                        <ReferenceLine x={0} stroke="#C8C6BF" strokeWidth={1} />
                        <XAxis type="number" dataKey="x" domain={[-2, 2]} ticks={[-2,-1,0,1,2]}
                          tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }}
                          tickFormatter={v => Y_TICK_LABELS[String(v)] || v}
                          label={{ value: refParticipant?.label, position: 'insideBottom', offset: -2, fontSize: 9, fill: '#9E9E8E', fontFamily: 'Inter' }} />
                        <YAxis type="number" dataKey="y" domain={[-2, 2]} ticks={[-2,-1,0,1,2]}
                          tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }}
                          tickFormatter={v => Y_TICK_LABELS[String(v)] || ''}
                          width={42}
                          label={{ value: cmpParticipant?.label, angle: -90, position: 'insideLeft', fontSize: 9, fill: '#9E9E8E', fontFamily: 'Inter' }} />
                        <ZAxis range={[30, 30]} />
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]?.payload
                          return (
                            <div className="font-sans text-xs rounded p-2" style={{ background: '#FFFFFF', border: '1px solid #E8E6DF' }}>
                              <p className="font-mono mb-1" style={{ color: '#9E9E8E' }}>{d?.date}</p>
                              <p style={{ color: '#555550' }}>{refParticipant?.label}: <span style={{ color: getSpeedColor(d?.x), fontWeight: 500 }}>{getSpeedLabel(d?.x)}</span></p>
                              <p style={{ color: '#555550' }}>{cmpParticipant?.label}: <span style={{ color: getSpeedColor(d?.y), fontWeight: 500 }}>{getSpeedLabel(d?.y)}</span></p>
                            </div>
                          )
                        }} />
                        <Scatter data={scatterData} fill="#3D3A8C" fillOpacity={0.6} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="mt-4 p-3 rounded" style={{ background: '#F0EFE8' }}>
                  {correlation === null ? (
                    <p className="text-sm font-sans" style={{ color: '#555550' }}>Not enough overlapping data (need at least 7 shared days).</p>
                  ) : (
                    <>
                      <CorrelationBar r={correlation.r} />
                      <p className="text-xs font-sans mt-2" style={{ color: '#9E9E8E' }}>
                        {correlation.pairsUsed} overlapping days
                        {offset !== 0 ? ` · ${cmpParticipant?.label} shifted ${offset > 0 ? '+' : ''}${offset}d` : ''}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* F — Export */}
          <div className="py-4">
            <SectionLabel>Export all data</SectionLabel>
            <ExportButton label="Export all daily as CSV" onClick={() => exportAllDailyCSV(participants, allDailyByUid)} />
            <div style={{ borderTop: '1px solid #E8E6DF' }}>
              <ExportButton label="Export all weekly as CSV" onClick={() => exportAllWeeklyCSV(participants, allWeeklyByUid)} />
            </div>
            <div style={{ borderTop: '1px solid #E8E6DF' }}>
              <ExportButton label="Export all monthly as CSV" onClick={() => exportAllMonthlyCSV(participants, allMonthlyByUid)} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
