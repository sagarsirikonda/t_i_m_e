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

export function useDaily(uid) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    fetchAll()
  }, [uid])

  async function fetchAll() {
    setLoading(true)
    try {
      const ref = collection(db, 'users', uid, 'daily')
      const q = query(ref, orderBy('date', 'desc'))
      const snap = await getDocs(q)
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error('useDaily fetch error', e)
    }
    setLoading(false)
  }

  async function saveEntry(dateKey, data) {
    const ref = doc(db, 'users', uid, 'daily', dateKey)
    const existing = entries.find((e) => e.id === dateKey)
    const payload = {
      date: dateKey,
      ...data,
      updatedAt: serverTimestamp(),
      ...(existing ? {} : { createdAt: serverTimestamp() }),
    }
    await setDoc(ref, payload, { merge: true })
    await fetchAll()
  }

  return { entries, loading, saveEntry, refetch: fetchAll }
}
