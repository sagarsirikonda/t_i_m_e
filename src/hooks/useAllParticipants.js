import { useState, useEffect } from 'react'
import {
  collectionGroup,
  getDocs,
  doc,
  updateDoc,
  collection,
  getDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'

export function useAllParticipants(isAdmin) {
  const [participants, setParticipants] = useState([])
  const [allDailyByUid, setAllDailyByUid] = useState({})
  const [allWeeklyByUid, setAllWeeklyByUid] = useState({})
  const [allMonthlyByUid, setAllMonthlyByUid] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return }
    fetchAll()
  }, [isAdmin])

  async function fetchAll() {
    setLoading(true)
    try {
      // Fetch all daily entries via collection group
      const dailySnap = await getDocs(collectionGroup(db, 'daily'))
      const weeklySnap = await getDocs(collectionGroup(db, 'weekly'))
      const monthlySnap = await getDocs(collectionGroup(db, 'monthly'))

      // Group by uid (parent of daily is the uid doc)
      const dailyByUid = {}
      dailySnap.forEach((d) => {
        const uid = d.ref.parent.parent.id
        if (!dailyByUid[uid]) dailyByUid[uid] = []
        dailyByUid[uid].push({ id: d.id, ...d.data() })
      })

      const weeklyByUid = {}
      weeklySnap.forEach((d) => {
        const uid = d.ref.parent.parent.id
        if (!weeklyByUid[uid]) weeklyByUid[uid] = []
        weeklyByUid[uid].push({ id: d.id, ...d.data() })
      })

      const monthlyByUid = {}
      monthlySnap.forEach((d) => {
        const uid = d.ref.parent.parent.id
        if (!monthlyByUid[uid]) monthlyByUid[uid] = []
        monthlyByUid[uid].push({ id: d.id, ...d.data() })
      })

      // Gather all unique UIDs
      const uids = new Set([
        ...Object.keys(dailyByUid),
        ...Object.keys(weeklyByUid),
        ...Object.keys(monthlyByUid),
      ])

      // Fetch profile for each uid
      const participantList = []
      for (const uid of uids) {
        try {
          const profileRef = doc(db, 'users', uid, 'profile', 'info')
          const profileSnap = await getDoc(profileRef)
          const profile = profileSnap.exists() ? profileSnap.data() : {}
          const firstName = (profile.displayName || '').split(' ')[0] || uid.slice(0, 6)
          participantList.push({
            uid,
            displayName: profile.displayName || '',
            email: profile.email || '',
            photoURL: profile.photoURL || '',
            joinedAt: profile.joinedAt,
            participantLabel: profile.participantLabel || '',
            label: profile.participantLabel || firstName,
            daysLogged: (dailyByUid[uid] || []).length,
            lastEntry: (dailyByUid[uid] || [])
              .map((e) => e.date)
              .sort()
              .reverse()[0] || null,
          })
        } catch (e) {
          console.warn('Could not fetch profile for', uid)
        }
      }

      setParticipants(participantList)
      setAllDailyByUid(dailyByUid)
      setAllWeeklyByUid(weeklyByUid)
      setAllMonthlyByUid(monthlyByUid)
    } catch (e) {
      console.error('useAllParticipants error', e)
    }
    setLoading(false)
  }

  async function updateParticipantLabel(uid, newLabel) {
    const profileRef = doc(db, 'users', uid, 'profile', 'info')
    await updateDoc(profileRef, { participantLabel: newLabel })
    setParticipants((prev) =>
      prev.map((p) =>
        p.uid === uid
          ? { ...p, participantLabel: newLabel, label: newLabel || p.displayName.split(' ')[0] }
          : p
      )
    )
  }

  return {
    participants,
    allDailyByUid,
    allWeeklyByUid,
    allMonthlyByUid,
    loading,
    refetch: fetchAll,
    updateParticipantLabel,
  }
}
