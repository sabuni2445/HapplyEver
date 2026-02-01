import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/theme';
import { getGuestByCode, getGuests, getProtocolAssignments, getWeddingById } from '@/utils/api';

const { width } = Dimensions.get('window');

// --- Helper Components ---

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: string, color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </View>
);

const TimelineItem = ({ time, title, description, isNext }: { time: string, title: string, description: string, isNext?: boolean }) => (
    <View style={[styles.timelineItem, isNext && styles.timelineItemNext]}>
        <View style={styles.timelineTimeContainer}>
            <Text style={[styles.timelineTime, isNext && styles.timelineTimeNextText]}>{time}</Text>
            <View style={[styles.timelineLine, isNext && styles.timelineLineNext]} />
            <View style={[styles.timelineDot, isNext && styles.timelineDotNext]} />
        </View>
        <View style={styles.timelineContent}>
            <Text style={[styles.timelineTitle, isNext && styles.timelineTitleNext]}>{title}</Text>
            <Text style={styles.timelineDescription}>{description}</Text>
        </View>
    </View>
);

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                });
            }
        };
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <View style={styles.countdownContainer}>
            <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{timeLeft.days}</Text>
                <Text style={styles.countdownLabel}>DAYS</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{timeLeft.hours}</Text>
                <Text style={styles.countdownLabel}>HRS</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{timeLeft.minutes}</Text>
                <Text style={styles.countdownLabel}>MINS</Text>
            </View>
        </View>
    );
};

interface ProtocolDashboardProps {
    userId: string;
}

export default function ProtocolDashboard({ userId }: ProtocolDashboardProps) {
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedWedding, setSelectedWedding] = useState<any>(null);
    const [weddingDetails, setWeddingDetails] = useState<any>(null);
    const [guests, setGuests] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Verification State
    const [modalVisible, setModalVisible] = useState(false);
    const [scannedData, setScannedData] = useState<any>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [manualCode, setManualCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [guestListVisible, setGuestListVisible] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);

    useEffect(() => {
        loadData();
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
            }
        })();
    }, []);

    const loadData = async () => {
        try {
            const data = await getProtocolAssignments(userId!);
            setAssignments(data);
            if (data.length > 0) {
                handleSelectWedding(data[0]);
            }
        } catch (error) {
            console.error('Failed to load assignments', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSelectWedding = async (assignment: any) => {
        setSelectedWedding(assignment);
        try {
            const { getTasksByWedding } = require('@/utils/api');
            const [details, guestList, allTasks] = await Promise.all([
                getWeddingById(assignment.weddingId).catch(() => null),
                getGuests(assignment.coupleClerkId).catch(() => []),
                getTasksByWedding(assignment.weddingId).catch(() => [])
            ]);

            // FALLBACK TO SAMPLES IF DATA IS MISSING
            if (!details) {
                setWeddingDetails({
                    partnersName: assignment.wedding?.partnersName || 'Sample Wedding (Elias & Selam)',
                    weddingDate: '2026-06-15T14:00:00',
                    numberOfGuests: 450
                });
            } else {
                setWeddingDetails(details);
            }

            setGuests(guestList && guestList.length > 0 ? guestList : [
                { firstName: 'Abebe', lastName: 'Bikila', priority: 'VIP', checkedIn: true, rsvpStatus: 'CONFIRMED' },
                { firstName: 'Sara', lastName: 'Kassa', priority: 'Guest', checkedIn: false, rsvpStatus: 'CONFIRMED' },
                { firstName: 'John', lastName: 'Doe', priority: 'Staff', checkedIn: false, rsvpStatus: 'PENDING' }
            ]);

            // Sort tasks by due date for timeline
            let timelineTasks = (allTasks || [])
                .filter((t: any) => t.dueDate)
                .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            if (timelineTasks.length === 0) {
                timelineTasks = [
                    { id: 101, title: 'Guest Arrival', description: 'Monitor entrance and scan QR codes', dueDate: '2026-06-15T14:00:00' },
                    { id: 102, title: 'Ceremony Check', description: 'Ensure VIP seating is ready', dueDate: '2026-06-15T15:30:00' },
                    { id: 103, title: 'Dinner Service', description: 'Coordinate with catering team', dueDate: '2026-06-15T19:00:00' }
                ];
            }
            setTasks(timelineTasks);
        } catch (error) {
            console.error('Error loading wedding details', error);
        }
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        setScanning(false);
        setModalVisible(false);
        verifyGuest(data);
    };

    const verifyGuest = async (data: string) => {
        let code = data;
        if (data.includes('code=')) {
            try {
                const match = data.match(/[?&]code=([^&]+)/);
                if (match && match[1]) {
                    code = match[1];
                }
            } catch (e) {
                console.error('Error parsing QR code:', e);
            }
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            const guest = await getGuestByCode(code);
            if (guest) {
                // Perform actual check-in
                const { checkInGuest } = require('@/utils/api');
                await checkInGuest(guest.id);

                setScannedData(guest);
                setTimeout(() => setScannedData(null), 5000);

                Alert.alert(
                    "Check-in Successful!",
                    `Welcome, ${guest.firstName} ${guest.lastName}!\nTable: ${guest.seatNumber || 'Assigned by Host'}`,
                    [{ text: "OK", onPress: () => loadData() }]
                );
            } else {
                Alert.alert("Not Found", "Guest code not recognized.");
            }
        } catch (error) {
            console.error('Check-in error:', error);
            Alert.alert("Error", "Could not verify guest or check-in failed.");
        }
    };

    if (loading) return <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 50 }} />;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.light.background, '#fdf6f0']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Mission Status</Text>
                        <Text style={styles.headerSubtitle}>
                            {selectedWedding ? selectedWedding.protocolJob : 'Current Objective'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
                            <Ionicons name="person-circle-outline" size={32} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {weddingDetails && (
                    <View style={styles.activeEventCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={styles.eventName}>{weddingDetails.partnersName}</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>ACTIVE</Text>
                            </View>
                        </View>
                        <CountdownTimer targetDate={weddingDetails.weddingDate} />
                    </View>
                )}
            </LinearGradient>

            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
                <View style={styles.content}>
                    {/* Quick Actions */}
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionButton, { width: '100%' }]} onPress={() => setModalVisible(true)}>
                            <View style={[styles.actionIcon, { width: 80, height: 80, borderRadius: 40 }]}>
                                <Ionicons name="qr-code-outline" size={36} color="#fff" />
                            </View>
                            <Text style={[styles.actionLabel, { fontSize: 16 }]}>Check In Guest</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <StatCard
                            label="Total Guests"
                            value={weddingDetails?.numberOfGuests || guests.length}
                            icon="people-outline"
                            color={Colors.light.text}
                        />
                        <StatCard
                            label="Verified (In)"
                            value={guests.filter(g => g.checkedIn).length}
                            icon="qr-code-outline"
                            color={Colors.light.success}
                        />
                    </View>

                    {/* Timeline */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Wedding Timeline</Text>
                    </View>
                    <View style={styles.timelineContainer}>
                        {tasks.length > 0 ? (
                            tasks.slice(0, 4).map((task, index) => (
                                <TimelineItem
                                    key={task.id}
                                    time={new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    title={task.title}
                                    description={task.description}
                                    isNext={index === 0}
                                />
                            ))
                        ) : (
                            <Text style={{ color: '#94a3b8', fontStyle: 'italic', marginLeft: 40 }}>No timeline tasks available</Text>
                        )}
                    </View>


                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Scanner Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Guest Check-in</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={28} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cameraContainer}>
                        {hasPermission === null ? (
                            <ActivityIndicator size="large" color={Colors.light.tint} />
                        ) : hasPermission === false ? (
                            <Text>No access to camera</Text>
                        ) : (
                            <CameraView
                                onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
                                style={StyleSheet.absoluteFillObject}
                            />
                        )}
                        <View style={styles.scanOverlay}>
                            <View style={styles.scanFrame} />
                            <Text style={styles.scanInstruction}>Align QR code within the frame</Text>
                        </View>
                    </View>

                    <View style={styles.manualEntry}>
                        <Text style={styles.manualLabel}>Or enter invite code manually:</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.codeInput}
                                placeholder="Ex: W-123"
                                value={manualCode}
                                onChangeText={setManualCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity style={styles.verifyButton} onPress={() => verifyGuest(manualCode)}>
                                <Text style={styles.verifyButtonText}>Check In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Full Guest List Modal */}
            <Modal visible={guestListVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Attendee List</Text>
                        <TouchableOpacity onPress={() => setGuestListVisible(false)}>
                            <Ionicons name="close" size={28} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 20, backgroundColor: '#f8fafc' }}>
                        <TextInput
                            style={styles.codeInput}
                            placeholder="Search guests..."
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                    <FlatList
                        data={guests}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <View style={styles.guestRow}>
                                <View style={styles.guestAvatar}>
                                    <Text style={styles.guestInitials}>{item.firstName[0]}{item.lastName[0]}</Text>
                                </View>
                                <View style={styles.guestInfo}>
                                    <Text style={styles.guestName}>{item.firstName} {item.lastName}</Text>
                                    <Text style={styles.guestStatus}>Table: {item.seatNumber || 'N/A'} • {item.priority || 'Guest'}</Text>
                                </View>
                                <View style={[styles.rsvpBadge, item.checkedIn ? styles.confirmed : styles.pending]}>
                                    <Ionicons name={item.checkedIn ? "checkmark-circle" : "time"} size={14} color={item.checkedIn ? "#059669" : "#64748b"} />
                                    <Text style={[styles.rsvpText, { marginLeft: 4 }]}>{item.checkedIn ? 'In' : 'Pending'}</Text>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>No guests found</Text>}
                    />
                </View>
            </Modal>

            {/* Mission History Modal */}
            <Modal visible={historyVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Mission History</Text>
                        <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                            <Ionicons name="close" size={28} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {assignments.filter(a => a.status === 'COMPLETED').length > 0 ? (
                            assignments.filter(a => a.status === 'COMPLETED').map((assignment, index) => (
                                <View key={index} style={[styles.activeEventCard, { marginBottom: 15, borderLeftWidth: 4, borderLeftColor: Colors.light.gold }]}>
                                    <Text style={styles.eventName}>{assignment.wedding?.partnersName || 'Past Wedding'}</Text>
                                    <Text style={{ color: '#64748b', marginTop: 4 }}>Date: {new Date(assignment.wedding?.weddingDate).toLocaleDateString()}</Text>
                                    <View style={[styles.statusBadge, { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#f1f5f9' }]}>
                                        <Text style={[styles.statusText, { color: '#64748b' }]}>ARCHIVED</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={{ alignItems: 'center', marginTop: 60 }}>
                                <Ionicons name="archive-outline" size={64} color="#e2e8f0" />
                                <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 16 }}>No historical missions found</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    profileButton: {
        padding: 4,
    },
    activeEventCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    eventName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
    },
    statusBadge: {
        backgroundColor: '#10b98120',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.light.success,
    },
    countdownContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    countdownItem: {
        alignItems: 'center',
    },
    countdownValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.tint,
        fontVariant: ['tabular-nums'],
    },
    countdownLabel: {
        fontSize: 10,
        color: Colors.light.textSecondary,
        marginTop: 2,
    },
    countdownSeparator: {
        fontSize: 24,
        color: Colors.light.textSecondary,
        marginHorizontal: 10,
        paddingBottom: 15,
    },
    content: {
        padding: 20,
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    actionButton: {
        alignItems: 'center',
        width: (width - 60) / 3,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.text,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    statLabel: {
        fontSize: 10,
        color: Colors.light.textSecondary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
    },
    seeAll: {
        fontSize: 14,
        color: Colors.light.tint,
        fontWeight: '600',
    },
    timelineContainer: {
        marginBottom: 30,
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 80,
    },
    timelineItemNext: {
        opacity: 1,
    },
    timelineTimeContainer: {
        width: 60,
        alignItems: 'center',
    },
    timelineTime: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.textSecondary,
        marginBottom: 4,
    },
    timelineTimeNextText: {
        color: Colors.light.tint,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#e5e7eb',
    },
    timelineLineNext: {
        backgroundColor: Colors.light.tint,
    },
    timelineDot: {
        position: 'absolute',
        top: 20,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#e5e7eb',
        borderWidth: 2,
        borderColor: '#fff',
    },
    timelineDotNext: {
        backgroundColor: Colors.light.tint,
        transform: [{ scale: 1.2 }],
    },
    timelineContent: {
        flex: 1,
        paddingLeft: 20,
        paddingBottom: 20,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
    },
    timelineTitleNext: {
        color: Colors.light.tint,
    },
    timelineDescription: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        marginTop: 2,
    },
    guestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    guestAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    guestInitials: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    guestInfo: {
        flex: 1,
    },
    guestName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.text,
    },
    guestStatus: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    rsvpBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    rsvpText: {
        fontSize: 11,
        fontWeight: '600',
    },
    confirmed: {
        backgroundColor: '#d1fae5',
    },
    pending: {
        backgroundColor: '#f3f4f6',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: Colors.light.tint,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    scanInstruction: {
        color: '#fff',
        marginTop: 20,
        fontSize: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    manualEntry: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    manualLabel: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 10,
    },
    inputRow: {
        flexDirection: 'row',
    },
    codeInput: {
        flex: 1,
        height: 50,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginRight: 10,
        fontSize: 16,
    },
    verifyButton: {
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    verifyButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
