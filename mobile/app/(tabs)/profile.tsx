import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUserProfile, getUserFromDatabase } from '@/utils/api';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
    const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
    const { signOut: clerkSignOut } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [clerkLoaded, clerkUser]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            if (clerkLoaded && clerkUser) {
                const dbUser = await getUserFromDatabase(clerkUser.id);
                const data = {
                    clerkId: clerkUser.id,
                    firstName: dbUser?.firstName || clerkUser.firstName || '',
                    lastName: dbUser?.lastName || clerkUser.lastName || '',
                    fullName: `${dbUser?.firstName || clerkUser.firstName} ${dbUser?.lastName || clerkUser.lastName}`,
                    email: clerkUser.primaryEmailAddress?.emailAddress,
                    imageUrl: dbUser?.imageUrl || clerkUser.imageUrl,
                    phoneNumber: dbUser?.phoneNumber || '',
                    role: dbUser?.selectedRole || dbUser?.role,
                    type: 'CLERK'
                };
                setProfile(data);
                setEditData(data);
            } else {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const data = {
                        clerkId: user.clerkId || user.id, // Fallback for stored users
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        fullName: `${user.firstName || ''} ${user.lastName || ''}`,
                        email: user.email || user.username,
                        imageUrl: user.imageUrl,
                        phoneNumber: user.phoneNumber || '',
                        role: user.selectedRole || user.role,
                        type: 'BACKEND'
                    };
                    setProfile(data);
                    setEditData(data);
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setEditData({ ...editData, imageUrl: result.assets[0].uri });
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await updateUserProfile(profile.clerkId, {
                firstName: editData.firstName,
                lastName: editData.lastName,
                phoneNumber: editData.phoneNumber,
                imageUrl: editData.imageUrl
            });

            if (response.success) {
                // If it's a backend user, we should update local storage too
                if (profile.type === 'BACKEND' || !clerkUser) {
                    const latestDbUser = await getUserFromDatabase(profile.clerkId);
                    if (latestDbUser) {
                        await AsyncStorage.setItem('user', JSON.stringify(latestDbUser));
                    }
                }

                Alert.alert('Success', 'Profile updated successfully');
                setIsEditing(false);
                await loadProfile();
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            if (profile?.type === 'CLERK') {
                await clerkSignOut();
            } else {
                await AsyncStorage.multiRemove(['user', 'userRole', 'attendee_guest_code', 'auth_session_type']);
                router.replace('/(auth)/sign-in' as any);
            }
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator color={Colors.light.gold} size="large" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={{ fontFamily: Fonts.Playfair.Bold, color: Colors.light.textSecondary }}>Session not found</Text>
                <TouchableOpacity
                    style={[styles.signOutButton, { marginTop: 20, width: 200 }]}
                    onPress={() => router.replace('/(auth)/sign-in' as any)}
                >
                    <Text style={styles.signOutText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#fdf6f0', '#fff']} style={styles.background} />

            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={[styles.title, { fontFamily: Fonts.Playfair.Bold }]}>
                        {isEditing ? 'Edit Profile' : 'Profile'}
                    </Text>
                    {!isEditing && (
                        <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtnContainer}>
                            <IconSymbol name="pencil" size={18} color={Colors.light.gold} />
                            <Text style={styles.editBtn}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileCard}>
                    <TouchableOpacity disabled={!isEditing} onPress={handlePickImage} style={styles.avatarContainer}>
                        <Image
                            source={isEditing ? (editData.imageUrl ? { uri: editData.imageUrl } : require('@/assets/images/react-logo.png')) : (profile.imageUrl ? { uri: profile.imageUrl } : require('@/assets/images/react-logo.png'))}
                            style={styles.avatar}
                        />
                        {isEditing && (
                            <View style={styles.cameraIcon}>
                                <IconSymbol name="camera.fill" size={16} color="#fff" />
                            </View>
                        )}
                        <View style={styles.verifiedBadge}>
                            <IconSymbol name="checkmark.seal.fill" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    {!isEditing && (
                        <>
                            <Text style={[styles.name, { fontFamily: Fonts.Playfair.Bold, fontSize: 26 }]}>{profile.fullName}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleTag}>{profile.role || 'User'}</Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoItem}>
                            <Text style={styles.label}>First Name</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={editData.firstName}
                                    onChangeText={(t) => setEditData({ ...editData, firstName: t })}
                                    placeholder="Enter first name"
                                />
                            ) : (
                                <Text style={styles.value}>{profile.firstName}</Text>
                            )}
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoItem}>
                            <Text style={styles.label}>Last Name</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={editData.lastName}
                                    onChangeText={(t) => setEditData({ ...editData, lastName: t })}
                                    placeholder="Enter last name"
                                />
                            ) : (
                                <Text style={styles.value}>{profile.lastName}</Text>
                            )}
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoItem}>
                            <Text style={styles.label}>Phone Number</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={editData.phoneNumber}
                                    onChangeText={(t) => setEditData({ ...editData, phoneNumber: t })}
                                    keyboardType="phone-pad"
                                    placeholder="+251 ..."
                                />
                            ) : (
                                <Text style={styles.value}>{profile.phoneNumber || 'Not set'}</Text>
                            )}
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoItem}>
                            <Text style={styles.label}>Email (Locked)</Text>
                            <Text style={[styles.value, { color: '#94a3b8' }]}>{profile.email}</Text>
                        </View>
                    </View>
                </View>

                {isEditing ? (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); setEditData(profile); }}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <IconSymbol name="arrow.right.square" size={20} color="#ef4444" />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.versionText}>ElegantEvents • Build 2.1.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        color: Colors.light.text,
    },
    editBtnContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.light.gold + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    editBtn: {
        color: Colors.light.gold,
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        padding: 24,
    },
    profileCard: {
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: Colors.light.gold,
    },
    cameraIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: Colors.light.gold,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: Colors.light.gold,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        color: Colors.light.text,
        marginBottom: 8,
    },
    roleBadge: {
        backgroundColor: Colors.light.gold + '10',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleTag: {
        color: Colors.light.gold,
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        marginBottom: 30,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    infoItem: {
        paddingVertical: 15,
    },
    label: {
        fontSize: 12,
        color: Colors.light.gold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        fontWeight: '700',
    },
    value: {
        fontSize: 18,
        color: Colors.light.text,
    },
    input: {
        fontSize: 18,
        color: Colors.light.text,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.gold + '30',
        paddingVertical: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 16,
    },
    saveBtn: {
        flex: 2,
        backgroundColor: Colors.light.gold,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff1f2',
        padding: 18,
        borderRadius: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    signOutText: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: '700',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#94a3b8',
        fontSize: 12,
    },
});
