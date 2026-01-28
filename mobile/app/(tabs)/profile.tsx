import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
    const { user } = useUser();
    const { signOut } = useAuth();

    if (!user) return null;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileCard}>
                    <Image
                        source={{ uri: user.imageUrl }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{user.fullName}</Text>
                    <Text style={styles.email}>{user.primaryEmailAddress?.emailAddress}</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>First Name</Text>
                        <Text style={styles.value}>{user.firstName}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>Last Name</Text>
                        <Text style={styles.value}>{user.lastName}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{user.primaryEmailAddress?.emailAddress}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
                    <IconSymbol name="arrow.right.square" size={20} color="#ef4444" />
                    <Text style={styles.signOutText}>Sign Out</Text>
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
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 32,
        color: Colors.light.text,
    },
    content: {
        padding: 24,
        paddingTop: 0,
    },
    profileCard: {
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 20,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: Colors.light.gold,
    },
    name: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
        marginBottom: 4,
    },
    email: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoItem: {
        paddingVertical: 12,
    },
    label: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 4,
    },
    value: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: Colors.light.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    signOutText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        color: '#ef4444',
        fontWeight: '600',
    },
});
