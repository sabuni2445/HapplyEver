import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getGuestByCode, getWeddingDetails, getWeddingCard, getGalleryByWedding, uploadGalleryItem } from '@/utils/api';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as ImagePicker from 'expo-image-picker';

export default function AttendeeScreen() {
    const { user } = useUser();
    const [guest, setGuest] = useState<any>(null);
    const [wedding, setWedding] = useState<any>(null);
    const [weddingCard, setWeddingCard] = useState<any>(null);
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [guestCode, setGuestCode] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const loadData = async (code?: string) => {
        const effectiveCode = code || guestCode;
        if (!effectiveCode) return;

        try {
            const guestData = await getGuestByCode(effectiveCode);
            setGuest(guestData);

            if (guestData.weddingId) {
                // For attendees, we need the couple's clerk ID to get wedding details
                // The guest object should have it, or we can get it from the wedding ID
                // In the web app, it's passed in the URL. Here we'll assume the guest object has enough info
                // or we need a getWeddingById function (which I added).
                const weddingData = await getWeddingDetails(guestData.coupleClerkId);
                setWedding(weddingData);

                const cardData = await getWeddingCard(guestData.coupleClerkId);
                setWeddingCard(cardData);

                const gallery = await getGalleryByWedding(weddingData.id);
                setGalleryItems(gallery);
            }
        } catch (error) {
            console.error("Error loading attendee data:", error);
            if (code) Alert.alert("Error", "Could not load invitation details.");
        }
    };

    useEffect(() => {
        // If user is logged in, we might be able to find their guest record by email
        // but for now, we'll rely on the code entry as per web implementation.
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [guestCode]);

    const handleUpload = async () => {
        if (!wedding) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setIsUploading(true);
            try {
                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri: result.assets[0].uri,
                    type: result.assets[0].type === 'video' ? 'video/mp4' : 'image/jpeg',
                    name: result.assets[0].type === 'video' ? 'video.mp4' : 'photo.jpg',
                });
                formData.append('fileType', result.assets[0].type === 'video' ? 'VIDEO' : 'IMAGE');
                formData.append('caption', "");

                await uploadGalleryItem(wedding.id, formData);
                Alert.alert("Success", "Uploaded to gallery!");
                loadData();
            } catch (error) {
                console.error("Upload error:", error);
                Alert.alert("Error", "Failed to upload.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    if (!guest) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#fdf6f0', '#fff9f3', '#fef8f1']} style={styles.background} />
                <View style={styles.header}>
                    <Text style={styles.title}>Attendee</Text>
                    <Text style={styles.subtitle}>Enter your invitation code</Text>
                </View>
                <View style={styles.loginCard}>
                    <TextInput
                        style={styles.input}
                        placeholder="Invitation Code (e.g., GUEST-123)"
                        value={guestCode}
                        onChangeText={setGuestCode}
                        autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.button} onPress={() => loadData(guestCode)}>
                        <Text style={styles.buttonText}>View Invitation</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#fdf6f0', '#fff9f3', '#fef8f1']} style={styles.background} />
            <View style={styles.header}>
                <Text style={styles.title}>Welcome, {guest.firstName}!</Text>
                <Text style={styles.subtitle}>Your Wedding Invitation</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {/* QR Code Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your Entry QR Code</Text>
                    <Text style={styles.cardSubtitle}>Show this at the entrance</Text>
                    {guest.qrCodeUrl ? (
                        <View style={styles.qrContainer}>
                            <Image source={{ uri: guest.qrCodeUrl }} style={styles.qrImage} />
                            <View style={styles.codeBadge}>
                                <Text style={styles.codeText}>{guest.uniqueCode}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.qrPlaceholder}>
                            <IconSymbol name="qrcode" size={100} color="#e5e7eb" />
                            <Text style={styles.codeText}>{guest.uniqueCode}</Text>
                        </View>
                    )}
                </View>

                {/* Wedding Card Preview */}
                {weddingCard && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Wedding Invitation</Text>
                        <View style={[styles.invitationPreview, { backgroundColor: weddingCard.backgroundColor || '#fff' }]}>
                            <Text style={[styles.invitationNames, { color: weddingCard.accentColor || Colors.light.gold }]}>
                                {wedding?.partnersName || "Wedding"}
                            </Text>
                            <Text style={styles.invitationDate}>
                                {wedding?.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString() : ""}
                            </Text>
                            <Text style={styles.invitationLocation}>{wedding?.location}</Text>
                        </View>
                    </View>
                )}

                {/* Gallery Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Shared Gallery</Text>
                        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={isUploading}>
                            <IconSymbol name="camera.fill" size={18} color="#fff" />
                            <Text style={styles.uploadText}>{isUploading ? "..." : "Upload"}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                        {galleryItems.length > 0 ? (
                            galleryItems.map((item) => (
                                <View key={item.id} style={styles.galleryItem}>
                                    <Image source={{ uri: item.fileUrl }} style={styles.galleryImage} />
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No photos yet. Be the first!</Text>
                        )}
                    </ScrollView>
                </View>

                {/* Wedding Details */}
                {wedding && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Wedding Details</Text>
                        <View style={styles.detailItem}>
                            <IconSymbol name="calendar" size={20} color={Colors.light.gold} />
                            <View>
                                <Text style={styles.detailLabel}>Date & Time</Text>
                                <Text style={styles.detailValue}>
                                    {new Date(wedding.weddingDate).toLocaleDateString()} at {wedding.weddingTime}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.detailItem}>
                            <IconSymbol name="mappin.and.ellipse" size={20} color={Colors.light.gold} />
                            <View>
                                <Text style={styles.detailLabel}>Location</Text>
                                <Text style={styles.detailValue}>{wedding.location}</Text>
                            </View>
                        </View>
                        {guest.priority && guest.priority !== 'STANDARD' && (
                            <View style={styles.detailItem}>
                                <IconSymbol name="star.fill" size={20} color={Colors.light.gold} />
                                <View>
                                    <Text style={styles.detailLabel}>Your Priority</Text>
                                    <Text style={[styles.detailValue, { color: guest.priority === 'VVIP' ? '#7c3aed' : Colors.light.gold }]}>
                                        {guest.priority} {guest.seatNumber ? `(Seat: ${guest.seatNumber})` : ""}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}
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
        fontSize: 28,
        color: Colors.light.text,
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    content: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    loginCard: {
        margin: 24,
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        backgroundColor: Colors.light.gold,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Bold,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    cardTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
    },
    qrContainer: {
        alignItems: 'center',
        gap: 16,
    },
    qrImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        borderWidth: 4,
        borderColor: Colors.light.gold,
    },
    qrPlaceholder: {
        width: 200,
        height: 200,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    codeBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    codeText: {
        color: '#92400e',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Bold,
    },
    invitationPreview: {
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    invitationNames: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 8,
    },
    invitationDate: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    invitationLocation: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.text,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.gold,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    uploadText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    galleryScroll: {
        flexDirection: 'row',
    },
    galleryItem: {
        width: 120,
        height: 120,
        borderRadius: 12,
        marginRight: 12,
        overflow: 'hidden',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    detailItem: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Regular,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        color: Colors.light.text,
        fontFamily: Fonts.Playfair.Bold,
    },
    emptyText: {
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        padding: 20,
    },
});
