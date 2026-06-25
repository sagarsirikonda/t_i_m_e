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

export function exportAllDailyCSV(participants, allDailyByUid) {
  const headers = ['participant', 'date', 'speed', 'speed_label', 'confidence', 'note']
  const rows = []
  for (const p of participants) {
    const entries = allDailyByUid[p.uid] || []
    for (const e of entries.sort((a, b) => a.date.localeCompare(b.date))) {
      rows.push([p.label, e.date, e.speed, getSpeedLabel(e.speed), e.confidence, e.note || ''])
    }
  }
  downloadCSV('all-daily.csv', rows, headers)
}

export function exportAllWeeklyCSV(participants, allWeeklyByUid) {
  const headers = ['participant', 'week', 'week_label', 'speed', 'speed_label', 'consistency', 'note']
  const rows = []
  for (const p of participants) {
    const entries = allWeeklyByUid[p.uid] || []
    for (const e of entries.sort((a, b) => a.weekKey.localeCompare(b.weekKey))) {
      rows.push([p.label, e.weekKey, e.weekLabel, e.speed, getSpeedLabel(e.speed), e.consistency, e.note || ''])
    }
  }
  downloadCSV('all-weekly.csv', rows, headers)
}

export function exportAllMonthlyCSV(participants, allMonthlyByUid) {
  const headers = ['participant', 'month', 'month_label', 'speed', 'speed_label', 'trend', 'compared_to_last', 'note']
  const rows = []
  for (const p of participants) {
    const entries = allMonthlyByUid[p.uid] || []
    for (const e of entries.sort((a, b) => a.monthKey.localeCompare(b.monthKey))) {
      rows.push([p.label, e.monthKey, e.monthLabel, e.speed, getSpeedLabel(e.speed), e.trend, e.comparedToLast, e.note || ''])
    }
  }
  downloadCSV('all-monthly.csv', rows, headers)
}
