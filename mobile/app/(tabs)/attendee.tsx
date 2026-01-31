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

const { width, height } = Dimensions.get('window');

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

    // Rating states
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingType, setRatingType] = useState<'PROTOCOL' | 'WEDDING' | 'COUPLE' | null>(null);
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState("");
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [protocol, setProtocol] = useState<any>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const qrScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (guest) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
                Animated.spring(qrScale, { toValue: 1, tension: 50, friction: 7, delay: 200, useNativeDriver: true }),
            ]).start();
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
                setWedding(weddingData); setWeddingCard(cardData); setGalleryItems(gallery); setMessages(messagesData);

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
        const url = Platform.select({ ios: `maps:0,0?q=${encodeURIComponent(wedding.location)}`, android: `geo:0,0?q=${encodeURIComponent(wedding.location)}`, default: `https://maps.google.com/?q=${encodeURIComponent(wedding.location)}` });
        Linking.openURL(url || "");
    };

    if (isCheckingSession) return <View style={styles.loadingContainer}><ActivityIndicator color={Colors.light.gold} /><Text style={styles.loadingText}>Loading...</Text></View>;

    if (!guest) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#fff', '#fdfaf8']} style={StyleSheet.absoluteFill} />
                <View style={styles.loginContainer}>
                    <Animated.View style={[styles.loginCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.loginEditorialTitle}>MY EXPERIENCE</Text>
                        <Text style={styles.loginEditorialSubtitle}>Enter your unique wedding code to begin the journey.</Text>
                        <TextInput style={styles.input} placeholder="CODE" value={guestCode} onChangeText={setGuestCode} autoCapitalize="characters" placeholderTextColor="#ccc" maxLength={10} />
                        <TouchableOpacity style={styles.button} onPress={() => loadData()}>
                            <LinearGradient colors={[Colors.light.gold, '#b8962e']} style={styles.buttonGradient}><Text style={styles.buttonText}>OPEN INVITATION</Text></LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#fff', '#fdfaf8']} style={styles.background} />
            <View style={styles.editorialHeader}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutLink}><IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={Colors.light.text} /></TouchableOpacity>
                <Text style={styles.editorialBrand}>{wedding?.partnersName?.toUpperCase() || "THE WEDDING"}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}>
                <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.heroGreeting}>Hello, {guest.firstName}</Text>
                    <Text style={styles.heroQuote}>"A journey of a thousand miles begins with a single step, and our most beautiful steps are taken together."</Text>
                    <View style={styles.editorialDivider} />
                </Animated.View>

                <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ scale: qrScale }, { translateY: slideAnim }] }]}>
                    <View style={styles.editorialSectionHeader}><Text style={styles.editorialSectionTitle}>— ENTRY PASS</Text></View>
                    <View style={styles.qrCard}>
                        <View style={styles.qrContainer}>
                            <Image source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${guest.uniqueCode}&color=000` }} style={styles.qrImage} resizeMode="contain" />
                            <View style={styles.qrCodeBadge}><Text style={styles.qrCodeText}>{guest.uniqueCode}</Text></View>
                        </View>
                        <Text style={styles.qrFooter}>Presented at the reception for express entry</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.editorialSectionHeader}><Text style={styles.editorialSectionTitle}>— INVITATION</Text></View>
                    <TouchableOpacity style={styles.invitationCard} onPress={() => setShowWeddingCardModal(true)} activeOpacity={0.9}>
                        <View style={[styles.invitationPreview, { backgroundColor: weddingCard?.backgroundColor || '#fff' }]}>
                            {weddingCard?.backgroundImage && (
                                weddingCard.backgroundType === 'VIDEO' ? (
                                    <Video source={{ uri: weddingCard.backgroundImage }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} isLooping shouldPlay isMuted />
                                ) : (
                                    <Image source={{ uri: weddingCard.backgroundImage }} style={styles.cardBackground} resizeMode="cover" />
                                )
                            )}
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: weddingCard?.backgroundColor || '#fff', opacity: (weddingCard?.overlayOpacity || 0) / 100 }]} />
                            <View style={{ alignItems: 'center', zIndex: 2 }}>
                                <Text style={[styles.invitationNames, { color: weddingCard?.textColor || Colors.light.text, fontFamily: weddingCard?.fontStyle === 'Cormorant' ? Fonts.Cormorant.Bold : Fonts.Playfair.Bold }]}>{wedding?.partnersName || "The Couple"}</Text>
                                <View style={[styles.miniDivider, { backgroundColor: weddingCard?.accentColor || Colors.light.gold }]} />
                                <Text style={[styles.invitationDate, { color: weddingCard?.textColor || Colors.light.textSecondary }]}>{wedding?.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString() : ""}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.editorialSectionHeader}>
                        <Text style={styles.editorialSectionTitle}>— GALLERY</Text>
                        <TouchableOpacity style={styles.editorialUpload} onPress={handleUpload} disabled={isUploading}><Text style={styles.editorialUploadText}>{isUploading ? "..." : "ADD MOMENT"}</Text></TouchableOpacity>
                    </View>
                    <View style={styles.galleryGrid}>
                        {galleryItems.map((item) => (
                            <View key={item.id} style={styles.editorialGalleryItem}>
                                <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedImage(item)} style={StyleSheet.absoluteFill}>
                                    <Image source={{ uri: item.fileUrl }} style={styles.galleryImage} resizeMode="cover" />
                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageOverlay}><IconSymbol name="plus" size={14} color="#fff" /></LinearGradient>
                                </TouchableOpacity>
                                {item.uploadedByClerkId === guest.uniqueCode && (
                                    <TouchableOpacity style={styles.editorialDelete} onPress={() => handleDelete(item.id)}>
                                        <IconSymbol name="trash.fill" size={12} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.editorialSectionHeader}><Text style={styles.editorialSectionTitle}>— FEEDBACK</Text></View>
                    <View style={styles.ratingList}>
                        {protocol && (
                            <TouchableOpacity style={styles.editorialRatingCard} onPress={() => { setRatingType('PROTOCOL'); setShowRatingModal(true); }}>
                                <View style={styles.ratingContent}>
                                    <View style={styles.ratingIconCircle}><IconSymbol name="shield.fill" size={20} color={Colors.light.gold} /></View>
                                    <View style={styles.ratingTextGroup}><Text style={styles.ratingTitle}>Rate Protocol</Text><Text style={styles.ratingSubtitle}>Tell us about your arrival experience</Text></View>
                                    <IconSymbol name="chevron.right" size={16} color="#d1d5db" />
                                </View>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.editorialRatingCard} onPress={() => { setRatingType('WEDDING'); setShowRatingModal(true); }}>
                            <View style={styles.ratingContent}>
                                <View style={styles.ratingIconCircle}><IconSymbol name="heart.fill" size={20} color={Colors.light.gold} /></View>
                                <View style={styles.ratingTextGroup}><Text style={styles.ratingTitle}>Rate Wedding</Text><Text style={styles.ratingSubtitle}>How did you like the celebration?</Text></View>
                                <IconSymbol name="chevron.right" size={16} color="#d1d5db" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {messages.length > 0 && (
                    <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.editorialSectionHeader}><Text style={styles.editorialSectionTitle}>— NEWS</Text></View>
                        <View style={styles.messagesContainer}>{messages.slice(0, 3).map((msg) => (
                            <View key={msg.id} style={styles.editorialMessage}>
                                <Text style={styles.messageText}>{msg.message}</Text>
                                <Text style={styles.messageTime}>THE COUPLE · {new Date(msg.createdAt).toLocaleTimeString()}</Text>
                            </View>
                        ))}</View>
                    </Animated.View>
                )}

                {wedding && (
                    <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.editorialSectionHeader}><Text style={styles.editorialSectionTitle}>— DETAILS</Text></View>
                        <View style={styles.detailsCard}>
                            <View style={styles.detailItem}><Text style={styles.detailLabel}>LOCATED AT</Text><Text style={styles.detailValue}>{wedding.location}</Text><TouchableOpacity onPress={openMaps}><Text style={styles.inlineLinkText}>View on Maps →</Text></TouchableOpacity></View>
                            <View style={styles.detailItem}><Text style={styles.detailLabel}>HAPPENING ON</Text><Text style={styles.detailValue}>{new Date(wedding.weddingDate).toLocaleDateString()}</Text></View>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>

            <Modal visible={showRatingModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContentContainer}>
                        <Text style={styles.modalTitle}>Rate {ratingType === 'PROTOCOL' ? 'Protocol' : 'Wedding'}</Text>
                        <View style={styles.starRow}>{[1, 2, 3, 4, 5].map(star => (<TouchableOpacity key={star} onPress={() => setRatingValue(star)}><IconSymbol name={star <= ratingValue ? "star.fill" : "star"} size={28} color={star <= ratingValue ? Colors.light.gold : "#ddd"} /></TouchableOpacity>))}</View>
                        <TextInput style={styles.commentInput} placeholder="Your thoughts..." placeholderTextColor="#ccc" multiline value={ratingComment} onChangeText={setRatingComment} />
                        <View style={styles.modalButtons}><TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRatingModal(false)}><Text style={styles.cancelText}>CANCEL</Text></TouchableOpacity><TouchableOpacity style={styles.submitBtn} onPress={handleRate} disabled={isSubmittingRating}><LinearGradient colors={[Colors.light.gold, '#b89627']} style={styles.submitGradient}><Text style={styles.submitText}>SUBMIT</Text></LinearGradient></TouchableOpacity></View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showWeddingCardModal} transparent animationType="fade">
                <View style={styles.fullScreenModal}>
                    <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowWeddingCardModal(false)}><IconSymbol name="xmark" size={30} color="#fff" /></TouchableOpacity>
                    {weddingCard && (
                        <View style={styles.fullScreenCardContainer}>
                            <View style={[styles.fullScreenInvitation, {
                                backgroundColor: weddingCard.backgroundColor || '#fff',
                                alignItems: weddingCard.alignment === 'center' ? 'center' : weddingCard.alignment === 'left' ? 'flex-start' : 'flex-end'
                            }]}>
                                {weddingCard.backgroundImage && (
                                    weddingCard.backgroundType === 'VIDEO' ? (
                                        <Video source={{ uri: weddingCard.backgroundImage }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} isLooping shouldPlay isMuted />
                                    ) : (
                                        <Image source={{ uri: weddingCard.backgroundImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                                    )
                                )}
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: weddingCard.backgroundColor || '#fff', opacity: (weddingCard.overlayOpacity || 0) / 100 }]} />

                                <View style={[styles.fullScreenCardContent, {
                                    alignItems: weddingCard.alignment === 'center' ? 'center' : weddingCard.alignment === 'left' ? 'flex-start' : 'flex-end',
                                    width: '100%',
                                    paddingHorizontal: 30,
                                    zIndex: 2
                                }]}>
                                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: weddingCard.alignment === 'center' ? 'center' : weddingCard.alignment === 'left' ? 'flex-start' : 'flex-end' }}>
                                        <Text style={[styles.modalEditorialTitle, { color: weddingCard.accentColor || Colors.light.gold }]}>THE WEDDING OF</Text>
                                        <Text style={[styles.invitationNamesLarge, {
                                            color: weddingCard.textColor || Colors.light.text,
                                            fontFamily: weddingCard.fontStyle === 'Cormorant' ? Fonts.Cormorant.Bold : Fonts.Playfair.Bold,
                                            fontSize: (weddingCard.namesFontSize || 3.2) * 10,
                                            textAlign: weddingCard.alignment || 'center'
                                        }]}>{wedding?.partnersName}</Text>
                                        <View style={[styles.miniDividerLarge, { backgroundColor: weddingCard.accentColor || Colors.light.gold }]} />

                                        <Text style={[styles.cardCustomMessage, {
                                            color: weddingCard.textColor || Colors.light.text,
                                            fontFamily: weddingCard.fontStyle === 'Cormorant' ? Fonts.Cormorant.Regular : Fonts.Playfair.Regular,
                                            fontSize: (weddingCard.fontSize || 1.5) * 12,
                                            textAlign: weddingCard.alignment || 'center'
                                        }]}>{weddingCard.message}</Text>

                                        <Text style={[styles.invitationDateLarge, { color: weddingCard.textColor || Colors.light.textSecondary }]}>
                                            {new Date(wedding.weddingDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </Text>
                                        <Text style={[styles.invitationLocationLarge, { color: weddingCard.textColor || '#999' }]}>{wedding?.location}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>

            <Modal visible={selectedImage !== null} transparent animationType="fade">
                <View style={styles.fullScreenModal}>
                    <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSelectedImage(null)}><IconSymbol name="xmark" size={30} color="#fff" /></TouchableOpacity>
                    {selectedImage && <><Image source={{ uri: selectedImage.fileUrl }} style={styles.fullScreenImage} resizeMode="contain" />
                        {selectedImage.uploadedByClerkId === guest.uniqueCode && (
                            <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => handleDelete(selectedImage.id)}>
                                <IconSymbol name="trash.fill" size={16} color="#fff" /><Text style={styles.modalDeleteText}>REMOVE PHOTO</Text>
                            </TouchableOpacity>
                        )}</>}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontFamily: Fonts.Playfair.Bold, fontSize: 14, color: 'rgba(0,0,0,0.5)', marginTop: 12 },
    background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
    editorialHeader: { height: 120, paddingTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(255, 255, 255, 0.8)' },
    editorialBrand: { fontFamily: Fonts.Playfair.Bold, fontSize: 14, letterSpacing: 4, color: Colors.light.text },
    logoutLink: { position: 'absolute', right: 24, top: 60 },
    scrollContent: { paddingBottom: 60 },
    heroSection: { paddingTop: 40, paddingHorizontal: 24, marginBottom: 40, alignItems: 'center' },
    heroGreeting: { fontFamily: Fonts.Playfair.Bold, fontSize: 32, color: Colors.light.text, marginBottom: 16 },
    heroQuote: { fontFamily: Fonts.Cormorant.Regular, fontStyle: 'italic', fontSize: 18, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 28 },
    editorialDivider: { width: 40, height: 1, backgroundColor: Colors.light.gold, marginTop: 30 },
    section: { marginBottom: 50, paddingHorizontal: 24 },
    editorialSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 12 },
    editorialSectionTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 12, letterSpacing: 2, color: Colors.light.text },
    qrCard: { padding: 30, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
    qrContainer: { alignItems: 'center', gap: 16 },
    qrImage: { width: 180, height: 180 },
    qrCodeBadge: { backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    qrCodeText: { fontFamily: Fonts.Playfair.Bold, color: Colors.light.text, fontSize: 16, letterSpacing: 3 },
    qrFooter: { marginTop: 20, fontSize: 12, fontFamily: Fonts.Cormorant.Regular, color: Colors.light.textSecondary, textAlign: 'center' },
    invitationCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
    invitationPreview: { padding: 40, alignItems: 'center' },
    cardBackground: { ...StyleSheet.absoluteFillObject, opacity: 0.1 },
    invitationNames: { fontFamily: Fonts.Playfair.Bold, fontSize: 24, color: Colors.light.text, textAlign: 'center' },
    miniDivider: { width: 30, height: 1, backgroundColor: Colors.light.gold, marginVertical: 16 },
    invitationDate: { fontFamily: Fonts.Cormorant.Regular, fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center' },
    invitationLocation: { fontFamily: Fonts.Cormorant.Regular, fontStyle: 'italic', fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center' },
    editorialUpload: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    editorialUploadText: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, color: Colors.light.gold },
    galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    editorialGalleryItem: { width: (width - 64) / 2, height: (width - 64) * 0.75, margin: 8, backgroundColor: '#fff', overflow: 'hidden' },
    galleryImage: { width: '100%', height: '100%' },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', justifyContent: 'flex-end', padding: 12 },
    editorialDelete: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.3)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    ratingList: { gap: 0 },
    editorialRatingCard: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    ratingContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    ratingIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212, 175, 55, 0.05)', justifyContent: 'center', alignItems: 'center' },
    ratingTextGroup: { flex: 1 },
    ratingTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 16, color: Colors.light.text },
    ratingSubtitle: { fontFamily: Fonts.Cormorant.Regular, fontSize: 14, color: Colors.light.textSecondary },
    messagesContainer: { gap: 0 },
    editorialMessage: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    messageText: { fontFamily: Fonts.Cormorant.Regular, fontSize: 17, color: Colors.light.text, lineHeight: 26 },
    messageTime: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, color: Colors.light.gold },
    detailsCard: { gap: 30 },
    detailItem: { gap: 8 },
    detailLabel: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, letterSpacing: 2, color: Colors.light.gold },
    detailValue: { fontFamily: Fonts.Cormorant.Regular, fontSize: 18, color: Colors.light.text },
    inlineLinkText: { fontFamily: Fonts.Playfair.Bold, fontSize: 11, color: Colors.light.gold },
    loginContainer: { flex: 1, justifyContent: 'center', padding: 24 },
    loginCard: { backgroundColor: '#fff', padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
    loginEditorialTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 24, color: Colors.light.text, marginBottom: 16 },
    loginEditorialSubtitle: { fontFamily: Fonts.Cormorant.Regular, fontSize: 16, color: '#999', textAlign: 'center', marginBottom: 32 },
    input: { width: '100%', height: 60, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', paddingHorizontal: 20, fontSize: 18, fontFamily: Fonts.Playfair.Bold, color: Colors.light.text, textAlign: 'center', letterSpacing: 4, marginBottom: 20 },
    button: { width: '100%', height: 60 },
    buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 14, fontFamily: Fonts.Playfair.Bold, letterSpacing: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContentContainer: { width: width - 60, backgroundColor: '#fff', padding: 40, alignItems: 'center' },
    modalTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 24, color: Colors.light.text, marginBottom: 30 },
    starRow: { flexDirection: 'row', gap: 16, marginBottom: 30 },
    commentInput: { width: '100%', height: 100, backgroundColor: 'rgba(0,0,0,0.02)', padding: 16, fontFamily: Fonts.Cormorant.Regular, fontSize: 16, marginBottom: 30 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    cancelText: { fontFamily: Fonts.Playfair.Bold, color: '#991199', fontSize: 12 },
    submitBtn: { flex: 1 },
    submitGradient: { paddingVertical: 16, alignItems: 'center' },
    submitText: { fontFamily: Fonts.Playfair.Bold, color: '#fff', fontSize: 12 },
    fullScreenModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
    modalCloseIcon: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
    fullScreenCardContainer: { padding: 30 },
    fullScreenInvitation: { aspectRatio: 0.7, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    fullScreenCardContent: { padding: 40, alignItems: 'center', flex: 1 },
    cardCustomMessage: { marginBottom: 30, lineHeight: 24 },
    modalEditorialTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 12, letterSpacing: 4, color: Colors.light.gold, marginBottom: 24 },
    invitationNamesLarge: { fontFamily: Fonts.Playfair.Bold, fontSize: 32, color: Colors.light.text, textAlign: 'center' },
    miniDividerLarge: { width: 60, height: 2, backgroundColor: Colors.light.gold, marginVertical: 24 },
    invitationDateLarge: { fontFamily: Fonts.Cormorant.Regular, fontSize: 20, color: Colors.light.text },
    invitationLocationLarge: { fontFamily: Fonts.Cormorant.Regular, fontStyle: 'italic', fontSize: 16, color: '#999' },
    fullScreenImage: { width: width, height: height * 0.8 },
    modalDeleteBtn: { position: 'absolute', bottom: 60, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    modalDeleteText: { color: '#fff', fontFamily: Fonts.Playfair.Bold, fontSize: 12 },
});
