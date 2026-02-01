import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Platform, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useCallback } from 'react';
import { useAuth, useOAuth, useUser } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { getUserFromDatabase } from '@/utils/api';

// Warm up the android browser to improve UX
export const useWarmUpBrowser = () => {
    useEffect(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    useWarmUpBrowser();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleRedirect = async (userId: string) => {
        try {
            const dbUser = await getUserFromDatabase(userId);

            // If user doesn't exist in DB at all, they MUST onboard
            if (!dbUser) {
                router.replace('/onboarding');
                return;
            }

            const role = dbUser?.selectedRole || dbUser?.role;

            // If they exist but haven't picked a role (or default COUPLE but no wedding etc), 
            // we check if we should still send them to onboarding.
            // But usually, role check is enough.
            if (!role) {
                router.replace('/onboarding');
                return;
            }

            if (role === 'VENDOR' || role === 'vendor') {
                router.replace('/(tabs)/vendor');
            } else if (role === 'PROTOCOL' || role === 'protocol') {
                router.replace('/(tabs)/protocol');
            } else if (role === 'MANAGER' || role === 'manager') {
                router.replace('/(tabs)/management');
            } else if (role === 'ADMIN' || role === 'admin') {
                // For admin if they use mobile, maybe just tabs or a specific view
                router.replace('/(tabs)');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error) {
            console.error("Redirect error:", error);
            // On error, let them try to onboard or go to tabs
            router.replace('/onboarding');
        }
    };

    useEffect(() => {
        // Check auth state after animation
        const checkAuth = async () => {
            if (isLoaded && isSignedIn && user) {
                setTimeout(() => {
                    handleRedirect(user.id);
                }, 1000);
            } else if (isLoaded) {
                // Check for backend-only session
                try {
                    const userData = await AsyncStorage.getItem('user');
                    if (userData) {
                        const parsedUser = JSON.parse(userData);
                        const role = parsedUser.selectedRole || parsedUser.role || 'COUPLE';
                        setTimeout(() => {
                            if (role === 'VENDOR') router.replace('/(tabs)/vendor');
                            else if (role === 'PROTOCOL') router.replace('/(tabs)/protocol');
                            else if (role === 'MANAGER') router.replace('/(tabs)/management');
                            else router.replace('/(tabs)');
                        }, 1000);
                    }
                } catch (error) {
                    console.error("Error checking local auth:", error);
                }
            }
        };

        checkAuth();

        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [isLoaded, isSignedIn]);

    const handleLogin = useCallback(async () => {
        try {
            const { createdSessionId, setActive, signUp, signIn } = await startOAuthFlow({
                redirectUrl: Linking.createURL('/(tabs)', { scheme: 'myapp' }),
            });

            if (createdSessionId) {
                setActive!({ session: createdSessionId });
                router.replace('/(tabs)');
            } else {
                // Use signIn or signUp for next steps such as MFA
            }
        } catch (err) {
            console.error('OAuth error', err);
        }
    }, []);

    const handleEmailLogin = () => {
        router.push('/sign-in');
    };

    // Generate random floating hearts
    const hearts = Array.from({ length: 15 }).map((_, i) => {
        const startX = Math.random() * width;
        const delay = Math.random() * 5000;
        const duration = 5000 + Math.random() * 5000;
        const size = 16 + Math.random() * 20;

        const anim = useRef(new Animated.Value(height)).current;
        const opacity = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(opacity, {
                            toValue: 0.6,
                            duration: 1000,
                            delay: delay,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: duration - 1000,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.timing(anim, {
                        toValue: -100,
                        duration: duration,
                        delay: delay,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        return (
            <Animated.Text
                key={i}
                style={{
                    position: 'absolute',
                    left: startX,
                    transform: [{ translateY: anim }],
                    opacity: opacity,
                    fontSize: size,
                    color: '#d48bb8',
                }}
            >
                ❤️
            </Animated.Text>
        );
    });

    return (
        <View style={styles.container}>
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070' }}
                    style={styles.heroImage}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.editorialHeader}>
                    <Text style={styles.preTitle}>ESTABLISHED MMXXV</Text>
                    <View style={styles.titleWrapper}>
                        <Text style={styles.titleMain}>Elegant</Text>
                        <View style={styles.ampersandBox}>
                            <Text style={styles.ampersand}>&</Text>
                        </View>
                        <Text style={styles.titleSub}>Events</Text>
                    </View>
                    <View style={styles.luxuryDivider} />
                    <Text style={styles.tagline}>FOR EXTRAORDINARY LOVE STORIES</Text>
                </View>

                <View style={styles.bottomSection}>
                    {!isSignedIn ? (
                        <View style={styles.buttonContainer}>
                            <BlurView intensity={20} tint="light" style={styles.glassButtonWrapper}>
                                <TouchableOpacity style={styles.premiumButton} onPress={handleLogin}>
                                    <View style={styles.iconCircle}>
                                        <Text style={styles.gText}>G</Text>
                                    </View>
                                    <Text style={styles.premiumButtonText}>Continue with Google</Text>
                                </TouchableOpacity>
                            </BlurView>

                            <TouchableOpacity style={styles.emailButton} onPress={handleEmailLogin}>
                                <Text style={styles.emailButtonText}>Sign in with Email</Text>
                                <View style={styles.emailUnderline} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ActivityIndicator color={Colors.light.gold} size="large" />
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a1a' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 30, paddingTop: 100, paddingBottom: 60 },

    editorialHeader: { alignItems: 'center' },
    preTitle: { fontFamily: Fonts.Playfair.Bold, fontSize: 10, letterSpacing: 4, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
    titleWrapper: { alignItems: 'center' },
    titleMain: { fontFamily: Fonts.Playfair.Bold, fontSize: 52, color: '#fff', letterSpacing: 2 },
    titleSub: { fontFamily: Fonts.Playfair.Bold, fontSize: 52, color: '#fff', letterSpacing: 2, marginTop: -10 },
    ampersandBox: { paddingVertical: 5 },
    ampersand: { fontFamily: Fonts.Cormorant.Regular, fontSize: 32, color: Colors.light.gold, fontStyle: 'italic' },
    luxuryDivider: { width: 40, height: 1, backgroundColor: Colors.light.gold, marginVertical: 30 },
    tagline: { fontFamily: Fonts.Cormorant.Regular, fontSize: 14, letterSpacing: 5, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

    bottomSection: { width: '100%', alignItems: 'center' },
    buttonContainer: { width: '100%', gap: 20 },
    glassButtonWrapper: { borderRadius: 100, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    premiumButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, justifyContent: 'center', gap: 15 },
    iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    gText: { color: '#000', fontSize: 14, fontWeight: '700' },
    premiumButtonText: { color: '#fff', fontSize: 15, fontFamily: Fonts.Playfair.Bold, letterSpacing: 2 },

    emailButton: { paddingVertical: 10, alignItems: 'center' },
    emailButtonText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: Fonts.Playfair.Bold, letterSpacing: 3, textTransform: 'uppercase' },
    emailUnderline: { width: 20, height: 1, backgroundColor: Colors.light.gold, marginTop: 8 },
});
