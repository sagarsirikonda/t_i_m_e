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

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
]

function EarlyNotice({ message }) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2.5 rounded mb-5 text-xs font-sans leading-relaxed"
      style={{ background: '#F0EFE8', color: '#555550' }}
    >
      <span style={{ color: '#B5620A', marginTop: 1 }}>&#9432;</span>
      <span>{message}</span>
    </div>
  )
}

function getWeekNotice() {
  const day = new Date().getDay() // 0=Sun, 1=Mon ... 6=Sat
  if (day >= 1 && day <= 4) {
    const daysLeft = 7 - day
    return `The week isn't over yet — ${daysLeft} day${daysLeft > 1 ? 's' : ''} to go. You can log now and update it later.`
  }
  return null
}

function getMonthNotice() {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = lastDay - now.getDate()
  if (daysLeft > 5) {
    return `${daysLeft} days left in ${now.toLocaleDateString('en-US', { month: 'long' })}. You can log now and update when the month ends.`
  }
  return null
}

export default function LogPage({ dailyHook, weeklyHook, monthlyHook, isNewUser }) {
  const todayKey = getTodayKey()
  const weekKey = getWeekKey()
  const monthKey = getMonthKey()
  const weekLabel = formatWeekLabel(weekKey)
  const monthLabel = formatMonthLabel(monthKey)
  const weekRange = getCurrentWeekRangeLabel()
  const mondayKey = getMondayKey()

  const [activeTab, setActiveTab] = useState('today')
  const [animating, setAnimating] = useState(false)
  const [displayTab, setDisplayTab] = useState('today')

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

  function switchTab(tab) {
    if (tab === activeTab || animating) return
    setAnimating(true)
    setTimeout(() => {
      setDisplayTab(tab)
      setActiveTab(tab)
      setTimeout(() => setAnimating(false), 200)
    }, 150)
  }

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
    <div className="pb-20 pt-4 max-w-[480px] mx-auto">
      {/* Header */}
      <div className="px-5 mb-5">
        <h1 className="font-serif text-2xl" style={{ color: '#1A1A18' }}>
          {formatTodayFull()}
        </h1>
        {isNewUser && (
          <p className="text-sm font-sans mt-2" style={{ color: '#3D3A8C' }}>
            Welcome. Start by logging how today feels.
          </p>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b px-5" style={{ borderColor: '#E8E6DF' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          const hasSaved =
            (tab.id === 'today' && todayEntry) ||
            (tab.id === 'week' && weekEntry) ||
            (tab.id === 'month' && monthEntry)

          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className="mr-5 pb-3 text-sm font-sans flex items-center gap-1.5 transition-colors"
              style={{
                color: active ? '#3D3A8C' : '#9E9E8E',
                fontWeight: active ? '600' : '400',
                borderBottom: active ? '2px solid #3D3A8C' : '2px solid transparent',
              }}
            >
              {tab.label}
              {hasSaved && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: active ? '#3D3A8C' : '#C8C6BF' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content with fade transition */}
      <div
        className="px-5 pt-6 transition-opacity duration-150"
        style={{ opacity: animating ? 0 : 1 }}
      >
        {loading ? (
          <><SkeletonCard lines={4} /><SkeletonCard lines={3} /></>
        ) : (
          <>
            {/* TODAY */}
            {displayTab === 'today' && (
              <div>
                <p className="text-xs font-mono mb-5" style={{ color: '#9E9E8E' }}>{todayKey}</p>

                <p className="font-sans font-medium text-base mb-4" style={{ color: '#1A1A18' }}>
                  How did today feel?
                </p>
                <SpeedSelector value={dailySpeed} onChange={setDailySpeed} />
                <SpeedLegend />

                <p className="text-sm font-sans mt-6 mb-2" style={{ color: '#555550' }}>
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
                  className="w-full mt-5 p-3 text-sm font-sans rounded resize-none outline-none"
                  style={{ border: '1px solid #E8E6DF', background: '#FFFFFF' }}
                />
                <p className="text-xs font-sans mt-1 text-right" style={{ color: '#9E9E8E' }}>
                  {dailyNote.length}/280
                </p>

                <div className="mt-4">
                  <SaveButton
                    onSave={saveDaily}
                    label="Save today's entry"
                    updateLabel={todayEntry ? "Update today's entry" : "Save today's entry"}
                  />
                </div>
              </div>
            )}

            {/* THIS WEEK */}
            {displayTab === 'week' && (
              <div>
                <p className="text-xs font-mono mb-5" style={{ color: '#9E9E8E' }}>{weekRange}</p>

                {getWeekNotice() && <EarlyNotice message={getWeekNotice()} />}

                <p className="font-sans font-medium text-base mb-4" style={{ color: '#1A1A18' }}>
                  How has this week felt overall?
                </p>
                {mondayKey === todayKey && (
                  <p className="text-xs font-sans mb-3" style={{ color: '#9E9E8E' }}>
                    Covers Mon {mondayKey} onwards
                  </p>
                )}
                <SpeedSelector value={weeklySpeed} onChange={setWeeklySpeed} />
                <SpeedLegend />

                <p className="text-sm font-sans mt-6 mb-2" style={{ color: '#555550' }}>Consistency</p>
                <PillSelector options={CONSISTENCY_OPTIONS} value={weeklyConsistency} onChange={setWeeklyConsistency} />

                <textarea
                  value={weeklyNote}
                  onChange={(e) => setWeeklyNote(e.target.value.slice(0, 280))}
                  maxLength={280}
                  rows={3}
                  placeholder="Anything worth noting? (optional)"
                  className="w-full mt-5 p-3 text-sm font-sans rounded resize-none outline-none"
                  style={{ border: '1px solid #E8E6DF', background: '#FFFFFF' }}
                />
                <p className="text-xs font-sans mt-1 text-right" style={{ color: '#9E9E8E' }}>
                  {weeklyNote.length}/280
                </p>

                <div className="mt-4">
                  <SaveButton
                    onSave={saveWeekly}
                    label="Save this week's entry"
                    updateLabel={weekEntry ? "Update this week's entry" : "Save this week's entry"}
                  />
                </div>
              </div>
            )}

            {/* THIS MONTH */}
            {displayTab === 'month' && (
              <div>
                <p className="text-xs font-mono mb-5" style={{ color: '#9E9E8E' }}>{monthKey}</p>

                {getMonthNotice() && <EarlyNotice message={getMonthNotice()} />}

                <p className="font-sans font-medium text-base mb-4" style={{ color: '#1A1A18' }}>
                  How has {new Date().toLocaleDateString('en-US', { month: 'long' })} felt overall?
                </p>
                <SpeedSelector value={monthlySpeed} onChange={setMonthlySpeed} />
                <SpeedLegend />

                <p className="text-sm font-sans mt-6 mb-2" style={{ color: '#555550' }}>Trend</p>
                <PillSelector options={TREND_OPTIONS} value={monthlyTrend} onChange={setMonthlyTrend} />

                <p className="text-sm font-sans mt-5 mb-2" style={{ color: '#555550' }}>Compared to last month</p>
                <PillSelector options={COMPARED_OPTIONS} value={monthlyCompared} onChange={setMonthlyCompared} />

                <textarea
                  value={monthlyNote}
                  onChange={(e) => setMonthlyNote(e.target.value.slice(0, 280))}
                  maxLength={280}
                  rows={3}
                  placeholder="Anything worth noting? (optional)"
                  className="w-full mt-5 p-3 text-sm font-sans rounded resize-none outline-none"
                  style={{ border: '1px solid #E8E6DF', background: '#FFFFFF' }}
                />
                <p className="text-xs font-sans mt-1 text-right" style={{ color: '#9E9E8E' }}>
                  {monthlyNote.length}/280
                </p>

                <div className="mt-4">
                  <SaveButton
                    onSave={saveMonthly}
                    label="Save this month's entry"
                    updateLabel={monthEntry ? "Update this month's entry" : "Save this month's entry"}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
