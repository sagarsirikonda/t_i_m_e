// Calculate Pearson correlation between two participants' daily speed arrays
// offsetDays: positive = shift participant B forward (their data appears later on timeline)
// Returns: { r: number, pairsUsed: number } or null if insufficient data
export function pearsonWithOffset(seriesA, seriesB, offsetDays) {
  // Build date->speed maps
  const mapA = {}
  for (const { date, speed } of seriesA) {
    mapA[date] = speed
  }

  // Apply offset to seriesB: shift B's date by offsetDays
  // offsetDays > 0: B's data appears later, so B's date + offset maps to that column
  const mapB = {}
  for (const { date, speed } of seriesB) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + offsetDays)
    const shiftedDate = d.toLocaleDateString('en-CA')
    mapB[shiftedDate] = speed
  }

  // Find overlapping dates
  const overlap = Object.keys(mapA).filter((date) => mapB[date] !== undefined)

  if (overlap.length < 7) {
    return null
  }

  const xs = overlap.map((d) => mapA[d])
  const ys = overlap.map((d) => mapB[d])

  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n

  let num = 0, denX = 0, denY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  const denom = Math.sqrt(denX * denY)
  if (denom === 0) return { r: 0, pairsUsed: n }

  return { r: num / denom, pairsUsed: n }
}

export function interpretCorrelation(r) {
  const abs = Math.abs(r)
  if (abs >= 0.7) return 'Strong alignment'
  if (abs >= 0.4) return 'Moderate alignment'
  if (abs >= 0.1) return 'Weak alignment'
  return 'No clear alignment'
}
