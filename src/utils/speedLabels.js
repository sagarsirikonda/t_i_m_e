export const SPEED_OPTIONS = [
  { value: -2, symbol: '−−', label: 'Much slower', color: '#1E3A5F', textColor: '#FFFFFF' },
  { value: -1, symbol: '−',  label: 'Slightly slower', color: '#93B4D4', textColor: '#1A1A18' },
  { value:  0, symbol: '·',  label: 'Normal', color: '#9E9E8E', textColor: '#1A1A18' },
  { value:  1, symbol: '+',  label: 'Slightly faster', color: '#E8C87A', textColor: '#1A1A18' },
  { value:  2, symbol: '++', label: 'Much faster', color: '#B5620A', textColor: '#FFFFFF' },
]

export function getSpeedOption(value) {
  return SPEED_OPTIONS.find((o) => o.value === value) || SPEED_OPTIONS[2]
}

export function getSpeedLabel(value) {
  return getSpeedOption(value).label
}

export function getSpeedColor(value) {
  return getSpeedOption(value).color
}

export function getSpeedSymbol(value) {
  return getSpeedOption(value).symbol
}
