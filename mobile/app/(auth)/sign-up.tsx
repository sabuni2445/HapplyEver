import * as React from 'react';
import { Text, TextInput, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const router = useRouter();

    const [emailAddress, setEmailAddress] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [pendingVerification, setPendingVerification] = React.useState(false);
    const [code, setCode] = React.useState('');

    const onSignUpPress = async () => {
        if (!isLoaded) {
            return;
        }

        try {
            await signUp.create({
                emailAddress,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

            setPendingVerification(true);
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            alert(err.errors[0].message);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) {
            return;
        }

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                router.replace('/(tabs)');
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2));
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            alert(err.errors[0].message);
        }
    };

    const onGoogleSignUpPress = React.useCallback(async () => {
        try {
            const { createdSessionId, setActive } = await startOAuthFlow();
            if (createdSessionId) {
                setActive({ session: createdSessionId });
                router.replace('/(tabs)');
            } else {
                // Use signIn or signUp for next steps such as MFA
            }
        } catch (err) {
            console.error('OAuth error', err);
        }
    }, []);

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
                {!pendingVerification && (
                    <>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Begin your wedding planning journey</Text>

                        <View style={styles.form}>
                            <TouchableOpacity style={styles.oauthButton} onPress={onGoogleSignUpPress}>
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
                                    onChangeText={(email) => setEmailAddress(email)}
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    value={password}
                                    placeholder="Create a password"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={true}
                                    onChangeText={(password) => setPassword(password)}
                                    style={styles.input}
                                />
                            </View>

                            <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
                                <Text style={styles.buttonText}>Sign Up</Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account?</Text>
                                <Link href="/sign-in">
                                    <Text style={styles.link}>Sign in</Text>
                                </Link>
                            </View>
                        </View>
                    </>
                )}

                {pendingVerification && (
                    <>
                        <Text style={styles.title}>Verify Email</Text>
                        <Text style={styles.subtitle}>Enter the code sent to your email</Text>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    value={code}
                                    placeholder="Verification Code"
                                    placeholderTextColor="#9ca3af"
                                    onChangeText={(code) => setCode(code)}
                                    style={styles.input}
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={onPressVerify}>
                                <Text style={styles.buttonText}>Verify Email</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
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
