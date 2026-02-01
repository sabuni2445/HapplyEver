import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { requestMeeting, syncUserToDatabase } from '@/utils/api';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export default function MeetingRequestScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [purpose, setPurpose] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dbUserId, setDbUserId] = useState<number | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            if (user) {
                try {
                    const dbUser = await syncUserToDatabase(user);
                    setDbUserId(dbUser?.user?.id || dbUser?.id);
                } catch (err) {
                    console.error("Error syncing user for meeting:", err);
                }
            }
        };
        loadUser();
    }, [user]);

    const handleRequestMeeting = async () => {
        if (!purpose.trim()) {
            Alert.alert("Required", "Please provide a purpose for the meeting.");
            return;
        }

        if (!dbUserId) {
            Alert.alert("Error", "User not found in database.");
            return;
        }

        setLoading(true);
        try {
            // Format date to ISO string for backend
            const meetingTime = date.toISOString();

            await requestMeeting({
                coupleId: dbUserId,
                meetingTime,
                purpose
            });

            Alert.alert(
                "Request Sent! 📅",
                "Your meeting has been scheduled and a Jitsi link has been sent to your email.",
                [{ text: "Great", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error("Error requesting meeting:", error);
            Alert.alert("Fail", "Failed to send meeting request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
                setDate(selectedDate);
            }
        } else {
            // iOS logic
            if (selectedDate) {
                setDate(selectedDate);
            }
        }
    };

    const showPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: date,
                onChange: (event, selectedDate) => {
                    if (event.type === 'set' && selectedDate) {
                        // After date is set, open time picker
                        const dateOnly = selectedDate;
                        DateTimePickerAndroid.open({
                            value: date,
                            onChange: (event, selectedTime) => {
                                if (event.type === 'set' && selectedTime) {
                                    const finalDate = new Date(dateOnly);
                                    finalDate.setHours(selectedTime.getHours());
                                    finalDate.setMinutes(selectedTime.getMinutes());
                                    setDate(finalDate);
                                }
                                setShowDatePicker(false);
                            },
                            mode: 'time',
                            is24Hour: true,
                        });
                    } else {
                        setShowDatePicker(false);
                    }
                },
                mode: 'date',
                minimumDate: new Date(),
            });
        } else {
            setShowDatePicker(true);
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
                    <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Request Meeting</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <IconSymbol name="calendar.badge.plus" size={48} color={Colors.light.gold} style={styles.mainIcon} />
                    <Text style={styles.cardTitle}>Meet Your Manager</Text>
                    <Text style={styles.description}>
                        Need to discuss your wedding plans? Schedule a video call with our expert manager using Jitsi.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Meeting Purpose</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Budget review, Venue selection..."
                            value={purpose}
                            onChangeText={setPurpose}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Select Date & Time</Text>
                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={showPicker}
                        >
                            <IconSymbol name="calendar" size={20} color={Colors.light.gold} />
                            <Text style={styles.dateText}>
                                {date.toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </TouchableOpacity>

                        {Platform.OS === 'ios' && showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="datetime"
                                is24Hour={true}
                                display="default"
                                onChange={onChangeDate}
                                minimumDate={new Date()}
                            />
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleRequestMeeting}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <IconSymbol name="paperplane.fill" size={18} color="#fff" />
                                <Text style={styles.submitButtonText}>Send Meeting Request</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.infoBox}>
                        <IconSymbol name="info.circle" size={16} color={Colors.light.textSecondary} />
                        <Text style={styles.infoText}>
                            The meeting link will be emailed to you immediately after request.
                        </Text>
                    </View>
                </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    title: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        alignItems: 'center',
    },
    mainIcon: {
        marginBottom: 16,
    },
    cardTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.text,
        marginBottom: 8,
    },
    description: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fdf6f0',
        borderRadius: 12,
        padding: 15,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.text,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        textAlignVertical: 'top',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fdf6f0',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        gap: 12,
    },
    dateText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.text,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: Colors.light.gold,
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 16,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
        paddingHorizontal: 10,
    },
    infoText: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontStyle: 'italic',
    }
});
