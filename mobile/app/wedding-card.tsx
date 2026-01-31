import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Image, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useRef } from 'react';
import { getWeddingCard, createOrUpdateWeddingCard, generateAIImage, getWeddingDetails } from '@/utils/api';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';

// Theme Background Assets
const IslamicBG = require('../assets/images/backgrounds/islamic_bg.png');
const ChristianBG = require('../assets/images/backgrounds/christian_bg.png');
const GoldBG = require('../assets/images/backgrounds/gold_bg.png');
const RomanticBG = require('../assets/images/backgrounds/romantic_bg.png');
const EthiopianBG = require('../assets/images/backgrounds/ethiopian_bg.png');
const IslamicRedBG = require('../assets/images/backgrounds/islamic_red.png');
const ChristianFloralBG = require('../assets/images/backgrounds/christian_floral.png');
const HabeshaTradBG = require('../assets/images/backgrounds/habesha_traditional.png');

const PRESET_BACKGROUNDS = [
    { id: 'habesha_couple', name: 'Traditional Habesha', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000', type: 'IMAGE' },
    { id: 'maroon_gold', name: 'Maroon & Gold Ornament', url: 'https://images.unsplash.com/photo-1549416843-70732df894c2?q=80&w=1000', type: 'IMAGE' },
    { id: 'gold_luxury', name: 'Gold Luxury', url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1000', type: 'IMAGE' },
    { id: 'romantic_floral', name: 'Romantic Floral', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000', type: 'IMAGE' },
    { id: 'ethiopian_modern', name: 'Ethiopian Modern', url: 'https://images.unsplash.com/photo-1584974232726-67ff93839172?q=80&w=1000', type: 'IMAGE' },
];

const PRESET_COLORS = [
    '#d4af37', '#ffffff', '#000000', '#2a2828', '#f3f2f2',
    '#e11d48', '#065f46', '#1e40af', '#7c3aed', '#d48bb8',
    '#78350f', '#fbbf24', '#059669', '#3b82f6', '#fef3c7'
];

const THEMES = [
    { id: "gold_glamour", name: "Gold Glamour", color: "#d4af37", bg: "#1a1a1a", text: "#ffffff", accent: "#d4af37", font: "Playfair", bgImage: GoldBG },
    { id: "ivory_classic", name: "Ivory Classic", color: "#d4af37", bg: "#fdf6f0", text: "#2a2828", accent: "#d4af37", font: "Playfair", bgImage: GoldBG },
    { id: "midnight_royal", name: "Midnight Royal", color: "#c5a059", bg: "#001f3f", text: "#ffffff", accent: "#c5a059", font: "Cormorant", bgImage: 'https://images.unsplash.com/photo-1550005810-3796d84a754b?q=80&w=2000' },
    { id: "romantic_pink", name: "Romantic Blush", color: "#d48bb8", bg: "#fff5f8", text: "#4a3a3a", accent: "#d48bb8", font: "Cormorant", bgImage: RomanticBG },
    { id: "islamic_tradition", name: "Islamic Tradition", color: "#d4af37", bg: "#7f1d1d", text: "#ffffff", accent: "#d4af37", font: "Playfair", bgImage: IslamicRedBG },
    { id: "christian_wedding", name: "Christian Wedding", color: "#1e40af", bg: "#eff6ff", text: "#1e3a8a", accent: "#3b82f6", font: "Cormorant", bgImage: ChristianFloralBG },
    { id: "habesha_heritage", name: "Habesha Heritage", color: "#78350f", bg: "#fffbeb", text: "#451a03", accent: "#78350f", font: "Playfair", bgImage: HabeshaTradBG },
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
    const [generatedAiImage, setGeneratedAiImage] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Wedding Details State
    const [partnerName, setPartnerName] = useState('');
    const [weddingDate, setWeddingDate] = useState('');
    const [weddingTime, setWeddingTime] = useState('');
    const [location, setLocation] = useState('');
    const [venue, setVenue] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                try {
                    const card = await getWeddingCard(user.id);
                    if (card) {
                        console.log("Loaded Wedding Card:", card);
                        setIsEnabled(card.digitalCardEnabled);
                        setSelectedTheme(card.theme || 'gold_glamour');
                        setMessage(card.customText || message);
                        setBackgroundImage(card.backgroundImage || '');
                        const isVideo = card.backgroundImage?.match(/\.(mp4|mov|wmv|avi|flv)$|video/i);
                        setBackgroundType(isVideo ? 'VIDEO' : 'IMAGE');
                        setFontStyle(card.fontFamily || 'Playfair');
                        setFontSize(typeof card.fontSize === 'string' ? parseFloat(card.fontSize) || 1.5 : card.fontSize || 1.5);
                        setNamesFontSize(typeof card.nameFontSize === 'string' ? parseFloat(card.nameFontSize) || 4.2 : card.nameFontSize || 4.2);
                        setTextColor(card.textColor || '#FFFFFF');
                        setBackgroundColor(card.backgroundColor || '#2a2828');
                        setAccentColor(card.accentColor || '#f3f2f2');
                        setOverlayOpacity(card.overlayOpacity || 50);
                        setAlignment(card.textAlign || 'center');
                    }

                    const details = await getWeddingDetails(user.id);
                    if (details) {
                        console.log("Loaded Wedding Details:", details);
                        setPartnerName(details.partnersName || '');

                        // Handle Date (might be array or string)
                        let formattedDate = details.weddingDate;
                        if (Array.isArray(details.weddingDate)) {
                            const [y, m, d] = details.weddingDate;
                            formattedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        }
                        setWeddingDate(formattedDate || '');

                        // Handle Time
                        let formattedTime = details.weddingTime;
                        if (Array.isArray(details.weddingTime)) {
                            const [h, min] = details.weddingTime;
                            formattedTime = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                        }
                        setWeddingTime(formattedTime || '');

                        setLocation(details.location || '');
                        setVenue(details.venue || '');
                    }
                } catch (err) {
                    console.error("Error loading wedding card/details:", err);
                }
            }
        };
        loadData();
    }, [user]);

    const handleGenerateAIImage = async () => {
        if (!aiPrompt.trim()) return;
        setGenerating(true);
        try {
            console.log("Generating AI Image with prompt:", aiPrompt);
            const result = await generateAIImage(aiPrompt);
            if (result && result.imageUrl) {
                setGeneratedAiImage(result.imageUrl);
                Alert.alert("Success", "AI Image generated! Click the preview below to apply it.");
            } else {
                console.warn("AI Generation returned no image URL:", result);
                Alert.alert("Notice", "AI generation completed but no image was returned. Please try a different prompt.");
            }
        } catch (error: any) {
            console.error("AI Generation Critical Error:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Unknown error";
            Alert.alert("AI Generation Failed", `We couldn't generate your image right now. Reason: ${errorMessage}. Please try again later.`);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        try {
            await createOrUpdateWeddingCard(user.id, {
                digitalCardEnabled: isEnabled,
                theme: selectedTheme,
                customText: message,
                backgroundImage,
                fontFamily: fontStyle,
                fontSize: String(fontSize),
                nameFontSize: String(namesFontSize),
                textColor,
                backgroundColor,
                accentColor,
                overlayOpacity,
                textAlign: alignment
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
                                        onPress={() => {
                                            setSelectedTheme(theme.id);
                                            setBackgroundColor(theme.bg);
                                            setTextColor(theme.text);
                                            setAccentColor(theme.accent);
                                            setFontStyle(theme.font);
                                            if (theme.bgImage) {
                                                setBackgroundImage(theme.bgImage);
                                                setBackgroundType('IMAGE');
                                                setOverlayOpacity(30);
                                            }
                                            setShowPreviewModal(true);
                                        }}
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
                            <Text style={styles.subLabel}>Suggested Backgrounds</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                                {PRESET_BACKGROUNDS.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.id}
                                        onPress={() => {
                                            setBackgroundImage(preset.url);
                                            setBackgroundType(preset.type as any);
                                            setOverlayOpacity(30);
                                        }}
                                        style={[styles.presetOption, backgroundImage === preset.url && styles.selectedPreset]}
                                    >
                                        <Image source={{ uri: preset.url }} style={styles.presetImage} />
                                        <Text style={styles.presetText} numberOfLines={1}>{preset.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={[styles.subLabel, { marginTop: 20 }]}>Custom Background {backgroundType === 'IMAGE' ? 'Image' : 'Video'}</Text>
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
                                Our AI will generate a unique background based on your description.
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

                            {generatedAiImage && (
                                <View style={{ marginTop: 16, alignItems: 'center' }}>
                                    <Text style={styles.miniLabel}>Generated Preview (Click to Apply)</Text>
                                    <TouchableOpacity
                                        style={styles.generatedPreviewContainer}
                                        onPress={() => {
                                            setBackgroundImage(generatedAiImage);
                                            setBackgroundType('IMAGE');
                                            setOverlayOpacity(30);
                                            Alert.alert("Applied", "AI generation set as card background!");
                                        }}
                                    >
                                        <Image source={{ uri: generatedAiImage }} style={styles.generatedPreviewImage} />
                                        <View style={styles.previewApplyOverlay}>
                                            <IconSymbol name="checkmark.circle.fill" size={24} color="#fff" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={styles.controlGroup}>
                            <Text style={styles.subLabel}>Typography & Spacing</Text>

                            <View style={styles.adjustmentItem}>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.miniLabel}>General Font Size</Text>
                                    <Text style={styles.adjustmentValue}>{fontSize.toFixed(1)}rem</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0.5}
                                    maximumValue={3.0}
                                    step={0.1}
                                    value={fontSize}
                                    onValueChange={setFontSize}
                                    minimumTrackTintColor={Colors.light.gold}
                                    maximumTrackTintColor="#d3d3d3"
                                    thumbTintColor={Colors.light.gold}
                                />
                            </View>

                            <View style={styles.adjustmentItem}>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.miniLabel}>Names Font Size *</Text>
                                    <Text style={styles.adjustmentValue}>{namesFontSize.toFixed(1)}rem</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={1.0}
                                    maximumValue={6.0}
                                    step={0.1}
                                    value={namesFontSize}
                                    onValueChange={setNamesFontSize}
                                    minimumTrackTintColor={Colors.light.gold}
                                    maximumTrackTintColor="#d3d3d3"
                                    thumbTintColor={Colors.light.gold}
                                />
                            </View>

                            <View style={styles.adjustmentItem}>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.miniLabel}>Overlay Opacity</Text>
                                    <Text style={styles.adjustmentValue}>{overlayOpacity}%</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={100}
                                    step={1}
                                    value={overlayOpacity}
                                    onValueChange={setOverlayOpacity}
                                    minimumTrackTintColor={Colors.light.gold}
                                    maximumTrackTintColor="#d3d3d3"
                                    thumbTintColor={Colors.light.gold}
                                />
                            </View>

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
                            <Text style={styles.subLabel}>Colors Palette</Text>

                            <Text style={styles.miniLabel}>Text Color</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPalette}>
                                {PRESET_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={`text-${color}`}
                                        onPress={() => setTextColor(color)}
                                        style={[styles.colorSwatch, { backgroundColor: color }, textColor === color && styles.selectedSwatch]}
                                    />
                                ))}
                            </ScrollView>

                            <Text style={styles.miniLabel}>Background Color</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPalette}>
                                {PRESET_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={`bg-${color}`}
                                        onPress={() => setBackgroundColor(color)}
                                        style={[styles.colorSwatch, { backgroundColor: color }, backgroundColor === color && styles.selectedSwatch]}
                                    />
                                ))}
                            </ScrollView>

                            <Text style={styles.miniLabel}>Accent Color</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPalette}>
                                {PRESET_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={`accent-${color}`}
                                        onPress={() => setAccentColor(color)}
                                        style={[styles.colorSwatch, { backgroundColor: color }, accentColor === color && styles.selectedSwatch]}
                                    />
                                ))}
                            </ScrollView>
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
                                        source={typeof backgroundImage === 'string' ? { uri: backgroundImage } : backgroundImage}
                                        resizeMode={ResizeMode.COVER}
                                        isLooping
                                        shouldPlay
                                        isMuted
                                    />
                                ) : (
                                    <Image source={typeof backgroundImage === 'string' ? { uri: backgroundImage } : backgroundImage} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
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
                                <View style={[styles.textPlate, {
                                    backgroundColor: 'rgba(255,255,255,0.75)',
                                    padding: 24,
                                    borderRadius: 16,
                                    width: '85%',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.4)',
                                }]}>
                                    <Text style={[styles.previewTitle, {
                                        fontFamily: fontStyle === 'Roboto' ? 'System' : (Fonts as any)[fontStyle]?.Bold,
                                        color: textColor,
                                        fontSize: namesFontSize * 9,
                                        textAlign: alignment as any,
                                        textShadowColor: 'rgba(0, 0, 0, 0.2)',
                                        textShadowOffset: { width: 1, height: 1 },
                                        textShadowRadius: 3
                                    }]}>
                                        {user?.firstName} & Partner
                                    </Text>
                                    <View style={[styles.divider, { backgroundColor: accentColor, alignSelf: 'center' }]} />
                                    <Text style={[styles.previewMessage, {
                                        fontFamily: fontStyle === 'Roboto' ? 'System' : (Fonts as any)[fontStyle]?.Regular,
                                        color: textColor,
                                        fontSize: fontSize * 11,
                                        textAlign: alignment as any,
                                        lineHeight: fontSize * 18
                                    }]}>
                                        {message}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>

                <Modal
                    visible={showPreviewModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowPreviewModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity
                                style={styles.closeModalButton}
                                onPress={() => setShowPreviewModal(false)}
                            >
                                <IconSymbol name="xmark.circle.fill" size={32} color="#1a1a1a" />
                            </TouchableOpacity>

                            <Text style={styles.modalTitle}>Design Preview</Text>

                            <View style={[styles.previewCard, {
                                backgroundColor: backgroundColor,
                                alignItems: alignment === 'center' ? 'center' : alignment === 'left' ? 'flex-start' : 'flex-end',
                                height: '70%', // Adjust for modal
                                marginTop: 20
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
                                        <Image source={typeof backgroundImage === 'string' ? { uri: backgroundImage } : backgroundImage} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                                    )
                                ) : null}

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
                                    <View style={[styles.textPlate, {
                                        backgroundColor: 'rgba(255,255,255,0.75)',
                                        padding: 28,
                                        borderRadius: 20,
                                        width: '85%',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.5)',
                                    }]}>
                                        <Text style={[styles.previewTitle, {
                                            fontFamily: fontStyle === 'Roboto' ? 'System' : (Fonts as any)[fontStyle]?.Bold,
                                            color: textColor,
                                            fontSize: namesFontSize * 8,
                                            textAlign: alignment as any,
                                            textShadowColor: 'rgba(0, 0, 0, 0.3)',
                                            textShadowOffset: { width: 1, height: 2 },
                                            textShadowRadius: 4
                                        }]}>
                                            {user?.firstName} & {partnerName || 'Partner'}
                                        </Text>
                                        <View style={[styles.divider, { backgroundColor: accentColor, alignSelf: 'center' }]} />
                                        <Text style={[styles.previewMessage, {
                                            fontFamily: fontStyle === 'Roboto' ? 'System' : (Fonts as any)[fontStyle]?.Regular,
                                            color: textColor,
                                            fontSize: fontSize * 10,
                                            textAlign: alignment as any,
                                            marginBottom: 12,
                                            lineHeight: fontSize * 16
                                        }]}>
                                            {message}
                                        </Text>

                                        {(weddingDate || location) && (
                                            <View style={{ marginTop: 10, alignItems: alignment as any }}>
                                                {weddingDate && (
                                                    <Text style={[styles.previewDetail, { color: textColor, fontFamily: Fonts.Cormorant.Regular, fontSize: 16 }]}>
                                                        {weddingDate} {weddingTime ? `at ${weddingTime}` : ''}
                                                    </Text>
                                                )}
                                                {location && (
                                                    <Text style={[styles.previewDetail, { color: textColor, fontFamily: Fonts.Cormorant.Regular, marginTop: 6, fontSize: 14, opacity: 0.9 }]}>
                                                        {location} {venue ? `(${venue})` : ''}
                                                    </Text>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.modalApplyButton}
                                onPress={() => setShowPreviewModal(false)}
                            >
                                <Text style={styles.modalApplyButtonText}>Keep Design</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View >
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
        aspectRatio: 0.65, // Slightly wider for better mobile feel
        borderRadius: 30, // More rounded for modern look
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)', // Subtle gold border
        justifyContent: 'center',
        marginTop: 10,
        backgroundColor: '#fff',
        // Smoother, deeper shadows
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
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
    presetOption: { width: 100, alignItems: 'center', marginRight: 16 },
    presetImage: { width: 100, height: 100, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 6 },
    selectedPreset: { borderColor: Colors.light.gold, borderWidth: 3 },
    presetText: { fontSize: 10, fontFamily: Fonts.Cormorant.Regular, color: Colors.light.textSecondary, textAlign: 'center' },
    disabledButton: {
        opacity: 0.5,
    },
    generatedPreviewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
        position: 'relative',
    },
    generatedPreviewImage: {
        width: '100%',
        height: '100%',
    },
    previewApplyOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        height: '80%',
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 20,
        alignItems: 'center',
        position: 'relative',
    },
    closeModalButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    modalTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: '#1a1a1a',
        marginTop: 10,
    },
    modalApplyButton: {
        backgroundColor: Colors.light.gold,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginTop: 30,
    },
    modalApplyButtonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: Fonts.Cormorant.Bold,
    },
    aiInfoNote: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
    adjustmentItem: {
        marginBottom: 16,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    adjustmentValue: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 14,
        color: Colors.light.gold,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    colorPalette: {
        paddingVertical: 10,
        gap: 12,
        paddingRight: 20,
    },
    colorSwatch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#eee',
    },
    selectedSwatch: {
        borderColor: Colors.light.gold,
        transform: [{ scale: 1.1 }],
    },
    previewDetail: {
        fontSize: 16,
        textAlign: 'center',
    },
    textPlate: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        // Premium glass effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
});
