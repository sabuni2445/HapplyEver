import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';
import { syncUserToDatabase, updateUserProfile, updateUserRole } from '@/utils/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function OnboardingScreen() {
    const { user, isLoaded: userLoaded } = useUser();
    const { userId } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        imageUrl: '',
        selectedRole: 'COUPLE'
    });

    useEffect(() => {
        if (userLoaded && user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                imageUrl: user.imageUrl || ''
            }));
        }
    }, [userLoaded, user]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setFormData({ ...formData, imageUrl: result.assets[0].uri });
        }
    };

    const handleComplete = async () => {
        if (!formData.firstName || !formData.lastName || !formData.selectedRole) {
            Alert.alert("Missing Information", "Please fill in all required fields.");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Sync user to DB (creates user if not exists)
            await syncUserToDatabase(user);

            // 2. Update profile (names, phone, image)
            await updateUserProfile(user?.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                imageUrl: formData.imageUrl
            });

            // 3. Update role
            await updateUserRole(user?.id, formData.selectedRole);

            // Navigate to appropriate dashboard
            if (formData.selectedRole === 'VENDOR') {
                router.replace('/(tabs)/vendor');
            } else if (formData.selectedRole === 'PROTOCOL') {
                router.replace('/(tabs)/protocol');
            } else if (formData.selectedRole === 'MANAGER') {
                router.replace('/(tabs)/management');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            console.error("Onboarding error:", error);
            Alert.alert("Error", "Failed to complete profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!userLoaded || !user) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.gold} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#fff', '#fdf6f0']}
                    style={styles.headerBackground}
                />

                <View style={styles.titleSection}>
                    <Text style={styles.title}>Complete Your Profile</Text>
                    <Text style={styles.subtitle}>Let's set up your account. You can update this information anytime.</Text>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>Your Information</Text>
                    <Text style={styles.infoBoxText}>Email: {user.primaryEmailAddress?.emailAddress}</Text>
                </View>

                <View style={styles.formCard}>
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>First Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.firstName}
                                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                placeholder="First Name"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Last Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.lastName}
                                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                placeholder="Last Name"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.phoneNumber}
                            onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                            placeholder="+1234567890"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.imageSection}>
                        <Text style={styles.label}>Profile Picture</Text>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                            <IconSymbol name="camera.fill" size={20} color={Colors.light.text} />
                            <Text style={styles.uploadBtnText}>Choose Image</Text>
                        </TouchableOpacity>

                        <View style={styles.avatarContainer}>
                            {formData.imageUrl ? (
                                <Image source={{ uri: formData.imageUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitial}>{formData.firstName?.[0] || '?'}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.avatarLabel}>Current profile picture</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>I am a... *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={formData.selectedRole}
                                onValueChange={(itemValue) => setFormData({ ...formData, selectedRole: itemValue })}
                                style={styles.picker}
                            >
                                <Picker.Item label="Couple" value="COUPLE" />
                                <Picker.Item label="Vendor" value="VENDOR" />
                            </Picker>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.disabledButton]}
                        onPress={handleComplete}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Complete Profile</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fdf6f0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fdf6f0',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 32,
        color: '#523c2b',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: '#7a5d4e',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    infoBox: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 32,
    },
    infoBoxTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: '#523c2b',
        textAlign: 'center',
        marginBottom: 8,
    },
    infoBoxText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: '#4a5568',
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 14,
        color: '#523c2b',
        marginBottom: 8,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Regular,
        color: '#523c2b',
        backgroundColor: '#fff',
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        gap: 8,
        marginBottom: 20,
    },
    uploadBtnText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: '#523c2b',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: Colors.light.gold,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2563eb', // Blue background for placeholder as in screenshot
        marginBottom: 8,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 48,
        color: '#fff',
        fontFamily: Fonts.Playfair.Bold,
    },
    avatarLabel: {
        fontSize: 12,
        color: '#718096',
        fontFamily: Fonts.Cormorant.Regular,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    submitButton: {
        backgroundColor: Colors.light.gold,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: Fonts.Playfair.Bold,
    }
});
