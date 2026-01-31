import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Animated, Dimensions } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getGuestByCode, getWeddingDetails } from '@/utils/api';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function GuestHomeScreen() {
    const router = useRouter();
    const [invitations, setInvitations] = useState<any[]>([]);
    const [newCode, setNewCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fabScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.spring(fabScale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                delay: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadInvitations();
        }, [])
    );

    const loadInvitations = async () => {
        try {
            const stored = await AsyncStorage.getItem('guest_invitations');
            if (stored) {
                setInvitations(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load invitations", error);
        }
    };

    const handleAddInvitation = async () => {
        if (!newCode.trim()) return;
        setIsLoading(true);
        try {
            const guestData = await getGuestByCode(newCode.trim());

            let weddingName = "Wedding Invitation";
            let weddingDate = "";

            try {
                if (guestData.coupleClerkId) {
                    const weddingData = await getWeddingDetails(guestData.coupleClerkId);
                    weddingName = weddingData.coupleName || weddingData.partnersName || "Wedding Invitation";
                    weddingDate = weddingData.weddingDate;
                }
            } catch (e) {
                console.log("Could not fetch wedding details for preview", e);
            }

            const newInvite = {
                code: guestData.uniqueCode,
                guestName: guestData.firstName,
                weddingName: weddingName,
                date: weddingDate,
                addedAt: new Date().toISOString()
            };

            const updated = [
                newInvite,
                ...invitations.filter(i => i.code !== newInvite.code)
            ];

            await AsyncStorage.setItem('guest_invitations', JSON.stringify(updated));
            setInvitations(updated);
            setNewCode("");
            setShowAddModal(false);
            Alert.alert("✨ Success", "Invitation added to your collection!");
        } catch (error) {
            Alert.alert("Invalid Code", "Please check your invitation code and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const removeInvitation = async (code: string) => {
        Alert.alert(
            "Remove Invitation",
            "Are you sure you want to remove this invitation?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        const updated = invitations.filter(i => i.code !== code);
                        setInvitations(updated);
                        await AsyncStorage.setItem('guest_invitations', JSON.stringify(updated));
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['#fff5f7', '#ffe8ec', '#ffd6dd']}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Animated Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
                    <View style={styles.backButtonInner}>
                        <IconSymbol name="chevron.left" size={20} color="#8b6f47" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.title}>✨ My Invitations</Text>
                <Text style={styles.subtitle}>Your exclusive wedding passes</Text>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {invitations.length === 0 ? (
                    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                            style={styles.emptyCard}
                        >
                            <IconSymbol name="envelope.open.fill" size={64} color="rgba(139,111,71,0.3)" />
                            <Text style={styles.emptyTitle}>No Invitations Yet</Text>
                            <Text style={styles.emptyText}>Tap the + button to add your first invitation</Text>
                        </LinearGradient>
                    </Animated.View>
                ) : (
                    invitations.map((invite, index) => (
                        <Animated.View
                            key={invite.code}
                            style={[
                                styles.cardWrapper,
                                {
                                    opacity: fadeAnim,
                                    transform: [{
                                        translateY: slideAnim.interpolate({
                                            inputRange: [0, 50],
                                            outputRange: [0, 50 + index * 20]
                                        })
                                    }]
                                }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => router.push(`/guest/${invite.code}` as any)}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.95)', 'rgba(255,245,247,0.9)']}
                                    style={styles.cardGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={styles.iconBadge}>
                                            <IconSymbol name="sparkles" size={20} color="#d4a574" />
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => removeInvitation(invite.code)}
                                            style={styles.deleteButton}
                                        >
                                            <IconSymbol name="xmark.circle.fill" size={24} color="rgba(139,111,71,0.6)" />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.weddingName}>{invite.weddingName}</Text>
                                    <Text style={styles.guestName}>For: {invite.guestName}</Text>

                                    <View style={styles.cardFooter}>
                                        <View style={styles.codeBadge}>
                                            <IconSymbol name="qrcode" size={14} color="#d4a574" />
                                            <Text style={styles.codeText}>{invite.code}</Text>
                                        </View>
                                        {invite.date && (
                                            <View style={styles.dateBadge}>
                                                <IconSymbol name="calendar" size={14} color="rgba(255,255,255,0.7)" />
                                                <Text style={styles.dateText}>
                                                    {new Date(invite.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.arrowContainer}>
                                        <IconSymbol name="arrow.right.circle.fill" size={32} color="rgba(212,165,116,0.8)" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    ))
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
                <TouchableOpacity
                    onPress={() => setShowAddModal(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#d4a574', '#e6c79c', '#d4a574']}
                        style={styles.fabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <IconSymbol name="plus" size={28} color="#1a1a2e" />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* Add Modal */}
            {showAddModal && (
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowAddModal(false)}
                    />
                    <BlurView intensity={20} style={styles.modalBlur}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.98)', 'rgba(255,245,247,0.95)']}
                            style={styles.modalContent}
                        >
                            <Text style={styles.modalTitle}>Add Invitation</Text>
                            <Text style={styles.modalSubtitle}>Enter your unique invitation code</Text>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="GUEST-XXXX"
                                placeholderTextColor="rgba(139,111,71,0.4)"
                                value={newCode}
                                onChangeText={setNewCode}
                                autoCapitalize="characters"
                                autoFocus
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setShowAddModal(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalAddBtn}
                                    onPress={handleAddInvitation}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={['#d4a574', '#e6c79c']}
                                        style={styles.modalAddGradient}
                                    >
                                        <Text style={styles.modalAddText}>{isLoading ? "..." : "Add"}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </BlurView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(212,165,116,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.3)',
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 36,
        color: '#8b6f47',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: 'rgba(139,111,71,0.7)',
        letterSpacing: 0.5,
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    emptyState: {
        marginTop: 60,
    },
    emptyCard: {
        padding: 48,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.2)',
    },
    emptyTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: '#8b6f47',
        marginTop: 24,
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: 'rgba(139,111,71,0.6)',
        textAlign: 'center',
    },
    cardWrapper: {
        marginBottom: 20,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    cardGradient: {
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.3)',
        borderRadius: 24,
        shadowColor: '#d4a574',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,215,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        padding: 4,
    },
    weddingName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: '#8b6f47',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    guestName: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: 'rgba(139,111,71,0.7)',
        marginBottom: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    codeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212,165,116,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.4)',
    },
    codeText: {
        fontSize: 12,
        color: '#8b6f47',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        color: 'rgba(139,111,71,0.8)',
        fontWeight: '600',
    },
    arrowContainer: {
        position: 'absolute',
        right: 24,
        bottom: 24,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 40,
        shadowColor: '#d4a574',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    fabGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalBlur: {
        width: width - 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalContent: {
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.4)',
    },
    modalTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 28,
        color: '#8b6f47',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: 'rgba(139,111,71,0.7)',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 16,
        padding: 16,
        fontSize: 18,
        color: '#8b6f47',
        fontFamily: Fonts.Cormorant.Regular,
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#8b6f47',
        fontSize: 16,
        fontWeight: '600',
    },
    modalAddBtn: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalAddGradient: {
        padding: 16,
        alignItems: 'center',
    },
    modalAddText: {
        color: '#1a1a2e',
        fontSize: 16,
        fontWeight: '700',
    },
});
