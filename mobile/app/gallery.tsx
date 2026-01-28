import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { getWeddingDetails, getGalleryByWedding, uploadGalleryItem } from '@/utils/api';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Video, ResizeMode } from 'expo-av';

export default function GalleryScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [wedding, setWedding] = useState<any>(null);
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

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
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            handleUpload(result.assets[0]);
        }
    };

    const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
        if (!wedding) return;

        setUploading(true);
        try {
            const formData = new FormData();
            const isVideo = asset.type === 'video' || asset.uri.toLowerCase().endsWith('.mp4') || asset.uri.toLowerCase().endsWith('.mov');

            formData.append('file', {
                uri: asset.uri,
                type: isVideo ? 'video/mp4' : 'image/jpeg',
                name: isVideo ? 'upload.mp4' : 'upload.jpg',
            } as any);
            formData.append('caption', 'Uploaded from mobile');
            formData.append('fileType', isVideo ? 'VIDEO' : 'IMAGE');

            await uploadGalleryItem(wedding.id, formData);
            Alert.alert("Success", `${isVideo ? 'Video' : 'Photo'} uploaded!`);
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to upload media");
        } finally {
            setUploading(false);
        }
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
                            <View key={item.id} style={styles.gridItem}>
                                {isVideoFile(item.fileUrl) ? (
                                    <Video
                                        source={{ uri: item.fileUrl }}
                                        style={styles.image}
                                        resizeMode={ResizeMode.COVER}
                                        shouldPlay={false}
                                        useNativeControls
                                    />
                                ) : (
                                    <Image source={{ uri: item.fileUrl }} style={styles.image} />
                                )}
                            </View>
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
                    <IconSymbol name="plus" size={32} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
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
});
