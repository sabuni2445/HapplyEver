import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getProtocolAssignments, getGuestByCode, getWeddingById, getGuests } from '@/utils/api';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProtocolScreen() {
    const { user } = useUser();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [weddingDetails, setWeddingDetails] = useState<any>({});
    const [guests, setGuests] = useState<any>({});
    const [selectedWedding, setSelectedWedding] = useState<number | null>(null);
    const [scannedCode, setScannedCode] = useState("");
    const [guest, setGuest] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const loadData = async () => {
        if (user) {
            try {
                const assignmentsData = await getProtocolAssignments(user.id);
                setAssignments(assignmentsData);

                const details: any = {};
                const guestsData: any = {};
                for (const assignment of assignmentsData) {
                    try {
                        const wedding = await getWeddingById(assignment.weddingId);
                        details[assignment.weddingId] = wedding;

                        const weddingGuests = await getGuests(assignment.coupleClerkId);
                        guestsData[assignment.weddingId] = weddingGuests;
                    } catch (error) {
                        console.error("Failed to load wedding data:", error);
                    }
                }
                setWeddingDetails(details);
                setGuests(guestsData);
            } catch (error) {
                console.error("Error loading protocol data:", error);
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

    const handleVerifyCode = async () => {
        if (!scannedCode.trim()) return;

        setIsScanning(true);
        try {
            const guestData = await getGuestByCode(scannedCode.trim());
            setGuest(guestData);
        } catch (error) {
            setGuest(null);
            Alert.alert("Not Found", "Guest not found with code: " + scannedCode);
        } finally {
            setIsScanning(false);
        }
    };

    const handleCheckIn = () => {
        if (!guest) return;
        Alert.alert("Success", `Guest ${guest.firstName} ${guest.lastName} verified successfully!`);
        setGuest(null);
        setScannedCode("");
    };

    const selectedWeddingGuests = selectedWedding ? (guests[selectedWedding] || []) : [];
    const selectedWeddingDetail = selectedWedding ? weddingDetails[selectedWedding] : null;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Protocol</Text>
                <Text style={styles.subtitle}>Guest Verification</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {/* Verification Section */}
                <View style={styles.section}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Verify Guest</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter or scan QR code..."
                                value={scannedCode}
                                onChangeText={setScannedCode}
                            />
                            <TouchableOpacity
                                style={[styles.verifyButton, isScanning && styles.disabledButton]}
                                onPress={handleVerifyCode}
                                disabled={isScanning}
                            >
                                <IconSymbol name="checkmark.shield.fill" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {guest && (
                            <View style={styles.resultContainer}>
                                <View style={styles.resultHeader}>
                                    <IconSymbol name="checkmark.circle.fill" size={24} color={Colors.light.success} />
                                    <Text style={styles.resultTitle}>Guest Found</Text>
                                </View>
                                <View style={styles.guestInfo}>
                                    <Text style={styles.guestName}>{guest.firstName} {guest.lastName}</Text>
                                    <Text style={styles.guestDetail}>Code: {guest.uniqueCode}</Text>
                                    {guest.priority && (
                                        <View style={[styles.priorityBadge, { backgroundColor: guest.priority === 'VVIP' ? '#ede9fe' : '#fef3c7' }]}>
                                            <Text style={[styles.priorityText, { color: guest.priority === 'VVIP' ? '#7c3aed' : '#d4af37' }]}>
                                                {guest.priority}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
                                    <Text style={styles.checkInText}>Verify & Check In</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Assigned Weddings */}
                <Text style={styles.sectionTitle}>Assigned Weddings</Text>
                {assignments.length > 0 ? (
                    assignments.map((assignment) => {
                        const wedding = weddingDetails[assignment.weddingId];
                        const isSelected = selectedWedding === assignment.weddingId;
                        return (
                            <TouchableOpacity
                                key={assignment.id}
                                style={[styles.weddingCard, isSelected && styles.selectedCard]}
                                onPress={() => setSelectedWedding(isSelected ? null : assignment.weddingId)}
                            >
                                <View style={styles.weddingHeader}>
                                    <Text style={styles.weddingName}>{wedding?.partnersName || `Wedding #${assignment.weddingId}`}</Text>
                                    <View style={styles.activeBadge}>
                                        <Text style={styles.activeText}>Active</Text>
                                    </View>
                                </View>
                                {wedding && (
                                    <View style={styles.weddingDetails}>
                                        <View style={styles.detailRow}>
                                            <IconSymbol name="calendar" size={14} color={Colors.light.textSecondary} />
                                            <Text style={styles.detailText}>
                                                {wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString() : "Date TBD"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <IconSymbol name="person.2.fill" size={14} color={Colors.light.textSecondary} />
                                            <Text style={styles.detailText}>
                                                {guests[assignment.weddingId]?.length || 0} Guests
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                <View style={styles.jobBadge}>
                                    <IconSymbol name="briefcase.fill" size={12} color={Colors.light.gold} />
                                    <Text style={styles.jobText}>Job: {assignment.protocolJob || "General Support"}</Text>
                                </View>
                                {isSelected && (
                                    <View style={styles.instructionBox}>
                                        <Text style={styles.instructionTitle}>Instructions:</Text>
                                        <Text style={styles.instructionText}>
                                            {assignment.protocolJob === "Scan QR Code" ? "Please use the scanner above to verify guest entry codes." :
                                                assignment.protocolJob === "Security" ? "Ensure the safety of guests and maintain order at the venue." :
                                                    assignment.protocolJob === "Guest Assistance" ? "Help guests find their seats and answer any questions." :
                                                        "Support the wedding manager with general venue tasks."}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <Text style={styles.emptyText}>No weddings assigned yet.</Text>
                )}

                {/* Guest List */}
                {selectedWedding && (
                    <View style={styles.guestListSection}>
                        <Text style={styles.sectionTitle}>Guest List</Text>
                        {selectedWeddingGuests.length > 0 ? (
                            selectedWeddingGuests.map((g: any) => (
                                <View key={g.id} style={styles.guestItem}>
                                    <View>
                                        <Text style={styles.guestItemName}>{g.firstName} {g.lastName}</Text>
                                        <Text style={styles.guestItemCode}>{g.uniqueCode}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: g.rsvpStatus === 'CONFIRMED' ? '#ecfdf5' : '#f3f4f6' }]}>
                                        <Text style={[styles.statusText, { color: g.rsvpStatus === 'CONFIRMED' ? '#10b981' : '#6b7280' }]}>
                                            {g.rsvpStatus || 'PENDING'}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No guests found.</Text>
                        )}
                    </View>
                )}
            </ScrollView>
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
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 32,
        color: Colors.light.text,
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    content: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 16,
        marginTop: 8,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    cardTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: Colors.light.text,
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
    },
    verifyButton: {
        backgroundColor: Colors.light.gold,
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    resultContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    resultTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: Colors.light.success,
    },
    guestInfo: {
        marginBottom: 20,
    },
    guestName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.text,
    },
    guestDetail: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '700',
        fontFamily: Fonts.Cormorant.Bold,
    },
    checkInButton: {
        backgroundColor: Colors.light.success,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkInText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Bold,
    },
    weddingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    selectedCard: {
        borderColor: Colors.light.gold,
        borderWidth: 2,
    },
    weddingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    weddingName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: Colors.light.text,
        flex: 1,
    },
    activeBadge: {
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '600',
    },
    weddingDetails: {
        flexDirection: 'row',
        gap: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    guestListSection: {
        marginTop: 12,
    },
    guestItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    guestItemName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 16,
        color: Colors.light.text,
    },
    guestItemCode: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.light.textSecondary,
        marginTop: 20,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
    },
    jobBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        padding: 8,
        backgroundColor: '#fdf6f0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    jobText: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 14,
        color: Colors.light.gold,
    },
    instructionBox: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: Colors.light.gold,
    },
    instructionTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 4,
    },
    instructionText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        lineHeight: 18,
    },
});
