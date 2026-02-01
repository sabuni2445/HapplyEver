import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Image, Alert, Modal, ActivityIndicator, Animated, Dimensions, Platform, Linking } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGuestByCode, getWeddingDetails, getWeddingCard, getGalleryByWedding, uploadGalleryItem, deleteGalleryItem, getWeddingMessagesForGuest, submitAttendeeRating, getUserByClerkId, getAssignmentByWedding } from '@/utils/api';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import { CATEGORY_IMAGES } from '../../constants/backgrounds';
import { DESIGN_CONSTANTS, getFontStack } from '../../constants/design';

const { width, height } = Dimensions.get('window');

const HERO_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop";

export default function AttendeeScreen() {
    const { user } = useUser();
    const [guest, setGuest] = useState<any>(null);
    const [wedding, setWedding] = useState<any>(null);
    const [weddingCard, setWeddingCard] = useState<any>(null);
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [guestCode, setGuestCode] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [showWeddingCardModal, setShowWeddingCardModal] = useState(false);
    const [coupleUser, setCoupleUser] = useState<any>(null);

    // Rating states
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingType, setRatingType] = useState<'PROTOCOL' | 'WEDDING' | 'COUPLE' | null>(null);
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState("");
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [protocol, setProtocol] = useState<any>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (guest) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        }
    }, [guest]);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const savedCode = await AsyncStorage.getItem('attendee_guest_code');
                if (savedCode) { setGuestCode(savedCode); await loadData(savedCode); }
            } finally { setIsCheckingSession(false); }
        };
        checkSession();
    }, []);

    const loadData = async (code?: string) => {
        const effectiveCode = (code || guestCode).trim();
        if (!effectiveCode) return;
        try {
            const guestData = await getGuestByCode(effectiveCode);
            setGuest(guestData);
            await AsyncStorage.setItem('attendee_guest_code', effectiveCode);

            if (guestData.weddingId) {
                const [weddingData, cardData, gallery, messagesData, assignmentData] = await Promise.all([
                    getWeddingDetails(guestData.coupleClerkId),
                    getWeddingCard(guestData.coupleClerkId),
                    getGalleryByWedding(guestData.weddingId),
                    getWeddingMessagesForGuest(guestData.weddingId, guestData.id).catch(() => []),
                    getAssignmentByWedding(guestData.weddingId).catch(() => null)
                ]);

                // Process card design JSON if exists
                let processedCard = cardData;
                if (cardData?.cardDesign) {
                    try {
                        const extraData = JSON.parse(cardData.cardDesign);
                        processedCard = { ...cardData, ...extraData };
                    } catch (e) {
                        console.error("Failed to parse card design", e);
                    }
                }

                setWedding(weddingData); setWeddingCard(processedCard); setGalleryItems(gallery); setMessages(messagesData);

                if (weddingData.clerkId) {
                    const couple = await getUserByClerkId(weddingData.clerkId);
                    setCoupleUser(couple);
                }

                if (assignmentData?.protocolClerkId) {
                    const protocolData = await getUserByClerkId(assignmentData.protocolClerkId);
                    setProtocol(protocolData);
                }
            }
        } catch (error) {
            if (code) Alert.alert("Error", "Check your invitation code.");
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [guestCode]);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('attendee_guest_code');
        setGuest(null); setWedding(null); setGalleryItems([]); setGuestCode("");
    };

    const handleUpload = async () => {
        if (!wedding || !guest) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permission needed', 'Allow access to photos.');
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.3, base64: true });
        if (!result.canceled && result.assets[0].base64) {
            setIsUploading(true);
            try {
                await uploadGalleryItem(guest.uniqueCode, wedding.id, { weddingId: wedding.id, fileUrl: `data:image/jpeg;base64,${result.assets[0].base64}`, fileType: 'IMAGE', caption: `Shared by ${guest.firstName}` });
                Alert.alert("✨ Success", "Added to gallery!"); loadData();
            } finally { setIsUploading(false); }
        }
    };

    const handleDelete = (itemId: number) => {
        Alert.alert("Delete Photo", "Remove this?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await deleteGalleryItem(itemId, guest.uniqueCode); setGalleryItems(prev => prev.filter(i => i.id !== itemId)); setSelectedImage(null); } catch (e) { Alert.alert("Error", "Could not delete."); } } }]);
    };

    const handleRate = async () => {
        if (!wedding || !ratingType) return;
        setIsSubmittingRating(true);
        try {
            const ratingData = {
                guestId: guest.id,
                weddingId: wedding.id,
                ratedType: ratingType,
                ratedId: ratingType === 'PROTOCOL' ? String(protocol?.clerkId) : ratingType === 'COUPLE' ? guest.coupleClerkId : String(wedding.id),
                rating: ratingValue,
                comment: ratingComment
            };
            await submitAttendeeRating(ratingData);
            Alert.alert("💫 Thank You", "Your feedback has been submitted!");
            setShowRatingModal(false);
            setRatingComment("");
            setRatingValue(5);
        } catch (error) {
            Alert.alert("Error", "Failed to submit rating.");
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const openMaps = () => {
        if (!wedding?.location) return;
        const url = Platform.select({
            ios: `maps:0,0?q=${encodeURIComponent(wedding.location)}`,
            android: `geo:0,0?q=${encodeURIComponent(wedding.location)}`,
        });
        if (url) Linking.openURL(url);
    };

    if (isCheckingSession) return <View style={styles.loadingContainer}><ActivityIndicator color={Colors.light.gold} size="large" /><Text style={styles.loadingText}>Unveiling your experience...</Text></View>;

    if (!guest) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFill} />
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />

                <View style={styles.loginContainer}>
                    <Animated.View style={[styles.loginCard, { opacity: fadeAnim }]}>
                        <Text style={styles.loginHeader}>HapplyEver</Text>
                        <Text style={styles.loginEditorialTitle}>GUEST PORTAL</Text>
                        <View style={styles.loginDivider} />
                        <Text style={styles.loginEditorialSubtitle}>Please enter your personal invitation code to proceed to the celebration.</Text>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="INVITATION CODE"
                                value={guestCode}
                                onChangeText={setGuestCode}
                                autoCapitalize="characters"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                maxLength={10}
                            />
                        </View>

                        <TouchableOpacity style={styles.button} onPress={() => loadData()} activeOpacity={0.8}>
                            <LinearGradient
                                colors={[Colors.light.gold, '#B8962E', '#A68527']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>ENTER CELEBRATION</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        );
    }

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [-100, 0],
        extrapolate: 'clamp'
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [150, 250],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />

                    <View style={styles.heroContent}>
                        <Text style={styles.heroPreTitle}>WELCOME TO THE CELEBRATION OF</Text>
                        <Text style={styles.heroTitle}>{wedding?.partnersName?.toUpperCase() || "THE PERFECT DAY"}</Text>
                        <View style={styles.heroDivider} />
                        <Text style={styles.heroName}>Honored Guest, {guest.firstName}</Text>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <BlurView intensity={40} tint="dark" style={styles.logoutBlur}>
                            <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContent}>
                    {/* VIP Entry Card */}
                    <View style={styles.entrySection}>
                        <BlurView intensity={10} tint="light" style={styles.entryCard}>
                            <View style={styles.qrHeader}>
                                <IconSymbol name="checkmark.seal.fill" size={20} color={Colors.light.gold} />
                                <Text style={styles.qrHeaderText}>COLLECTOR'S ENTRY PASS</Text>
                            </View>

                            <View style={styles.qrWrapper}>
                                <Image
                                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${guest.uniqueCode}&color=000` }}
                                    style={styles.qrImage}
                                />
                                <View style={styles.qrCodeBadge}>
                                    <Text style={styles.qrCodeText}>{guest.uniqueCode}</Text>
                                </View>
                            </View>

                            <Text style={styles.qrInstructions}>Present this digital pass at the reception desk for priority check-in.</Text>
                        </BlurView>
                    </View>

                    {/* Digital Invitation Button */}
                    <TouchableOpacity style={styles.inviteButton} onPress={() => setShowWeddingCardModal(true)} activeOpacity={0.95}>
                        <LinearGradient
                            colors={['#1a1a1a', '#2a2a2a']}
                            style={styles.inviteGradient}
                        >
                            <View style={styles.inviteIconBox}>
                                <IconSymbol name="envelope.fill" size={24} color={Colors.light.gold} />
                            </View>
                            <View style={styles.inviteTextBox}>
                                <Text style={styles.inviteTitle}>Digital Invitation</Text>
                                <Text style={styles.inviteSubtitle}>View the personalized keepsake</Text>
                            </View>
                            <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.3)" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Moments Gallery */}
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Shared Moments</Text>
                            <Text style={styles.sectionSubtitle}>Capture and share the beauty</Text>
                        </View>
                        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={isUploading}>
                            <IconSymbol name="camera.fill" size={16} color="#fff" />
                            <Text style={styles.uploadBtnText}>{isUploading ? "..." : "ADD PHOTO"}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.galleryContainer}>
                        {galleryItems.length > 0 ? (
                            <View style={styles.galleryGrid}>
                                {galleryItems.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.galleryItem, index % 3 === 0 ? styles.galleryItemWide : {}]}
                                        onPress={() => setSelectedImage(item)}
                                    >
                                        <Image source={{ uri: item.fileUrl }} style={styles.galleryThumb} />
                                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={styles.galleryOverlay} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyGallery}>
                                <IconSymbol name="photo.on.rectangle.angled" size={40} color="#eee" />
                                <Text style={styles.emptyText}>Be the first to share a moment</Text>
                            </View>
                        )}
                    </View>

                    {/* Feedback & News */}
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Wedding Journal</Text>
                            <Text style={styles.sectionSubtitle}>Messages & Feedback</Text>
                        </View>
                    </View>

                    <View style={styles.feedbackRow}>
                        {protocol && (
                            <TouchableOpacity style={styles.feedbackCard} onPress={() => { setRatingType('PROTOCOL'); setShowRatingModal(true); }}>
                                <View style={[styles.feedbackBadge, { backgroundColor: '#F8F1EB' }]}>
                                    <IconSymbol name="shield.fill" size={18} color="#D89D6A" />
                                </View>
                                <Text style={styles.feedbackText}>Rate Protocol</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.feedbackCard} onPress={() => { setRatingType('WEDDING'); setShowRatingModal(true); }}>
                            <View style={[styles.feedbackBadge, { backgroundColor: '#EBF3F8' }]}>
                                <IconSymbol name="heart.fill" size={18} color="#6AA1D8" />
                            </View>
                            <Text style={styles.feedbackText}>Rate Wedding</Text>
                        </TouchableOpacity>
                    </View>

                    {messages.length > 0 && (
                        <View style={styles.newsContainer}>
                            {messages.slice(0, 3).map((msg) => (
                                <View key={msg.id} style={styles.newsCard}>
                                    <View style={styles.newsHeader}>
                                        <Text style={styles.newsLabel}>LATEST MESSAGE</Text>
                                        <Text style={styles.newsTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                    <Text style={styles.newsText}>{msg.message}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Event Logistics */}
                    <View style={styles.logisticsCard}>
                        <Text style={styles.logisticsTitle}>Event Logistics</Text>
                        <View style={styles.logisticsItem}>
                            <IconSymbol name="mappin.circle.fill" size={24} color={Colors.light.gold} />
                            <View style={styles.logisticsInfo}>
                                <Text style={styles.logisticsLabel}>VENUE LOCATION</Text>
                                <Text style={styles.logisticsValue}>{wedding?.location || "To be announced"}</Text>
                                <TouchableOpacity onPress={openMaps} style={styles.mapLink}>
                                    <Text style={styles.mapLinkText}>Get Directions →</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.logisticsDivider} />

                        <View style={styles.logisticsItem}>
                            <IconSymbol name="calendar.badge.clock" size={24} color={Colors.light.gold} />
                            <View style={styles.logisticsInfo}>
                                <Text style={styles.logisticsLabel}>DATE & TIME</Text>
                                <Text style={styles.logisticsValue}>
                                    {wedding?.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "Loading..."}
                                    {wedding?.weddingTime ? ` at ${wedding.weddingTime}` : ""}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.footerSpacing} />
                </View>
            </Animated.ScrollView>

            {/* Floating Header (Hidden initially, shown on scroll) */}
            <Animated.View style={[styles.floatingHeader, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
                <BlurView intensity={80} style={StyleSheet.absoluteFill} />
                <Text style={styles.floatingTitle}>{wedding?.partnersName?.toUpperCase()}</Text>
            </Animated.View>

            {/* MODALS */}
            <Modal visible={showRatingModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    <Animated.View style={styles.modalContentContainer}>
                        <Text style={styles.modalTitleHeader}>Leave your Mark</Text>
                        <Text style={styles.modalSubtitle}>How was your experience with {ratingType === 'PROTOCOL' ? 'our protocol team' : 'the wedding celebration'}?</Text>

                        <View style={styles.starRow}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setRatingValue(star)}>
                                    <IconSymbol name={star <= ratingValue ? "star.fill" : "star"} size={36} color={star <= ratingValue ? Colors.light.gold : "#eee"} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.commentInput}
                            placeholder="Share your thoughts with the couple..."
                            placeholderTextColor="#ccc"
                            multiline
                            value={ratingComment}
                            onChangeText={setRatingComment}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRatingModal(false)}>
                                <Text style={styles.cancelText}>NOT NOW</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleRate} disabled={isSubmittingRating}>
                                <LinearGradient colors={[Colors.light.gold, '#B89627']} style={styles.submitGradient}>
                                    {isSubmittingRating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>SHARE FEEDBACK</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Wedding Card Modal - Sync with Editor Design */}
            <Modal visible={showWeddingCardModal} transparent animationType="slide">
                <View style={styles.fullScreenModal}>
                    <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowWeddingCardModal(false)}>
                        <BlurView intensity={30} tint="dark" style={styles.closeBlur}>
                            <IconSymbol name="xmark" size={24} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>

                    {weddingCard ? (
                        <View style={styles.fullScreenCardContainer}>
                            <View style={[styles.fullScreenInvitation, {
                                backgroundColor: weddingCard.backgroundColor || '#fff',
                            }]}>
                                {(() => {
                                    let bgSource = weddingCard.backgroundImage;
                                    let bgType = weddingCard.backgroundType;

                                    if (bgSource?.startsWith('ASSET:')) {
                                        const assetId = bgSource.replace('ASSET:', '');
                                        for (const cat in CATEGORY_IMAGES) {
                                            const preset = (CATEGORY_IMAGES[cat] as any[]).find((p: any) => p.id === assetId);
                                            if (preset) {
                                                bgSource = preset.url;
                                                bgType = preset.type;
                                                break;
                                            }
                                        }
                                    } else if (weddingCard.backgroundVideo) {
                                        bgSource = weddingCard.backgroundVideo;
                                        bgType = 'VIDEO';
                                    }

                                    if (!bgSource) return null;

                                    return bgType === 'VIDEO' ? (
                                        <Video
                                            source={{ uri: bgSource }}
                                            style={[StyleSheet.absoluteFill, { transform: [{ scale: weddingCard.backgroundScale || 1.0 }] }]}
                                            resizeMode={weddingCard.resizeMode === 'contain' ? ResizeMode.CONTAIN : ResizeMode.COVER}
                                            isLooping shouldPlay isMuted
                                            useNativeControls={false}
                                        />
                                    ) : (
                                        <Image
                                            source={typeof bgSource === 'number' ? bgSource : { uri: bgSource }}
                                            style={[StyleSheet.absoluteFill, { transform: [{ scale: weddingCard.backgroundScale || 1.0 }] }]}
                                            resizeMode={weddingCard.resizeMode || 'cover'}
                                        />
                                    );
                                })()}

                                <View style={[StyleSheet.absoluteFill, {
                                    backgroundColor: weddingCard.backgroundColor || '#fff',
                                    opacity: (weddingCard.overlayOpacity || 30) / 100
                                }]} />

                                <View style={[styles.fullScreenCardContent, {
                                    zIndex: 2,
                                    alignItems: (weddingCard.textAlign === 'right' ? 'flex-end' : weddingCard.textAlign === 'left' ? 'flex-start' : 'center') as any,
                                    justifyContent: 'center',
                                }]}>
                                    {(() => {
                                        const PlateComponent = weddingCard.plateType === 'GLASS' ? BlurView : View;
                                        const plateStyle: any = [styles.textPlate, {
                                            alignItems: weddingCard.textAlign === 'right' ? 'flex-end' : weddingCard.textAlign === 'left' ? 'flex-start' : 'center',
                                            backgroundColor: weddingCard.plateType === 'SOLID' ? (weddingCard.plateColor || 'rgba(255,255,255,0.85)') : weddingCard.plateType === 'GLASS' ? 'rgba(255,255,255,0.7)' : 'transparent',
                                            padding: DESIGN_CONSTANTS.PLATE_PADDING,
                                            width: DESIGN_CONSTANTS.PLATE_WIDTH as any,
                                            borderRadius: DESIGN_CONSTANTS.PLATE_RADIUS,
                                            borderWidth: weddingCard.plateType === 'NONE' ? 0 : 1,
                                            borderColor: weddingCard.plateType === 'NONE' ? 'transparent' : 'rgba(255,255,255,0.3)',
                                            shadowOpacity: weddingCard.plateType === 'NONE' ? 0 : 0.1,
                                            alignSelf: weddingCard.textAlign === 'right' ? 'flex-end' : weddingCard.textAlign === 'left' ? 'flex-start' : 'center',
                                        }];

                                        return (
                                            <PlateComponent intensity={weddingCard.plateType === 'GLASS' ? 60 : 0} tint="light" style={plateStyle}>
                                                <Text style={[styles.modalEditorialTitle, { color: weddingCard.accentColor || Colors.light.gold, textAlign: (weddingCard.textAlign as any) || 'center' }]}>
                                                    THE WEDDING OF
                                                </Text>
                                                <Text style={[styles.invitationNamesLarge, {
                                                    color: weddingCard.textColor,
                                                    fontFamily: getFontStack(weddingCard.fontFamily, 'Bold'),
                                                    fontSize: (parseFloat(weddingCard.nameFontSize) || 4.2) * DESIGN_CONSTANTS.MULT_NAME,
                                                    textAlign: (weddingCard.textAlign as any) || 'center',
                                                    lineHeight: (parseFloat(weddingCard.nameFontSize) || 4.2) * DESIGN_CONSTANTS.MULT_NAME * 1.2,
                                                }]}>
                                                    {coupleUser?.firstName || "The"} & {wedding?.partnersName || "Couple"}
                                                </Text>
                                                <View style={[styles.miniDividerLarge, {
                                                    backgroundColor: weddingCard.accentColor || Colors.light.gold,
                                                }]} />

                                                <Text style={[styles.cardCustomMessage, {
                                                    color: weddingCard.textColor,
                                                    fontFamily: getFontStack(weddingCard.fontFamily, 'Regular'),
                                                    fontSize: (parseFloat(weddingCard.fontSize) || 1.5) * DESIGN_CONSTANTS.MULT_BODY,
                                                    textAlign: (weddingCard.textAlign as any) || 'center',
                                                    lineHeight: (parseFloat(weddingCard.fontSize) || 1.5) * DESIGN_CONSTANTS.MULT_BODY * 1.5,
                                                    marginBottom: 20
                                                }]}>
                                                    {weddingCard.customText || "We invite you to celebrate our special day!"}
                                                </Text>

                                                {(wedding?.weddingDate || wedding?.location) && (
                                                    <View style={{ marginTop: 5, alignItems: weddingCard.textAlign === 'right' ? 'flex-end' : weddingCard.textAlign === 'left' ? 'flex-start' : 'center' }}>
                                                        {wedding.weddingDate && (
                                                            <Text style={[styles.invitationDateLarge, {
                                                                color: weddingCard.textColor,
                                                                fontFamily: getFontStack(weddingCard.fontFamily, 'Bold'),
                                                                fontSize: 18,
                                                                textAlign: (weddingCard.textAlign as any) || 'center',
                                                            }]}>
                                                                {new Date(wedding.weddingDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                                {wedding.weddingTime ? ` at ${wedding.weddingTime}` : ''}
                                                            </Text>
                                                        )}
                                                        {wedding.location && (
                                                            <Text style={[styles.invitationLocationLarge, {
                                                                color: weddingCard.textColor,
                                                                fontFamily: getFontStack(weddingCard.fontFamily, 'Regular'),
                                                                marginTop: 8,
                                                                fontSize: 16,
                                                                opacity: 0.9,
                                                                textAlign: (weddingCard.textAlign as any) || 'center',
                                                            }]}>
                                                                {wedding.location} {wedding.venue ? `(${wedding.venue})` : ''}
                                                            </Text>
                                                        )}
                                                    </View>
                                                )}
                                            </PlateComponent>
                                        );
                                    })()}
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                            <IconSymbol name="envelope.open.fill" size={48} color={Colors.light.gold} />
                            <Text style={{ fontFamily: Fonts.Playfair.Bold, fontSize: 18, marginTop: 20, color: Colors.light.text }}>Invitation handcrafted</Text>
                            <Text style={{ fontFamily: Fonts.Cormorant.Regular, fontSize: 16, color: Colors.light.textSecondary }}>Available soon...</Text>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Photo Preview Modal */}
            <Modal visible={selectedImage !== null} transparent animationType="fade">
                <View style={styles.fullScreenModalGallery}>
                    <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSelectedImage(null)}>
                        <BlurView intensity={30} tint="dark" style={styles.closeBlur}>
                            <IconSymbol name="xmark" size={24} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>
                    {selectedImage && (
                        <View style={styles.previewImageContent}>
                            <Image source={{ uri: selectedImage.fileUrl }} style={styles.fullImage} resizeMode="contain" />
                            <View style={styles.previewInfo}>
                                <Text style={styles.previewCaption}>{selectedImage.caption || "A beautiful moment"}</Text>
                                <Text style={styles.previewMeta}>Shared by {selectedImage.caption?.split('by ')[1] || "Guest"}</Text>
                            </View>
                            {selectedImage.uploadedByClerkId === guest.uniqueCode && (
                                <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => handleDelete(selectedImage.id)}>
                                    <IconSymbol name="trash.fill" size={16} color="#fff" />
                                    <Text style={styles.modalDeleteText}>REMOVE PHOTO</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { fontFamily: Fonts.Playfair.Bold, fontSize: 16, color: Colors.light.gold, marginTop: 20, letterSpacing: 1 },
    scrollContent: { paddingBottom: 100 },

    // Login Screen Styles
    loginContainer: { flex: 1, justifyContent: 'center', padding: 30 },
    loginCard: { padding: 40, alignItems: 'center' },
    loginHeader: { fontFamily: Fonts.Playfair.Bold, fontSize: 14, letterSpacing: 8, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
    loginEditorialTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 32, color: '#fff', letterSpacing: 2 },
    loginDivider: { width: 40, height: 2, backgroundColor: Colors.light.gold, marginVertical: 30 },
    loginEditorialSubtitle: { fontFamily: Fonts.Cormorant.Regular, fontSize: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 28, marginBottom: 40 },
    inputWrapper: { width: '100%', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
    input: { height: 60, fontSize: 20, fontFamily: Fonts.Playfair.Bold, color: '#fff', textAlign: 'center', letterSpacing: 6 },
    button: { width: '100%', height: 65, marginTop: 20, borderRadius: 2, overflow: 'hidden' },
    buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 14, fontFamily: Fonts.Playfair.Bold, letterSpacing: 3 },

    // Hero Section Styles
    heroContainer: { height: height * 0.6, width: '100%', justifyContent: 'flex-end', paddingBottom: 40 },
    heroImage: { ...StyleSheet.absoluteFillObject },
    heroContent: { paddingHorizontal: 30, alignItems: 'center' },
    heroPreTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 5, marginBottom: 12 },
    heroTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 38, color: '#fff', textAlign: 'center', lineHeight: 48 },
    heroDivider: { width: 40, height: 1, backgroundColor: Colors.light.gold, marginVertical: 24 },
    heroName: { fontFamily: Fonts.Cormorant.Regular, fontSize: 24, color: Colors.light.gold, textAlign: 'center' },

    logoutButton: { position: 'absolute', top: 60, right: 30, zIndex: 10 },
    logoutBlur: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },

    // Floating Header
    floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, paddingTop: 60, alignItems: 'center', zIndex: 100, overflow: 'hidden' },
    floatingTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 13, letterSpacing: 4, color: Colors.light.text },

    // Main Content Sections
    mainContent: { marginTop: -30, backgroundColor: '#FDFDFD', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 40 },

    // Entry Pass Card
    entrySection: { marginBottom: 40 },
    entryCard: { padding: 30, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0', backgroundColor: 'rgba(255,255,255,0.5)' },
    qrHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 30 },
    qrHeaderText: { fontFamily: Fonts.Playfair.Bold, fontSize: 11, color: Colors.light.text, letterSpacing: 3 },
    qrWrapper: { alignItems: 'center', marginBottom: 20 },
    qrImage: { width: 200, height: 200, marginBottom: 15 },
    qrCodeBadge: { backgroundColor: '#1a1a1a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 },
    qrCodeText: { fontFamily: Fonts.Playfair.Bold, color: '#fff', fontSize: 16, letterSpacing: 4 },
    qrInstructions: { fontFamily: Fonts.Cormorant.Regular, fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 22 },

    // Invite Button
    inviteButton: { marginBottom: 40, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    inviteGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    inviteIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
    inviteTextBox: { flex: 1 },
    inviteTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 18, color: '#fff' },
    inviteSubtitle: { fontFamily: Fonts.Cormorant.Regular, fontSize: 14, color: 'rgba(255,255,255,0.5)' },

    // Section Headers
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
    sectionTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 24, color: Colors.light.text },
    sectionSubtitle: { fontFamily: Fonts.Cormorant.Regular, fontSize: 16, color: Colors.light.textSecondary, marginTop: 4 },

    uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.gold, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
    uploadBtnText: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, color: '#fff', letterSpacing: 1 },

    // Gallery Styles
    galleryContainer: { marginBottom: 40 },
    galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    galleryItem: { width: (width - 60) / 2, height: (width - 60) / 2, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f0f0f0' },
    galleryItemWide: { width: '100%', height: 200 },
    galleryThumb: { width: '100%', height: '100%' },
    galleryOverlay: { ...StyleSheet.absoluteFillObject },
    emptyGallery: { padding: 40, alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 20 },
    emptyText: { fontFamily: Fonts.Cormorant.Regular, fontSize: 16, color: '#999', marginTop: 12 },

    // Feedback Row
    feedbackRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    feedbackCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0', gap: 12 },
    feedbackBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    feedbackText: { fontFamily: Fonts.Playfair.Bold, fontSize: 13, color: Colors.light.text },

    // News Container
    newsContainer: { marginBottom: 40 },
    newsCard: { backgroundColor: '#F9FBFB', padding: 24, borderRadius: 24, borderLeftWidth: 4, borderLeftColor: '#6AA1D8', marginBottom: 12 },
    newsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    newsLabel: { fontFamily: Fonts.Playfair.Bold, fontSize: 9, color: '#6AA1D8', letterSpacing: 2 },
    newsTime: { fontFamily: Fonts.Playfair.Bold, fontSize: 9, color: '#999' },
    newsText: { fontFamily: Fonts.Cormorant.Regular, fontSize: 18, color: Colors.light.text, lineHeight: 26 },

    // Logistics Card
    logisticsCard: { backgroundColor: '#FDFDFD', padding: 30, borderRadius: 24, borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 40 },
    logisticsTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 20, color: Colors.light.text, marginBottom: 24 },
    logisticsItem: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
    logisticsInfo: { flex: 1 },
    logisticsLabel: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, color: Colors.light.gold, letterSpacing: 2, marginBottom: 6 },
    logisticsValue: { fontFamily: Fonts.Cormorant.Regular, fontSize: 18, color: Colors.light.text, lineHeight: 24 },
    mapLink: { marginTop: 8 },
    mapLinkText: { fontFamily: Fonts.Playfair.Bold, fontSize: 12, color: Colors.light.gold },
    logisticsDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 24 },
    footerSpacing: { height: 60 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContentContainer: { width: width - 48, backgroundColor: '#fff', padding: 32, borderRadius: 30 },
    modalTitleHeader: { fontFamily: Fonts.Playfair.Bold, fontSize: 24, color: Colors.light.text, textAlign: 'center', marginBottom: 12 },
    modalSubtitle: { fontFamily: Fonts.Cormorant.Regular, fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    starRow: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginBottom: 30 },
    commentInput: { width: '100%', height: 120, backgroundColor: '#f9f9f9', borderRadius: 20, padding: 20, fontFamily: Fonts.Cormorant.Regular, fontSize: 17, color: Colors.light.text, marginBottom: 30 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 18, alignItems: 'center' },
    cancelText: { fontFamily: Fonts.Playfair.Bold, color: '#999', fontSize: 12, letterSpacing: 2 },
    submitBtn: { flex: 2, borderRadius: 15, overflow: 'hidden' },
    submitGradient: { paddingVertical: 18, alignItems: 'center' },
    submitText: { fontFamily: Fonts.Playfair.Bold, color: '#fff', fontSize: 12, letterSpacing: 2 },

    // Full Screen Invitation Modal
    fullScreenModal: { flex: 1, backgroundColor: '#000' },
    modalCloseIcon: { position: 'absolute', top: 60, right: 30, zIndex: 100 },
    closeBlur: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    fullScreenCardContainer: { flex: 1 },
    fullScreenInvitation: { flex: 1, backgroundColor: '#fff' },
    fullScreenCardContent: { padding: 40, flex: 1 },
    textPlate: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        padding: 24,
        borderRadius: 20,
        width: '88%',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    modalEditorialTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 12, letterSpacing: 4, marginBottom: 20 },
    invitationNamesLarge: { color: Colors.light.text },
    miniDividerLarge: { width: 60, height: 2, marginVertical: 15 },
    invitationDateLarge: { marginBottom: 4 },
    invitationLocationLarge: { opacity: 0.8 },
    cardCustomMessage: { lineHeight: 28 },

    // Photo Preview Gallery
    fullScreenModalGallery: { flex: 1, backgroundColor: '#000' },
    previewImageContent: { flex: 1, justifyContent: 'center' },
    fullImage: { width: '100%', height: height * 0.7 },
    previewInfo: { padding: 30, backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', bottom: 120, left: 0, right: 0 },
    previewCaption: { fontFamily: Fonts.Playfair.Bold, fontSize: 18, color: '#fff', marginBottom: 6 },
    previewMeta: { fontFamily: Fonts.Cormorant.Regular, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    modalDeleteBtn: { position: 'absolute', bottom: 60, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, backgroundColor: 'rgba(255,50,50,0.2)', borderWidth: 1, borderColor: 'rgba(255,50,50,0.3)' },
    modalDeleteText: { fontFamily: Fonts.Playfair.Bold, color: '#fff', fontSize: 12, letterSpacing: 2 },
});
