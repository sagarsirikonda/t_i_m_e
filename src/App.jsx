import React, { useState, useEffect } from 'react'
import { isConfigured, missingVars } from './firebase.js'
import { useAuth } from './hooks/useAuth.js'
import { useDaily } from './hooks/useDaily.js'
import { useWeekly } from './hooks/useWeekly.js'
import { useMonthly } from './hooks/useMonthly.js'
import { useAllParticipants } from './hooks/useAllParticipants.js'
import BottomNav from './components/BottomNav.jsx'
import LogPage from './pages/LogPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import InsightsPage from './pages/InsightsPage.jsx'
import ResearchPage from './pages/ResearchPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

// Offline detection banner
function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-center text-xs py-1 font-sans" style={{ background: '#E8E6DF', color: '#555550' }}>
      You're offline — changes will sync when reconnected.
    </div>
  )
}

// Firebase not configured screen
function ConfigureScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#FAFAF9' }}>
      <div className="max-w-sm w-full">
        <h1 className="font-serif text-2xl mb-3" style={{ color: '#1A1A18' }}>Configure Firebase</h1>
        <p className="text-sm font-sans mb-4" style={{ color: '#555550' }}>
          Copy <code className="font-mono text-xs px-1 rounded" style={{ background: '#E8E6DF' }}>.env.example</code> to{' '}
          <code className="font-mono text-xs px-1 rounded" style={{ background: '#E8E6DF' }}>.env</code> and fill in your Firebase project credentials.
        </p>
        <div className="p-3 rounded text-xs font-mono" style={{ background: '#F0EFE8', color: '#555550' }}>
          {missingVars.map((v) => (
            <p key={v}>{v}=</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// Sign-in screen
function SignInScreen({ signIn }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signIn()
    } catch (e) {
      setError('Sign in failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#FAFAF9' }}>
      <div className="max-w-sm w-full text-center">
        <h1 className="font-serif text-3xl mb-3" style={{ color: '#1A1A18' }}>Temporal Perception Logger</h1>
        <p className="text-sm font-sans mb-8 leading-relaxed" style={{ color: '#555550' }}>
          Log how today, this week, and this month felt — in under a minute. You're part of a quiet study on whether time feels different for everyone at the same time.
        </p>
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="inline-flex items-center gap-3 px-5 font-sans font-medium text-sm rounded transition-opacity"
          style={{
            height: '44px',
            background: '#FFFFFF',
            border: '1px solid #E8E6DF',
            color: '#1A1A18',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <GoogleIcon />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        {error && <p className="text-xs font-sans mt-3" style={{ color: '#C0392B' }}>{error}</p>}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function App() {
  const { user, loading: authLoading, isAdmin, signIn, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('log')
  const [isNewUser, setIsNewUser] = useState(false)

  const dailyHook = useDaily(user?.uid)
  const weeklyHook = useWeekly(user?.uid)
  const monthlyHook = useMonthly(user?.uid)
  const participantsHook = useAllParticipants(isAdmin)

  // Detect new user (no daily entries after data loads)
  useEffect(() => {
    if (!dailyHook.loading && dailyHook.entries.length === 0 && user) {
      setIsNewUser(true)
    } else {
      setIsNewUser(false)
    }
  }, [dailyHook.loading, dailyHook.entries.length, user])

  if (!isConfigured) return <ConfigureScreen />

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#E8E6DF', borderTopColor: '#3D3A8C' }} />
      </div>
    )
  }

  if (!user) return <SignInScreen signIn={signIn} />

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <OfflineBanner />

      <main style={{ paddingTop: navigator.onLine ? 0 : 24 }}>
        {activeTab === 'log' && (
          <LogPage
            dailyHook={dailyHook}
            weeklyHook={weeklyHook}
            monthlyHook={monthlyHook}
            isNewUser={isNewUser}
          />
        )}
        {activeTab === 'history' && (
          <HistoryPage
            dailyHook={dailyHook}
            weeklyHook={weeklyHook}
            monthlyHook={monthlyHook}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsPage
            dailyHook={dailyHook}
            weeklyHook={weeklyHook}
            monthlyHook={monthlyHook}
          />
        )}
        {activeTab === 'research' && isAdmin && (
          <ResearchPage participantsHook={participantsHook} />
        )}
        {activeTab === 'settings' && (
          <SettingsPage
            user={user}
            signOut={signOut}
            dailyHook={dailyHook}
            weeklyHook={weeklyHook}
            monthlyHook={monthlyHook}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
    </div>
  )
}
