import { useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { syncUserToDatabase, getUserFromDatabase } from '../utils/api';

export function useUserSync() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  const syncUser = useCallback(async () => {
    if (!userId || !user || isSyncing) {
      console.log('⏭️ Skipping sync:', { userId: !!userId, user: !!user, isSyncing });
      return;
    }

    console.log('🚀 Starting user sync...');
    setIsSyncing(true);
    setError(null);

    try {
      // First check if user exists in database
      console.log('📋 Step 1: Checking if user exists in database...');
      let dbUserData = await getUserFromDatabase(userId);

      // If user doesn't exist, sync from Clerk
      if (!dbUserData) {
        console.log('📋 Step 2: User not found, creating new user in database...');
        const syncResult = await syncUserToDatabase(user);
        dbUserData = syncResult.user;
        console.log('✅ New user created in database!');
      } else {
        console.log('✅ User already exists in database');
      }

      setDbUser(dbUserData);

      // Also sync to localStorage for quick access
      if (dbUserData.selectedRole) {
        localStorage.setItem('selectedRole', dbUserData.selectedRole);
        console.log('💾 Role saved to localStorage:', dbUserData.selectedRole);
      }
      
      console.log('🎉 User sync completed successfully!');
    } catch (err) {
      console.error('❌ Error in user sync:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  }, [userId, user, isSyncing]);

  useEffect(() => {
    if (isLoaded && isSignedIn && userId && user) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, userId, user, syncUser]);

  return {
    dbUser,
    isSyncing,
    error,
    syncUser,
    isLoaded,
    isSignedIn,
  };
}

