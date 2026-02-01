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
import { useAuth } from '@clerk/clerk-expo';
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

export default function ProtocolScreen() {
    const router = useRouter();
    const { userId } = useAuth();
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
                getWeddingById(assignment.weddingId),
                getGuests(assignment.coupleClerkId),
                getTasksByWedding(assignment.weddingId)
            ]);
            setWeddingDetails(details);
            setGuests(guestList);
            // Sort tasks by due date for timeline
            const timelineTasks = (allTasks || [])
                .filter((t: any) => t.dueDate)
                .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
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

        // Extract code from URL if data is a URL
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
                setTimeout(() => setScannedData(null), 5000); // Clear after 5 seconds

                Alert.alert(
                    "Check-in Successful!",
                    `Welcome, ${guest.firstName} ${guest.lastName}!\n\nTable: ${guest.seatNumber || 'Assigned by Host'}`,
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

    const renderHeader = () => (
        <LinearGradient
            colors={[Colors.light.background, '#fdf6f0']}
            style={styles.header}
        >
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.headerTitle}>Event Assistant</Text>
                    <Text style={styles.headerSubtitle}>
                        {selectedWedding ? selectedWedding.protocolJob : 'Dashboard'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
                    <Ionicons name="person-circle-outline" size={32} color={Colors.light.text} />
                </TouchableOpacity>
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
    );

    const renderContent = () => {
        if (loading) return <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 50 }} />;

        return (
            <View style={styles.content}>
                {/* Quick Actions */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setModalVisible(true)}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="qr-code-outline" size={24} color="#fff" />
                        </View>
                        <Text style={styles.actionLabel}>Check In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/protocol/tasks')}>
                        <View style={[styles.actionIcon, { backgroundColor: Colors.light.success }]}>
                            <Ionicons name="checkmark-done-circle-outline" size={24} color="#fff" />
                        </View>
                        <Text style={styles.actionLabel}>My Tasks</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Coming Soon', 'Detailed floor plans will be available in a future update.')}>
                        <View style={[styles.actionIcon, { backgroundColor: Colors.light.textSecondary }]}>
                            <Ionicons name="map-outline" size={24} color="#fff" />
                        </View>
                        <Text style={styles.actionLabel}>Floor Plan</Text>
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

                {/* Guest List Preview */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Guest List</Text>
                    <TouchableOpacity onPress={() => { }}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {guests.slice(0, 5).map((guest, index) => (
                    <View key={index} style={styles.guestRow}>
                        <View style={styles.guestAvatar}>
                            <Text style={styles.guestInitials}>{guest.firstName[0]}{guest.lastName[0]}</Text>
                        </View>
                        <View style={styles.guestInfo}>
                            <Text style={styles.guestName}>{guest.firstName} {guest.lastName}</Text>
                            <Text style={styles.guestStatus}>{guest.priority || "Guest"}</Text>
                        </View>
                        <View style={[styles.rsvpBadge, guest.rsvpStatus === 'CONFIRMED' ? styles.confirmed : styles.pending]}>
                            <Text style={styles.rsvpText}>{guest.rsvpStatus === 'CONFIRMED' ? 'Here' : 'Pending'}</Text>
                        </View>
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
                {renderContent()}
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
                            <Text>Requesting permission...</Text>
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
        marginBottom: 100,
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    actionButton: {
        alignItems: 'center',
        width: width / 3.5,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: Colors.light.tint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.light.text,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        backgroundColor: '#f9f9f9',
        width: '48%',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
    },
    seeAll: {
        fontSize: 14,
        color: Colors.light.tint,
    },
    timelineContainer: {
        marginLeft: 20,
        marginBottom: 30,
    },
    timelineItem: {
        marginBottom: 25,
        position: 'relative',
    },
    timelineItemNext: {
    },
    timelineTimeContainer: {
        position: 'absolute',
        left: -20,
        top: 0,
        bottom: -25,
        alignItems: 'center',
        width: 50,
    },
    timelineTime: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.textSecondary,
        marginBottom: 8,
    },
    timelineTimeNextText: {
        color: Colors.light.tint,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#e5e7eb',
    },
    timelineLineNext: {
        backgroundColor: Colors.light.tint,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#e5e7eb',
        position: 'absolute',
        top: 22,
    },
    timelineDotNext: {
        backgroundColor: Colors.light.tint,
        borderWidth: 2,
        borderColor: '#fff',
        width: 14,
        height: 14,
        borderRadius: 7,
        top: 20,
    },
    timelineContent: {
        marginLeft: 40,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 4,
    },
    timelineTitleNext: {
        color: Colors.light.tint,
    },
    timelineDescription: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    guestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    guestInfo: {
        flex: 1,
    },
    guestName: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.text,
    },
    guestStatus: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    rsvpBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    confirmed: {
        backgroundColor: '#10b98115',
    },
    pending: {
        backgroundColor: '#f3f4f6',
    },
    rsvpText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    cameraContainer: {
        height: 400,
        width: '100%',
        overflow: 'hidden',
        marginTop: 20,
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
        borderColor: '#fff',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    scanInstruction: {
        color: '#fff',
        marginTop: 20,
        fontSize: 16,
        fontWeight: '500',
    },
    manualEntry: {
        padding: 20,
    },
    manualLabel: {
        fontSize: 16,
        marginBottom: 10,
        color: Colors.light.text,
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
