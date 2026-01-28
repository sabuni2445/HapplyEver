import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Modal, Image, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getGuests, createGuests } from '@/utils/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

export default function GuestsScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [guests, setGuests] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newGuestName, setNewGuestName] = useState('');
    const [newGuestEmail, setNewGuestEmail] = useState('');
    const [newGuestPhone, setNewGuestPhone] = useState('');
    const [newGuestPriority, setNewGuestPriority] = useState('STANDARD');
    const [newGuestSeat, setNewGuestSeat] = useState('');
    const [selectedGuest, setSelectedGuest] = useState<any>(null);

    const loadData = async () => {
        if (user) {
            try {
                const guestsData = await getGuests(user.id);
                setGuests(guestsData || []);
            } catch (error) {
                console.error("Error loading guests data:", error);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [user]);

    const handleAddGuest = async () => {
        if (!user || !newGuestName) return;

        try {
            await createGuests(user.id, [{
                firstName: newGuestName.split(' ')[0],
                lastName: newGuestName.split(' ').slice(1).join(' ') || '',
                email: newGuestEmail,
                phoneNumber: newGuestPhone,
                priority: newGuestPriority,
                seatNumber: newGuestSeat
            }]);
            setModalVisible(false);
            setNewGuestName('');
            setNewGuestEmail('');
            setNewGuestPhone('');
            setNewGuestPriority('STANDARD');
            setNewGuestSeat('');
            loadData();
            Alert.alert("Success", "Guest added successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to add guest");
        }
    };

    const getInvitationUrl = (guest: any) => {
        const baseUrl = "http://localhost:5173";
        return `${baseUrl}/attendee/dashboard?code=${guest.uniqueCode}&couple=${user?.id}`;
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert("Copied", "Invitation link copied to clipboard!");
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Guest List</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={() => router.push('/guest-messaging')} style={styles.messageButton}>
                        <IconSymbol name="bubble.left.and.bubble.right.fill" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                        <IconSymbol name="plus" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {guests.length > 0 ? (
                    guests.map((guest) => (
                        <TouchableOpacity
                            key={guest.id}
                            style={styles.card}
                            onPress={() => setSelectedGuest(guest)}
                        >
                            <View style={styles.guestInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.guestName}>{guest.firstName} {guest.lastName}</Text>
                                    {guest.priority && guest.priority !== 'STANDARD' && (
                                        <View style={[styles.priorityBadge, { backgroundColor: guest.priority === 'VVIP' ? '#ede9fe' : '#fef3c7' }]}>
                                            <Text style={[styles.priorityText, { color: guest.priority === 'VVIP' ? '#7c3aed' : '#d4af37' }]}>{guest.priority}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.guestEmail}>{guest.email || guest.phoneNumber || "No contact info"}</Text>
                                <View style={styles.metaRow}>
                                    {guest.seatNumber && (
                                        <Text style={styles.seatText}>Seat: {guest.seatNumber}</Text>
                                    )}
                                    {guest.uniqueCode && (
                                        <Text style={styles.guestCode}>Code: {guest.uniqueCode}</Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.rightSide}>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(guest.rsvpStatus) }]}>
                                    <Text style={styles.badgeText}>{guest.rsvpStatus || 'PENDING'}</Text>
                                </View>
                                {guest.qrCodeUrl && (
                                    <IconSymbol name="qrcode" size={20} color={Colors.light.gold} style={{ marginTop: 8 }} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="person.2" size={48} color={Colors.light.textSecondary} />
                        <Text style={styles.emptyText}>No guests added yet.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Add Guest Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Guest</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <IconSymbol name="xmark" size={20} color={Colors.light.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. John Doe"
                                value={newGuestName}
                                onChangeText={setNewGuestName}
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. john@example.com"
                                value={newGuestEmail}
                                onChangeText={setNewGuestEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. +251..."
                                value={newGuestPhone}
                                onChangeText={setNewGuestPhone}
                                keyboardType="phone-pad"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={styles.inputLabel}>Priority</Text>
                            <View style={styles.priorityOptions}>
                                {['STANDARD', 'VIP', 'VVIP'].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.priorityOption, newGuestPriority === p && styles.selectedPriority]}
                                        onPress={() => setNewGuestPriority(p)}
                                    >
                                        <Text style={[styles.priorityOptionText, newGuestPriority === p && { color: '#fff' }]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Seat Number (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Table 5, Seat A"
                                value={newGuestSeat}
                                onChangeText={setNewGuestSeat}
                                placeholderTextColor="#9ca3af"
                            />

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleAddGuest}
                            >
                                <LinearGradient
                                    colors={[Colors.light.gold, '#b8962e']}
                                    style={styles.submitGradient}
                                >
                                    <Text style={styles.buttonText}>Save Guest</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Guest Details Modal (QR Code & Link) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={!!selectedGuest}
                onRequestClose={() => setSelectedGuest(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Guest Invitation</Text>
                            <TouchableOpacity onPress={() => setSelectedGuest(null)} style={styles.closeButton}>
                                <IconSymbol name="xmark" size={20} color={Colors.light.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {selectedGuest && (
                            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                                <Text style={styles.detailsGuestName}>{selectedGuest.firstName} {selectedGuest.lastName}</Text>

                                {selectedGuest.qrCodeUrl ? (
                                    <View style={styles.qrContainer}>
                                        <Image
                                            source={{ uri: selectedGuest.qrCodeUrl }}
                                            style={styles.qrCode}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.guestCodeLarge}>{selectedGuest.uniqueCode}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.noQrContainer}>
                                        <IconSymbol name="qrcode" size={48} color="#e5e7eb" />
                                        <Text style={styles.noQrText}>No QR Code available</Text>
                                    </View>
                                )}

                                <View style={styles.linkSection}>
                                    <Text style={styles.inputLabel}>Invitation Link</Text>
                                    <View style={styles.linkRow}>
                                        <Text style={styles.linkText} numberOfLines={1}>{getInvitationUrl(selectedGuest)}</Text>
                                        <TouchableOpacity
                                            style={styles.copyButton}
                                            onPress={() => copyToClipboard(getInvitationUrl(selectedGuest))}
                                        >
                                            <IconSymbol name="doc.on.doc" size={18} color={Colors.light.gold} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, styles.closeDetailsButton]}
                                    onPress={() => setSelectedGuest(null)}
                                >
                                    <Text style={styles.buttonText}>Close</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACCEPTED': return Colors.light.success;
        case 'DECLINED': return Colors.light.error;
        default: return '#9ca3af';
    }
};

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
        padding: 24,
        paddingTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 32,
        color: Colors.light.text,
    },
    addButton: {
        backgroundColor: Colors.light.gold,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    messageButton: {
        backgroundColor: Colors.light.text,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    content: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    guestInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    guestName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: Colors.light.text,
    },
    priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: Fonts.Cormorant.Bold,
    },
    guestEmail: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    seatText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 12,
        color: Colors.light.textSecondary,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    guestCode: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: Colors.light.gold,
    },
    rightSide: {
        alignItems: 'flex-end',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: Fonts.Cormorant.Regular,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        marginTop: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
    },
    inputLabel: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.text,
    },
    priorityOptions: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    priorityOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    selectedPriority: {
        backgroundColor: Colors.light.gold,
        borderColor: Colors.light.gold,
    },
    priorityOptionText: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 14,
        color: Colors.light.text,
    },
    saveButton: {
        marginTop: 24,
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
    },
    submitGradient: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeDetailsButton: {
        backgroundColor: Colors.light.gold,
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
    },
    detailsGuestName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    qrContainer: {
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    qrCode: {
        width: 180,
        height: 180,
        marginBottom: 12,
    },
    guestCodeLarge: {
        fontFamily: 'monospace',
        fontSize: 20,
        color: Colors.light.text,
        fontWeight: 'bold',
        letterSpacing: 4,
    },
    noQrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        backgroundColor: '#f9fafb',
        borderRadius: 20,
        marginBottom: 20,
    },
    noQrText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 12,
    },
    linkSection: {
        marginTop: 10,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 12,
        gap: 10,
    },
    linkText: {
        flex: 1,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    copyButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
});
