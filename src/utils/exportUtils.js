import { getSpeedLabel } from './speedLabels.js'

function downloadCSV(filename, rows, headers) {
  const escape = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportDailyCSV(entries) {
  const headers = ['date', 'speed', 'speed_label', 'confidence', 'note']
  const rows = entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => [
      e.date,
      e.speed,
      getSpeedLabel(e.speed),
      e.confidence,
      e.note || '',
    ])
  downloadCSV('daily-log.csv', rows, headers)
}

export function exportWeeklyCSV(entries) {
  const headers = ['week', 'week_label', 'speed', 'speed_label', 'consistency', 'note']
  const rows = entries
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
    .map((e) => [
      e.weekKey,
      e.weekLabel,
      e.speed,
      getSpeedLabel(e.speed),
      e.consistency,
      e.note || '',
    ])
  downloadCSV('weekly-log.csv', rows, headers)
}

export function exportMonthlyCSV(entries) {
  const headers = ['month', 'month_label', 'speed', 'speed_label', 'trend', 'compared_to_last', 'note']
  const rows = entries
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((e) => [
      e.monthKey,
      e.monthLabel,
      e.speed,
      getSpeedLabel(e.speed),
      e.trend,
      e.comparedToLast,
      e.note || '',
    ])
  downloadCSV('monthly-log.csv', rows, headers)
}
