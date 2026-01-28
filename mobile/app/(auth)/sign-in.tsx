import { useSignIn, useOAuth, useUser } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import React from 'react';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getUserByClerkId, getRoleDashboard, storeUserData } from '@/utils/navigation';

WebBrowser.maybeCompleteAuthSession();

export default function Page() {
    const { signIn, setActive, isSignedIn } = useSignIn();
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const { user } = useUser();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSuccessfulSignIn = async (clerkUserId: string) => {
        try {
            // Fetch user data from backend to get role
            const userData = await getUserByClerkId(clerkUserId);

            if (userData) {
                // Store user data locally
                await storeUserData(userData);

                // Get role-specific dashboard route
                const dashboardRoute = getRoleDashboard(userData.role);

                console.log(`Redirecting ${userData.role} user to ${dashboardRoute}`);
                router.replace(dashboardRoute as any);
            } else {
                // Fallback to default if user not found in backend
                console.warn('User not found in backend, redirecting to default dashboard');
                router.replace('/(tabs)/couple-dashboard' as any);
            }
        } catch (error) {
            console.error('Error during post-signin:', error);
            // Fallback to default dashboard on error
            router.replace('/(tabs)/couple-dashboard' as any);
        }
    };

    const onSignInPress = React.useCallback(async () => {
        if (!isSignedIn) {
            return;
        }

        try {
            const signInAttempt = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId });

                // Get the clerk user ID and redirect based on role
                const clerkUserId = signInAttempt.createdUserId;
                if (clerkUserId) {
                    await handleSuccessfulSignIn(clerkUserId);
                }
            } else {
                console.error(JSON.stringify(signInAttempt, null, 2));
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            alert(err.errors[0].message);
        }
    }, [isSignedIn, emailAddress, password]);

    const onGoogleSignInPress = React.useCallback(async () => {
        try {
            const { createdSessionId, setActive: setActiveSession, signUp } = await startOAuthFlow();
            if (createdSessionId) {
                await setActiveSession({ session: createdSessionId });

                // Get user ID from the session
                if (signUp?.createdUserId) {
                    await handleSuccessfulSignIn(signUp.createdUserId);
                } else if (user?.id) {
                    await handleSuccessfulSignIn(user.id);
                } else {
                    // Fallback
                    router.replace('/(tabs)/couple-dashboard' as any);
                }
            } else {
                // Use signIn or signUp for next steps such as MFA
            }
        } catch (err) {
            console.error('OAuth error', err);
        }
    }, [user]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.content}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue your journey</Text>

                <View style={styles.form}>
                    <TouchableOpacity style={styles.oauthButton} onPress={onGoogleSignInPress}>
                        {/* Simple G icon representation or use an image asset if available */}
                        <View style={styles.googleIcon}>
                            <Text style={styles.googleIconText}>G</Text>
                        </View>
                        <Text style={styles.oauthButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            autoCapitalize="none"
                            value={emailAddress}
                            placeholder="Enter your email"
                            placeholderTextColor="#9ca3af"
                            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            value={password}
                            placeholder="Enter your password"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={true}
                            onChangeText={(password) => setPassword(password)}
                            style={styles.input}
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={onSignInPress}>
                        <Text style={styles.buttonText}>Sign In</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account?</Text>
                        <Link href="/sign-up">
                            <Text style={styles.link}>Sign up</Text>
                        </Link>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 32,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
    },
    form: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    oauthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 10,
    },
    googleIcon: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIconText: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#4285F4',
    },
    oauthButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        fontFamily: Fonts.Cormorant.Regular,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#9ca3af',
        fontSize: 14,
        fontFamily: Fonts.Cormorant.Regular,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#f9fafb',
        color: Colors.light.text,
    },
    button: {
        backgroundColor: Colors.light.gold,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: Fonts.Cormorant.Regular,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        gap: 6,
    },
    footerText: {
        color: Colors.light.textSecondary,
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Regular,
    },
    link: {
        color: Colors.light.gold,
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: Fonts.Cormorant.Regular,
    },
});
