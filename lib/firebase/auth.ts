import { signInWithPopup, signOut as firebaseSignOut, UserCredential } from 'firebase/auth'
import { auth, googleProvider } from './config'

export interface FirebaseUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

// Sign in with Google popup
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; credential: UserCredential } | null> => {
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
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Firebase sign out error:', error)
    throw error
  }
}

// Get current Firebase user
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  const user = auth.currentUser
  if (!user) return null

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}
