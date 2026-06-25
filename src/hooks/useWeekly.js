import { useState, useEffect } from 'react'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../firebase.js'

export function useWeekly(uid) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    fetchAll()
  }, [uid])

  async function fetchAll() {
    setLoading(true)
    try {
      const ref = collection(db, 'users', uid, 'weekly')
      const q = query(ref, orderBy('weekKey', 'desc'))
      const snap = await getDocs(q)
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error('useWeekly fetch error', e)
    }
    setLoading(false)
  }

  async function saveEntry(weekKey, data) {
    const ref = doc(db, 'users', uid, 'weekly', weekKey)
    const existing = entries.find((e) => e.id === weekKey)
    const payload = {
      weekKey,
      ...data,
      updatedAt: serverTimestamp(),
      ...(existing ? {} : { createdAt: serverTimestamp() }),
    }
    await setDoc(ref, payload, { merge: true })
    await fetchAll()
  }

  return { entries, loading, saveEntry, refetch: fetchAll }
}
