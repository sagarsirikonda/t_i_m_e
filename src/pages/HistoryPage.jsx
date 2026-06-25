import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Area, AreaChart, Cell,
} from 'recharts'
import { DailyEntryCard, WeeklyEntryCard, MonthlyEntryCard } from '../components/EntryCard.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { getSpeedColor, getSpeedLabel, getSpeedOption } from '../utils/speedLabels.js'
import { parseDateKey } from '../utils/dateUtils.js'

const SUBTABS = ['Daily', 'Weekly', 'Monthly']

function SpeedDot(props) {
  const { cx, cy, payload } = props
  if (!payload || payload.speed === undefined) return null
  const color = getSpeedColor(payload.speed)
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#FAFAF9" strokeWidth={1.5} />
}

function CustomDailyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="font-sans text-xs rounded p-2 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6DF' }}>
      <p className="font-mono font-medium mb-1">{d?.date}</p>
      <p style={{ color: getSpeedColor(d?.speed) }}>{getSpeedLabel(d?.speed)}</p>
      {d?.note && <p className="mt-1 max-w-[160px]" style={{ color: '#555550' }}>{d.note}</p>}
    </div>
  )
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="font-sans text-xs rounded p-2 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6DF' }}>
      <p className="font-mono font-medium mb-1">{d?.key}</p>
      <p style={{ color: getSpeedColor(d?.speed) }}>{getSpeedLabel(d?.speed)}</p>
    </div>
  )
}

const Y_TICKS = [-2, -1, 0, 1, 2]
const Y_LABELS = { '-2': 'Slower', '-1': '', '0': 'Normal', '1': '', '2': 'Faster' }

export default function HistoryPage({ dailyHook, weeklyHook, monthlyHook }) {
  const [activeTab, setActiveTab] = useState('Daily')

  return (
    <div className="pb-20 pt-4 max-w-[480px] mx-auto">
      <div className="px-5">
        <h1 className="font-serif text-2xl mb-4">History</h1>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b px-5" style={{ borderColor: '#E8E6DF' }}>
        {SUBTABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="mr-6 pb-3 text-sm font-sans transition-colors"
            style={{
              color: activeTab === tab ? '#3D3A8C' : '#9E9E8E',
              fontWeight: activeTab === tab ? '600' : '400',
              borderBottom: activeTab === tab ? '2px solid #3D3A8C' : '2px solid transparent',
            }}
          >{tab}</button>
        ))}
      </div>

      <div className="px-5 mt-4">
        {activeTab === 'Daily' && (
          <DailyHistory hook={dailyHook} />
        )}
        {activeTab === 'Weekly' && (
          <WeeklyHistory hook={weeklyHook} />
        )}
        {activeTab === 'Monthly' && (
          <MonthlyHistory hook={monthlyHook} />
        )}
      </div>
    </div>
  )
}

function DailyHistory({ hook }) {
  const { entries, loading, saveEntry } = hook

  const chartData = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now)
    cutoff.setDate(now.getDate() - 89)
    const entryMap = {}
    entries.forEach((e) => { entryMap[e.date] = e })

    const data = []
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toLocaleDateString('en-CA')
      const entry = entryMap[key]
      data.push({ date: key, speed: entry?.speed, note: entry?.note, confidence: entry?.confidence })
    }
    return data
  }, [entries])

  if (loading) return <><SkeletonCard lines={5} /><SkeletonCard lines={3} /><SkeletonCard lines={3} /></>

  return (
    <>
      {entries.length === 0 ? (
        <p className="text-sm font-sans py-8" style={{ color: '#9E9E8E' }}>No daily entries yet.</p>
      ) : (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
              <ReferenceLine y={0} stroke="#E8E6DF" strokeWidth={1.5} />
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
              <YAxis
                domain={[-2, 2]}
                ticks={Y_TICKS}
                tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }}
                tickFormatter={(v) => Y_LABELS[String(v)] || ''}
              />
              <Tooltip content={<CustomDailyTooltip />} />
              <Line
                type="monotone"
                dataKey="speed"
                stroke="#3D3A8C"
                strokeWidth={1.5}
                dot={<SpeedDot />}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {entries.map((e) => (
        <DailyEntryCard key={e.id} entry={e} onSave={saveEntry} />
      ))}
    </>
  )
}

function WeeklyHistory({ hook }) {
  const { entries, loading, saveEntry } = hook

  const chartData = useMemo(() => {
    return entries
      .slice(0, 26)
      .reverse()
      .map((e) => ({ key: e.weekKey, speed: e.speed }))
  }, [entries])

  if (loading) return <><SkeletonCard lines={5} /><SkeletonCard lines={3} /></>

  return (
    <>
      {entries.length === 0 ? (
        <p className="text-sm font-sans py-8" style={{ color: '#9E9E8E' }}>No weekly entries yet.</p>
      ) : (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" vertical={false} />
              <XAxis dataKey="key" tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#9E9E8E' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis domain={[-2, 2]} ticks={Y_TICKS} tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }} tickFormatter={(v) => Y_LABELS[String(v)] || ''} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="speed" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={getSpeedColor(entry.speed)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {entries.map((e) => (
        <WeeklyEntryCard key={e.id} entry={e} onSave={saveEntry} />
      ))}
    </>
  )
}

function MonthlyHistory({ hook }) {
  const { entries, loading, saveEntry } = hook

  const chartData = useMemo(() => {
    return [...entries].reverse().map((e) => ({ key: e.monthKey, speed: e.speed }))
  }, [entries])

  if (loading) return <><SkeletonCard lines={5} /><SkeletonCard lines={3} /></>

  return (
    <>
      {entries.length === 0 ? (
        <p className="text-sm font-sans py-8" style={{ color: '#9E9E8E' }}>No monthly entries yet.</p>
      ) : (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" vertical={false} />
              <XAxis dataKey="key" tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#9E9E8E' }} />
              <YAxis domain={[-2, 2]} ticks={Y_TICKS} tick={{ fontFamily: 'Inter', fontSize: 9, fill: '#9E9E8E' }} tickFormatter={(v) => Y_LABELS[String(v)] || ''} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="speed" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={getSpeedColor(entry.speed)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {entries.map((e) => (
        <MonthlyEntryCard key={e.id} entry={e} onSave={saveEntry} />
      ))}
    </>
  )
}
