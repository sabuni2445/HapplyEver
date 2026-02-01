import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Animated, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getGuestByCode, getWeddingDetails } from '@/utils/api';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function GuestHomeScreen() {
    const router = useRouter();
    const [invitations, setInvitations] = useState<any[]>([]);
    const [newCode, setNewCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
        loadInvitations();
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
            let weddingName = "Wedding Celebration";
            let weddingDate = "";
            let location = "";

            try {
                if (guestData.coupleClerkId) {
                    const weddingData = await getWeddingDetails(guestData.coupleClerkId);
                    weddingName = weddingData.partnersName || "The Wedding";
                    weddingDate = weddingData.weddingDate;
                    location = weddingData.location;
                }
            } catch (e) { }

            const newInvite = {
                code: guestData.uniqueCode,
                guestName: guestData.firstName,
                weddingName: weddingName,
                date: weddingDate,
                location: location,
                addedAt: new Date().toISOString()
            };

            const updated = [newInvite, ...invitations.filter(i => i.code !== newInvite.code)];
            await AsyncStorage.setItem('guest_invitations', JSON.stringify(updated));
            setInvitations(updated);
            setNewCode("");
            setShowAddModal(false);
            Alert.alert("✨ Invitation Found", `Welcome to ${weddingName}`);
        } catch (error) {
            Alert.alert("Invalid Code", "Please check your invitation code.");
        } finally {
            setIsLoading(false);
        }
    };

    const removeInvitation = async (code: string) => {
        Alert.alert("Remove Invitation", "Hide this invitation?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: "destructive", onPress: async () => {
                    const updated = invitations.filter(i => i.code !== code);
                    setInvitations(updated);
                    await AsyncStorage.setItem('guest_invitations', JSON.stringify(updated));
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={['#fff', '#fcfaf8', '#f8f4f0']} style={StyleSheet.absoluteFill} />

            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.replace('/')} style={styles.backFab}>
                        <IconSymbol name="chevron.left" size={20} color={Colors.light.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Journal</Text>
                    <Text style={styles.subtitle}>MY WEDDING INVITATIONS</Text>
                </View>

                {invitations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <IconSymbol name="envelope.open" size={40} color="#ccc" />
                        </View>
                        <Text style={styles.emptyTitle}>Your collection is empty</Text>
                        <Text style={styles.emptySubtitle}>Enter your guest code to add a digital invitation to your journal.</Text>
                        <TouchableOpacity style={styles.addBtnLarge} onPress={() => setShowAddModal(true)}>
                            <Text style={styles.addBtnLargeText}>ADD INVITATION</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.invitationGrid}>
                        {invitations.map((invite, index) => (
                            <TouchableOpacity
                                key={invite.code}
                                style={styles.inviteCard}
                                activeOpacity={0.9}
                                onPress={() => router.push(`/guest/${invite.code}`)}
                            >
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardPreTitle}>THE WEDDING OF</Text>
                                    <Text style={styles.cardTitle}>{invite.weddingName.toUpperCase()}</Text>

                                    <View style={styles.cardFooter}>
                                        <View style={styles.metaBox}>
                                            <IconSymbol name="calendar" size={12} color={Colors.light.gold} />
                                            <Text style={styles.metaText}>
                                                {invite.date ? new Date(invite.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Set'}
                                            </Text>
                                        </View>
                                        <View style={styles.metaBox}>
                                            <IconSymbol name="signature" size={12} color={Colors.light.gold} />
                                            <Text style={styles.metaText}>{invite.code}</Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeInvitation(invite.code)}>
                                    <IconSymbol name="xmark" size={14} color="#ccc" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </Animated.ScrollView>

            {/* Floating Add Button */}
            {invitations.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
                    <LinearGradient colors={[Colors.light.gold, '#B89627']} style={styles.fabGradient}>
                        <IconSymbol name="plus" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Add Modal */}
            <Modal visible={showAddModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Invitation</Text>
                        <Text style={styles.modalSubtitle}>Enter the code found on your physical card or message.</Text>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="GUEST-XXXX"
                                placeholderTextColor="#ccc"
                                value={newCode}
                                onChangeText={setNewCode}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                                <Text style={styles.cancelText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddInvitation} disabled={isLoading}>
                                <LinearGradient colors={[Colors.light.gold, '#B89627']} style={styles.submitGradient}>
                                    {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>ADD TO JOURNAL</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 120 },
    header: { marginBottom: 50 },
    backFab: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    title: { fontFamily: Fonts.Playfair.Bold, fontSize: 44, color: Colors.light.text, letterSpacing: -1 },
    subtitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, color: Colors.light.gold, letterSpacing: 4, marginTop: 8 },

    // Empty State
    emptyContainer: { flex: 1, height: height * 0.6, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    emptyTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 24, color: Colors.light.text, marginBottom: 16 },
    emptySubtitle: { fontFamily: Fonts.Cormorant.Regular, fontSize: 17, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 26, marginBottom: 40 },
    addBtnLarge: { backgroundColor: '#1a1a1a', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 40 },
    addBtnLargeText: { fontFamily: Fonts.Playfair.Bold, fontSize: 11, color: '#fff', letterSpacing: 2 },

    // Grid
    invitationGrid: { gap: 20 },
    inviteCard: { backgroundColor: '#fff', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardPreTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 9, color: Colors.light.gold, letterSpacing: 3, marginBottom: 12 },
    cardTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 22, color: Colors.light.text, marginBottom: 20 },
    cardFooter: { flexDirection: 'row', gap: 15 },
    metaBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9f9f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    metaText: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, color: Colors.light.textSecondary },
    cardInfo: { flex: 1 },
    removeBtn: { position: 'absolute', top: 20, right: 20, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },

    fab: { position: 'absolute', bottom: 40, right: 30, width: 64, height: 64, borderRadius: 32, overflow: 'hidden', elevation: 10, shadowColor: Colors.light.gold, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
    fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: width - 48, backgroundColor: '#fff', padding: 32, borderRadius: 32 },
    modalTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 26, color: Colors.light.text, textAlign: 'center', marginBottom: 12 },
    modalSubtitle: { fontFamily: Fonts.Cormorant.Regular, fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    inputWrapper: { backgroundColor: '#f9f9f9', borderRadius: 20, marginBottom: 30 },
    input: { height: 65, textAlign: 'center', fontFamily: Fonts.Playfair.Bold, fontSize: 22, letterSpacing: 4, color: Colors.light.text },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 18, alignItems: 'center' },
    cancelText: { fontFamily: Fonts.Playfair.Bold, color: '#999', fontSize: 11, letterSpacing: 2 },
    submitBtn: { flex: 2, borderRadius: 15, overflow: 'hidden' },
    submitGradient: { paddingVertical: 18, alignItems: 'center' },
    submitText: { fontFamily: Fonts.Playfair.Bold, color: '#fff', fontSize: 11, letterSpacing: 2 },
});
