import React from 'react'
import { exportDailyCSV, exportWeeklyCSV, exportMonthlyCSV } from '../utils/exportUtils.js'
import SkeletonCard from '../components/SkeletonCard.jsx'

function Section({ title, children }) {
  return (
    <div className="py-5 border-b" style={{ borderColor: '#E8E6DF' }}>
      <p className="text-xs font-sans uppercase tracking-wider mb-3" style={{ color: '#9E9E8E' }}>{title}</p>
      {children}
    </div>
  )
}

function ExportButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-sm font-sans py-2.5 flex items-center justify-between"
      style={{ color: '#3D3A8C' }}
    >
      <span>{label}</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v7M4 6.5l3 3 3-3M2 11h10" stroke="#3D3A8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default function SettingsPage({ user, signOut, dailyHook, weeklyHook, monthlyHook }) {
  const { entries: daily, loading: dLoading } = dailyHook
  const { entries: weekly, loading: wLoading } = weeklyHook
  const { entries: monthly, loading: mLoading } = monthlyHook
  const loading = dLoading || wLoading || mLoading

  const firstEntry = daily.length > 0
    ? [...daily].sort((a, b) => a.date.localeCompare(b.date))[0].date
    : null

  return (
    <div className="pb-20 px-5 pt-4 max-w-[480px] mx-auto">
      <h1 className="font-serif text-2xl mb-4">Settings</h1>

      {/* Account */}
      <Section title="Account">
        <div className="flex items-center gap-3 mb-4">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              className="rounded-full"
              style={{ width: 48, height: 48 }}
            />
          )}
          <div>
            <p className="font-sans font-medium text-sm" style={{ color: '#1A1A18' }}>{user.displayName}</p>
            <p className="font-sans text-xs mt-0.5" style={{ color: '#9E9E8E' }}>{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="text-sm font-sans px-4 rounded"
          style={{
            height: '36px',
            border: '1px solid #E8E6DF',
            background: '#FFFFFF',
            color: '#1A1A18',
          }}
        >
          Sign out
        </button>
      </Section>

      {/* Export */}
      <Section title="Export your data">
        {loading ? (
          <SkeletonCard lines={3} />
        ) : (
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            <ExportButton label="Export daily as CSV" onClick={() => exportDailyCSV(daily)} />
            <div style={{ borderTop: '1px solid #E8E6DF' }}>
              <ExportButton label="Export weekly as CSV" onClick={() => exportWeeklyCSV(weekly)} />
            </div>
            <div style={{ borderTop: '1px solid #E8E6DF' }}>
              <ExportButton label="Export monthly as CSV" onClick={() => exportMonthlyCSV(monthly)} />
            </div>
          </div>
        )}
      </Section>

      {/* Stats */}
      <Section title="Stats">
        {loading ? (
          <SkeletonCard lines={4} />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-sans" style={{ color: '#1A1A18' }}>
              <span className="font-mono font-medium">{daily.length}</span>
              <span style={{ color: '#555550' }}> days logged</span>
            </p>
            <p className="text-sm font-sans" style={{ color: '#1A1A18' }}>
              <span className="font-mono font-medium">{weekly.length}</span>
              <span style={{ color: '#555550' }}> weeks logged</span>
            </p>
            <p className="text-sm font-sans" style={{ color: '#1A1A18' }}>
              <span className="font-mono font-medium">{monthly.length}</span>
              <span style={{ color: '#555550' }}> months logged</span>
            </p>
            {firstEntry && (
              <p className="text-sm font-sans" style={{ color: '#555550' }}>
                First entry: <span className="font-mono">{firstEntry}</span>
              </p>
            )}
          </div>
        )}
      </Section>

      {/* About */}
      <Section title="About">
        <p className="text-sm font-sans leading-relaxed mb-4" style={{ color: '#555550' }}>
          This app is part of a long-term research project investigating whether time perception fluctuates in patterns shared across unrelated people.
        </p>
        <p className="text-sm font-sans leading-relaxed mb-4" style={{ color: '#555550' }}>
          Each participant logs privately — how today felt, how the week felt, how the month felt. No context is given, no suggestions made. Just the raw perception, recorded consistently over time.
        </p>
        <p className="text-sm font-sans leading-relaxed mb-4" style={{ color: '#555550' }}>
          The hypothesis: there may be a variable that causes time to feel faster or slower for multiple people simultaneously, possibly with a 1–2 day offset between individuals.
        </p>
        <p className="text-sm font-sans leading-relaxed mb-4" style={{ color: '#555550' }}>
          Your data is private to you. The researcher sees only anonymized patterns across participants — never your identity or personal details.
        </p>
        <p className="text-sm font-sans font-medium" style={{ color: '#1A1A18' }}>
          Please log every day, even on normal days. Every entry matters.
        </p>
      </Section>
    </div>
  )
}
