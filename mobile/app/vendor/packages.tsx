import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState } from 'react';
import { initializeVendorPackageUpgrade, manualVendorPackageUpgrade, verifyVendorPackagePayment } from '@/utils/api';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

export default function PackagesScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<string>('MONTH_1');

    const packages = [
        {
            type: 'NORMAL',
            basePrice: 0,
            priceLabel: 'Free',
            features: ['Up to 2 Services', '1 Image per service', 'Basic support'],
            color: ['#9ca3af', '#4b5563'],
            icon: 'person.fill'
        },
        {
            type: 'GOLD',
            basePrice: 1500,
            priceLabel: 'ETB 1,500/mo',
            features: ['Up to 10 Services', '5 Images per service', 'Priority listing', 'Teaser video'],
            color: ['#fbbf24', '#d97706'],
            icon: 'star.fill'
        },
        {
            type: 'PREMIUM',
            basePrice: 3500,
            priceLabel: 'ETB 3,500/mo',
            features: ['Unlimited Services', '10 Images per service', 'Featured status', 'Full video support', 'Advanced analytics'],
            color: [Colors.light.gold, '#b8962e'],
            icon: 'crown.fill'
        }
    ];

    const durationOptions = [
        { label: '1 Month', value: 'MONTH_1', multiplier: 1 },
        { label: '6 Months', value: 'MONTH_6', multiplier: 6 },
        { label: '12 Months', value: 'MONTH_12', multiplier: 12 },
    ];

    const handlePackagePress = (pkg: any) => {
        if (pkg.type === 'NORMAL') {
            Alert.alert("Info", "You are already on the Normal plan or can downgrade easily. Please contact support for downgrades.");
            return;
        }
        setSelectedPackage(pkg);
        setShowDurationModal(true);
    };

    const confirmDuration = (duration: string) => {
        setSelectedDuration(duration);
        setShowDurationModal(false);
        setShowPaymentModal(true);
    };

    const handleUpgrade = async (method: 'CHAPA' | 'MANUAL') => {
        if (!selectedPackage || !user) return;

        const durationObj = durationOptions.find(d => d.value === selectedDuration);
        const amount = selectedPackage.basePrice * (durationObj?.multiplier || 1);

        setIsLoading(true);
        try {
            const params = {
                clerkId: user.id,
                type: selectedPackage.type,
                duration: selectedDuration,
                amount: amount
            };

            if (method === 'CHAPA') {
                const response = await initializeVendorPackageUpgrade(params);
                if (response.success && response.checkout_url) {
                    setShowPaymentModal(false);
                    await WebBrowser.openBrowserAsync(response.checkout_url);

                    const txRef = response.tx_ref;

                    Alert.alert(
                        "Payment Verification",
                        "Did you complete the payment?",
                        [
                            { text: "No", style: "cancel" },
                            {
                                text: "Yes",
                                onPress: async () => {
                                    try {
                                        const verify = await verifyVendorPackagePayment(txRef);
                                        if (verify.success) {
                                            Alert.alert("Success", "Package upgraded successfully!");
                                            await user?.reload();
                                            router.replace('/(tabs)');
                                        } else {
                                            Alert.alert("Pending", "Payment verification pending. Please refresh your dashboard shortly.");
                                        }
                                    } catch (e) {
                                        Alert.alert("Error", "Could not verify payment status.");
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    Alert.alert("Error", response.error || "Failed to initialize payment");
                }
            } else {
                await manualVendorPackageUpgrade(params);
                setShowPaymentModal(false);
                Alert.alert(
                    "Request Sent",
                    "Your upgrade request has been sent for manual approval. Please provide proof of payment to our office.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            }
        } catch (error) {
            console.error("Upgrade error:", error);
            Alert.alert("Error", "Failed to process upgrade request.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Service Plans</Text>
                    <Text style={styles.subtitle}>Choose the best plan for your business</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {packages.map((pkg) => (
                    <TouchableOpacity
                        key={pkg.type}
                        style={styles.packageCard}
                        onPress={() => handlePackagePress(pkg)}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={pkg.color as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.iconContainer}>
                                    <IconSymbol name={pkg.icon as any} size={28} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.pkgType}>{pkg.type}</Text>
                                    <Text style={styles.pkgPrice}>{pkg.priceLabel}</Text>
                                </View>
                            </View>

                            <View style={styles.features}>
                                {pkg.features.map((feature, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <IconSymbol name="checkmark.circle.fill" size={16} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.selectBtn}>
                                <Text style={styles.selectBtnText}>Select {pkg.type}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal visible={showDurationModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Duration</Text>
                        <Text style={styles.modalSubtitle}>How long would you like to subscribe?</Text>

                        {durationOptions.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={styles.optionBtn}
                                onPress={() => confirmDuration(opt.value)}
                            >
                                <Text style={styles.optionText}>{opt.label}</Text>
                                <Text style={styles.optionPrice}>
                                    ETB {(selectedPackage?.basePrice * opt.multiplier).toLocaleString()}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setShowDurationModal(false)}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showPaymentModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Payment Method</Text>
                        <Text style={styles.modalSubtitle}>Choose how you want to pay</Text>

                        {isLoading ? (
                            <ActivityIndicator size="large" color={Colors.light.gold} style={{ marginVertical: 20 }} />
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.optionBtn, styles.chapaBtn]}
                                    onPress={() => handleUpgrade('CHAPA')}
                                >
                                    <IconSymbol name="creditcard.fill" size={20} color="#fff" />
                                    <Text style={[styles.optionText, { color: '#fff' }]}>Pay with Chapa (Telebirr/Card)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.optionBtn, styles.manualBtn]}
                                    onPress={() => handleUpgrade('MANUAL')}
                                >
                                    <IconSymbol name="doc.text.fill" size={20} color={Colors.light.text} />
                                    <Text style={styles.optionText}>Manual Approval Request</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setShowPaymentModal(false)}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
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
        gap: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 28,
        color: Colors.light.text,
    },
    subtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    packageCard: {
        borderRadius: 32,
        marginBottom: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    cardGradient: {
        padding: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    pkgType: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: '#fff',
    },
    pkgPrice: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
    },
    features: {
        marginBottom: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    featureText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: '#fff',
    },
    selectBtn: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    selectBtnText: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
        color: Colors.light.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        elevation: 5,
    },
    modalTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    optionBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 12,
        gap: 12,
    },
    optionText: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: Colors.light.text,
    },
    optionPrice: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: Colors.light.gold,
    },
    chapaBtn: {
        backgroundColor: '#0ea5e9',
        borderColor: '#0284c7',
        justifyContent: 'center',
    },
    manualBtn: {
        justifyContent: 'center',
    },
    cancelBtn: {
        marginTop: 12,
        padding: 16,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: '#ef4444',
    },
});
