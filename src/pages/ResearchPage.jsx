import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from 'recharts'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { pearsonWithOffset, interpretCorrelation } from '../utils/correlationUtils.js'
import { exportAllDailyCSV, exportAllWeeklyCSV, exportAllMonthlyCSV } from '../utils/adminExportUtils.js'
import { getSpeedLabel } from '../utils/speedLabels.js'

const PARTICIPANT_COLORS = ['#4F46E5', '#0D9488', '#E85D4A', '#D97706', '#64748B', '#7C3AED', '#059669', '#DC2626']

function getTodayMinus(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toLocaleDateString('en-CA')
}

function ExportButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-sm font-sans py-2.5 flex items-center justify-between"
      style={{ color: '#3D3A8C' }}
    >
      <span>{label}</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v7M4 6.5l3 3 3-3M2 11h10" stroke="#3D3A8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default function ResearchPage({ participantsHook }) {
  const { participants, allDailyByUid, allWeeklyByUid, allMonthlyByUid, loading, updateParticipantLabel } = participantsHook

  const [fromDate, setFromDate] = useState(getTodayMinus(89))
  const [toDate, setToDate] = useState(getTodayMinus(0))
  const [refUid, setRefUid] = useState('')
  const [cmpUid, setCmpUid] = useState('')
  const [offset, setOffset] = useState(0)
  const [editingLabel, setEditingLabel] = useState(null)
  const [labelInput, setLabelInput] = useState('')

  // Build overlay chart data
  const overlayData = useMemo(() => {
    const dateMap = {}
    const start = new Date(fromDate + 'T00:00:00')
    const end = new Date(toDate + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateMap[d.toLocaleDateString('en-CA')] = {}
    }
    participants.forEach((p) => {
      const daily = allDailyByUid[p.uid] || []
      daily.forEach((e) => {
        if (dateMap[e.date] !== undefined) {
          dateMap[e.date][p.uid] = e.speed
        }
      })
    })
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }))
  }, [participants, allDailyByUid, fromDate, toDate])

  // Build offset chart data
  const { offsetData, correlation } = useMemo(() => {
    if (!refUid || !cmpUid || refUid === cmpUid) return { offsetData: [], correlation: null }

    const refSeries = (allDailyByUid[refUid] || []).map((e) => ({ date: e.date, speed: e.speed }))
    const cmpSeries = (allDailyByUid[cmpUid] || []).map((e) => ({ date: e.date, speed: e.speed }))
    const corr = pearsonWithOffset(refSeries, cmpSeries, offset)

    // Build chart data for the selected range
    const start = new Date(fromDate + 'T00:00:00')
    const end = new Date(toDate + 'T00:00:00')
    const refMap = {}
    refSeries.forEach((e) => { refMap[e.date] = e.speed })

    // Apply offset to cmpSeries
    const cmpMap = {}
    cmpSeries.forEach(({ date, speed }) => {
      const d = new Date(date + 'T00:00:00')
      d.setDate(d.getDate() + offset)
      cmpMap[d.toLocaleDateString('en-CA')] = speed
    })

    const data = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toLocaleDateString('en-CA')
      data.push({ date: key, ref: refMap[key], cmp: cmpMap[key] })
    }

    return { offsetData: data, correlation: corr }
  }, [refUid, cmpUid, offset, allDailyByUid, fromDate, toDate])

  function startEditLabel(p) {
    setEditingLabel(p.uid)
    setLabelInput(p.participantLabel || '')
  }

  async function saveLabel(uid) {
    await updateParticipantLabel(uid, labelInput.trim())
    setEditingLabel(null)
  }

  const refParticipant = participants.find((p) => p.uid === refUid)
  const cmpParticipant = participants.find((p) => p.uid === cmpUid)

  if (loading) {
    return (
      <div className="pb-20 px-5 pt-4 max-w-[480px] mx-auto">
        <h1 className="font-serif text-2xl mb-4">Research</h1>
        <SkeletonCard lines={5} /><SkeletonCard lines={5} />
      </div>
    )
  }

  return (
    <div className="pb-20 px-5 pt-4 max-w-[480px] mx-auto">
      <h1 className="font-serif text-2xl mb-4">Research</h1>

      {participants.length === 0 ? (
        <p className="text-sm font-sans py-8" style={{ color: '#9E9E8E' }}>No participants have logged data yet.</p>
      ) : (
        <>
          {/* Section A — Participant Overview */}
          <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <p className="text-xs font-sans uppercase tracking-wider mb-3" style={{ color: '#9E9E8E' }}>Participants</p>
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
                  {participants.map((p) => (
                    <tr key={p.uid} style={{ borderTop: '1px solid #E8E6DF' }}>
                      <td className="py-2 pr-3">
                        {editingLabel === p.uid ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={labelInput}
                              onChange={(e) => setLabelInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(p.uid); if (e.key === 'Escape') setEditingLabel(null) }}
                              className="font-mono text-xs px-1 rounded outline-none"
                              style={{ border: '1px solid #3D3A8C', width: 40 }}
                              autoFocus
                            />
                            <button onClick={() => saveLabel(p.uid)} className="text-xs" style={{ color: '#3D3A8C' }}>Save</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditLabel(p)}
                            className="font-mono font-medium"
                            style={{ color: '#3D3A8C' }}
                          >
                            {p.label}
                          </button>
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

          {/* Section B — Overlay Chart */}
          <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <p className="text-xs font-sans uppercase tracking-wider mb-3" style={{ color: '#9E9E8E' }}>Overlay chart</p>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs font-sans block mb-1" style={{ color: '#9E9E8E' }}>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-2 text-xs font-mono rounded outline-none"
                  style={{ height: '36px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-sans block mb-1" style={{ color: '#9E9E8E' }}>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-2 text-xs font-mono rounded outline-none"
                  style={{ height: '36px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}
                />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={overlayData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <XAxis
                  dataKey="date"
                  tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#9E9E8E' }}
                  tickFormatter={(v) => {
                    const d = new Date(v + 'T00:00:00')
                    const day = d.getDate()
                    return day === 1 || day === 15 ? `${d.toLocaleDateString('en-US', { month: 'short' })} ${day}` : ''
                  }}
                  interval={0}
                />
                <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]} tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="font-sans text-xs rounded p-2" style={{ background: '#FFFFFF', border: '1px solid #E8E6DF' }}>
                        <p className="font-mono font-medium mb-1">{label}</p>
                        {payload.filter(p => p.value !== undefined && p.value !== null).map((p, i) => {
                          const participant = participants.find(pt => pt.uid === p.dataKey)
                          return (
                            <p key={i} style={{ color: p.color }}>
                              {participant?.label || p.dataKey}: {getSpeedLabel(p.value)}
                            </p>
                          )
                        })}
                      </div>
                    )
                  }}
                />
                <Legend
                  formatter={(value) => participants.find((p) => p.uid === value)?.label || value}
                  wrapperStyle={{ fontFamily: 'Inter', fontSize: 10 }}
                />
                {participants.map((p, i) => (
                  <Line
                    key={p.uid}
                    type="monotone"
                    dataKey={p.uid}
                    stroke={PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Section C — Offset Analysis */}
          <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
            <p className="text-xs font-sans uppercase tracking-wider mb-3" style={{ color: '#9E9E8E' }}>Offset analysis</p>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs font-sans block mb-1" style={{ color: '#9E9E8E' }}>Reference</label>
                <select
                  value={refUid}
                  onChange={(e) => setRefUid(e.target.value)}
                  className="w-full px-2 text-xs font-sans rounded outline-none"
                  style={{ height: '36px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}
                >
                  <option value="">Select...</option>
                  {participants.map((p) => (
                    <option key={p.uid} value={p.uid}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-sans block mb-1" style={{ color: '#9E9E8E' }}>Compare with</label>
                <select
                  value={cmpUid}
                  onChange={(e) => setCmpUid(e.target.value)}
                  className="w-full px-2 text-xs font-sans rounded outline-none"
                  style={{ height: '36px', border: '1px solid #E8E6DF', background: '#FFFFFF' }}
                >
                  <option value="">Select...</option>
                  {participants.filter((p) => p.uid !== refUid).map((p) => (
                    <option key={p.uid} value={p.uid}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {refUid && cmpUid && (
              <>
                <div className="mb-4">
                  <label className="text-xs font-sans block mb-2" style={{ color: '#9E9E8E' }}>
                    Shift {cmpParticipant?.label || 'B'} by{' '}
                    <span className="font-mono font-medium" style={{ color: '#1A1A18' }}>
                      {offset > 0 ? `+${offset}` : offset} day{Math.abs(offset) !== 1 ? 's' : ''}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={-3}
                    max={3}
                    step={1}
                    value={offset}
                    onChange={(e) => setOffset(parseInt(e.target.value))}
                    className="w-full"
                    style={{ accentColor: '#3D3A8C' }}
                  />
                  <div className="flex justify-between text-xs font-mono mt-0.5" style={{ color: '#9E9E8E' }}>
                    <span>-3</span><span>0</span><span>+3</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={offsetData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#9E9E8E' }}
                      tickFormatter={(v) => {
                        const d = new Date(v + 'T00:00:00')
                        const day = d.getDate()
                        return day === 1 || day === 15 ? `${d.toLocaleDateString('en-US', { month: 'short' })} ${day}` : ''
                      }}
                      interval={0}
                    />
                    <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]} tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="font-sans text-xs rounded p-2" style={{ background: '#FFFFFF', border: '1px solid #E8E6DF' }}>
                            <p className="font-mono font-medium mb-1">{label}</p>
                            {payload.filter(p => p.value !== undefined && p.value !== null).map((p, i) => (
                              <p key={i} style={{ color: p.color }}>{p.name}: {getSpeedLabel(p.value)}</p>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 10 }} />
                    <Line type="monotone" dataKey="ref" name={refParticipant?.label || 'Ref'} stroke={PARTICIPANT_COLORS[0]} strokeWidth={1.5} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="cmp" name={`${cmpParticipant?.label || 'Cmp'} (offset ${offset > 0 ? '+' : ''}${offset}d)`} stroke={PARTICIPANT_COLORS[1]} strokeWidth={1.5} dot={false} connectNulls={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 p-3 rounded" style={{ background: '#F0EFE8' }}>
                  {correlation === null ? (
                    <p className="text-sm font-sans" style={{ color: '#555550' }}>
                      Not enough overlapping data to calculate correlation (need at least 7 shared days).
                    </p>
                  ) : (
                    <>
                      <p className="font-sans text-sm font-medium" style={{ color: '#1A1A18' }}>
                        Correlation: <span className="font-mono">{correlation.r.toFixed(2)}</span>
                      </p>
                      <p className="text-sm font-sans mt-1" style={{ color: '#555550' }}>
                        {interpretCorrelation(correlation.r)} · {correlation.pairsUsed} overlapping days
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Section D — Export All */}
          <div className="py-4">
            <p className="text-xs font-sans uppercase tracking-wider mb-3" style={{ color: '#9E9E8E' }}>Export all data</p>
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
