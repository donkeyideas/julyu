import { signInWithPopup, signOut as firebaseSignOut, UserCredential } from 'firebase/auth'
import { getFirebaseAuth, getGoogleProvider } from './config'

export interface FirebaseUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

// Sign in with Google popup
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; credential: UserCredential } | null> => {
  const auth = getFirebaseAuth()
  const googleProvider = getGoogleProvider()

  if (!auth || !googleProvider) {
    console.error('Firebase not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables.')
    throw new Error('Google Sign-In is not configured. Please contact support.')
  }

  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      credential: result
    }
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Sign-in popup was closed by user')
      return null
    }
    if (error.code === 'auth/popup-blocked') {
      console.error('Popup was blocked by browser')
      throw new Error('Popup was blocked. Please allow popups for this site.')
    }
    console.error('Google sign-in error:', error)
    throw error
  }
}

// Sign out from Firebase
export const signOutFromFirebase = async (): Promise<void> => {
  const auth = getFirebaseAuth()
  if (!auth) return

  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Firebase sign out error:', error)
    throw error
  }
}

// Get current Firebase user
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  const auth = getFirebaseAuth()
  if (!auth) return null

  const user = auth.currentUser
  if (!user) return null

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}
