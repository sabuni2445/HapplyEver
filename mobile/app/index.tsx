import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
            const role = dbUser?.selectedRole || 'USER';

            if (role === 'VENDOR') {
                router.replace('/(tabs)/vendor');
            } else if (role === 'PROTOCOL') {
                router.replace('/(tabs)/protocol');
            } else if (role === 'MANAGER') {
                router.replace('/(tabs)/management');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error) {
            router.replace('/(tabs)');
        }
    };

    useEffect(() => {
        // Check auth state after animation
        if (isLoaded && isSignedIn && user) {
            setTimeout(() => {
                handleRedirect(user.id);
            }, 1000);
        }

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
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1', '#fffaf5', '#fef9f3']}
                style={styles.background}
            />

            {/* Floating Hearts */}
            {hearts}

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <Animated.View
                    style={[
                        styles.logoContainer,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <IconSymbol name="sparkles" size={48} color="#fff" />
                </Animated.View>

                <Text style={styles.title}>ElegantEvents</Text>
                <Text style={styles.subtitle}>WHERE DREAMS BECOME REALITY</Text>

                <View style={styles.messageContainer}>
                    <Text style={styles.welcomeTitle}>Welcome to Your Wedding Journey</Text>
                    <Text style={styles.welcomeText}>
                        Plan your perfect day with our comprehensive wedding management platform.
                        From guest lists to vendor coordination, we've got you covered.
                    </Text>
                </View>

                {!isSignedIn && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={handleLogin}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.googleIcon}>G</Text>
                            </View>
                            <Text style={styles.buttonText}>Continue with Google</Text>
                            <IconSymbol name="arrow.right" size={20} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={handleEmailLogin}>
                            <Text style={styles.secondaryButtonText}>Continue with Email</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        alignItems: 'center',
        padding: 20,
        width: '100%',
        maxWidth: 400,
        zIndex: 10,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.light.gold,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 42,
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        letterSpacing: 2,
        marginBottom: 40,
        textAlign: 'center',
    },
    messageContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    welcomeTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    welcomeText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.gold,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 50,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        gap: 10,
    },
    iconContainer: {
        width: 24,
        height: 24,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIcon: {
        color: Colors.light.gold,
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: Fonts.Cormorant.Regular,
    },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    secondaryButtonText: {
        color: Colors.light.textSecondary,
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Regular,
        textDecorationLine: 'underline',
    },
});
