import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getPaymentsByWedding, initializeChapaPayment, verifyChapaPayment, getWeddingDetails, getCoupleBookings } from '@/utils/api';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaymentsScreen() {
    const { user } = useUser();
    const [payments, setPayments] = useState<any[]>([]);
    const [wedding, setWedding] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);

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
                    const paymentsData = await getPaymentsByWedding(weddingData.id);
                    setPayments(paymentsData || []);
                }
            } catch (error) {
                console.error("Error loading payments data:", error);
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

    const SERVICE_CHARGE = 10000;

    const calculateServicesTotal = () => {
        const uniqueServiceIds = new Set();
        return bookings.reduce((sum, booking) => {
            if (booking.status === "ACCEPTED" && booking.serviceId && !uniqueServiceIds.has(booking.serviceId)) {
                uniqueServiceIds.add(booking.serviceId);
                return sum + (booking.service?.price || 0);
            }
            return sum;
        }, 0);
    };

    const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'PAID' ? (p.amount || 0) : 0), 0);
    const totalCost = calculateServicesTotal() + SERVICE_CHARGE;
    const remainingBalance = Math.max(0, totalCost - totalPaid);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Payments</Text>
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
                                <Text style={styles.summaryLabel}>Overall Budget</Text>
                                <Text style={styles.summaryValue}>ETB {totalCost.toLocaleString()}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View>
                                <Text style={styles.summaryLabel}>Total Paid</Text>
                                <Text style={styles.summaryValue}>ETB {totalPaid.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={styles.summaryFooter}>
                            <Text style={styles.summaryFooterLabel}>Outstanding Price:</Text>
                            <Text style={styles.summaryFooterValue}>ETB {remainingBalance.toLocaleString()}</Text>
                        </View>
                    </LinearGradient>
                </View>

                <Text style={styles.sectionTitle}>Payment Schedule</Text>

                {payments.length > 0 ? (
                    payments.map((payment) => (
                        <View key={payment.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.paymentTitle}>{payment.description || "Payment"}</Text>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(payment.status) }]}>
                                    <Text style={styles.badgeText}>
                                        {payment.status === 'PAID' ? 'Settled' : 'Outstanding'}
                                    </Text>
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
                                        {processingId === payment.id ? "Processing..." : "Pay Now"}
                                    </Text>
                                </TouchableOpacity>
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
    sectionTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 16,
    },
    paidDetail: {
        fontSize: 14,
        color: Colors.light.success,
        fontFamily: Fonts.Cormorant.Bold,
        marginBottom: 8,
    },
});
