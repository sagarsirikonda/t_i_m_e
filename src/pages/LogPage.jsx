import React, { useState, useEffect } from 'react'
import SpeedSelector, { SpeedLegend } from '../components/SpeedSelector.jsx'
import PillSelector from '../components/PillSelector.jsx'
import SaveButton from '../components/SaveButton.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import {
  getTodayKey,
  getWeekKey,
  getMonthKey,
  formatTodayFull,
  getCurrentWeekRangeLabel,
  formatMonthLabel,
  formatWeekLabel,
  getMondayKey,
} from '../utils/dateUtils.js'

const CONSISTENCY_OPTIONS = [
  { value: 'consistent', label: 'Consistent' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'shifted', label: 'Shifted midweek' },
]

const TREND_OPTIONS = [
  { value: 'accelerating', label: 'Accelerating' },
  { value: 'decelerating', label: 'Decelerating' },
  { value: 'flat', label: 'Flat' },
  { value: 'irregular', label: 'Irregular' },
]

const COMPARED_OPTIONS = [
  { value: 'faster', label: 'Faster than last month' },
  { value: 'slower', label: 'Slower than last month' },
  { value: 'similar', label: 'Similar to last month' },
]

function Section({ children }) {
  return (
    <div className="py-6 border-b" style={{ borderColor: '#E8E6DF' }}>
      {children}
    </div>
  )
}

export default function LogPage({ dailyHook, weeklyHook, monthlyHook, isNewUser }) {
  const todayKey = getTodayKey()
  const weekKey = getWeekKey()
  const monthKey = getMonthKey()
  const weekLabel = formatWeekLabel(weekKey)
  const monthLabel = formatMonthLabel(monthKey)
  const weekRange = getCurrentWeekRangeLabel()
  const mondayKey = getMondayKey()

  // Daily form state
  const [dailySpeed, setDailySpeed] = useState(null)
  const [dailyConfidence, setDailyConfidence] = useState(null)
  const [dailyNote, setDailyNote] = useState('')

  // Weekly form state
  const [weeklySpeed, setWeeklySpeed] = useState(null)
  const [weeklyConsistency, setWeeklyConsistency] = useState(null)
  const [weeklyNote, setWeeklyNote] = useState('')

  // Monthly form state
  const [monthlySpeed, setMonthlySpeed] = useState(null)
  const [monthlyTrend, setMonthlyTrend] = useState(null)
  const [monthlyCompared, setMonthlyCompared] = useState(null)
  const [monthlyNote, setMonthlyNote] = useState('')

  const todayEntry = dailyHook.entries.find((e) => e.date === todayKey)
  const weekEntry = weeklyHook.entries.find((e) => e.weekKey === weekKey)
  const monthEntry = monthlyHook.entries.find((e) => e.monthKey === monthKey)

  // Pre-fill from existing entries
  useEffect(() => {
    if (todayEntry) {
      setDailySpeed(todayEntry.speed)
      setDailyConfidence(todayEntry.confidence)
      setDailyNote(todayEntry.note || '')
    }
  }, [todayEntry?.date])

  useEffect(() => {
    if (weekEntry) {
      setWeeklySpeed(weekEntry.speed)
      setWeeklyConsistency(weekEntry.consistency)
      setWeeklyNote(weekEntry.note || '')
    }
  }, [weekEntry?.weekKey])

  useEffect(() => {
    if (monthEntry) {
      setMonthlySpeed(monthEntry.speed)
      setMonthlyTrend(monthEntry.trend)
      setMonthlyCompared(monthEntry.comparedToLast)
      setMonthlyNote(monthEntry.note || '')
    }
  }, [monthEntry?.monthKey])

  async function saveDaily() {
    if (dailySpeed === null) throw new Error('Select a speed')
    await dailyHook.saveEntry(todayKey, {
      speed: dailySpeed,
      confidence: dailyConfidence ?? false,
      note: dailyNote,
    })
  }

  async function saveWeekly() {
    if (weeklySpeed === null) throw new Error('Select a speed')
    await weeklyHook.saveEntry(weekKey, {
      speed: weeklySpeed,
      consistency: weeklyConsistency || '',
      note: weeklyNote,
      weekKey,
      weekLabel,
    })
  }

  async function saveMonthly() {
    if (monthlySpeed === null) throw new Error('Select a speed')
    await monthlyHook.saveEntry(monthKey, {
      speed: monthlySpeed,
      trend: monthlyTrend || '',
      comparedToLast: monthlyCompared || '',
      note: monthlyNote,
      monthKey,
      monthLabel,
    })
  }

  const loading = dailyHook.loading || weeklyHook.loading || monthlyHook.loading

  return (
    <div className="pb-20 px-5 pt-4 max-w-[480px] mx-auto">
      <h1
        className="font-serif text-2xl mb-1"
        style={{ color: '#1A1A18' }}
      >
        {formatTodayFull()}
      </h1>

      {isNewUser && (
        <p className="text-sm font-sans mt-2 mb-2" style={{ color: '#3D3A8C' }}>
          Welcome. Start by logging how today feels.
        </p>
      )}

      {loading ? (
        <>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </>
      ) : (
        <>
          {/* Section A — Today */}
          <Section>
            <h2 className="font-sans font-medium text-base mb-4" style={{ color: '#1A1A18' }}>
              How did today feel?
            </h2>
            <SpeedSelector value={dailySpeed} onChange={setDailySpeed} />
            <SpeedLegend />

            <p className="text-sm font-sans mt-4 mb-2" style={{ color: '#555550' }}>
              Did this feel clear to you?
            </p>
            <div className="flex gap-2">
              {[{ value: true, label: 'Yes, clear' }, { value: false, label: 'Not sure' }].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setDailyConfidence(opt.value)}
                  className="px-3 text-sm rounded font-sans"
                  style={{
                    height: '36px',
                    background: dailyConfidence === opt.value ? '#3D3A8C' : '#FFFFFF',
                    color: dailyConfidence === opt.value ? '#FFFFFF' : '#1A1A18',
                    border: dailyConfidence === opt.value ? '1px solid #3D3A8C' : '1px solid #E8E6DF',
                  }}
                >{opt.label}</button>
              ))}
            </div>

            <textarea
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value.slice(0, 280))}
              maxLength={280}
              rows={3}
              placeholder="Anything worth noting? (optional)"
              className="w-full mt-4 p-3 text-sm font-sans rounded resize-none outline-none"
              style={{ border: '1px solid #E8E6DF', background: '#FFFFFF' }}
            />
            <p className="text-xs font-sans mt-1 text-right" style={{ color: '#9E9E8E' }}>
              {dailyNote.length}/280
            </p>

            <div className="mt-3">
              <SaveButton
                onSave={saveDaily}
                label="Save today's entry"
                updateLabel={todayEntry ? "Update today's entry" : "Save today's entry"}
              />
            </div>
          </Section>

          {/* Section B — This Week */}
          <Section>
            <h2 className="font-sans font-medium text-base mb-1" style={{ color: '#1A1A18' }}>
              How has this week felt overall?
            </h2>
            <p className="text-sm font-sans mb-4" style={{ color: '#9E9E8E' }}>
              {weekRange}
              {mondayKey === todayKey && (
                <span className="ml-2 text-xs">· Covers Mon {mondayKey} onwards</span>
              )}
            </p>
            <SpeedSelector value={weeklySpeed} onChange={setWeeklySpeed} />
            <SpeedLegend />

            <p className="text-sm font-sans mt-4 mb-2" style={{ color: '#555550' }}>Consistency</p>
            <PillSelector options={CONSISTENCY_OPTIONS} value={weeklyConsistency} onChange={setWeeklyConsistency} />

            <textarea
              value={weeklyNote}
              onChange={(e) => setWeeklyNote(e.target.value.slice(0, 280))}
              maxLength={280}
              rows={3}
              placeholder="Anything worth noting? (optional)"
              className="w-full mt-4 p-3 text-sm font-sans rounded resize-none outline-none"
              style={{ border: '1px solid #E8E6DF', background: '#FFFFFF' }}
            />
            <p className="text-xs font-sans mt-1 text-right" style={{ color: '#9E9E8E' }}>
              {weeklyNote.length}/280
            </p>

            <div className="mt-3">
              <SaveButton
                onSave={saveWeekly}
                label="Save this week's entry"
                updateLabel={weekEntry ? "Update this week's entry" : "Save this week's entry"}
              />
            </div>
          </Section>

          {/* Section C — This Month */}
          <Section>
            <h2 className="font-sans font-medium text-base mb-4" style={{ color: '#1A1A18' }}>
              How has {new Date().toLocaleDateString('en-US', { month: 'long' })} felt overall?
            </h2>
            <SpeedSelector value={monthlySpeed} onChange={setMonthlySpeed} />
            <SpeedLegend />

            <p className="text-sm font-sans mt-4 mb-2" style={{ color: '#555550' }}>Trend</p>
            <PillSelector options={TREND_OPTIONS} value={monthlyTrend} onChange={setMonthlyTrend} />

            <p className="text-sm font-sans mt-4 mb-2" style={{ color: '#555550' }}>Compared to last month</p>
            <PillSelector options={COMPARED_OPTIONS} value={monthlyCompared} onChange={setMonthlyCompared} />

            <textarea
              value={monthlyNote}
              onChange={(e) => setMonthlyNote(e.target.value.slice(0, 280))}
              maxLength={280}
              rows={3}
              placeholder="Anything worth noting? (optional)"
              className="w-full mt-4 p-3 text-sm font-sans rounded resize-none outline-none"
              style={{ border: '1px solid #E8E6DF', background: '#FFFFFF' }}
            />
            <p className="text-xs font-sans mt-1 text-right" style={{ color: '#9E9E8E' }}>
              {monthlyNote.length}/280
            </p>

            <div className="mt-3">
              <SaveButton
                onSave={saveMonthly}
                label="Save this month's entry"
                updateLabel={monthEntry ? "Update this month's entry" : "Save this month's entry"}
              />
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
