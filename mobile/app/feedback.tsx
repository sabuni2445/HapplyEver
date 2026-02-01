import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { submitCoupleFeedback, getWeddingById, getAssignmentByWedding, getCoupleBookings } from '@/utils/api';

type RatingCategory = 'WEDDING' | 'APP' | 'MANAGER' | 'PROTOCOL' | 'SERVICE';

interface FeedbackSection {
    category: RatingCategory;
    title: string;
    description: string;
    targetId?: string;
    targetName?: string;
}

export default function FeedbackScreen() {
    const { user } = useUser();
    const router = useRouter();
    const { weddingId } = useLocalSearchParams();

    const [sections, setSections] = useState<FeedbackSection[]>([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [ratings, setRatings] = useState<Record<string, { rating: number; comment: string }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadContext = async () => {
            if (!weddingId) return;
            try {
                const [wedding, assignment, bookings] = await Promise.all([
                    getWeddingById(Number(weddingId)),
                    getAssignmentByWedding(Number(weddingId)),
                    getCoupleBookings(user?.id)
                ]);

                const newSections: FeedbackSection[] = [
                    { category: 'WEDDING', title: 'The Wedding', description: 'How was your special day?' },
                    { category: 'APP', title: 'The App', description: 'Did the app help you plan smoothly?' }
                ];

                if (assignment?.managerClerkId) {
                    newSections.push({
                        category: 'MANAGER',
                        title: 'The Manager',
                        description: 'How was the coordination and management?',
                        targetId: assignment.managerClerkId,
                        targetName: "Your Wedding Manager"
                    });
                }

                if (assignment?.protocolClerkId) {
                    newSections.push({
                        category: 'PROTOCOL',
                        title: 'The Protocol',
                        description: 'How was the on-site assistance?',
                        targetId: assignment.protocolClerkId,
                        targetName: "Your Protocol Officer"
                    });
                }

                if (bookings && bookings.length > 0) {
                    bookings.forEach((b: any) => {
                        if (b.status === 'ACCEPTED' || b.status === 'COMPLETED') {
                            newSections.push({
                                category: 'SERVICE',
                                title: b.serviceName || 'Service',
                                description: 'How was the quality of this service?',
                                targetId: b.serviceId.toString(),
                                targetName: b.serviceName
                            });
                        }
                    });
                }

                setSections(newSections);
            } catch (error) {
                console.error("Error loading feedback context:", error);
            }
        };
        loadContext();
    }, [weddingId]);

    const handleRating = (value: number) => {
        const section = sections[currentSectionIndex];
        const key = `${section.category}_${section.targetId || 'general'}`;
        setRatings({
            ...ratings,
            [key]: { ...ratings[key], rating: value }
        });
    };

    const handleComment = (text: string) => {
        const section = sections[currentSectionIndex];
        const key = `${section.category}_${section.targetId || 'general'}`;
        setRatings({
            ...ratings,
            [key]: { ...ratings[key], comment: text }
        });
    };

    const handleNext = () => {
        if (currentSectionIndex < sections.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1);
        } else {
            submitAll();
        }
    };

    const submitAll = async () => {
        if (!user || !weddingId) return;

        setIsSubmitting(true);
        try {
            const feedbackArray = Object.entries(ratings).map(([key, value]) => {
                const [category, targetId] = key.split('_');
                return {
                    weddingId: Number(weddingId),
                    coupleClerkId: user.id,
                    category,
                    targetId: targetId === 'general' ? null : targetId,
                    rating: value.rating,
                    comment: value.comment
                };
            });

            await submitCoupleFeedback({ feedbacks: feedbackArray });

            Alert.alert(
                "Congratulations!",
                "Your feedback has been submitted. Thank you for using ElegantEvents!",
                [{ text: "Back Home", onPress: () => router.replace('/(tabs)') }]
            );
        } catch (error) {
            Alert.alert("Error", "Failed to submit feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (sections.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.light.gold} />
            </View>
        );
    }

    const currentSection = sections[currentSectionIndex];
    const currentKey = `${currentSection.category}_${currentSection.targetId || 'general'}`;
    const currentData = ratings[currentKey] || { rating: 0, comment: '' };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Happy Ever After!</Text>
                <Text style={styles.subtitle}>Congratulations on your beautiful wedding</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${((currentSectionIndex + 1) / sections.length) * 100}%` }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formCard}>
                    <Text style={styles.categoryTitle}>{currentSection.title}</Text>
                    <Text style={styles.categoryDesc}>{currentSection.description}</Text>

                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => handleRating(star)}
                                style={styles.starWrapper}
                            >
                                <IconSymbol
                                    name={star <= currentData.rating ? "star.fill" : "star"}
                                    size={44}
                                    color={star <= currentData.rating ? Colors.light.gold : '#e5e7eb'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Tell us more (optional)..."
                        value={currentData.comment}
                        onChangeText={handleComment}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.nextButton, currentData.rating === 0 && styles.disabledButton]}
                        onPress={handleNext}
                        disabled={currentData.rating === 0 || isSubmitting}
                    >
                        <LinearGradient
                            colors={[Colors.light.gold, '#b8962e']}
                            style={styles.gradient}
                        >
                            <Text style={styles.nextButtonText}>
                                {currentSectionIndex === sections.length - 1 ? (isSubmitting ? "Submitting..." : "Finish & Submit") : "Next Section"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {currentSectionIndex > 0 && (
                        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentSectionIndex(currentSectionIndex - 1)}>
                            <Text style={styles.backButtonText}>Previous</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
    },
    header: {
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 28,
        color: Colors.light.gold,
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    progressContainer: {
        height: 4,
        width: '100%',
        backgroundColor: '#f3f4f6',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.light.gold,
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    categoryTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    categoryDesc: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 32,
    },
    starWrapper: {
        padding: 4,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#f3f4f6',
        borderRadius: 16,
        padding: 16,
        height: 120,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        marginBottom: 32,
        color: Colors.light.text,
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradient: {
        padding: 18,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
    },
    disabledButton: {
        opacity: 0.5,
    },
    backButton: {
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
    },
    backButtonText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
