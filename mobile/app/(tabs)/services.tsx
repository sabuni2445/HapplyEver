import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Image } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getCoupleBookings, getAllServices, createBooking, createRating, getWeddingDetails, getPaymentsByWedding } from '@/utils/api';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ServicesScreen() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'booked' | 'browse'>('booked');
    const [bookings, setBookings] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Rating Modal State
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState('');

    // Service Details Modal State
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [wedding, setWedding] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);

    // Booking Form State
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('14:00');
    const [bookingLocation, setBookingLocation] = useState('');
    const [bookingNotes, setBookingNotes] = useState('');
    const [isBooking, setIsBooking] = useState(false);

    const loadData = async () => {
        if (user) {
            try {
                const [bookingsData, servicesData, weddingData] = await Promise.all([
                    getCoupleBookings(user.id),
                    getAllServices(),
                    getWeddingDetails(user.id)
                ]);
                setBookings(bookingsData || []);
                setServices(servicesData || []);
                setWedding(weddingData);

                if (weddingData?.id) {
                    const paymentsData = await getPaymentsByWedding(weddingData.id);
                    setPayments(paymentsData || []);
                }
            } catch (error) {
                console.error("Error loading services data:", error);
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

    const handleBookService = (service: any) => {
        if (!user || !wedding) {
            Alert.alert("Error", "Please complete your wedding profile first.");
            return;
        }
        setSelectedService(service);
        setBookingModalVisible(true);
    };

    const confirmBooking = async () => {
        if (!user || !selectedService) return;

        setIsBooking(true);
        try {
            await createBooking(user.id, {
                serviceId: selectedService.id,
                eventDate: bookingDate,
                eventTime: bookingTime,
                location: bookingLocation,
                specialRequests: bookingNotes || "Booked via mobile app"
            });
            setBookingModalVisible(false);
            Alert.alert("Success", "Your booking inquiry has been gracefully delivered!");
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to book service. Please check your connection.");
        } finally {
            setIsBooking(false);
        }
    };

    const openRatingModal = (booking: any) => {
        setSelectedBooking(booking);
        setRating(5);
        setReview('');
        setRatingModalVisible(true);
    };

    const openDetailsModal = (service: any) => {
        setSelectedService(service);
        setDetailsModalVisible(true);
    };

    const submitRating = async () => {
        if (!user || !selectedBooking) return;

        try {
            await createRating({
                serviceId: selectedBooking.serviceId,
                userId: user.id,
                rating,
                review,
                bookingId: selectedBooking.id
            });
            setRatingModalVisible(false);
            Alert.alert("Success", "Thank you for your feedback!");
            loadData(); // Refresh to potentially update UI state
        } catch (error) {
            Alert.alert("Error", "Failed to submit rating");
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Services</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'booked' && styles.activeTab]}
                    onPress={() => setActiveTab('booked')}
                >
                    <IconSymbol
                        name="calendar.badge.clock"
                        size={16}
                        color={activeTab === 'booked' ? '#fff' : Colors.light.text}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'booked' && styles.activeTabText]}>My Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
                    onPress={() => setActiveTab('browse')}
                >
                    <IconSymbol
                        name="magnifyingglass"
                        size={16}
                        color={activeTab === 'browse' ? '#fff' : Colors.light.text}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>Browse All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {activeTab === 'booked' ? (
                    bookings.length > 0 ? (
                        bookings.map((booking) => (
                            <View key={booking.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.serviceName}>{booking.service?.serviceName || booking.serviceName || "Service"}</Text>
                                    <View style={[styles.badge, { backgroundColor: getStatusColor(booking.status) }]}>
                                        <Text style={styles.badgeText}>{booking.status}</Text>
                                    </View>
                                </View>
                                <Text style={styles.price}>ETB {(booking.service?.price || booking.servicePrice || 0).toLocaleString()}</Text>
                                <Text style={styles.description}>{booking.service?.description || booking.serviceDescription}</Text>

                                {booking.status === 'COMPLETED' && (
                                    <TouchableOpacity
                                        style={styles.rateButton}
                                        onPress={() => openRatingModal(booking)}
                                    >
                                        <IconSymbol name="star.fill" size={16} color="#fff" />
                                        <Text style={styles.rateButtonText}>Rate Service</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <IconSymbol name="calendar" size={48} color={Colors.light.textSecondary} />
                            <Text style={styles.emptyText}>No bookings yet.</Text>
                        </View>
                    )
                ) : (
                    services.length > 0 ? (
                        services.map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                style={[styles.card, { padding: 0, overflow: 'hidden' }]}
                                onPress={() => openDetailsModal(service)}
                            >
                                {service.imageUrl ? (
                                    <Image
                                        source={{ uri: service.imageUrl }}
                                        style={styles.browseImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.browseImage, { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }]}>
                                        <IconSymbol name="photo" size={40} color="#d1d5db" />
                                    </View>
                                )}
                                <View style={{ padding: 20 }}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.serviceName}>{service.serviceName}</Text>
                                        <IconSymbol name="chevron.right" size={20} color={Colors.light.gold} />
                                    </View>
                                    <Text style={styles.category}>{service.category}</Text>
                                    <Text style={styles.price}>ETB {service.price?.toLocaleString()}</Text>
                                    <Text style={styles.description} numberOfLines={2}>{service.description}</Text>
                                    <TouchableOpacity
                                        style={styles.bookButton}
                                        onPress={() => handleBookService(service)}
                                    >
                                        <Text style={styles.bookButtonText}>Request Booking</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <IconSymbol name="magnifyingglass" size={48} color={Colors.light.textSecondary} />
                            <Text style={styles.emptyText}>No services available.</Text>
                        </View>
                    )
                )}
            </ScrollView>

            {/* Service Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsModalVisible}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.detailsModalView}>
                        <ScrollView contentContainerStyle={styles.detailsContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Service Details</Text>
                                <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeButton}>
                                    <IconSymbol name="xmark" size={20} color={Colors.light.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {selectedService?.imageUrl && (
                                <Image
                                    source={{ uri: selectedService.imageUrl }}
                                    style={styles.serviceImage}
                                    resizeMode="cover"
                                />
                            )}

                            <Text style={styles.detailsName}>{selectedService?.serviceName}</Text>
                            <View style={styles.detailsRow}>
                                <Text style={styles.detailsCategory}>{selectedService?.category}</Text>
                                <Text style={styles.detailsPrice}>ETB {selectedService?.price?.toLocaleString()}</Text>
                            </View>

                            <Text style={styles.detailsSectionTitle}>Description</Text>
                            <Text style={styles.detailsDescription}>{selectedService?.description}</Text>

                            {selectedService?.contactInfo && (
                                <>
                                    <Text style={styles.detailsSectionTitle}>Contact Information</Text>
                                    <Text style={styles.detailsDescription}>{selectedService.contactInfo}</Text>
                                </>
                            )}

                            <TouchableOpacity
                                style={styles.detailsBookButton}
                                onPress={() => {
                                    setDetailsModalVisible(false);
                                    handleBookService(selectedService);
                                }}
                            >
                                <LinearGradient
                                    colors={[Colors.light.gold, '#b8962e']}
                                    style={styles.submitGradient}
                                >
                                    <Text style={styles.submitButtonText}>Book Now</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Premium Booking Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={bookingModalVisible}
                onRequestClose={() => setBookingModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.detailsModalView}>
                        <ScrollView contentContainerStyle={styles.detailsContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Inquiry Details</Text>
                                <TouchableOpacity onPress={() => setBookingModalVisible(false)} style={styles.closeButton}>
                                    <IconSymbol name="xmark" size={20} color={Colors.light.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.formSubtitle}>Curating your experience with {selectedService?.serviceName}</Text>

                            <View style={styles.budgetInsightBox}>
                                <Text style={styles.insightTitle}>Budget Insights</Text>
                                <View style={styles.insightGrid}>
                                    <View style={styles.insightItem}>
                                        <Text style={styles.insightLabel}>Total Budget</Text>
                                        <Text style={styles.insightValue}>ETB {wedding?.budget?.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.insightItem}>
                                        <Text style={styles.insightLabel}>Investment</Text>
                                        <Text style={[styles.insightValue, { color: Colors.light.gold }]}>ETB {selectedService?.price?.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.insightItem}>
                                        <Text style={styles.insightLabel}>Remaining</Text>
                                        <Text style={[styles.insightValue, {
                                            color: (wedding?.budget - (bookings.reduce((sum, b) => sum + (b.service?.price || 0), 0) + (selectedService?.price || 0))) < 0 ? Colors.light.error : Colors.light.success
                                        }]}>
                                            ETB {(wedding?.budget - (bookings.reduce((sum, b) => sum + (b.service?.price || 0), 0) + (selectedService?.price || 0)))?.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.inputLabel}>Preferred Date</Text>
                                <View style={styles.inputContainer}>
                                    <IconSymbol name="calendar" size={18} color={Colors.light.gold} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.formInput}
                                        value={bookingDate}
                                        onChangeText={setBookingDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.inputLabel}>Event Time</Text>
                                <View style={styles.inputContainer}>
                                    <IconSymbol name="clock" size={18} color={Colors.light.gold} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.formInput}
                                        value={bookingTime}
                                        onChangeText={setBookingTime}
                                        placeholder="e.g. 14:00"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.inputLabel}>Venue Location</Text>
                                <View style={styles.inputContainer}>
                                    <IconSymbol name="mappin.and.ellipse" size={18} color={Colors.light.gold} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.formInput}
                                        value={bookingLocation}
                                        onChangeText={setBookingLocation}
                                        placeholder="Where will the celebration take place?"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.inputLabel}>Bespoke Requirements</Text>
                                <TextInput
                                    style={[styles.formInput, { height: 100, textAlignVertical: 'top', paddingVertical: 12 }]}
                                    value={bookingNotes}
                                    onChangeText={setBookingNotes}
                                    placeholder="Share any specific visions or special accommodations you desire..."
                                    multiline
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.detailsBookButton, isBooking && { opacity: 0.7 }]}
                                onPress={confirmBooking}
                                disabled={isBooking}
                            >
                                <LinearGradient
                                    colors={[Colors.light.gold, '#b8962e']}
                                    style={styles.submitGradient}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {isBooking ? "Delivering Inquiry..." : "Confirm Booking Inquiry"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Rating Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={ratingModalVisible}
                onRequestClose={() => setRatingModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Rate Your Experience</Text>
                            <TouchableOpacity onPress={() => setRatingModalVisible(false)} style={styles.closeButton}>
                                <IconSymbol name="xmark" size={20} color={Colors.light.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>{selectedBooking?.service?.serviceName}</Text>

                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    style={styles.starWrapper}
                                >
                                    <IconSymbol
                                        name={star <= rating ? "star.fill" : "star"}
                                        size={40}
                                        color={star <= rating ? Colors.light.gold : '#e5e7eb'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.ratingLabel}>
                            {rating === 5 ? "Excellent!" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Share your experience with this vendor..."
                            value={review}
                            onChangeText={setReview}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholderTextColor="#9ca3af"
                        />

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={submitRating}
                        >
                            <LinearGradient
                                colors={[Colors.light.gold, '#b8962e']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitButtonText}>Submit Review</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACCEPTED': return Colors.light.success;
        case 'PENDING': return Colors.light.gold;
        case 'REJECTED': return Colors.light.error;
        case 'COMPLETED': return Colors.light.text;
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
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 16,
        gap: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    activeTab: {
        backgroundColor: Colors.light.gold,
        borderColor: Colors.light.gold,
    },
    tabText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
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
    browseImage: {
        width: '100%',
        height: 150,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    serviceName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.text,
        flex: 1,
        marginRight: 8,
    },
    category: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    price: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: Colors.light.gold,
        marginBottom: 8,
    },
    description: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        lineHeight: 22,
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.light.textSecondary,
        marginTop: 16,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
    },
    bookButton: {
        marginTop: 16,
        backgroundColor: Colors.light.text,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
    },
    rateButton: {
        marginTop: 16,
        backgroundColor: Colors.light.gold,
        padding: 12,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    rateButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalView: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 12,
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
    },
    modalSubtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    starWrapper: {
        padding: 4,
    },
    ratingLabel: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
        color: Colors.light.gold,
        marginBottom: 24,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#f3f4f6',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        backgroundColor: '#f9fafb',
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        height: 120,
        color: Colors.light.text,
    },
    submitButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitGradient: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
    },
    detailsModalView: {
        width: '100%',
        height: '90%',
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: 'auto',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    detailsContent: {
        padding: 24,
        paddingBottom: 40,
    },
    serviceImage: {
        width: '100%',
        height: 250,
        borderRadius: 20,
        marginBottom: 20,
    },
    detailsName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 28,
        color: Colors.light.text,
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    detailsCategory: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailsPrice: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.gold,
    },
    detailsSectionTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.text,
        marginBottom: 12,
        marginTop: 12,
    },
    detailsDescription: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 17,
        color: Colors.light.textSecondary,
        lineHeight: 26,
        marginBottom: 20,
    },
    detailsBookButton: {
        marginTop: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    // Premium Form Styles
    formSubtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        marginBottom: 24,
    },
    budgetInsightBox: {
        background: 'rgba(212, 175, 55, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
        backgroundColor: '#fdfaf2',
    },
    insightTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: Colors.light.text,
        marginBottom: 16,
    },
    insightGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    insightItem: {
        flex: 1,
    },
    insightLabel: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 12,
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    insightValue: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 16,
        color: Colors.light.text,
    },
    formSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 12,
    },
    formInput: {
        flex: 1,
        height: 50,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 17,
        color: Colors.light.text,
    },
});
