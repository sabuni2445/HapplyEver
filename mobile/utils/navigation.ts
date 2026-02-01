import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:8080/api';

export interface User {
    id: number;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'COUPLE' | 'VENDOR' | 'ADMIN' | 'MANAGER' | 'PROTOCOL';
    selectedRole?: 'COUPLE' | 'VENDOR' | 'ADMIN' | 'MANAGER' | 'PROTOCOL';
}

const SESSION_TYPE_KEY = 'auth_session_type'; // 'clerk' or 'backend'

/**
 * Get role-based dashboard route
 */
export const getRoleDashboard = (role: string): string => {
    const dashboards: Record<string, string> = {
        'COUPLE': '/',
        'VENDOR': '/vendor',
        'ADMIN': '/management',
        'MANAGER': '/management',
        'PROTOCOL': '/protocol'
    };
    return dashboards[role] || '/';
};

/**
 * Fetch user data from backend by Clerk ID
 */
export const getUserByClerkId = async (clerkId: string): Promise<User | null> => {
    try {
        const response = await fetch(`${API_URL}/users/clerk/${clerkId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
};

/**
 * Store user data in AsyncStorage
 */
export const storeUserData = async (user: User, sessionType: 'clerk' | 'backend' = 'clerk'): Promise<void> => {
    try {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('userRole', user.selectedRole || user.role);
        await AsyncStorage.setItem(SESSION_TYPE_KEY, sessionType);
    } catch (error) {
        console.error('Error storing user data:', error);
    }
};

/**
 * Get stored session type
 */
export const getStoredSessionType = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(SESSION_TYPE_KEY);
};

/**
 * Get stored user data
 */
export const getStoredUserData = async (): Promise<User | null> => {
    try {
        const userData = await AsyncStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting stored user data:', error);
        return null;
    }
};

/**
 * Clear user data from storage
 */
export const clearUserData = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userRole');
    } catch (error) {
        console.error('Error clearing user data:', error);
    }
};
