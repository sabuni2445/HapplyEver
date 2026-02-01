import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserFromDatabase, getMessages, sendMessage, getMeetingRequests } from '@/utils/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function MessagesScreen() {
    const { user } = useUser();
    const [userId, setUserId] = useState<number | null>(null);
    const [clerkId, setClerkId] = useState<string | null>(null);
    const [managerId, setManagerId] = useState<string | null>(null);
    const [managerInfo, setManagerInfo] = useState<any>(null);
    const [messages, setMessages] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState('messages');
    const [loading, setLoading] = useState(true);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [conversation, setConversation] = useState<any[]>([]);
    const [isChatView, setIsChatView] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [chatPartner, setChatPartner] = useState<any>(null);

    useEffect(() => {
        loadUser();
    }, [user]);

    useEffect(() => {
        if (userId) {
            loadData();
        }
    }, [userId]);

    const loadUser = async () => {
        try {
            if (user) {
                const dbUser = await getUserFromDatabase(user.id);
                setUserId(dbUser.id);
                setClerkId(user.id);
                const currentRole = dbUser.selectedRole || dbUser.role || 'COUPLE';
                setRole(currentRole);

                // Get wedding assignment to find manager
                if (currentRole === 'PROTOCOL' || currentRole === 'COUPLE') {
                    try {
                        const { getAssignmentByCouple, getUserFromDatabase } = require('@/utils/api');
                        const assignment = await getAssignmentByCouple(user.id);
                        if (assignment?.managerClerkId) {
                            setManagerId(assignment.managerClerkId);
                            // Fetch manager info to show in chat
                            const mInfo = await getUserFromDatabase(assignment.managerClerkId);
                            setManagerInfo(mInfo);
                        }
                    } catch (err) {
                        console.log('No assignment found');
                    }
                }
            } else {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setUserId(parsedUser.id);
                    setClerkId(parsedUser.clerkId);
                    setRole(parsedUser.selectedRole || parsedUser.role || 'PROTOCOL');
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            // Use clerkId for messages (backend expects clerkId)
            const { getInbox } = require('@/utils/api');
            const messagesData = await getInbox(clerkId);
            setMessages(messagesData || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversation = async (otherClerkId: string) => {
        try {
            const { getConversation } = require('@/utils/api');
            const data = await getConversation(clerkId, otherClerkId);
            setConversation(data || []);
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const handleSendMessage = async () => {
        const receiverId = isChatView ? selectedChatId : managerId;

        if (!newMessage.trim() || !receiverId) {
            Alert.alert('Error', 'Cannot send message - no recipient identified');
            return;
        }

        try {
            const { sendMessageByClerkId } = require('@/utils/api');
            await sendMessageByClerkId(clerkId, receiverId, newMessage);
            setNewMessage('');
            if (isChatView) {
                fetchConversation(receiverId);
            } else {
                loadData();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const openChat = async (otherUser: any) => {
        if (!otherUser) return;

        setIsChatView(true);
        setSelectedChatId(otherUser.clerkId);
        setChatPartner(otherUser);
        fetchConversation(otherUser.clerkId);
    };

    // Protocol Role: We no longer force direct chat immediately
    // but we can offer it in the inbox or as a quick link
    // useEffect(() => {
    //     if (role === 'PROTOCOL' && managerId) {
    //         setIsChatView(true);
    //         setSelectedChatId(managerId);
    //         fetchConversation(managerId);
    //     }
    // }, [role, managerId]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {isChatView ? (
                <View style={[styles.chatHeader, { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }]}>
                    <TouchableOpacity onPress={() => setIsChatView(false)} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={Colors.light.gold} />
                    </TouchableOpacity>
                    <View style={styles.chatTitleContainer}>
                        <View style={[styles.smallAvatar, { backgroundColor: Colors.light.gold }]}>
                            <Text style={styles.smallAvatarText}>
                                {(chatPartner?.firstName?.[0] || 'M').toUpperCase()}
                            </Text>
                        </View>
                        <View>
                            <Text style={[styles.chatTitle, { fontFamily: 'PlayfairDisplay-Bold' }]}>{chatPartner?.firstName} {chatPartner?.lastName}</Text>
                            <Text style={[styles.chatSubtitle, { color: '#64748b' }]}>
                                {chatPartner?.selectedRole === 'MANAGER' ? 'Wedding Manager' :
                                    chatPartner?.selectedRole === 'PROTOCOL' ? 'Protocol Officer' : 'Couple'}
                            </Text>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#fdf6f0', '#fff']}
                        style={styles.headerGradient}
                    />
                    <Text style={[styles.title, { fontFamily: 'PlayfairDisplay-Bold', fontSize: 32 }]}>Conversation</Text>
                </View>
            )}

            <ScrollView style={styles.content}>
                {isChatView ? (
                    <View style={styles.chatContainer}>
                        {conversation.length === 0 ? (
                            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                                <Text style={{ fontSize: 20, fontWeight: '600', color: '#999', marginTop: 20 }}>No history yet</Text>
                            </View>
                        ) : (
                            conversation.map((msg: any, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.bubble,
                                        msg.sender?.clerkId === clerkId ? styles.myBubble : styles.otherBubble
                                    ]}
                                >
                                    <Text style={[
                                        styles.bubbleText,
                                        msg.sender?.clerkId === clerkId ? styles.myBubbleText : styles.otherBubbleText
                                    ]}>
                                        {msg.content}
                                    </Text>
                                    <Text style={styles.bubbleTime}>
                                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                ) : (
                    <View style={styles.messagesContainer}>
                        {role === 'PROTOCOL' && managerId && (
                            <TouchableOpacity
                                style={[styles.messageCard, { borderColor: Colors.light.gold, borderWidth: 1 }]}
                                onPress={() => openChat(managerInfo)}
                            >
                                <View style={styles.messageHeader}>
                                    <View style={[styles.avatarCircle, { backgroundColor: Colors.light.gold }]}>
                                        <Text style={styles.avatarText}>
                                            {(managerInfo?.firstName?.[0] || 'M').toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.messageInfo}>
                                        <Text style={styles.messageSender}>
                                            {managerInfo?.firstName || 'Wedding'} {managerInfo?.lastName || 'Manager'}
                                        </Text>
                                        <Text style={[styles.messageTime, { color: Colors.light.gold, fontWeight: '700' }]}>
                                            Your Assigned Manager
                                        </Text>
                                    </View>
                                    <IconSymbol name="plus" size={20} color={Colors.light.gold} />
                                </View>
                                <Text style={styles.messageText}>Tap to start or continue chatting with your manager.</Text>
                            </TouchableOpacity>
                        )}
                        {messages.length === 0 ? (
                            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                                <IconSymbol name="message.fill" size={64} color={Colors.light.textSecondary} />
                                <Text style={{ fontSize: 20, fontWeight: '600', color: '#999', marginTop: 20 }}>No messages yet</Text>
                                <Text style={{ fontSize: 14, color: '#ccc', marginTop: 8 }}>Start a conversation with your manager</Text>
                            </View>
                        ) : (
                            messages.map((msg: any, index) => {
                                const otherUser = msg.sender?.clerkId === clerkId ? msg.receiver : msg.sender;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.messageCard}
                                        onPress={() => openChat(otherUser)}
                                    >
                                        <View style={styles.messageHeader}>
                                            <View style={styles.avatarCircle}>
                                                <Text style={styles.avatarText}>
                                                    {(otherUser?.firstName?.[0] || 'M').toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.messageInfo}>
                                                <Text style={styles.messageSender}>
                                                    {otherUser?.firstName} {otherUser?.lastName}
                                                </Text>
                                                <Text style={styles.messageTime}>
                                                    {new Date(msg.sentAt).toLocaleDateString()} at {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            {!msg.read && msg.receiver?.clerkId === clerkId && (
                                                <View style={styles.unreadBadge}>
                                                    <Text style={styles.unreadText}>New</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.messageText} numberOfLines={2}>{msg.content}</Text>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}
            </ScrollView>

            {isChatView ? (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Reply to manager..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                        <IconSymbol name="paperplane.fill" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Quick message to manager..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                        <IconSymbol name="paperplane.fill" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
        color: Colors.light.text,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 15,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    chatTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    smallAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.light.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallAvatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    chatSubtitle: {
        fontSize: 12,
        color: Colors.light.gold,
        fontWeight: '600',
    },
    chatContainer: {
        paddingVertical: 10,
    },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
        marginBottom: 8,
    },
    myBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.light.gold,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myBubbleText: {
        color: '#fff',
    },
    otherBubbleText: {
        color: '#333',
    },
    bubbleTime: {
        fontSize: 10,
        color: 'rgba(0,0,0,0.4)',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    tabs: {
        flexDirection: 'row',
        gap: 10,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: `${Colors.light.gold}20`,
    },
    tabText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    activeTabText: {
        color: Colors.light.gold,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    messagesContainer: {
        gap: 10,
    },
    messageCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 12,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.light.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    messageInfo: {
        flex: 1,
    },
    messageSender: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 2,
    },
    messageText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    messageTime: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    unreadBadge: {
        backgroundColor: Colors.light.gold,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    myMessage: {
        backgroundColor: `${Colors.light.gold}15`,
        alignSelf: 'flex-end',
        maxWidth: '80%',
    },
    meetingsContainer: {
        gap: 15,
    },
    meetingCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    meetingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    meetingTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    meetingDate: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    meetingNotes: {
        fontSize: 14,
        color: '#999',
        marginBottom: 10,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusPENDING: {
        backgroundColor: '#FFA50020',
    },
    statusACCEPTED: {
        backgroundColor: '#10B98120',
    },
    statusREJECTED: {
        backgroundColor: '#EF444420',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    headerGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    meetingBody: {
        marginVertical: 15,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    meetingLabel: {
        fontFamily: 'PlayfairDisplay-Bold',
    },
    meetingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    meetingActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtnSmall: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: Colors.light.gold,
    },
    declineBtn: {
        backgroundColor: '#fee2e2',
    },
    actionBtnTextSmall: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: Colors.light.gold,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
