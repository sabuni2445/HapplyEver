import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    ScrollView,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useUser } from '@clerk/clerk-expo';
import { getProtocolAssignments, getWeddingById } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
    const { user: clerkUser, isLoaded } = useUser();
    const [completedWeddings, setCompletedWeddings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWedding, setSelectedWedding] = useState<any>(null);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [clerkId, setClerkId] = useState<string | null>(null);

    useEffect(() => {
        loadSession();
    }, [clerkUser, isLoaded]);

    const loadSession = async () => {
        if (isLoaded && clerkUser) {
            setClerkId(clerkUser.id);
        } else {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setClerkId(parsed.clerkId || parsed.id);
            }
        }
    };

    useEffect(() => {
        if (clerkId) {
            loadCompletedWeddings();
        } else if (isLoaded && !clerkUser) {
            // If clerk is loaded but no user, and we already checked storage (via loadSession)
            // we might still be loading clerkId from storage.
            // Let's just monitor clerkId.
        }
    }, [clerkId]);

    const loadCompletedWeddings = async () => {
        if (!clerkId) return;
        try {
            setLoading(true);
            const assignments = await getProtocolAssignments(clerkId || '');
            const completed = assignments.filter((a: any) => a.status === 'COMPLETED');

            // Full wedding details might be needed for dates/names if not in assignment
            const detailedWeddings = await Promise.all(
                completed.map(async (a: any) => {
                    if (!a.wedding) {
                        const w = await getWeddingById(a.weddingId);
                        return { ...a, wedding: w };
                    }
                    return a;
                })
            );

            setCompletedWeddings(detailedWeddings);
        } catch (error) {
            console.error('Error loading completed weddings:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderWeddingItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.weddingTitle}>{item.wedding?.partnersName || 'Wedding Event'}</Text>
                    <Text style={styles.weddingDate}>
                        {new Date(item.wedding?.weddingDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                </View>
                <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>COMPLETED</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => {
                    setSelectedWedding(item);
                    setFeedbackModalVisible(true);
                }}
            >
                <Text style={styles.feedbackButtonText}>See Your Feedback / Rating</Text>
                <Ionicons name="star-outline" size={18} color={Colors.light.gold} />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.light.gold} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.light.gold + '10', '#fff']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Event History</Text>
                <Text style={styles.headerSubtitle}>Your completed wedding missions</Text>
            </LinearGradient>

            <FlatList
                data={completedWeddings}
                renderItem={renderWeddingItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="archive-outline" size={64} color="#e2e8f0" />
                        <Text style={styles.emptyText}>No completed weddings found</Text>
                        <Text style={styles.emptySubtext}>Finish a mission to see it here!</Text>
                    </View>
                }
            />

            {/* Feedback Modal */}
            <Modal visible={feedbackModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Mission Feedback</Text>
                        <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.ratingSection}>
                            <Text style={styles.sectionTitle}>Overall Performance</Text>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreText}>4.8</Text>
                                <Text style={styles.scoreMax}>/ 5</Text>
                            </View>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Ionicons key={s} name={s <= 4 ? "star" : "star-half"} size={24} color={Colors.light.gold} />
                                ))}
                            </View>
                        </View>

                        <View style={styles.feedbackCard}>
                            <View style={styles.feedbackHeader}>
                                <Ionicons name="people-outline" size={20} color={Colors.light.gold} />
                                <Text style={styles.feedbackAuthor}>Guest Feedback</Text>
                            </View>
                            <Text style={styles.ratingValue}>4.9/5 Average</Text>
                            <Text style={styles.comment}>"Very helpful at the check-in desk. Organized the seating perfectly."</Text>
                        </View>

                        <View style={styles.feedbackCard}>
                            <View style={styles.feedbackHeader}>
                                <Ionicons name="briefcase-outline" size={20} color={Colors.light.gold} />
                                <Text style={styles.feedbackAuthor}>Manager Feedback</Text>
                            </View>
                            <Text style={styles.ratingValue}>4.7/5 Score</Text>
                            <Text style={styles.comment}>"Excellent communication throughout the event. Handled the VIP arrivals with great professionalism."</Text>
                        </View>

                        <View style={styles.statsSummary}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Total Rating</Text>
                                <Text style={styles.statValue}>4.8</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Response Time</Text>
                                <Text style={styles.statValue}>98%</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Tasks Done</Text>
                                <Text style={styles.statValue}>12/12</Text>
                            </View>
                        </View>
                    </ScrollView>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 25,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    weddingTitle: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: Colors.light.text,
    },
    weddingDate: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    completedBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    completedText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#16a34a',
    },
    feedbackButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.light.gold + '40',
        gap: 8,
    },
    feedbackButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.gold,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#cbd5e1',
        marginTop: 8,
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
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'PlayfairDisplay_700Bold',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 30,
        padding: 20,
        backgroundColor: Colors.light.gold + '05',
        borderRadius: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 15,
    },
    scoreCircle: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 10,
    },
    scoreText: {
        fontSize: 48,
        fontWeight: '800',
        color: Colors.light.text,
    },
    scoreMax: {
        fontSize: 20,
        color: '#94a3b8',
        fontWeight: '600',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 4,
    },
    feedbackCard: {
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    feedbackAuthor: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.light.text,
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.gold,
        marginBottom: 8,
    },
    comment: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    statsSummary: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 20,
        padding: 20,
        marginTop: 10,
        marginBottom: 40,
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.light.text,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#f1f5f9',
    },
});
