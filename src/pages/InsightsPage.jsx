import React, { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { getSpeedLabel, getSpeedColor } from '../utils/speedLabels.js'
import { parseDateKey, getMonthKey } from '../utils/dateUtils.js'

function InsightCard({ title, children }) {
  return (
    <div className="py-4 border-b" style={{ borderColor: '#E8E6DF' }}>
      <p className="text-xs font-sans uppercase tracking-wider mb-2" style={{ color: '#9E9E8E' }}>{title}</p>
      {children}
    </div>
  )
}

function BigStat({ value, sub }) {
  return (
    <div>
      <p className="font-serif text-3xl" style={{ color: '#1A1A18' }}>{value}</p>
      {sub && <p className="text-sm font-sans mt-0.5" style={{ color: '#555550' }}>{sub}</p>}
    </div>
  )
}

export default function InsightsPage({ dailyHook, weeklyHook, monthlyHook }) {
  const { entries: daily, loading: dLoading } = dailyHook
  const { entries: weekly, loading: wLoading } = weeklyHook
  const { entries: monthly, loading: mLoading } = monthlyHook
  const loading = dLoading || wLoading || mLoading

  const insights = useMemo(() => {
    if (daily.length === 0) return null

    // Sort daily by date ascending
    const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date))
    const todayKey = new Date().toLocaleDateString('en-CA')

    // Logging streak
    let streak = 0
    let d = new Date()
    while (true) {
      const key = d.toLocaleDateString('en-CA')
      if (sorted.find((e) => e.date === key)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }

    // This month's average
    const curMonth = getMonthKey()
    const thisMonthEntries = sorted.filter((e) => e.date.startsWith(curMonth))
    const monthAvg = thisMonthEntries.length > 0
      ? (thisMonthEntries.reduce((s, e) => s + e.speed, 0) / thisMonthEntries.length).toFixed(2)
      : null

    // Most common feeling
    const counts = { '-2': 0, '-1': 0, '0': 0, '1': 0, '2': 0 }
    sorted.forEach((e) => { counts[String(e.speed)] = (counts[String(e.speed)] || 0) + 1 })
    const mostCommonVal = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]

    // Longest fast / slow periods
    function longestRun(predicate) {
      let best = null, cur = []
      for (const e of sorted) {
        if (predicate(e.speed)) {
          cur.push(e)
        } else {
          if (cur.length > (best?.length || 0)) best = [...cur]
          cur = []
        }
      }
      if (cur.length > (best?.length || 0)) best = cur
      return best
    }
    const fastRun = longestRun((s) => s >= 1)
    const slowRun = longestRun((s) => s <= -1)

    // Week vs day alignment
    let alignCount = 0, totalWeeks = 0
    weekly.forEach((w) => {
      const weekDays = sorted.filter((e) => {
        const d = parseDateKey(e.date)
        const dayOfWeek = d.getDay()
        const monday = new Date(d)
        monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
        const wKey = `${monday.getFullYear()}-W${String(Math.ceil(((monday - new Date(monday.getFullYear(), 0, 1)) / 86400000 + new Date(monday.getFullYear(), 0, 1).getDay() + 1) / 7)).padStart(2, '0')}`
        return wKey === w.weekKey
      })
      if (weekDays.length >= 3) {
        const avgDay = weekDays.reduce((s, e) => s + e.speed, 0) / weekDays.length
        const diff = Math.abs(avgDay - w.speed)
        if (diff <= 0.5) alignCount++
        totalWeeks++
      }
    })
    const alignRate = totalWeeks > 0 ? alignCount / totalWeeks : null

    return {
      streak,
      monthAvg,
      thisMonthCount: thisMonthEntries.length,
      mostCommonVal: parseInt(mostCommonVal[0]),
      mostCommonCount: mostCommonVal[1],
      fastRun,
      slowRun,
      alignRate,
      totalWeeks,
    }
  }, [daily, weekly])

  const monthlySparkData = useMemo(() => {
    return [...monthly].sort((a, b) => a.monthKey.localeCompare(b.monthKey)).map((e) => ({ speed: e.speed }))
  }, [monthly])

  if (loading) {
    return (
      <div className="pb-20 px-5 pt-4 max-w-[480px] mx-auto">
        <h1 className="font-serif text-2xl mb-4">Insights</h1>
        <SkeletonCard lines={4} /><SkeletonCard lines={4} /><SkeletonCard lines={4} />
      </div>
    )
  }

  return (
    <div className="pb-20 px-5 pt-4 max-w-[480px] mx-auto">
      <h1 className="font-serif text-2xl mb-4">Insights</h1>

      {daily.length < 14 && (
        <p className="text-sm font-sans py-3 mb-2 px-3 rounded" style={{ color: '#555550', background: '#F0EFE8' }}>
          Log at least 14 days to see insights. {daily.length > 0 ? `You have ${daily.length} day${daily.length === 1 ? '' : 's'} logged.` : ''}
        </p>
      )}

      {insights && (
        <>
          <InsightCard title="Logging streak">
            <BigStat value={`${insights.streak} day${insights.streak === 1 ? '' : 's'}`} sub="in a row" />
          </InsightCard>

          {insights.monthAvg !== null && (
            <InsightCard title="This month's average">
              <BigStat
                value={insights.monthAvg}
                sub={`${getSpeedLabel(Math.round(parseFloat(insights.monthAvg)))} · ${insights.thisMonthCount} entries`}
              />
            </InsightCard>
          )}

          <InsightCard title="Most common feeling">
            <div className="flex items-center gap-2">
              <span
                className="inline-block px-2 py-0.5 rounded text-sm font-mono font-medium"
                style={{ background: getSpeedColor(insights.mostCommonVal), color: insights.mostCommonVal === -2 || insights.mostCommonVal === 2 ? '#FFFFFF' : '#1A1A18' }}
              >
                {getSpeedLabel(insights.mostCommonVal)}
              </span>
              <span className="text-sm font-sans" style={{ color: '#555550' }}>{insights.mostCommonCount} times</span>
            </div>
          </InsightCard>

          {insights.fastRun && insights.fastRun.length > 0 && (
            <InsightCard title="Longest fast period">
              <BigStat
                value={`${insights.fastRun.length} day${insights.fastRun.length === 1 ? '' : 's'}`}
                sub={`${insights.fastRun[0].date} — ${insights.fastRun[insights.fastRun.length - 1].date}`}
              />
            </InsightCard>
          )}

          {insights.slowRun && insights.slowRun.length > 0 && (
            <InsightCard title="Longest slow period">
              <BigStat
                value={`${insights.slowRun.length} day${insights.slowRun.length === 1 ? '' : 's'}`}
                sub={`${insights.slowRun[0].date} — ${insights.slowRun[insights.slowRun.length - 1].date}`}
              />
            </InsightCard>
          )}

          {insights.alignRate !== null && (
            <InsightCard title="Week vs day alignment">
              <p className="text-sm font-sans" style={{ color: '#1A1A18' }}>
                Your weekly ratings tend to{' '}
                <strong>{insights.alignRate >= 0.6 ? 'match' : 'diverge from'}</strong>{' '}
                your daily entries.
              </p>
              <p className="text-xs font-sans mt-1" style={{ color: '#9E9E8E' }}>
                {Math.round(insights.alignRate * 100)}% alignment across {insights.totalWeeks} comparable weeks
              </p>
            </InsightCard>
          )}

          {monthlySparkData.length >= 2 && (
            <InsightCard title="Monthly speed over time">
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={monthlySparkData}>
                  <YAxis domain={[-2, 2]} hide />
                  <Line type="monotone" dataKey="speed" stroke="#3D3A8C" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </InsightCard>
          )}
        </>
      )}

      {/* Research reminder — always shown */}
      <div className="py-4 mt-2">
        <p className="text-sm font-sans leading-relaxed" style={{ color: '#555550', fontStyle: 'italic' }}>
          You are building a dataset to test whether time perception fluctuates in shared patterns across unrelated people. The key signal to look for: do your slow or fast periods align with others', possibly with a 1–2 day offset? Export your data from Settings and compare timelines once you have at least 30 days logged.
        </p>
      </div>
    </div>
  )
}
