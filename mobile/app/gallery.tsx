import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { getWeddingDetails, getGalleryByWedding, uploadGalleryItem, deleteGalleryItem } from '@/utils/api';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function GalleryScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [wedding, setWedding] = useState<any>(null);
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (user) {
            const weddingData = await getWeddingDetails(user.id);
            setWedding(weddingData);
            if (weddingData?.id) {
                const items = await getGalleryByWedding(weddingData.id);
                setGalleryItems(items);
            }
        }
    };

    const pickMedia = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photos to upload.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // Defaulting to images for base64 stability
            allowsEditing: true,
            quality: 0.3,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            handleUpload(result.assets[0]);
        }
    };

    const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
        if (!wedding || !user) return;

        setUploading(true);
        try {
            const isVideo = asset.type === 'video' || asset.uri.toLowerCase().endsWith('.mp4') || asset.uri.toLowerCase().endsWith('.mov');

            const itemData = {
                weddingId: wedding.id,
                fileUrl: `data:${isVideo ? 'video/mp4' : 'image/jpeg'};base64,${asset.base64}`,
                fileType: isVideo ? 'VIDEO' : 'IMAGE',
                caption: 'Uploaded from mobile'
            };

            await uploadGalleryItem(user.id, wedding.id, itemData);
            Alert.alert("Success", "Media uploaded to your gallery!");
            loadData();
        } catch (error) {
            console.error("Upload error:", error);
            Alert.alert("Error", "Failed to upload media. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (itemId: number) => {
        if (!user) return;
        Alert.alert(
            "Delete Media",
            "Are you sure you want to remove this from the gallery?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await deleteGalleryItem(itemId, user.id);
                            setGalleryItems(prev => prev.filter(i => i.id !== itemId));
                            setSelectedImage(null);
                            Alert.alert("Deleted", "Item has been removed.");
                        } catch (e) {
                            Alert.alert("Error", "Could not delete this item. You may only delete your own uploads.");
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const isVideoFile = (url: string) => {
        return url?.toLowerCase().endsWith('.mp4') || url?.toLowerCase().endsWith('.mov');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Shared Gallery</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity
                    onPress={pickMedia}
                    disabled={uploading}
                    style={styles.mainUploadButton}
                >
                    <LinearGradient
                        colors={[Colors.light.gold, '#b8962e']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mainUploadGradient}
                    >
                        <IconSymbol name="plus" size={24} color="#fff" />
                        <Text style={styles.mainUploadText}>
                            {uploading ? "Uploading..." : "Add Photo or Video"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {galleryItems.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name="photo" size={48} color={Colors.light.textSecondary} />
                        <Text style={styles.emptyText}>No photos or videos yet. Be the first to upload!</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {galleryItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.gridItem}
                                onPress={() => setSelectedImage(item)}
                            >
                                {isVideoFile(item.fileUrl) ? (
                                    <View>
                                        <Video
                                            source={{ uri: item.fileUrl }}
                                            style={styles.image}
                                            resizeMode={ResizeMode.COVER}
                                            shouldPlay={false}
                                        />
                                        <View style={styles.videoOverlay}>
                                            <IconSymbol name="video" size={24} color="#fff" />
                                        </View>
                                    </View>
                                ) : (
                                    <Image source={{ uri: item.fileUrl }} style={styles.image} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={pickMedia}
                disabled={uploading}
            >
                <LinearGradient
                    colors={[Colors.light.gold, '#b8962e']}
                    style={styles.fabGradient}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <IconSymbol name="plus" size={32} color="#fff" />
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* View Image Modal */}
            <Modal visible={selectedImage !== null} transparent animationType="fade">
                <View style={styles.fullScreenModal}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <TouchableOpacity
                        style={styles.modalCloseIcon}
                        onPress={() => setSelectedImage(null)}
                    >
                        <IconSymbol name="xmark" size={30} color="#fff" />
                    </TouchableOpacity>

                    {selectedImage && (
                        <View style={styles.modalContent}>
                            {isVideoFile(selectedImage.fileUrl) ? (
                                <Video
                                    source={{ uri: selectedImage.fileUrl }}
                                    style={styles.fullScreenMedia}
                                    resizeMode={ResizeMode.CONTAIN}
                                    useNativeControls
                                    shouldPlay
                                />
                            ) : (
                                <Image
                                    source={{ uri: selectedImage.fileUrl }}
                                    style={styles.fullScreenMedia}
                                    resizeMode="contain"
                                />
                            )}

                            <View style={styles.modalFooter}>
                                <Text style={styles.modalCaption}>
                                    {selectedImage.caption || "Shared with love"}
                                </Text>

                                {selectedImage.uploadedByClerkId === user?.id && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDelete(selectedImage.id)}
                                        disabled={isDeleting}
                                    >
                                        <IconSymbol name="trash.fill" size={20} color="#ff4444" />
                                        <Text style={styles.deleteText}>Delete from Gallery</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        zIndex: 10,
    },
    backButtonText: {
        color: Colors.light.gold,
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Regular,
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    mainUploadButton: {
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    mainUploadGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 12,
    },
    mainUploadText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: Fonts.Cormorant.Bold,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
    },
    modalCloseIcon: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
    },
    modalContent: {
        flex: 1,
        justifyContent: 'center',
    },
    fullScreenMedia: {
        width: width,
        height: height * 0.7,
    },
    modalFooter: {
        padding: 24,
        alignItems: 'center',
    },
    modalCaption: {
        color: '#fff',
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    deleteText: {
        color: '#ff4444',
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
    },
});
