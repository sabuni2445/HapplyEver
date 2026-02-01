import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Colors } from '@/constants/theme';
import { getUserFromDatabase } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProtocolMissionsView from '@/components/ProtocolMissionsView';

export default function MissionsScreen() {
    const { user: clerkUser, isLoaded } = useUser();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, [isLoaded, clerkUser]);

    const loadSession = async () => {
        try {
            if (isLoaded && clerkUser) {
                const dbUser = await getUserFromDatabase(clerkUser.id);
                setUserData({
                    id: dbUser?.id,
                    clerkId: clerkUser.id
                });
            } else {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUserData({
                        id: parsed.id,
                        clerkId: parsed.clerkId || parsed.id // Fallback
                    });
                }
            }
        } catch (error) {
            console.error("Error loading session for missions:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.light.gold} />
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={styles.centered}>
                <Text>Please sign in to view missions.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ProtocolMissionsView userId={userData.id} clerkId={userData.clerkId} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
