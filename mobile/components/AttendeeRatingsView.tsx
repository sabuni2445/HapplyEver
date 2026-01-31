import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { getRatingsByWedding, getRatingsByRated } from '../utils/api';
import { IconSymbol } from './ui/icon-symbol';
import { Fonts } from '../constants/theme';

/**
 * AttendeeRatingsView Component
 * 
 * Displays attendee ratings for a wedding with filtering by type
 * Can be used in Protocol Dashboard and Admin Dashboard
 * 
 * Props:
 * - weddingId: ID of the wedding to fetch ratings for
 * - filterType: 'ALL' | 'PROTOCOL' | 'WEDDING' | 'COUPLE'
 * - filterId: ID of the specific entity to filter by (optional)
 */
export default function AttendeeRatingsView({ weddingId, filterType = 'ALL', filterId = null }) {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        loadRatings();
    }, [weddingId, filterType, filterId]);

    const loadRatings = async () => {
        setLoading(true);
        try {
            let fetchedRatings = [];

            if (filterType === 'ALL') {
                fetchedRatings = await getRatingsByWedding(weddingId);
            } else if (filterId) {
                fetchedRatings = await getRatingsByRated(filterType, filterId);
            }

            setRatings(fetchedRatings);

            // Calculate average rating
            if (fetchedRatings.length > 0) {
                const sum = fetchedRatings.reduce((acc, r) => acc + r.rating, 0);
                setAverageRating((sum / fetchedRatings.length).toFixed(1));
            } else {
                setAverageRating(0);
            }
        } catch (error) {
            console.error("Error loading ratings:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                    <IconSymbol
                        key={star}
                        name={star <= rating ? "star.fill" : "star"}
                        size={16}
                        color={star <= rating ? "#d4a574" : "rgba(139,111,71,0.3)"}
                    />
                ))}
            </View>
        );
    };

    const getRatingTypeLabel = (type) => {
        switch (type) {
            case 'PROTOCOL': return '👮 Protocol';
            case 'WEDDING': return '💒 Wedding';
            case 'COUPLE': return '💑 Couple';
            default: return type;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d4a574" />
                <Text style={styles.loadingText}>Loading ratings...</Text>
            </View>
        );
    }

    if (ratings.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <IconSymbol name="star" size={64} color="rgba(139,111,71,0.3)" />
                <Text style={styles.emptyTitle}>No Ratings Yet</Text>
                <Text style={styles.emptyText}>
                    {filterType === 'ALL'
                        ? 'Guests haven\'t submitted any ratings for this wedding yet.'
                        : `No ratings for this ${filterType.toLowerCase()} yet.`}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Average Rating Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>
                        {filterType === 'ALL' ? 'All Ratings' : getRatingTypeLabel(filterType)}
                    </Text>
                    <Text style={styles.ratingCount}>{ratings.length} rating{ratings.length !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.averageContainer}>
                    <Text style={styles.averageNumber}>{averageRating}</Text>
                    {renderStars(Math.round(parseFloat(averageRating)))}
                </View>
            </View>

            {/* Ratings List */}
            <ScrollView style={styles.ratingsList} showsVerticalScrollIndicator={false}>
                {ratings.map((rating, index) => (
                    <View key={rating.id || index} style={styles.ratingCard}>
                        <View style={styles.ratingHeader}>
                            <View style={styles.ratingHeaderLeft}>
                                <Text style={styles.guestName}>
                                    {rating.guest?.firstName || 'Guest'} {rating.guest?.lastName || ''}
                                </Text>
                                <Text style={styles.ratingType}>{getRatingTypeLabel(rating.ratedType)}</Text>
                            </View>
                            {renderStars(rating.rating)}
                        </View>

                        {rating.comment && (
                            <Text style={styles.comment}>{rating.comment}</Text>
                        )}

                        <Text style={styles.timestamp}>
                            {new Date(rating.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: '#8b6f47',
        marginTop: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: '#8b6f47',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: 'rgba(139,111,71,0.7)',
        textAlign: 'center',
        lineHeight: 22,
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.3)',
        shadowColor: '#d4a574',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: '#8b6f47',
    },
    ratingCount: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: 'rgba(139,111,71,0.7)',
    },
    averageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    averageNumber: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 36,
        color: '#d4a574',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    ratingsList: {
        flex: 1,
    },
    ratingCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.2)',
    },
    ratingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    ratingHeaderLeft: {
        flex: 1,
    },
    guestName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 16,
        color: '#8b6f47',
        marginBottom: 4,
    },
    ratingType: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 13,
        color: 'rgba(139,111,71,0.7)',
    },
    comment: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 15,
        color: 'rgba(139,111,71,0.9)',
        lineHeight: 22,
        marginBottom: 8,
    },
    timestamp: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 12,
        color: 'rgba(139,111,71,0.5)',
    },
});
