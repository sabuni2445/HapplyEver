import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Linking } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import {
    getPaymentsByWedding,
    initializeChapaPayment,
    verifyChapaPayment,
    getWeddingDetails,
    getCoupleBookings,
    getAssignmentByWedding,
    getUserByClerkId
} from '@/utils/api';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ManagementScreen() {
    const { user } = useUser();
    const [payments, setPayments] = useState<any[]>([]);
    const [wedding, setWedding] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [manager, setManager] = useState<any>(null);
    const [protocol, setProtocol] = useState<any>(null);

    const loadData = async () => {
        if (user) {
            try {
                const [weddingData, bookingsData] = await Promise.all([
                    getWeddingDetails(user.id),
                    getCoupleBookings(user.id)
                ]);
                setWedding(weddingData);
                setBookings(bookingsData || []);

                if (weddingData?.id) {
                    const [paymentsData, assignmentData] = await Promise.all([
                        getPaymentsByWedding(weddingData.id),
                        getAssignmentByWedding(weddingData.id)
                    ]);
                    setPayments(paymentsData || []);

                    if (assignmentData) {
                        if (assignmentData.managerClerkId) {
                            const mData = await getUserByClerkId(assignmentData.managerClerkId);
                            setManager(mData);
                        }
                        if (assignmentData.protocolClerkId) {
                            const pData = await getUserByClerkId(assignmentData.protocolClerkId);
                            setProtocol(pData);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading management data:", error);
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

    const handlePay = async (payment: any) => {
        if (!user || !wedding) return;

        setProcessingId(payment.id);
        try {
            const txRef = `wedding-${wedding.id}-payment-${payment.id}-${Date.now()}`;

            const result = await initializeChapaPayment({
                email: user.emailAddresses[0].emailAddress,
                firstName: user.firstName || "User",
                lastName: user.lastName || "",
                phoneNumber: "",
                amount: payment.amount,
                txRef,
                coupleClerkId: user.id,
                returnUrl: "https://chapa.co"
            });

            if (result.success && result.checkout_url) {
                await WebBrowser.openBrowserAsync(result.checkout_url);

                Alert.alert(
                    "Payment Verification",
                    "Did you complete the payment?",
                    [
                        { text: "No", style: "cancel" },
                        {
                            text: "Yes",
                            onPress: async () => {
                                try {
                                    const verify = await verifyChapaPayment(txRef);
                                    if (verify.status === 'success' || verify.status === 'PAID') {
                                        Alert.alert("Success", "Payment confirmed!");
                                        loadData();
                                    } else {
                                        Alert.alert("Pending", "Payment verification pending. Please refresh shortly.");
                                    }
                                } catch (e) {
                                    Alert.alert("Error", "Could not verify payment status.");
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert("Error", "Failed to initialize payment");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Payment processing failed");
        } finally {
            setProcessingId(null);
        }
    };

    const handleChat = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    const handleMeeting = async () => {
        if (!wedding) return;
        const meetingUrl = `https://meet.jit.si/ElegantEvents-Wedding-${wedding.id}`;
        await WebBrowser.openBrowserAsync(meetingUrl);
    };

    const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
    const totalOutstanding = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
    const totalBudget = wedding?.budget || 0;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Management</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {/* Budget Summary Card */}
                <View style={styles.summaryCard}>
                    <LinearGradient
                        colors={[Colors.light.gold, '#b8962e']}
                        style={styles.summaryGradient}
                    >
                        <View style={styles.summaryRow}>
                            <View>
                                <Text style={styles.summaryLabel}>Total Budget</Text>
                                <Text style={styles.summaryValue}>ETB {totalBudget.toLocaleString()}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View>
                                <Text style={styles.summaryLabel}>Total Paid</Text>
                                <Text style={styles.summaryValue}>ETB {totalPaid.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={styles.summaryFooter}>
                            <Text style={styles.summaryFooterLabel}>Outstanding Balance:</Text>
                            <Text style={styles.summaryFooterValue}>ETB {totalOutstanding.toLocaleString()}</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Wedding Team Section */}
                {(manager || protocol) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Wedding Team</Text>
                        <View style={styles.teamGrid}>
                            {manager && (
                                <View style={styles.teamCard}>
                                    <View style={styles.teamHeader}>
                                        <View style={styles.iconContainer}>
                                            <IconSymbol name="person.fill" size={24} color={Colors.light.gold} />
                                        </View>
                                        <View>
                                            <Text style={styles.teamRole}>Wedding Manager</Text>
                                            <Text style={styles.teamName}>{manager.firstName} {manager.lastName}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.teamActions}>
                                        <TouchableOpacity style={styles.actionButton} onPress={() => handleChat(manager.email)}>
                                            <IconSymbol name="message.fill" size={18} color="#fff" />
                                            <Text style={styles.actionText}>Chat</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionButton, styles.meetingButton]} onPress={handleMeeting}>
                                            <IconSymbol name="video.fill" size={18} color="#fff" />
                                            <Text style={styles.actionText}>Meeting</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            {protocol && (
                                <View style={styles.teamCard}>
                                    <View style={styles.teamHeader}>
                                        <View style={styles.iconContainer}>
                                            <IconSymbol name="person.2.fill" size={24} color={Colors.light.gold} />
                                        </View>
                                        <View>
                                            <Text style={styles.teamRole}>Protocol Officer</Text>
                                            <Text style={styles.teamName}>{protocol.firstName} {protocol.lastName}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.teamActions}>
                                        <TouchableOpacity style={styles.actionButton} onPress={() => handleChat(protocol.email)}>
                                            <IconSymbol name="message.fill" size={18} color="#fff" />
                                            <Text style={styles.actionText}>Chat</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionButton, styles.meetingButton]} onPress={handleMeeting}>
                                            <IconSymbol name="video.fill" size={18} color="#fff" />
                                            <Text style={styles.actionText}>Meeting</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Payment Schedule</Text>

                {payments.length > 0 ? (
                    payments.map((payment) => (
                        <View key={payment.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.paymentTitle}>{payment.description || "Payment"}</Text>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(payment.status) }]}>
                                    <Text style={styles.badgeText}>{payment.status}</Text>
                                </View>
                            </View>

                            <Text style={styles.amount}>ETB {payment.amount.toLocaleString()}</Text>

                            {payment.dueDate && (
                                <Text style={styles.date}>Due: {new Date(payment.dueDate).toLocaleDateString()}</Text>
                            )}

                            {payment.status === 'PENDING' && (
                                <TouchableOpacity
                                    style={[styles.payButton, processingId === payment.id && styles.disabledButton]}
                                    onPress={() => handlePay(payment)}
                                    disabled={processingId === payment.id}
                                >
                                    <Text style={styles.payButtonText}>
                                        {processingId === payment.id ? "Processing..." : `Pay the remaining ETB ${payment.amount.toLocaleString()}`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {payment.status === 'PAID' && (
                                <View style={styles.successBadge}>
                                    <IconSymbol name="checkmark.circle.fill" size={16} color={Colors.light.success} />
                                    <Text style={styles.successText}>Fully Paid</Text>
                                </View>
                            )}
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No payment schedule found.</Text>
                )}
            </ScrollView>
        </View>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PAID': return Colors.light.success;
        case 'PENDING': return Colors.light.gold;
        case 'FAILED': return Colors.light.error;
        default: return '#6b7280';
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
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 32,
        color: Colors.light.text,
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
    },
    summaryCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 5,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    summaryGradient: {
        padding: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    summaryLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontFamily: Fonts.Cormorant.Regular,
        marginBottom: 4,
    },
    summaryValue: {
        color: '#fff',
        fontSize: 22,
        fontFamily: Fonts.Playfair.Bold,
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    summaryFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryFooterLabel: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Bold,
    },
    summaryFooterValue: {
        color: '#fff',
        fontSize: 20,
        fontFamily: Fonts.Playfair.Bold,
    },
    teamGrid: {
        gap: 16,
    },
    teamCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    teamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fdf6f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    teamRole: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Regular,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    teamName: {
        fontSize: 18,
        color: Colors.light.text,
        fontFamily: Fonts.Playfair.Bold,
    },
    teamActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.gold,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    meetingButton: {
        backgroundColor: '#523c2b',
    },
    actionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Fonts.Cormorant.Regular,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    paymentTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.text,
        flex: 1,
    },
    amount: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.gold,
        marginBottom: 8,
    },
    date: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginBottom: 16,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: Fonts.Cormorant.Regular,
    },
    payButton: {
        backgroundColor: Colors.light.gold,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    payButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Regular,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.light.textSecondary,
        marginTop: 40,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ecfdf5',
        padding: 12,
        borderRadius: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: '#d1fae5',
    },
    successText: {
        color: Colors.light.success,
        fontWeight: '700',
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Bold,
    },
});
