import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
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

import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@clerk/clerk-expo';
import {
    getUserFromDatabase,
    getTasksByProtocol,
    acceptTask,
    rejectTask,
    completeTask
} from '@/utils/api';

const { width } = Dimensions.get('window');

const StatusBadge = ({ status }: { status: string }) => {
    const config: any = {
        PENDING_ACCEPTANCE: { color: '#f59e0b', bg: '#fef3c7', label: 'PENDING' },
        ACCEPTED: { color: '#3b82f6', bg: '#dbeafe', label: 'ACCEPTED' },
        IN_PROGRESS: { color: '#8b5cf6', bg: '#ede9fe', label: 'ACTIVE' },
        COMPLETED: { color: '#10b981', bg: '#d1fae5', label: 'SECURED' },
        REJECTED: { color: '#ef4444', bg: '#fee2e2', label: 'DECLINED' }
    };
    const s = config[status] || config.PENDING_ACCEPTANCE;
    return (
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
    );
};

export default function ProtocolTasksScreen() {
    const router = useRouter();
    const { userId: clerkId } = useAuth();
    const [dbUser, setDbUser] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Action states
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        if (!clerkId) return;
        try {
            setLoading(true);
            const user = await getUserFromDatabase(clerkId);
            setDbUser(user);
            if (user?.id) {
                const tasksData = await getTasksByProtocol(user.id);
                setTasks(tasksData);
            }
        } catch (error) {
            console.error('Failed to load tasks', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [clerkId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAccept = async (taskId: number) => {
        try {
            await acceptTask(taskId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to accept task.");
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert("Required", "Please provide a reason for declining.");
            return;
        }
        setIsSubmitting(true);
        try {
            await rejectTask(selectedTask.id, rejectionReason);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setModalVisible(false);
            setRejectionReason("");
            setSelectedTask(null);
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to reject task.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async (taskId: number) => {
        try {
            await completeTask(taskId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to complete task.");
        }
    };

    const renderTaskCard = ({ item }: { item: any }) => (
        <View style={styles.taskCard}>
            <View style={styles.cardHeader}>
                <StatusBadge status={item.status} />
            </View>

            <Text style={styles.taskTitle}>{item.title}</Text>

            {item.wedding && (
                <View style={styles.weddingInfo}>
                    <Ionicons name="heart-outline" size={14} color={Colors.light.gold} />
                    <Text style={styles.weddingName}>
                        Wedding: {item.wedding.partnersName || 'Mission Client'}
                    </Text>
                </View>
            )}

            <Text style={styles.taskDescription}>{item.description}</Text>

            <View style={styles.cardFooter}>
                <View style={styles.dueContainer}>
                    <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
                    <Text style={styles.dueText}>
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'ASAP'}
                    </Text>
                </View>

                {item.status === 'PENDING_ACCEPTANCE' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.miniBtn, styles.acceptBtn]}
                            onPress={() => handleAccept(item.id)}
                        >
                            <Text style={styles.miniBtnText}>ACCEPT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.miniBtn, styles.rejectBtnMini]}
                            onPress={() => { setSelectedTask(item); setModalVisible(true); }}
                        >
                            <Text style={[styles.miniBtnText, { color: '#ef4444' }]}>DECLINE</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {(item.status === 'ACCEPTED' || item.status === 'IN_PROGRESS') && (
                    <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => handleComplete(item.id)}
                    >
                        <Text style={styles.completeBtnText}>MARK COMPLETE</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                )}

                {item.status === 'REJECTED' && item.rejectionReason && (
                    <View style={styles.reasonBox}>
                        <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
                        <Text style={styles.reasonText}>{item.rejectionReason}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const pending = tasks.filter(t => t.status === 'PENDING_ACCEPTANCE');
    const active = tasks.filter(t => t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS');
    const history = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'REJECTED');

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#fff', '#fdf6f0']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mission Intel</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={Colors.light.gold} />}
            >
                {/* Intel Stats */}
                <View style={styles.statGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{pending.length}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                        <View style={[styles.statStatus, { backgroundColor: '#f59e0b' }]} />
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{active.length}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                        <View style={[styles.statStatus, { backgroundColor: '#3b82f6' }]} />
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{history.length}</Text>
                        <Text style={styles.statLabel}>Secured</Text>
                        <View style={[styles.statStatus, { backgroundColor: '#10b981' }]} />
                    </View>
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={Colors.light.gold} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {pending.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Deployment Requests</Text>
                                {pending.map(task => <View key={task.id}>{renderTaskCard({ item: task })}</View>)}
                            </View>
                        )}

                        {active.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Active Operations</Text>
                                {active.map(task => <View key={task.id}>{renderTaskCard({ item: task })}</View>)}
                            </View>
                        )}

                        {history.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Objective History</Text>
                                {history.map(task => <View key={task.id}>{renderTaskCard({ item: task })}</View>)}
                            </View>
                        )}

                        {tasks.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="clipboard-outline" size={60} color="#e5e7eb" />
                                <Text style={styles.emptyTitle}>All Clear</Text>
                                <Text style={styles.emptySubtitle}>No mission objectives assigned at this time.</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Reject Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Decline Objective</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalRef}>Mission: {selectedTask?.title}</Text>
                        <Text style={styles.modalLabel}>Operational Justification Required</Text>

                        <TextInput
                            style={styles.rejectionInput}
                            placeholder="State reason for declining..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={4}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                        />

                        <TouchableOpacity
                            style={[styles.confirmRejectBtn, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleReject}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.confirmRejectText}>CONFIRM DECLINE</Text>
                            )}
                        </TouchableOpacity>
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
        height: Platform.OS === 'ios' ? 110 : 80,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    statGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    statStatus: {
        position: 'absolute',
        top: 0,
        left: '50%',
        marginLeft: -10,
        width: 20,
        height: 3,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.gold,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    taskTitle: {
        fontSize: 18,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
        marginBottom: 8,
    },
    taskDescription: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        lineHeight: 20,
        marginBottom: 20,
    },
    weddingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fefaf6',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#fdf0e0',
    },
    weddingName: {
        fontSize: 13,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.gold,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f9fafb',
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dueText: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    miniBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: Colors.light.tint,
    },
    rejectBtnMini: {
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fef2f2',
    },
    miniBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    completeBtn: {
        backgroundColor: '#10b981',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    completeBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    reasonBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        padding: 10,
        borderRadius: 8,
        flex: 1,
    },
    reasonText: {
        fontSize: 12,
        color: '#ef4444',
        fontStyle: 'italic',
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
    },
    modalRef: {
        fontSize: 14,
        color: Colors.light.gold,
        fontFamily: Fonts.Cormorant.Bold,
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    rejectionInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#f3f4f6',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        height: 120,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    confirmRejectBtn: {
        backgroundColor: '#ef4444',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmRejectText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
