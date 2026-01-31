import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getVendorBookings, updateBookingStatus } from '@/utils/api';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BookingsScreen() {
    const { user } = useUser();
    const [bookings, setBookings] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const loadData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const bookingsData = await getVendorBookings(user.id);
                setBookings(bookingsData || []);
            } catch (error) {
                console.error("Error loading vendor bookings:", error);
            } finally {
                setIsLoading(false);
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

    const handleUpdateStatus = async (bookingId: number, status: string) => {
        try {
            await updateBookingStatus(bookingId, user!.id, status);
            Alert.alert("Success", `Booking ${status.toLowerCase()} successfully.`);
            setShowDetailModal(false);
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to update booking status.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return '#10b981';
            case 'REJECTED': return '#ef4444';
            case 'COMPLETED': return '#3b82f6';
            case 'CANCELLED': return '#6b7280';
            default: return Colors.light.gold;
        }
    };

    const openDetailModal = (booking: any) => {
        setSelectedBooking(booking);
        setShowDetailModal(true);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Bookings</Text>
                    <Text style={styles.subtitle}>Manage your service requests</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {isLoading ? (
                    <Text style={styles.infoText}>Loading bookings...</Text>
                ) : bookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name="calendar.badge.clock" size={64} color="#e5e7eb" />
                        <Text style={styles.emptyText}>No bookings yet.</Text>
                    </View>
                ) : (
                    bookings.map((booking) => (
                        <TouchableOpacity
                            key={booking.id}
                            style={styles.bookingCard}
                            onPress={() => openDetailModal(booking)}
                        >
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.serviceName}>{booking.serviceName}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}10` }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                                            {booking.status}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.bookingDate}>
                                    {new Date(booking.eventDate || booking.createdAt).toLocaleDateString()}
                                </Text>
                            </View>

                            <View style={styles.coupleInfo}>
                                <IconSymbol name="person.2.fill" size={16} color={Colors.light.textSecondary} />
                                <Text style={styles.coupleText}>{booking.coupleName || "Valued Couple"}</Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.viewDetailText}>Tap to view details</Text>
                                <IconSymbol name="chevron.right" size={14} color={Colors.light.gold} />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Booking Detail Modal */}
            <Modal visible={showDetailModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Booking Details</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedBooking && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionLabel}>Service Requested</Text>
                                    <View style={styles.detailRow}>
                                        <IconSymbol name="briefcase.fill" size={18} color={Colors.light.gold} />
                                        <Text style={styles.detailValue}>{selectedBooking.serviceName}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionLabel}>Couple Information</Text>
                                    <View style={styles.detailRow}>
                                        <IconSymbol name="person.fill" size={18} color={Colors.light.gold} />
                                        <Text style={styles.detailValue}>{selectedBooking.coupleName || "Valued Couple"}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionLabel}>Event Details</Text>
                                    <View style={styles.detailRow}>
                                        <IconSymbol name="calendar" size={18} color={Colors.light.gold} />
                                        <Text style={styles.detailValue}>
                                            {new Date(selectedBooking.eventDate).toLocaleDateString()} at {selectedBooking.eventTime || 'TBA'}
                                        </Text>
                                    </View>
                                    <View style={[styles.detailRow, { marginTop: 12 }]}>
                                        <IconSymbol name="mappin.and.ellipse" size={18} color={Colors.light.gold} />
                                        <Text style={styles.detailValue}>{selectedBooking.location || 'Not specified'}</Text>
                                    </View>
                                </View>

                                {selectedBooking.specialRequests && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionLabel}>Special Requests / Notes</Text>
                                        <View style={styles.noteBox}>
                                            <Text style={styles.noteText}>"{selectedBooking.specialRequests}"</Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.statusSection}>
                                    <Text style={styles.sectionLabel}>Current Status</Text>
                                    <View style={[styles.statusDisplay, { backgroundColor: `${getStatusColor(selectedBooking.status)}10` }]}>
                                        <Text style={[styles.statusDisplayText, { color: getStatusColor(selectedBooking.status) }]}>
                                            {selectedBooking.status}
                                        </Text>
                                    </View>
                                </View>

                                {selectedBooking.status === 'PENDING' && (
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={[styles.modalActionBtn, styles.modalRejectBtn]}
                                            onPress={() => handleUpdateStatus(selectedBooking.id, 'REJECTED')}
                                        >
                                            <Text style={styles.modalRejectBtnText}>Reject Request</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalActionBtn, styles.modalAcceptBtn]}
                                            onPress={() => handleUpdateStatus(selectedBooking.id, 'ACCEPTED')}
                                        >
                                            <Text style={styles.modalAcceptBtnText}>Accept Request</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
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
        fontSize: 28,
        color: Colors.light.text,
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    content: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    infoText: {
        textAlign: 'center',
        marginTop: 40,
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Regular,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.textSecondary,
        marginTop: 16,
    },
    bookingCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        elevation: 4,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    serviceName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.text,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    bookingDate: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: Colors.light.gold,
    },
    coupleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    coupleText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.text,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
        marginTop: 4,
    },
    viewDetailText: {
        fontSize: 12,
        color: Colors.light.gold,
        fontFamily: Fonts.Cormorant.Bold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
    },
    detailSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailValue: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.text,
    },
    noteBox: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 16,
    },
    noteText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.text,
        fontStyle: 'italic',
        lineHeight: 24,
    },
    statusSection: {
        marginBottom: 32,
    },
    statusDisplay: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statusDisplayText: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        textTransform: 'uppercase',
    },
    modalActions: {
        gap: 12,
        marginBottom: 40,
    },
    modalActionBtn: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalAcceptBtn: {
        backgroundColor: Colors.light.gold,
    },
    modalAcceptBtnText: {
        color: '#fff',
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
    },
    modalRejectBtn: {
        backgroundColor: '#f3f4f6',
    },
    modalRejectBtnText: {
        color: Colors.light.text,
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
    },
});
