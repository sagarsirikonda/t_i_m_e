import React from 'react'

const TABS = [
  { id: 'log', label: 'Log' },
  { id: 'history', label: 'History' },
  { id: 'insights', label: 'Insights' },
  { id: 'research', label: 'Research', adminOnly: true },
  { id: 'settings', label: 'Settings' },
]

export default function BottomNav({ activeTab, onTabChange, isAdmin }) {
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t"
      style={{
        height: '56px',
        background: '#FAFAF9',
        borderColor: '#E8E6DF',
        zIndex: 50,
      }}
    >
      {visibleTabs.map((tab) => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center font-sans text-xs transition-colors"
            style={{
              color: active ? '#3D3A8C' : '#9E9E8E',
              fontWeight: active ? '600' : '400',
            }}
          >
            <TabIcon id={tab.id} active={active} />
            <span className="mt-0.5">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function TabIcon({ id, active }) {
  const color = active ? '#3D3A8C' : '#9E9E8E'
  const size = 18

  if (id === 'log') return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="3" y="3" width="12" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
      <line x1="6" y1="9" x2="12" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="6" x2="9" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )

  if (id === 'history') return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <polyline points="3,13 6,9 9,11 13,6 15,8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )

  if (id === 'insights') return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="3" y="9" width="2.5" height="6" rx="1" fill={color}/>
      <rect x="7.75" y="6" width="2.5" height="9" rx="1" fill={color}/>
      <rect x="12.5" y="3" width="2.5" height="12" rx="1" fill={color}/>
    </svg>
  )

  if (id === 'research') return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="4.5" stroke={color} strokeWidth="1.5"/>
      <line x1="11.5" y1="11.5" x2="15" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )

  if (id === 'settings') return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2" stroke={color} strokeWidth="1.5"/>
      <path d="M9 3v1.5M9 13.5V15M3 9h1.5M13.5 9H15M4.93 4.93l1.06 1.06M12.01 12.01l1.06 1.06M4.93 13.07l1.06-1.06M12.01 5.99l1.06-1.06" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )

  return null
}
