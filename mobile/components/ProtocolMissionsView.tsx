import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Dimensions,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { getProtocolAssignments, getTasksByProtocol, acceptTask, rejectTask, completeTask, getGuestsByWeddingId } from '@/utils/api';

const { width } = Dimensions.get('window');

interface ProtocolMissionsViewProps {
    userId: number; // Database ID
    clerkId: string; // Clerk ID
}

export default function ProtocolMissionsView({ userId, clerkId }: ProtocolMissionsViewProps) {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingGuests, setLoadingGuests] = useState(false);
    const [selectedWeddingId, setSelectedWeddingId] = useState<number | null>(null);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [userId, clerkId]);

    useEffect(() => {
        if (selectedWeddingId) {
            loadGuests();
        }
    }, [selectedWeddingId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assignmentsData, tasksData] = await Promise.all([
                getProtocolAssignments(clerkId), // Backend expects clerkId for assignments
                getTasksByProtocol(userId)        // Backend expects database ID for tasks
            ]);
            setAssignments(assignmentsData);
            setTasks(tasksData);
            if (assignmentsData.length > 0) {
                setSelectedWeddingId(assignmentsData[0].weddingId);
            }
        } catch (error) {
            console.error('Error loading missions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGuests = async () => {
        if (selectedWeddingId) {
            try {
                setLoadingGuests(true);
                const guestsData = await getGuestsByWeddingId(selectedWeddingId);
                setGuests(guestsData);
            } catch (error) {
                console.error('Error loading guests:', error);
            } finally {
                setLoadingGuests(false);
            }
        }
    };

    const handleAccept = async (taskId: number) => {
        try {
            await acceptTask(taskId);
            Alert.alert('Success', 'Mission accepted!');
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to accept mission.');
        }
    };

    const handleComplete = async (taskId: number) => {
        try {
            await completeTask(taskId);
            Alert.alert('Success', 'Mission completed!');
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to complete mission.');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for rejection.');
            return;
        }
        try {
            await rejectTask(selectedTask.id, rejectionReason);
            setRejectModalVisible(false);
            setRejectionReason('');
            Alert.alert('Success', 'Mission rejected.');
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to reject mission.');
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesWedding = t.wedding?.id === selectedWeddingId;
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = showCompleted ? t.status === 'COMPLETED' : t.status !== 'COMPLETED';
        return matchesWedding && matchesSearch && matchesStatus;
    });

    const activeTasksCount = tasks.filter(t => t.wedding?.id === selectedWeddingId && t.status !== 'COMPLETED').length;
    const completedTasksCount = tasks.filter(t => t.wedding?.id === selectedWeddingId && t.status === 'COMPLETED').length;

    const renderTaskItem = ({ item }: { item: any }) => (
        <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.replace(/_/g, ' ')}
                    </Text>
                </View>
                <Text style={styles.categoryText}>{new Date(item.dueDate).toLocaleDateString()}</Text>
            </View>

            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDescription}>{item.description}</Text>

            <View style={styles.taskFooter}>
                {item.status === 'PENDING_ACCEPTANCE' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(item.id)}>
                            <Text style={styles.actionBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => { setSelectedTask(item); setRejectModalVisible(true); }}
                        >
                            <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {(item.status === 'ACCEPTED' || item.status === 'IN_PROGRESS') && (
                    <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleComplete(item.id)}>
                        <Text style={styles.actionBtnText}>Mark Done</Text>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                )}
                {item.status === 'REJECTED' && (
                    <View style={styles.rejectedContainer}>
                        <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                        <Text style={styles.rejectedReason}>Reason: {item.rejectionReason}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING_ACCEPTANCE': return { backgroundColor: '#fef3c7' };
            case 'ACCEPTED': return { backgroundColor: '#dcfce7' };
            case 'COMPLETED': return { backgroundColor: '#d1fae5' };
            case 'REJECTED': return { backgroundColor: '#fee2e2' };
            default: return { backgroundColor: '#f3f4f6' };
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING_ACCEPTANCE': return '#d97706';
            case 'ACCEPTED': return '#16a34a';
            case 'COMPLETED': return '#059669';
            case 'REJECTED': return '#dc2626';
            default: return '#6b7280';
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color={Colors.light.gold} style={{ marginTop: 50 }} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.missionsHeader}>
                <Text style={styles.missionsTitle}>Active Missions</Text>
                <Text style={styles.missionsSubtitle}>Weddings currently assigned to you</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weddingTabs}>
                {assignments.map((assignment) => (
                    <TouchableOpacity
                        key={assignment.id}
                        style={[
                            styles.weddingTab,
                            selectedWeddingId === assignment.weddingId && styles.activeWeddingTab
                        ]}
                        onPress={() => setSelectedWeddingId(assignment.weddingId)}
                    >
                        <Text style={[
                            styles.weddingTabText,
                            selectedWeddingId === assignment.weddingId && styles.activeWeddingTabText
                        ]}>
                            {assignment.wedding?.partnersName || 'Untitled Event'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={{ padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
                    <TouchableOpacity
                        style={[styles.filterChip, !showCompleted && styles.activeFilterChip]}
                        onPress={() => setShowCompleted(false)}
                    >
                        <Text style={[styles.filterText, !showCompleted && styles.activeFilterText]}>
                            Active ({activeTasksCount})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, showCompleted && styles.activeFilterChip]}
                        onPress={() => setShowCompleted(true)}
                    >
                        <Text style={[styles.filterText, showCompleted && styles.activeFilterText]}>
                            Completed ({completedTasksCount})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {selectedWeddingId && (
                <View style={styles.statsContainer}>
                    <View style={[styles.statBox, { backgroundColor: '#eff6ff' }]}>
                        <Ionicons name="people" size={20} color="#3b82f6" />
                        <Text style={[styles.statValue, { color: '#1e40af' }]}>
                            {loadingGuests ? '...' : guests.length}
                        </Text>
                        <Text style={styles.statLabel}>Total Guests</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#f0fdf4' }]}>
                        <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                        <Text style={[styles.statValue, { color: '#166534' }]}>
                            {loadingGuests ? '...' : guests.filter(g => g.rsvpStatus === 'CONFIRMED').length}
                        </Text>
                        <Text style={styles.statLabel}>Active (RSVP)</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="qr-code" size={20} color="#d97706" />
                        <Text style={[styles.statValue, { color: '#92400e' }]}>
                            {loadingGuests ? '...' : guests.filter(g => g.checkedIn).length}
                        </Text>
                        <Text style={styles.statLabel}>Verified (In)</Text>
                    </View>
                </View>
            )}

            <FlatList
                data={filteredTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.taskList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="clipboard-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No missions found for this wedding</Text>
                    </View>
                }
            />

            <Modal visible={rejectModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Mission</Text>
                        <Text style={styles.modalSubtitle}>Please provide a reason for rejecting this mission.</Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Type your reason here..."
                            multiline
                            numberOfLines={4}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setRejectModalVisible(false)}
                            >
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmRejectBtn]}
                                onPress={handleReject}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Submit</Text>
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
        backgroundColor: '#f8fafc',
    },
    missionsHeader: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    missionsTitle: {
        fontSize: 24,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
    },
    missionsSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
    },
    weddingTabs: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        maxHeight: 60,
    },
    weddingTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#f1f5f9',
    },
    activeWeddingTab: {
        backgroundColor: Colors.light.gold,
    },
    weddingTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    activeWeddingTabText: {
        color: '#fff',
    },
    taskList: {
        padding: 20,
        paddingBottom: 40,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 6,
    },
    taskDescription: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        lineHeight: 20,
        marginBottom: 20,
    },
    taskFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    actionBtnText: {
        fontWeight: '700',
        fontSize: 14,
        color: '#fff',
    },
    acceptBtn: {
        backgroundColor: Colors.light.gold,
    },
    rejectBtn: {
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    completeBtn: {
        backgroundColor: '#10b981',
    },
    rejectedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff1f2',
        padding: 10,
        borderRadius: 8,
        gap: 8,
    },
    rejectedReason: {
        fontSize: 12,
        color: '#ef4444',
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 16,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 20,
    },
    reasonInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 15,
        textAlignVertical: 'top',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBtnText: {
        fontWeight: '700',
        fontSize: 15,
        color: '#64748b',
    },
    cancelBtn: {
        backgroundColor: '#e2e8f0',
    },
    confirmRejectBtn: {
        backgroundColor: '#ef4444',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: Colors.light.text,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    activeFilterChip: {
        backgroundColor: Colors.light.gold,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    activeFilterText: {
        color: '#fff',
    },
});
