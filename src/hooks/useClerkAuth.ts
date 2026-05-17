import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback } from 'react';

/**
 * Thin Clerk auth hook that wraps useAuth() and useUser().
 * Provides a stable API shape for the app — auth state and helpers.
 */
export function useClerkAuth() {
  const { isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();

  const userId = user?.id ?? null;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  const logout = useCallback(() => {
    return signOut();
  }, [signOut]);

  return {
    isSignedIn: !!isSignedIn,
    userId,
    userEmail,
    getToken,
    logout,
  };
}