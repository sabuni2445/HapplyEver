import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { getWeddingDetails, getGuests, getWeddingMessages, sendWeddingMessage } from '@/utils/api';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Picker } from '@react-native-picker/picker';

export default function GuestMessagingScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [wedding, setWedding] = useState<any>(null);
    const [guests, setGuests] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState("ALL");
    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (user) {
            try {
                const weddingData = await getWeddingDetails(user.id);
                setWedding(weddingData);

                if (weddingData?.id) {
                    const [guestsData, messagesData] = await Promise.all([
                        getGuests(user.id),
                        getWeddingMessages(weddingData.id)
                    ]);
                    setGuests(guestsData || []);
                    setMessages(messagesData || []);
                }
            } catch (error) {
                console.error("Error loading messaging data:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !wedding) return;

        setSending(true);
        try {
            await sendWeddingMessage({
                weddingId: wedding.id,
                senderClerkId: user?.id,
                senderType: "COUPLE",
                recipientType: selectedRecipient === "ALL" ? "ALL_GUESTS" : "SPECIFIC_GUEST",
                recipientGuestId: selectedRecipient !== "ALL" ? parseInt(selectedRecipient) : null,
                message: messageText,
                isBroadcast: selectedRecipient === "ALL"
            });

            setMessageText("");
            setSelectedRecipient("ALL");
            Alert.alert("Success", "Message sent successfully!");
            loadData(); // Refresh messages
        } catch (error) {
            Alert.alert("Error", "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.gold} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={28} color={Colors.light.gold} />
                </TouchableOpacity>
                <Text style={styles.title}>Guest Messaging</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>To:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedRecipient}
                            onValueChange={(itemValue) => setSelectedRecipient(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="All Guests (Broadcast)" value="ALL" />
                            {guests.map((guest) => (
                                <Picker.Item
                                    key={guest.id}
                                    label={`${guest.firstName} ${guest.lastName}`}
                                    value={guest.id.toString()}
                                />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Message:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={selectedRecipient === "ALL" ? "e.g., Ceremony starts in 1 hour!" : "Type your message..."}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, (!messageText.trim() || sending) && styles.disabledButton]}
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                                <Text style={styles.sendButtonText}>Send Message</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Recent Messages</Text>
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <View key={msg.id} style={styles.messageItem}>
                            <View style={styles.messageHeader}>
                                <Text style={styles.sender}>
                                    {msg.senderType === "COUPLE" ? "You" : "Guest"}
                                </Text>
                                <Text style={styles.time}>
                                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <Text style={styles.messageText}>{msg.message}</Text>
                            {msg.isBroadcast && (
                                <View style={styles.broadcastBadge}>
                                    <Text style={styles.broadcastText}>Broadcast</Text>
                                </View>
                            )}
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No messages yet.</Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    backButton: {
        padding: 8,
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
    },
    content: {
        padding: 24,
        paddingTop: 0,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    label: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        height: 100,
    },
    sendButton: {
        backgroundColor: Colors.light.gold,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    sendButtonText: {
        color: '#fff',
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 18,
        fontWeight: '600',
    },
    sectionTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.text,
        marginBottom: 16,
    },
    messageItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: Colors.light.gold,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sender: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 16,
        color: Colors.light.text,
    },
    time: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    messageText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        lineHeight: 22,
    },
    broadcastBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 8,
    },
    broadcastText: {
        color: '#d97706',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.light.textSecondary,
        marginTop: 20,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
    },
});
