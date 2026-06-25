import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider, ADMIN_UID, isConfigured } from '../firebase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setIsAdmin(ADMIN_UID !== '' && firebaseUser.uid === ADMIN_UID)

        // Write or update profile document
        const profileRef = doc(db, 'users', firebaseUser.uid, 'profile', 'info')
        const snap = await getDoc(profileRef)
        if (!snap.exists()) {
          await setDoc(profileRef, {
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            joinedAt: serverTimestamp(),
            participantLabel: '',
          })
        }
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = () => {
    if (!isConfigured) return
    return signInWithPopup(auth, googleProvider)
  }

  const signOut = () => {
    if (!isConfigured) return
    return firebaseSignOut(auth)
  }

  return { user, loading, isAdmin, signIn, signOut }
}
