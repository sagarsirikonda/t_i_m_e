import React, { useState, useMemo, useRef } from 'react'
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

function formatPrintDate() {
  return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
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
function AverageSignalChart({ participants, allDailyByUid, fromDate, toDate, height = 220 }) {
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
    <ResponsiveContainer width="100%" height={height}>
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

// ── PDF Document Components ──────────────────────────────────────────────────
const PDF_BODY = 'Georgia, "Times New Roman", serif'
const PDF_UI = '"DM Sans", system-ui, sans-serif'

function PDFMeta({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E9E8E', margin: '0 0 4px', fontFamily: PDF_UI }}>{label}</p>
      <p style={{ fontSize: 13, color: '#1A1A18', margin: 0, fontFamily: PDF_UI, fontWeight: 500 }}>{value}</p>
    </div>
  )
}

function PDFFigLabel({ n }) {
  return (
    <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3D3A8C', margin: '0 0 5px', fontFamily: PDF_UI, fontWeight: 600 }}>
      Figure {n}
    </p>
  )
}

function PDFFigTitle({ children }) {
  return (
    <h2 style={{ fontSize: 17, fontWeight: 400, color: '#1A1A18', margin: '0 0 14px', fontFamily: PDF_BODY, lineHeight: 1.3 }}>
      {children}
    </h2>
  )
}

function PDFPara({ label, children }) {
  return (
    <p style={{ fontSize: 11.5, lineHeight: 1.9, color: '#444440', margin: '0 0 10px', fontFamily: PDF_BODY }}>
      {label && <span style={{ fontWeight: 600, color: '#1A1A18', fontFamily: PDF_UI, fontSize: 10 }}>{label}{'  '}</span>}
      {children}
    </p>
  )
}

function GroupPDFDocument({ participants, allDailyByUid, fromDate, toDate }) {
  return (
    <div style={{ width: 700, background: '#ffffff' }}>

      {/* ── Page 1: Cover ─────────────────────────────────────────────────── */}
      <div className="pdf-page" style={{ background: '#ffffff' }}>
        <div style={{ background: '#1A1A18', padding: '44px 56px 40px' }}>
          <p style={{ fontSize: 9.5, letterSpacing: '0.14em', color: '#888780', margin: '0 0 14px', fontFamily: PDF_UI, textTransform: 'uppercase' }}>
            Research Report · Temporal Perception Study
          </p>
          <h1 style={{ fontSize: 27, fontWeight: 400, color: '#FAFAF9', margin: '0 0 12px', lineHeight: 1.3, fontFamily: PDF_BODY }}>
            An Investigation into Synchronized Time<br />Perception Across Unrelated Individuals
          </h1>
          <p style={{ fontSize: 13, color: '#888780', margin: 0, fontFamily: PDF_UI, lineHeight: 1.6 }}>
            Do people who have no contact with each other experience time as faster or slower at the same time?
          </p>
        </div>
        <div style={{ display: 'flex', gap: 40, padding: '22px 56px', borderBottom: '0.5px solid #E0DDD6', flexWrap: 'wrap' }}>
          <PDFMeta label="Researcher" value="Sagar Sirikonda" />
          <PDFMeta label="Date of export" value={formatPrintDate()} />
          <PDFMeta label="Participants" value={`${participants.length} enrolled`} />
          <PDFMeta label="Date range" value={`${fromDate} — ${toDate}`} />
        </div>
        <div style={{ padding: '30px 56px 36px' }}>
          <div style={{ borderLeft: '3px solid #3D3A8C', padding: '14px 20px', marginBottom: 20, background: '#F7F6F2' }}>
            <p style={{ fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9E9E8E', margin: '0 0 9px', fontFamily: PDF_UI, fontWeight: 600 }}>Abstract</p>
            <p style={{ fontSize: 11.5, lineHeight: 1.9, margin: 0, color: '#333330', fontFamily: PDF_BODY }}>
              This report presents preliminary data from an ongoing study examining whether subjective time perception fluctuates in synchronized patterns across unrelated individuals. Participants independently recorded daily, weekly, and monthly assessments of how fast or slow time felt, with no contextual cues or external influence provided at any point during data collection. The data is analyzed for temporal correlation across participants, with particular attention to lagged alignment of one to two days between individuals. All participant identities have been anonymized and replaced with sequential labels.
            </p>
          </div>
          <div style={{ borderLeft: '3px solid #555550', padding: '12px 20px', marginBottom: 8, background: '#EFEDE6' }}>
            <p style={{ fontSize: 11.5, margin: 0, fontFamily: PDF_BODY, color: '#333330', lineHeight: 1.75 }}>
              <span style={{ fontWeight: 700, fontFamily: PDF_UI, fontSize: 10, letterSpacing: '0.04em' }}>H1{'  '}</span>
              Subjective time perception fluctuates in measurable patterns that are shared across unrelated individuals, with a potential systematic temporal offset of one to two days between participants.
            </p>
          </div>
          <div style={{ borderLeft: '3px solid #C8C6BF', padding: '12px 20px', marginBottom: 28, background: '#F7F6F2' }}>
            <p style={{ fontSize: 11.5, margin: 0, fontFamily: PDF_BODY, color: '#666660', lineHeight: 1.75 }}>
              <span style={{ fontWeight: 700, fontFamily: PDF_UI, fontSize: 10, letterSpacing: '0.04em' }}>H0{'  '}</span>
              Reported time perception is independent across individuals and shows no cross-participant correlation beyond what is expected by chance.
            </p>
          </div>
          <p style={{ fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9E9E8E', margin: '0 0 9px', fontFamily: PDF_UI, fontWeight: 600 }}>Data collection</p>
          <p style={{ fontSize: 11.5, lineHeight: 1.9, margin: 0, color: '#444440', fontFamily: PDF_BODY }}>
            Participants were recruited informally and asked to log their subjective time perception once per day using a five-point scale: −2 (much slower than normal), −1 (slightly slower), 0 (normal), +1 (slightly faster), and +2 (much faster). No definitions were offered — each participant responded on personal instinct alone. Weekly and monthly summary assessments were also collected. All entries were made independently with no communication between participants regarding their ratings. Data collection began in June 2026 and is ongoing.
          </p>
        </div>
      </div>

      {/* ── Page 2: Figure 1 — Heatmap ────────────────────────────────────── */}
      <div className="pdf-page" style={{ background: '#ffffff', padding: '40px 56px 52px' }}>
        <PDFFigLabel n={1} />
        <PDFFigTitle>Participant Heatmap</PDFFigTitle>
        <PDFPara label="What this shows">
          Each row represents one participant; each column one calendar day. Cell color encodes the daily speed rating: dark blue for much slower than normal, amber for much faster, and mid-gray for normal. Missing cells (low opacity) indicate no entry was recorded for that day.
        </PDFPara>
        <PDFPara label="Interpretation">
          Vertical bands crossing multiple rows simultaneously are the primary visual signal of H1. A band where most participants share the same color on the same calendar day indicates synchronized perception. Staggered bands — where the color shift appears one or two columns apart between participant groups — indicate a temporal offset, the central prediction under H1. Random scatter with no vertical structure supports H0.
        </PDFPara>
        <div style={{ marginTop: 20 }}>
          <ParticipantHeatmap participants={participants} allDailyByUid={allDailyByUid} fromDate={fromDate} toDate={toDate} />
        </div>
      </div>

      {/* ── Page 3: Figure 2 — Average Signal ────────────────────────────── */}
      <div className="pdf-page" style={{ background: '#ffffff', padding: '40px 56px 52px' }}>
        <PDFFigLabel n={2} />
        <PDFFigTitle>Average Signal Across All Participants</PDFFigTitle>
        <PDFPara label="What this shows">
          The mean speed rating across all participants who logged on a given day, plotted as a continuous line. The shaded band marks the full range between the lowest and highest individual rating each day, giving a sense of dispersion alongside the average.
        </PDFPara>
        <PDFPara label="Interpretation">
          Averaging cancels individual noise. If a real shared signal exists, it becomes clearer here than in any individual's data. A visible oscillation — the line rising and falling with a regular rhythm — supports H1. A flat or randomly jagged line supports H0. The more participants contributing on each day, the more statistically reliable this average becomes.
        </PDFPara>
        <div style={{ marginTop: 20 }}>
          <AverageSignalChart participants={participants} allDailyByUid={allDailyByUid} fromDate={fromDate} toDate={toDate} height={240} />
        </div>
      </div>

      {/* ── Page 4: Figure 3 — Correlation Matrix ────────────────────────── */}
      <div className="pdf-page" style={{ background: '#ffffff', padding: '40px 56px 52px' }}>
        <PDFFigLabel n={3} />
        <PDFFigTitle>Correlation Matrix — All Pairs at Zero Offset</PDFFigTitle>
        <PDFPara label="What this shows">
          A symmetric grid of Pearson correlation coefficients (r) for every participant pair, compared on the same calendar day with no time shift applied. r ranges from −1 (perfect inverse) through 0 (no relationship) to +1 (perfect synchrony). Cells are color-coded: green (r ≥ 0.7, strong), amber (0.4–0.7, moderate), or gray (below 0.4, weak). The diagonal is undefined.
        </PDFPara>
        <PDFPara label="Interpretation">
          Under H1, the matrix should show clusters of green cells — groups of participants whose perception moves in unison. Amber cells between green clusters suggest the same underlying pattern exists but with a temporal lag; these pairs should be examined using the offset tool. Under H0, the matrix is uniformly gray. This view uses zero offset only — apparent amber pairs may reveal stronger green-level correlation at a 1–2 day shift.
        </PDFPara>
        <div style={{ marginTop: 20 }}>
          <CorrelationMatrix participants={participants} allDailyByUid={allDailyByUid} />
        </div>
      </div>

    </div>
  )
}

function CorrelationSummaryBlock({ correlation, offsetLabel }) {
  return (
    <div style={{ padding: '18px 22px', borderRadius: 4, background: '#F0EFE8' }}>
      {correlation === null ? (
        <p style={{ fontSize: 12, fontFamily: PDF_BODY, color: '#555550', margin: 0 }}>
          Insufficient data — at least 7 shared days are required to compute a reliable correlation.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 22, fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, color: '#1A1A18' }}>
              {correlation.r >= 0 ? '+' : ''}{correlation.r.toFixed(2)}
            </span>
            <span style={{ fontSize: 12, fontFamily: PDF_BODY, color: Math.abs(correlation.r) >= 0.7 ? '#2D7A4F' : Math.abs(correlation.r) >= 0.4 ? '#D97706' : '#9E9E8E' }}>
              {interpretCorrelation(correlation.r)}
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: '#E8E6DF', marginBottom: 10 }}>
            <div style={{
              height: 5, borderRadius: 3,
              width: `${Math.abs(correlation.r) * 100}%`,
              background: Math.abs(correlation.r) >= 0.7 ? '#2D7A4F' : Math.abs(correlation.r) >= 0.4 ? '#D97706' : '#9E9E8E',
            }} />
          </div>
          <p style={{ fontSize: 11, fontFamily: PDF_UI, color: '#9E9E8E', margin: 0 }}>
            {correlation.pairsUsed} overlapping day{correlation.pairsUsed !== 1 ? 's' : ''} · offset {offsetLabel}d
          </p>
        </>
      )}
    </div>
  )
}

function PairPDFDocument({ refParticipant, cmpParticipant, offset, offsetData, scatterData, correlation }) {
  const offsetLabel = offset > 0 ? `+${offset}` : String(offset)

  return (
    <div style={{ width: 700, background: '#ffffff' }}>

      {/* ── Page 1: Cover + Figure 4 ──────────────────────────────────────── */}
      <div className="pdf-page" style={{ background: '#ffffff' }}>
        <div style={{ background: '#1A1A18', padding: '36px 56px 30px' }}>
          <p style={{ fontSize: 9.5, letterSpacing: '0.14em', color: '#888780', margin: '0 0 12px', fontFamily: PDF_UI, textTransform: 'uppercase' }}>
            Research Report · Temporal Perception Study · Pairwise Analysis
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 400, color: '#FAFAF9', margin: '0 0 10px', lineHeight: 1.3, fontFamily: PDF_BODY }}>
            Offset Analysis: {refParticipant?.label} vs {cmpParticipant?.label}
          </h1>
          <p style={{ fontSize: 12.5, color: '#888780', margin: 0, fontFamily: PDF_UI, lineHeight: 1.6 }}>
            Testing for lagged synchrony in subjective time perception between two participants
          </p>
        </div>
        <div style={{ display: 'flex', gap: 32, padding: '16px 56px', borderBottom: '0.5px solid #E0DDD6', flexWrap: 'wrap' }}>
          <PDFMeta label="Researcher" value="Sagar Sirikonda" />
          <PDFMeta label="Date of export" value={formatPrintDate()} />
          <PDFMeta label="Reference" value={refParticipant?.label || '—'} />
          <PDFMeta label="Comparison" value={`${cmpParticipant?.label || '—'} (${offsetLabel}d)`} />
          {correlation && (
            <PDFMeta
              label="Pearson r"
              value={`${correlation.r >= 0 ? '+' : ''}${correlation.r.toFixed(2)} · ${interpretCorrelation(correlation.r)}`}
            />
          )}
        </div>
        <div style={{ padding: '18px 56px 0' }}>
          <p style={{ fontSize: 11.5, lineHeight: 1.85, margin: 0, color: '#444440', fontFamily: PDF_BODY }}>
            This report isolates the relationship between {refParticipant?.label} and {cmpParticipant?.label} from the broader dataset. The offset tool was used to shift {cmpParticipant?.label}'s timeline by {offsetLabel} day{Math.abs(offset) !== 1 ? 's' : ''} relative to {refParticipant?.label}. At this offset, {cmpParticipant?.label}'s entry on day N is compared against {refParticipant?.label}'s entry on day N{offset > 0 ? ` − ${offset}` : offset < 0 ? ` + ${Math.abs(offset)}` : ''}, testing whether one participant consistently experiences the same pattern {Math.abs(offset)} day{Math.abs(offset) !== 1 ? 's' : ''} {offset > 0 ? 'before' : offset < 0 ? 'after' : 'as'} the other. A significant Pearson correlation at a non-zero offset constitutes evidence of lagged synchrony — the central prediction of H1.
          </p>
        </div>

        {/* Figure 4 inline on page 1 */}
        <div style={{ padding: '20px 56px 36px' }}>
          <PDFFigLabel n={4} />
          <PDFFigTitle>Temporal Alignment Timeline{' '}<span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72em', fontWeight: 500 }}>(offset {offsetLabel}d)</span></PDFFigTitle>
          <PDFPara label="What this shows">
            Daily speed ratings for both participants over the date range. {cmpParticipant?.label}'s line is shifted by {offsetLabel} day{Math.abs(offset) !== 1 ? 's' : ''}. Periods where both lines rise and fall in parallel indicate temporal alignment at this offset.
          </PDFPara>
          <PDFPara label="Interpretation">
            When the offset is correct, the two lines should move in rough parallel across most of the range. Divergent movements suggest the alignment is absent or that a different offset should be tested. The solid line is the reference participant; the dashed line is the comparison at the applied shift.
          </PDFPara>
          <div style={{ marginTop: 14 }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={offsetData} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <ReferenceLine y={0} stroke="#C8C6BF" strokeWidth={1.5} />
                <XAxis dataKey="date"
                  tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#9E9E8E' }}
                  tickFormatter={v => { const d = new Date(v + 'T00:00:00'); const day = d.getDate(); return day === 1 || day === 15 ? `${d.toLocaleDateString('en-US', { month: 'short' })} ${day}` : '' }}
                  interval={0} />
                <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]}
                  tick={{ fontFamily: PDF_UI, fontSize: 9, fill: '#9E9E8E' }}
                  tickFormatter={v => Y_TICK_LABELS[String(v)] || ''} width={42} />
                <Legend wrapperStyle={{ fontFamily: PDF_UI, fontSize: 10, paddingTop: 6 }} />
                <Line type="monotone" dataKey="ref" name={refParticipant?.label || 'Ref'}
                  stroke={PARTICIPANT_COLORS[0]} strokeWidth={1.5}
                  dot={<SpeedDot dataKey="ref" />} connectNulls={false} />
                <Line type="monotone" dataKey="cmp"
                  name={`${cmpParticipant?.label || 'Cmp'} (${offsetLabel}d)`}
                  stroke={PARTICIPANT_COLORS[1]} strokeWidth={1.5} strokeDasharray="4 2"
                  dot={<SpeedDot dataKey="cmp" />} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {scatterData.length < 3 && (
            <div style={{ marginTop: 20 }}>
              <CorrelationSummaryBlock correlation={correlation} offsetLabel={offsetLabel} />
            </div>
          )}
        </div>
      </div>

      {/* ── Page 2: Figure 5 — Scatter + Summary (when enough data) ──────── */}
      {scatterData.length >= 3 && (
        <div className="pdf-page" style={{ background: '#ffffff', padding: '40px 56px 52px' }}>
          <PDFFigLabel n={5} />
          <PDFFigTitle>Scatter Plot: {refParticipant?.label} vs {cmpParticipant?.label} ({offsetLabel}d)</PDFFigTitle>
          <PDFPara label="What this shows">
            Each dot represents one overlapping day. The X axis is {refParticipant?.label}'s rating; the Y axis is {cmpParticipant?.label}'s rating at the applied offset. A cluster along the diagonal from lower-left to upper-right indicates positive correlation.
          </PDFPara>
          <PDFPara label="Interpretation">
            A diagonal cluster supports H1 — both participants experienced similar time speed on the same (or shifted) days. Scattered dots with no diagonal structure support H0. The Pearson r below quantifies this numerically.
          </PDFPara>
          <div style={{ marginTop: 20 }}>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <ReferenceLine y={0} stroke="#C8C6BF" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#C8C6BF" strokeWidth={1} />
                <XAxis type="number" dataKey="x" domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]}
                  tick={{ fontFamily: PDF_UI, fontSize: 9, fill: '#9E9E8E' }}
                  tickFormatter={v => Y_TICK_LABELS[String(v)] || v}
                  label={{ value: refParticipant?.label, position: 'insideBottom', offset: -2, fontSize: 9, fill: '#9E9E8E', fontFamily: PDF_UI }} />
                <YAxis type="number" dataKey="y" domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]}
                  tick={{ fontFamily: PDF_UI, fontSize: 9, fill: '#9E9E8E' }}
                  tickFormatter={v => Y_TICK_LABELS[String(v)] || ''}
                  width={42}
                  label={{ value: cmpParticipant?.label, angle: -90, position: 'insideLeft', fontSize: 9, fill: '#9E9E8E', fontFamily: PDF_UI }} />
                <ZAxis range={[30, 30]} />
                <Scatter data={scatterData} fill="#3D3A8C" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 28 }}>
            <CorrelationSummaryBlock correlation={correlation} offsetLabel={offsetLabel} />
          </div>
        </div>
      )}

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
  const [exporting, setExporting] = useState(null)

  const pdfGroupRef = useRef(null)
  const pdfPairRef = useRef(null)

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

  async function exportGroupPDF() {
    if (!pdfGroupRef.current || exporting) return
    setExporting('group')
    const el = pdfGroupRef.current
    el.style.opacity = '1'
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise(r => setTimeout(r, 600))
    try {
      const { generatePDFFromElement } = await import('../utils/pdfExport.js')
      await generatePDFFromElement(el, 'temporal-perception-study.pdf')
    } finally {
      el.style.opacity = '0'
      setExporting(null)
    }
  }

  async function exportPairPDF() {
    if (!pdfPairRef.current || exporting) return
    setExporting('pair')
    const el = pdfPairRef.current
    el.style.opacity = '1'
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise(r => setTimeout(r, 600))
    try {
      const { generatePDFFromElement } = await import('../utils/pdfExport.js')
      await generatePDFFromElement(
        el,
        `temporal-${refParticipant?.label}-vs-${cmpParticipant?.label}.pdf`,
      )
    } finally {
      el.style.opacity = '0'
      setExporting(null)
    }
  }

  const dateRangeSelector = (
    <div className="no-print flex gap-3 mb-4">
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
      <div className="no-print flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl">Research</h1>
        <button onClick={exportGroupPDF} disabled={!!exporting}
          className="flex items-center gap-1.5 text-xs font-sans px-3 rounded"
          style={{ height: 32, border: '1px solid #E8E6DF', background: '#FFFFFF', color: exporting ? '#9E9E8E' : '#3D3A8C', cursor: exporting ? 'default' : 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7 2v5M5 5l2 2 2-2M3 9h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {exporting === 'group' ? 'Generating PDF…' : 'Export report as PDF'}
        </button>
      </div>

      {participants.length === 0 ? (
        <p className="text-sm font-sans py-8" style={{ color: '#9E9E8E' }}>No participants have logged data yet.</p>
      ) : (
        <>
          {/* A — Participants */}
          <div className="group-section py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
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
          <div className="group-section print-section py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Heatmap — all participants × days</SectionLabel>
            <div className="mb-4 text-xs font-sans leading-relaxed space-y-1.5" style={{ color: '#555550' }}>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>What this shows:</span> Each row is one participant. Each cell is one day. The color of the cell is their speed rating for that day — how fast or slow time felt.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>What to look for:</span> Vertical bands — columns where most rows share the same color. A vertical blue band means most participants felt time was slow on that day or period. A vertical amber band means most felt it was fast. Bands that run across many rows simultaneously are the core signal of the hypothesis.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>If the hypothesis is correct:</span> You will see recurring bands — slow periods and fast periods appearing at roughly the same time across unrelated people. The bands may be slightly staggered (shifting by a column or two between groups of participants), which would indicate a 1–2 day offset between individuals.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>If the hypothesis is wrong:</span> Colors are scattered randomly with no vertical structure. Each row looks like noise independent of the others.</p>
            </div>
            {dateRangeSelector}
            <ParticipantHeatmap
              participants={participants}
              allDailyByUid={allDailyByUid}
              fromDate={fromDate}
              toDate={toDate}
            />
          </div>

          {/* C — Average Signal */}
          <div className="group-section print-section py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Average signal across all participants</SectionLabel>
            <div className="mb-4 text-xs font-sans leading-relaxed space-y-1.5" style={{ color: '#555550' }}>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>What this shows:</span> The mean speed rating across all participants for each day, plotted as a single line over time. Each dot on the line is the average of everyone who logged that day.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>Why this matters:</span> When many people's data is averaged, individual noise cancels out. If a real shared signal exists, it becomes clearer here than in any individual's data alone. The more participants, the more reliable this line becomes.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>If the hypothesis is correct:</span> The line will show a visible wave — oscillating between slower and faster periods over time, with a pattern that repeats. A rising average means most people were feeling time speed up simultaneously; a dip means they felt it slowing.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>If the hypothesis is wrong:</span> The line hovers near zero with no clear rhythm — it looks flat or randomly jagged with no repeating structure.</p>
            </div>
            <AverageSignalChart
              participants={participants}
              allDailyByUid={allDailyByUid}
              fromDate={fromDate}
              toDate={toDate}
            />
          </div>

          {/* D — Correlation Matrix */}
          <div className="group-section print-section py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Correlation matrix — all pairs at zero offset</SectionLabel>
            <div className="mb-4 text-xs font-sans leading-relaxed space-y-1.5" style={{ color: '#555550' }}>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>What this shows:</span> A grid of every possible participant pair. Each cell shows the Pearson correlation coefficient (r) between two participants' daily speed ratings, compared on the same calendar day (zero offset). r ranges from −1 to +1, where +1 means their ratings move in perfect unison, 0 means no relationship, and −1 means they move in opposite directions.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>How to read the colors:</span> Green (r ≥ 0.7) means strong alignment — these two people's time perception rises and falls together. Amber (0.4–0.7) means moderate alignment. Gray (below 0.4) means no meaningful relationship. The diagonal is always empty — a person correlates perfectly with themselves by definition.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>If the hypothesis is correct:</span> You will see clusters of green cells, often as blocks along the diagonal — groups of participants who are in sync with each other. Between those green blocks, amber cells suggest the groups follow the same pattern but with a small time offset. Use the Offset Analysis tool below to identify the exact lag for any amber pair.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>Important note:</span> This matrix uses zero offset only. A pair that appears amber here may reveal a strong green correlation (r ≥ 0.7) when a 1 or 2 day shift is applied in the Offset Analysis section. Do not dismiss amber pairs without checking them there.</p>
            </div>
            <CorrelationMatrix participants={participants} allDailyByUid={allDailyByUid} />
          </div>

          {/* E — Offset Analysis */}
          <div className="pair-section print-section py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <SectionLabel>Offset analysis — pair deep-dive</SectionLabel>
            <div className="mb-4 text-xs font-sans leading-relaxed space-y-1.5" style={{ color: '#555550' }}>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>What this shows:</span> A focused comparison between any two participants. Select a reference participant and a comparison participant, then use the slider to shift one person's timeline forward or backward by up to 3 days relative to the other.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>How the offset works:</span> At offset 0, both timelines are compared on the same calendar day. At offset +1, the comparison participant's entries are shifted one day forward — meaning their day 2 is compared to the reference's day 1. This tests whether one person feels the same pattern one day later than the other.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>What to look for:</span> Slide the offset and watch the correlation value (r). If r jumps significantly higher at a specific offset (for example, weak at 0 but strong at +1), that indicates a real lag — one person consistently experiences the same slow or fast feeling one day after the other. This is the central prediction of the hypothesis.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>The scatter plot:</span> Each dot represents one overlapping day. The X axis is the reference participant's rating; the Y axis is the comparison participant's rating at the applied offset. When the offset is wrong, dots scatter randomly. When the offset is correct, dots cluster along a diagonal from lower-left (both slow) to upper-right (both fast) — showing that on days when one felt slow, so did the other.</p>
              <p><span className="font-medium" style={{ color: '#1A1A18' }}>Minimum data requirement:</span> At least 7 shared days are needed for the correlation to be reported. Fewer than 7 overlapping days is statistically insufficient.</p>
            </div>
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
                <div className="no-print flex justify-end mb-4">
                  <button onClick={exportPairPDF} disabled={!!exporting}
                    className="flex items-center gap-1.5 text-xs font-sans px-3 rounded"
                    style={{ height: 32, border: '1px solid #E8E6DF', background: '#FFFFFF', color: exporting ? '#9E9E8E' : '#3D3A8C', cursor: exporting ? 'default' : 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M7 2v5M5 5l2 2 2-2M3 9h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {exporting === 'pair' ? 'Generating PDF…' : `Export ${refParticipant?.label} vs ${cmpParticipant?.label} as PDF`}
                  </button>
                </div>
                <div className="no-print mb-5">
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
          <div className="group-section no-print py-4">
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

      {/* PDF render containers — at top:0 so Recharts can measure, opacity:0 so user can't see */}
      <div ref={pdfGroupRef} style={{ position: 'fixed', left: 0, top: 0, width: 700, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
        <GroupPDFDocument
          participants={participants}
          allDailyByUid={allDailyByUid}
          fromDate={fromDate}
          toDate={toDate}
        />
      </div>

      {refUid && cmpUid && (
        <div ref={pdfPairRef} style={{ position: 'fixed', left: 0, top: 0, width: 700, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
          <PairPDFDocument
            refParticipant={refParticipant}
            cmpParticipant={cmpParticipant}
            offset={offset}
            offsetData={offsetData}
            scatterData={scatterData}
            correlation={correlation}
          />
        </div>
      )}

      {/* Full-screen overlay shown while PDF is generating */}
      {exporting && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#FAFAF9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#E8E6DF', borderTopColor: '#3D3A8C' }} />
          <p className="text-sm font-sans" style={{ color: '#555550' }}>Generating PDF…</p>
          <p className="text-xs font-sans" style={{ color: '#9E9E8E' }}>This may take a few seconds</p>
        </div>
      )}
    </div>
  )
}
