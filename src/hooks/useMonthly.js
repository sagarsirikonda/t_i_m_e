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

export function useMonthly(uid) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    fetchAll()
  }, [uid])

  async function fetchAll() {
    setLoading(true)
    try {
      const ref = collection(db, 'users', uid, 'monthly')
      const q = query(ref, orderBy('monthKey', 'desc'))
      const snap = await getDocs(q)
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error('useMonthly fetch error', e)
    }
    setLoading(false)
  }

  async function saveEntry(monthKey, data) {
    const ref = doc(db, 'users', uid, 'monthly', monthKey)
    const existing = entries.find((e) => e.id === monthKey)
    const payload = {
      monthKey,
      ...data,
      updatedAt: serverTimestamp(),
      ...(existing ? {} : { createdAt: serverTimestamp() }),
    }
    await setDoc(ref, payload, { merge: true })
    await fetchAll()
  }

  return { entries, loading, saveEntry, refetch: fetchAll }
}
