import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Linking, TextInput } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import {
    getPaymentsByWedding,
    initializeChapaPayment,
    verifyChapaPayment,
    getWeddingDetails,
    getCoupleBookings,
    getAssignmentByWedding,
    getUserByClerkId,
    sendMessage,
    getTasksByWedding,
    completeTask,
    getManagerAssignments,
    getWeddingById,
    updateWeddingStatus
} from '@/utils/api';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ManagerTaskAssignment from '@/components/ManagerTaskAssignment';

export default function ManagementScreen() {
    const { user } = useUser();
    const [payments, setPayments] = useState<any[]>([]);
    const [wedding, setWedding] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [manager, setManager] = useState<any>(null);
    const [protocol, setProtocol] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [couple, setCouple] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [showCoupleInput, setShowCoupleInput] = useState(false);
    const [coupleMessage, setCoupleMessage] = useState("");
    const [showManagerInput, setShowManagerInput] = useState(false);
    const [managerMessage, setManagerMessage] = useState("");
    const [showProtocolInput, setShowProtocolInput] = useState(false);
    const [protocolMessage, setProtocolMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const router = useRouter();
    const { weddingId: paramWeddingId } = useLocalSearchParams();
    const [selectedWeddingId, setSelectedWeddingId] = useState<string | null>(null);

    const loadData = async () => {
        if (user) {
            try {
                const dbUser = await getUserByClerkId(user.id);
                const role = dbUser?.selectedRole || dbUser?.role || 'COUPLE';
                setUserRole(role);

                let weddingToLoad: any = null;
                let activeWeddingId: any = null;

                if (role === 'MANAGER' || role === 'ADMIN') {
                    const managerAssignments = await getManagerAssignments(user.id);
                    setAssignments(managerAssignments || []);

                    activeWeddingId = selectedWeddingId || paramWeddingId || (managerAssignments?.length > 0 ? managerAssignments[0].weddingId : null);

                    if (activeWeddingId) {
                        try {
                            const wData = await getWeddingById(activeWeddingId);
                            setWedding(wData);
                            weddingToLoad = wData;
                        } catch (e) {
                            // Fallback to details by user if id lookup fails
                            const wData = await getWeddingDetails(user.id);
                            setWedding(wData);
                            weddingToLoad = wData;
                        }
                    } else {
                        const wData = await getWeddingDetails(user.id);
                        setWedding(wData);
                        weddingToLoad = wData;
                    }
                } else {
                    const wData = await getWeddingDetails(user.id);
                    setWedding(wData);
                    weddingToLoad = wData;
                    activeWeddingId = wData?.id;
                }

                if (weddingToLoad) {
                    const [paymentsData, assignmentData, bookingsData, tasksData] = await Promise.all([
                        getPaymentsByWedding(weddingToLoad.id),
                        getAssignmentByWedding(weddingToLoad.id),
                        getCoupleBookings(weddingToLoad.coupleClerkId || weddingToLoad.id),
                        getTasksByWedding(weddingToLoad.id)
                    ]);

                    setPayments(paymentsData || []);
                    setBookings(bookingsData || []);
                    setTasks(tasksData || []);

                    if (weddingToLoad.coupleClerkId) {
                        const cData = await getUserByClerkId(weddingToLoad.coupleClerkId);
                        setCouple(cData);
                    }

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

    const handlePayBalance = async (amount: number) => {
        if (!user || !wedding || amount <= 0) return;

        setProcessingId(-1); // Use -1 to indicate balance payment
        try {
            const txRef = `wedding-${wedding.id}-final-${Date.now()}`;

            const result = await initializeChapaPayment({
                email: user.emailAddresses[0].emailAddress,
                firstName: user.firstName || "User",
                lastName: user.lastName || "",
                phoneNumber: "",
                amount: amount,
                txRef,
                coupleClerkId: user.id,
                returnUrl: "https://chapa.co"
            });

            if (result.success && result.checkout_url) {
                await WebBrowser.openBrowserAsync(result.checkout_url);
                Alert.alert("Verification", "Did you complete the payment?", [
                    { text: "No", style: "cancel" },
                    {
                        text: "Yes", onPress: async () => {
                            const verify = await verifyChapaPayment(txRef);
                            if (verify.status === 'success' || verify.status === 'PAID') {
                                Alert.alert("Success", "Balance paid!");
                                loadData();
                            }
                        }
                    }
                ]);
            }
        } catch (error) {
            Alert.alert("Error", "Payment failed");
        } finally {
            setProcessingId(null);
        }
    };

    const handleChat = () => {
        router.push('/(tabs)/messages');
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
                <Text style={styles.title}>Management</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {/* Wedding Selector for Managers */}
                {(userRole === 'MANAGER' || userRole === 'ADMIN') && assignments.length > 0 && (
                    <View style={styles.selectorContainer}>
                        <Text style={styles.selectorLabel}>Managed Wedding:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                            {assignments.map((assign) => (
                                <TouchableOpacity
                                    key={assign.weddingId}
                                    style={[
                                        styles.selectorChip,
                                        (selectedWeddingId || paramWeddingId || assignments[0].weddingId) == assign.weddingId && styles.selectorChipActive
                                    ]}
                                    onPress={() => {
                                        setSelectedWeddingId(assign.weddingId);
                                        loadData();
                                    }}
                                >
                                    <Text style={[
                                        styles.selectorChipText,
                                        (selectedWeddingId || paramWeddingId || assignments[0].weddingId) == assign.weddingId && styles.selectorChipTextActive
                                    ]}>
                                        {assign.wedding?.partnersName || `Wedding #${assign.weddingId}`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
                {/* Budget Summary Card */}
                <View style={styles.summaryCard}>
                    <LinearGradient
                        colors={[Colors.light.gold, '#b8962e']}
                        style={styles.summaryGradient}
                    >
                        <View style={styles.summaryRow}>
                            <View>
                                <Text style={styles.summaryLabel}>Outstanding Cost</Text>
                                <Text style={styles.summaryValue}>ETB {totalCost.toLocaleString()}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View>
                                <Text style={styles.summaryLabel}>Total Paid</Text>
                                <Text style={styles.summaryValue}>ETB {totalPaid.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={styles.summaryFooter}>
                            <View>
                                <Text style={styles.summaryFooterLabel}>Outstanding Price:</Text>
                                <Text style={styles.summaryFooterValue}>ETB {remainingBalance.toLocaleString()}</Text>
                            </View>
                            {(userRole === 'COUPLE' || userRole === 'USER' || !userRole) && remainingBalance > 0 && (
                                <TouchableOpacity
                                    style={styles.payBalanceBtn}
                                    onPress={() => handlePayBalance(remainingBalance)}
                                    disabled={processingId !== null}
                                >
                                    <Text style={styles.payBalanceBtnText}>
                                        {processingId === -1 ? "..." : "Pay Now"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </LinearGradient>
                </View>

                {userRole === 'MANAGER' && user?.id && (
                    <View style={{ marginBottom: 24 }}>
                        <ManagerTaskAssignment managerId={user.id} />

                        {wedding && wedding.status !== 'COMPLETED' && (
                            <TouchableOpacity
                                style={styles.completeWeddingBtn}
                                onPress={() => {
                                    Alert.alert(
                                        "Confirm Completion",
                                        "Are you sure you want to mark this wedding as completed? This will allow the couple to provide feedback.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "Complete",
                                                onPress: async () => {
                                                    try {
                                                        await updateWeddingStatus(wedding.id, 'COMPLETED');
                                                        Alert.alert("Success", "Wedding marked as completed!");
                                                        loadData();
                                                    } catch (e) {
                                                        Alert.alert("Error", "Failed to update status");
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <LinearGradient
                                    colors={['#10b981', '#059669']}
                                    style={styles.completeWeddingGradient}
                                >
                                    <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                                    <Text style={styles.completeWeddingText}>Mark Wedding as Completed</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Wedding Team Section */}
                {(manager || protocol || (userRole === 'MANAGER' && couple)) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Wedding Team</Text>
                        <View style={styles.teamGrid}>
                            {manager && userRole !== 'MANAGER' && (
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
                                    <View style={{ height: 10 }} />
                                    <View style={styles.teamActions}>
                                        {!showManagerInput ? (
                                            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                                                <TouchableOpacity style={[styles.actionButton, { flex: 1 }]} onPress={() => setShowManagerInput(true)}>
                                                    <IconSymbol name="message.fill" size={18} color="#fff" />
                                                    <Text style={styles.actionText}>Inbox</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.actionButton, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.light.gold }]} onPress={() => router.push('/meeting-request')}>
                                                    <IconSymbol name="calendar.badge.plus" size={18} color={Colors.light.gold} />
                                                    <Text style={[styles.actionText, { color: Colors.light.gold }]}>Meeting</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.inlineBox}>
                                                <TextInput
                                                    style={styles.inlineInput}
                                                    placeholder="Type a message..."
                                                    value={managerMessage}
                                                    onChangeText={setManagerMessage}
                                                    multiline
                                                />
                                                <View style={styles.inlineActions}>
                                                    <TouchableOpacity
                                                        style={[styles.smallBtn, styles.primaryBtn]}
                                                        onPress={async () => {
                                                            if (!managerMessage.trim()) return;
                                                            setIsSending(true);
                                                            try {
                                                                await sendMessage(user?.id, manager.clerkId, managerMessage);
                                                                setManagerMessage("");
                                                                setShowManagerInput(false);
                                                                router.push('/(tabs)/messages');
                                                            } catch (e) { Alert.alert("Error", "Failed to send"); }
                                                            finally { setIsSending(false); }
                                                        }}
                                                        disabled={isSending}
                                                    >
                                                        <Text style={styles.smallBtnText}>{isSending ? "..." : "Send"}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.smallBtn, styles.cancelBtn]}
                                                        onPress={() => setShowManagerInput(false)}
                                                    >
                                                        <Text style={styles.smallBtnText}>Cancel</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}

                            {userRole === 'MANAGER' && couple && (
                                <View style={styles.teamCard}>
                                    <View style={styles.teamHeader}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#f0f9ff' }]}>
                                            <IconSymbol name="person.2.fill" size={24} color="#0284c7" />
                                        </View>
                                        <View>
                                            <Text style={[styles.teamRole, { color: '#0369a1' }]}>Couple</Text>
                                            <Text style={styles.teamName}>{couple.firstName || wedding?.partnersName} {couple.lastName || ""}</Text>
                                        </View>
                                    </View>
                                    <View style={{ height: 10 }} />
                                    <View style={styles.teamActions}>
                                        {!showCoupleInput ? (
                                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#0284c7' }]} onPress={() => setShowCoupleInput(true)}>
                                                <IconSymbol name="message.fill" size={18} color="#fff" />
                                                <Text style={styles.actionText}>Inbox Couple</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.inlineBox}>
                                                <TextInput
                                                    style={styles.inlineInput}
                                                    placeholder="Message the couple..."
                                                    value={coupleMessage}
                                                    onChangeText={setCoupleMessage}
                                                    multiline
                                                />
                                                <View style={styles.inlineActions}>
                                                    <TouchableOpacity
                                                        style={[styles.smallBtn, { backgroundColor: '#0284c7' }]}
                                                        onPress={async () => {
                                                            if (!coupleMessage.trim()) return;
                                                            setIsSending(true);
                                                            try {
                                                                await sendMessage(user?.id, couple.clerkId || wedding.coupleClerkId, coupleMessage);
                                                                setCoupleMessage("");
                                                                setShowCoupleInput(false);
                                                                router.push('/(tabs)/messages');
                                                            } catch (e) { Alert.alert("Error", "Failed to send"); }
                                                            finally { setIsSending(false); }
                                                        }}
                                                        disabled={isSending}
                                                    >
                                                        <Text style={styles.smallBtnText}>{isSending ? "..." : "Send"}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.smallBtn, styles.cancelBtn]}
                                                        onPress={() => setShowCoupleInput(false)}
                                                    >
                                                        <Text style={styles.smallBtnText}>Cancel</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
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
                                    <View style={{ height: 10 }} />
                                    <View style={styles.teamActions}>
                                        {!showProtocolInput ? (
                                            <TouchableOpacity style={styles.actionButton} onPress={() => setShowProtocolInput(true)}>
                                                <IconSymbol name="message.fill" size={18} color="#fff" />
                                                <Text style={styles.actionText}>Inbox</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.inlineBox}>
                                                <TextInput
                                                    style={styles.inlineInput}
                                                    placeholder="Type a message..."
                                                    value={protocolMessage}
                                                    onChangeText={setProtocolMessage}
                                                    multiline
                                                />
                                                <View style={styles.inlineActions}>
                                                    <TouchableOpacity
                                                        style={[styles.smallBtn, styles.primaryBtn]}
                                                        onPress={async () => {
                                                            if (!protocolMessage.trim()) return;
                                                            setIsSending(true);
                                                            try {
                                                                await sendMessage(user?.id, protocol.clerkId, protocolMessage);
                                                                setProtocolMessage("");
                                                                setShowProtocolInput(false);
                                                                router.push('/(tabs)/messages');
                                                            } catch (e) { Alert.alert("Error", "Failed to send"); }
                                                            finally { setIsSending(false); }
                                                        }}
                                                        disabled={isSending}
                                                    >
                                                        <Text style={styles.smallBtnText}>{isSending ? "..." : "Send"}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.smallBtn, styles.cancelBtn]}
                                                        onPress={() => setShowProtocolInput(false)}
                                                    >
                                                        <Text style={styles.smallBtnText}>Cancel</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Tasks List Section */}
                {tasks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Wedding Tasks</Text>
                        {tasks.map((task) => (
                            <View key={task.id} style={styles.taskCard}>
                                <View style={styles.taskMain}>
                                    <TouchableOpacity
                                        style={[styles.checkbox, task.status === 'COMPLETED' && styles.checkboxChecked]}
                                        onPress={async () => {
                                            if (task.status === 'COMPLETED') return;
                                            try {
                                                await completeTask(task.id);
                                                loadData();
                                            } catch (e) { Alert.alert("Error", "Failed to complete task"); }
                                        }}
                                    >
                                        {task.status === 'COMPLETED' && <IconSymbol name="checkmark" size={12} color="#fff" />}
                                    </TouchableOpacity>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.taskTitle, task.status === 'COMPLETED' && styles.taskTitleDone]}>{task.title}</Text>
                                        <Text style={styles.taskDesc}>{task.description}</Text>
                                        <View style={styles.taskLabels}>
                                            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(task.assignedRole) }]}>
                                                <Text style={styles.roleBadgeText}>{task.assignedRole}</Text>
                                            </View>
                                            {task.dueDate && (
                                                <Text style={styles.taskDate}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

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
                                        {processingId === payment.id ? "Processing..." : `Pay the remaining ETB ${payment.amount.toLocaleString()}`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {payment.status === 'PAID' && (
                                <View style={styles.successBadge}>
                                    <IconSymbol name="checkmark.circle.fill" size={16} color={Colors.light.success} />
                                    <Text style={styles.successText}>Settled</Text>
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

// Wrapper to handle role checking locally for now

const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
        case 'MANAGER': return '#dbeafe';
        case 'COUPLE': return '#fef3c7';
        case 'PROTOCOL': return '#d1fae5';
        default: return '#f3f4f6';
    }
};

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
    paidDetail: {
        fontSize: 14,
        color: Colors.light.success,
        fontFamily: Fonts.Cormorant.Bold,
        marginBottom: 8,
    },
    payBalanceBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        elevation: 2,
    },
    payBalanceBtnText: {
        color: Colors.light.gold,
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 14,
    },
    inlineBox: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inlineInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: Colors.light.text,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.light.gold,
    },
    inlineActions: {
        flexDirection: 'row',
        gap: 8,
    },
    smallBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    primaryBtn: {
        backgroundColor: Colors.light.gold,
    },
    cancelBtn: {
        backgroundColor: '#ef4444',
    },
    smallBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    selectorContainer: {
        marginBottom: 20,
    },
    selectorLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 8,
        fontFamily: Fonts.Cormorant.Bold,
    },
    selectorScroll: {
        flexDirection: 'row',
    },
    selectorChip: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectorChipActive: {
        backgroundColor: Colors.light.gold,
        borderColor: Colors.light.gold,
    },
    selectorChipText: {
        fontSize: 14,
        color: Colors.light.text,
        fontFamily: Fonts.Cormorant.Regular,
    },
    selectorChipTextActive: {
        color: '#fff',
        fontFamily: Fonts.Playfair.Bold,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    taskMain: {
        flexDirection: 'row',
        gap: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Colors.light.gold,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: Colors.light.gold,
    },
    taskTitle: {
        fontSize: 16,
        fontFamily: Fonts.Playfair.Bold,
        color: Colors.light.text,
        marginBottom: 4,
    },
    taskTitleDone: {
        textDecorationLine: 'line-through',
        color: Colors.light.textSecondary,
    },
    taskDesc: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Regular,
        marginBottom: 8,
    },
    taskLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    taskDate: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Regular,
    },
    completeWeddingBtn: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    completeWeddingGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    completeWeddingText: {
        color: '#fff',
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
    },
});
