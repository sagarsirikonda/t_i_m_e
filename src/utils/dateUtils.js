// Returns 'YYYY-MM-DD' in the user's local timezone
export function getTodayKey() {
  return new Date().toLocaleDateString('en-CA')
}

// Returns week key like '2025-W23'
export function getWeekKey(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Get Monday of the week
  const dayOfWeek = d.getDay() // 0=Sun, 1=Mon...
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))

  const year = monday.getFullYear()
  // ISO week number
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil(
    ((monday - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7
  )
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

// Returns month key like '2025-06'
export function getMonthKey(date = new Date()) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// Returns week label like 'Jun 2 – Jun 8, 2025'
export function formatWeekLabel(weekKey) {
  const [year, weekPart] = weekKey.split('-W')
  const weekNum = parseInt(weekPart, 10)
  // Get Monday of that ISO week
  const jan1 = new Date(parseInt(year), 0, 1)
  const daysOffset = (weekNum - 1) * 7
  const monday = new Date(jan1)
  monday.setDate(jan1.getDate() + daysOffset - ((jan1.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const sundayFmt = sunday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${fmt(monday)} – ${sundayFmt}`
}

// Returns month label like 'June 2025'
export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Returns the current week's Monday–Sunday range label for sub-label on Log page
export function getCurrentWeekRangeLabel() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

// Returns formatted date like 'Thursday, 12 June 2025'
export function formatTodayFull() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Parse 'YYYY-MM-DD' to a Date at local midnight
export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Get Monday of this week as 'YYYY-MM-DD'
export function getMondayKey() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  return monday.toLocaleDateString('en-CA')
}
