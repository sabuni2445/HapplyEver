import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Image } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useRef } from 'react';
import { getWeddingCard, createOrUpdateWeddingCard, generateAIImage } from '@/utils/api';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';

const THEMES = [
    { id: "classic", name: "Classic Elegance", color: "#d4af37" },
    { id: "modern", name: "Modern Minimalist", color: "#523c2b" },
    { id: "romantic", name: "Romantic Blush", color: "#d48bb8" },
    { id: "tropical", name: "Tropical Paradise", color: "#10b981" },
    { id: "vintage", name: "Vintage Charm", color: "#92400e" },
    { id: "royal", name: "Royal Luxury", color: "#7c3aed" },
    { id: "ethiopian_traditional", name: "Ethiopian Traditional", color: "#e11d48" },
    { id: "ethiopian_modern", name: "Ethiopian Modern", color: "#fbbf24" },
    { id: "habesha_elegant", name: "Habesha Elegant", color: "#78350f" },
    { id: "tigray_heritage", name: "Tigray Heritage", color: "#15803d" },
    { id: "amhara_classic", name: "Amhara Classic", color: "#2563eb" },
];

export default function WeddingCardScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [isEnabled, setIsEnabled] = useState(false);

    if (!user) return null;
    const [selectedTheme, setSelectedTheme] = useState('classic');
    const [message, setMessage] = useState('We invite you to celebrate our special day!');
    const [backgroundImage, setBackgroundImage] = useState('');
    const [backgroundType, setBackgroundType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
    const [fontStyle, setFontStyle] = useState('Playfair');
    const [fontSize, setFontSize] = useState(1.5);
    const [namesFontSize, setNamesFontSize] = useState(4.2);
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [backgroundColor, setBackgroundColor] = useState('#2a2828');
    const [accentColor, setAccentColor] = useState('#f3f2f2');
    const [overlayOpacity, setOverlayOpacity] = useState(50);
    const [alignment, setAlignment] = useState('center');
    const [aiPrompt, setAiPrompt] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                const card = await getWeddingCard(user.id);
                if (card) {
                    setIsEnabled(card.digitalCardEnabled);
                    setSelectedTheme(card.theme || 'classic');
                    setMessage(card.message || message);
                    setBackgroundImage(card.backgroundImage || '');
                    setBackgroundType(card.backgroundType || 'IMAGE');
                    setFontStyle(card.fontStyle || 'Playfair');
                    setFontSize(card.fontSize || 1.5);
                    setNamesFontSize(card.namesFontSize || 4.2);
                    setTextColor(card.textColor || '#FFFFFF');
                    setBackgroundColor(card.backgroundColor || '#2a2828');
                    setAccentColor(card.accentColor || '#f3f2f2');
                    setOverlayOpacity(card.overlayOpacity || 50);
                    setAlignment(card.alignment || 'center');
                }
            }
        };
        loadData();
    }, [user]);

    const handleGenerateAIImage = async () => {
        if (!aiPrompt.trim()) return;
        setGenerating(true);
        try {
            const result = await generateAIImage(aiPrompt);
            if (result && result.imageUrl) {
                setBackgroundImage(result.imageUrl);
                setBackgroundType('IMAGE');
                Alert.alert("Success", "AI Image generated and set as background!");
            } else {
                Alert.alert("Error", "Failed to generate image. Please try again.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to generate AI image");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        try {
            await createOrUpdateWeddingCard(user.id, {
                digitalCardEnabled: isEnabled,
                theme: selectedTheme,
                message,
                backgroundImage,
                backgroundType,
                fontStyle,
                fontSize,
                namesFontSize,
                textColor,
                backgroundColor,
                accentColor,
                overlayOpacity,
                alignment
            });
            Alert.alert("Success", "Wedding card updated!");
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to save wedding card");
        }
    };

    const pickMedia = async (type: 'IMAGE' | 'VIDEO') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'IMAGE' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setBackgroundImage(result.assets[0].uri);
            setBackgroundType(type);
        }
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
                <Text style={styles.title}>Digital Card</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Enable Digital Card</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: Colors.light.gold }}
                            thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
                            onValueChange={setIsEnabled}
                            value={isEnabled}
                        />
                    </View>
                    <Text style={styles.description}>
                        Enable this to allow guests to view your digital invitation and QR code.
                    </Text>
                </View>

                {isEnabled && (
                    <>
                        <Text style={styles.sectionTitle}>Customize Your Card</Text>

                        <View style={styles.controlGroup}>
                            <Text style={styles.subLabel}>Theme</Text>
                            <View style={styles.themesGrid}>
                                {THEMES.map((theme) => (
                                    <TouchableOpacity
                                        key={theme.id}
                                        style={[styles.themeOption, selectedTheme === theme.id && styles.selectedTheme, { borderColor: theme.color }]}
                                        onPress={() => setSelectedTheme(theme.id)}
                                    >
                                        <View style={[styles.colorPreview, { backgroundColor: theme.color }]} />
                                        <Text style={styles.themeName}>{theme.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.controlGroup}>
                            <Text style={styles.subLabel}>Background Type</Text>
                            <View style={styles.optionsRow}>
                                <TouchableOpacity
                                    style={[styles.optionButton, backgroundType === 'IMAGE' && styles.selectedOption]}
                                    onPress={() => setBackgroundType('IMAGE')}
                                >
                                    <IconSymbol name="photo" size={18} color={backgroundType === 'IMAGE' ? '#fff' : Colors.light.text} />
                                    <Text style={[styles.optionText, backgroundType === 'IMAGE' && { color: '#fff' }]}>Image</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.optionButton, backgroundType === 'VIDEO' && styles.selectedOption]}
                                    onPress={() => setBackgroundType('VIDEO')}
                                >
                                    <IconSymbol name="video" size={18} color={backgroundType === 'VIDEO' ? '#fff' : Colors.light.text} />
                                    <Text style={[styles.optionText, backgroundType === 'VIDEO' && { color: '#fff' }]}>Video</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.controlGroup}>
                            <Text style={styles.subLabel}>Background {backgroundType === 'IMAGE' ? 'Image' : 'Video'}</Text>
                            <TouchableOpacity style={styles.uploadButton} onPress={() => pickMedia(backgroundType)}>
                                <IconSymbol name={backgroundType === 'IMAGE' ? "photo" : "video"} size={24} color={Colors.light.text} />
                                <Text style={styles.uploadButtonText}>
                                    {backgroundImage ? `Change ${backgroundType === 'IMAGE' ? 'Image' : 'Video'}` : `Select ${backgroundType === 'IMAGE' ? 'Image' : 'Video'}`}
                                </Text>
                            </TouchableOpacity>
                            {backgroundImage ? (
                                <TouchableOpacity onPress={() => setBackgroundImage('')} style={styles.removeButton}>
                                    <Text style={styles.removeButtonText}>Remove Background</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <View style={styles.controlGroup}>
                            <Text style={styles.subLabel}>Custom Message</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                numberOfLines={3}
                                placeholder="Enter your custom message here..."
                            />
                        </View>

                        <View style={styles.controlGroup}>
                            <Text style={styles.subLabel}>AI Image Generator</Text>
                            <Text style={styles.description}>
                                Describe the background you want, and our AI will generate it for you!
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { marginTop: 12 }]}
                                value={aiPrompt}
                                onChangeText={setAiPrompt}
                                multiline
                                numberOfLines={2}
                                placeholder="e.g. A romantic sunset over the Ethiopian highlands with gold accents..."
                            />
                            <TouchableOpacity
                                style={[styles.aiButton, generating && styles.disabledButton]}
                                onPress={handleGenerateAIImage}
                                disabled={generating || !aiPrompt.trim()}
                            >
                                {generating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <IconSymbol name="sparkles" size={18} color="#fff" />
                                        <Text style={styles.aiButtonText}>Generate with AI</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.controlGroup}>
                            <Text style={styles.subLabel}>Typography</Text>
                            <Text style={styles.miniLabel}>Font Family</Text>
                            <View style={styles.optionsRow}>
                                {['Playfair', 'Cormorant', 'Roboto'].map((font) => (
                                    <TouchableOpacity
                                        key={font}
                                        style={[styles.optionButton, fontStyle === font && styles.selectedOption]}
                                        onPress={() => setFontStyle(font)}
                                    >
                                        <Text style={[styles.optionText, fontStyle === font && { color: '#fff' }]}>{font}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.miniLabel}>General Font Size (rem)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={String(fontSize)}
                                        onChangeText={(v) => setFontSize(parseFloat(v) || 0)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.miniLabel}>Names Font Size (rem)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={String(namesFontSize)}
                                        onChangeText={(v) => setNamesFontSize(parseFloat(v) || 0)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <Text style={styles.miniLabel}>Text Alignment</Text>
                            <View style={styles.optionsRow}>
                                {['left', 'center', 'right'].map((align) => (
                                    <TouchableOpacity
                                        key={align}
                                        style={[styles.optionButton, alignment === align && styles.selectedOption]}
                                        onPress={() => setAlignment(align as any)}
                                    >
                                        <IconSymbol name={`text.align${align === 'center' ? 'center' : align === 'left' ? 'left' : 'right'}`} size={20} color={alignment === align ? '#fff' : Colors.light.text} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.controlGroup}>
                            <Text style={styles.subLabel}>Colors</Text>
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.miniLabel}>Text Color</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={textColor}
                                        onChangeText={setTextColor}
                                        placeholder="#FFFFFF"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.miniLabel}>Background Color</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={backgroundColor}
                                        onChangeText={setBackgroundColor}
                                        placeholder="#2a2828"
                                    />
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.miniLabel}>Accent Color</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={accentColor}
                                        onChangeText={setAccentColor}
                                        placeholder="#f3f2f2"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.miniLabel}>Overlay Opacity (%)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={String(overlayOpacity)}
                                        onChangeText={(v) => setOverlayOpacity(parseInt(v) || 0)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Preview</Text>
                        <View style={[styles.previewCard, {
                            backgroundColor: backgroundColor,
                            alignItems: alignment === 'center' ? 'center' : alignment === 'left' ? 'flex-start' : 'flex-end'
                        }]}>
                            {backgroundImage ? (
                                backgroundType === 'VIDEO' ? (
                                    <Video
                                        style={StyleSheet.absoluteFillObject}
                                        source={{ uri: backgroundImage }}
                                        resizeMode={ResizeMode.COVER}
                                        isLooping
                                        shouldPlay
                                        isMuted
                                    />
                                ) : (
                                    <Image source={{ uri: backgroundImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                                )
                            ) : null}

                            {/* Overlay */}
                            <View style={[StyleSheet.absoluteFillObject, {
                                backgroundColor: backgroundColor,
                                opacity: overlayOpacity / 100
                            }]} />

                            <View style={[styles.previewContent, {
                                alignItems: alignment === 'center' ? 'center' : alignment === 'left' ? 'flex-start' : 'flex-end',
                                borderColor: accentColor,
                                borderLeftWidth: alignment === 'left' ? 4 : 0,
                                borderRightWidth: alignment === 'right' ? 4 : 0,
                                paddingHorizontal: 20
                            }]}>
                                <Text style={[styles.previewTitle, {
                                    fontFamily: fontStyle === 'Roboto' ? 'System' : (Fonts as any)[fontStyle]?.Bold,
                                    color: textColor,
                                    fontSize: namesFontSize * 10, // Scale down for mobile preview
                                    textAlign: alignment as any
                                }]}>
                                    {user?.firstName} & Partner
                                </Text>
                                <View style={[styles.divider, { backgroundColor: accentColor }]} />
                                <Text style={[styles.previewMessage, {
                                    fontFamily: fontStyle === 'Roboto' ? 'System' : (Fonts as any)[fontStyle]?.Regular,
                                    color: textColor,
                                    fontSize: fontSize * 12, // Scale down for mobile preview
                                    textAlign: alignment as any
                                }]}>
                                    {message}
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 24,
        top: 60,
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
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: Colors.light.text,
    },
    subLabel: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 12,
    },
    miniLabel: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginTop: 8,
        marginBottom: 4,
    },
    description: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    sectionTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 20,
        marginTop: 10,
    },
    themesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    themeOption: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 12,
    },
    selectedTheme: {
        backgroundColor: '#fff9f3',
        borderWidth: 2,
    },
    colorPreview: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginBottom: 8,
    },
    themeName: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.text,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: Colors.light.gold,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 40,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: Fonts.Cormorant.Regular,
    },
    controlGroup: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        color: Colors.light.text,
        marginTop: 4,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
        flexWrap: 'wrap',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
        gap: 8,
    },
    selectedOption: {
        backgroundColor: Colors.light.gold,
        borderColor: Colors.light.gold,
    },
    optionText: {
        fontSize: 14,
        color: Colors.light.text,
        fontFamily: Fonts.Cormorant.Regular,
        fontWeight: '600',
    },
    previewCard: {
        width: '100%',
        aspectRatio: 0.6,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    previewContent: {
        zIndex: 2,
        width: '100%',
    },
    previewTitle: {
        lineHeight: 40,
        marginBottom: 10,
    },
    previewMessage: {
        lineHeight: 24,
    },
    divider: {
        width: 60,
        height: 2,
        marginVertical: 15,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Colors.light.gold,
        borderRadius: 12,
        padding: 20,
        marginTop: 8,
        gap: 10,
    },
    uploadButtonText: {
        fontSize: 16,
        color: Colors.light.text,
        fontFamily: Fonts.Cormorant.Regular,
    },
    removeButton: {
        marginTop: 12,
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#ef4444',
        fontSize: 14,
        fontFamily: Fonts.Cormorant.Regular,
        textDecorationLine: 'underline',
    },
    aiButton: {
        backgroundColor: Colors.light.text,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    aiButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Bold,
    },
    disabledButton: {
        opacity: 0.5,
    },
});
