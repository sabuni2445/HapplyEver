import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8080/api';

export interface User {
    id: number;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'COUPLE' | 'VENDOR' | 'ADMIN' | 'MANAGER' | 'PROTOCOL';
}

/**
 * Get role-based dashboard route
 */
export const getRoleDashboard = (role: string): string => {
    const dashboards: Record<string, string> = {
        'COUPLE': '/(tabs)/couple-dashboard',
        'VENDOR': '/(tabs)/vendor-dashboard',
        'ADMIN': '/(tabs)/admin-dashboard',
        'MANAGER': '/(tabs)/manager-dashboard',
        'PROTOCOL': '/(tabs)/protocol-dashboard'
    };
    return dashboards[role] || '/(tabs)/couple-dashboard';
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
export const storeUserData = async (user: User): Promise<void> => {
    try {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('userRole', user.role);
    } catch (error) {
        console.error('Error storing user data:', error);
    }
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
