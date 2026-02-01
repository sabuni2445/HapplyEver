import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { getWeddingDetails, createWeddingDetails, updateWeddingDetails } from '@/utils/api';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export default function WeddingFormScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [formData, setFormData] = useState({
        partnersName: '',
        weddingDate: new Date(),
        weddingTime: '',
        location: '',
        venue: '',
        numberOfGuests: '',
        budget: '',
        theme: '',
        catering: '',
        decorations: '',
        music: '',
        photography: '',
        rules: '',
        additionalNotes: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                try {
                    const data = await getWeddingDetails(user.id);
                    if (data) {
                        setFormData({
                            ...data,
                            weddingDate: data.weddingDate ? new Date(data.weddingDate) : new Date(),
                            numberOfGuests: data.numberOfGuests ? String(data.numberOfGuests) : '',
                            budget: data.budget ? String(data.budget) : ''
                        });
                        setIsEditing(true);
                    }
                } catch (error) {
                    console.log("No existing wedding details found");
                }
            }
        };
        loadData();
    }, [user]);

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                numberOfGuests: parseInt(formData.numberOfGuests) || 0,
                budget: parseFloat(formData.budget) || 0,
                weddingDate: formData.weddingDate.toISOString()
            };

            if (isEditing) {
                await updateWeddingDetails(user!.id, payload);
                Alert.alert("Success", "Wedding details updated!");
            } else {
                await createWeddingDetails(user!.id, payload);
                Alert.alert("Success", "Wedding details created!");
            }
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to save wedding details");
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
                setFormData({ ...formData, weddingDate: selectedDate });
            }
        } else {
            if (selectedDate) {
                setFormData({ ...formData, weddingDate: selectedDate });
            }
            setShowDatePicker(false);
        }
    };

    const showPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: formData.weddingDate,
                onChange: onDateChange,
                mode: 'date',
                display: 'default',
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
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{isEditing ? "Edit Wedding" : "Create Wedding"}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Partner's Name</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.partnersName}
                        onChangeText={(text) => setFormData({ ...formData, partnersName: text })}
                        placeholder="Enter partner's name"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Wedding Date</Text>
                    <TouchableOpacity onPress={showPicker} style={styles.input}>
                        <Text>{formData.weddingDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {Platform.OS === 'ios' && showDatePicker && (
                        <DateTimePicker
                            value={formData.weddingDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Wedding Time</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.weddingTime}
                        onChangeText={(text) => setFormData({ ...formData, weddingTime: text })}
                        placeholder="e.g. 2:00 PM"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Venue</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.venue}
                        onChangeText={(text) => setFormData({ ...formData, venue: text })}
                        placeholder="Enter venue name"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Location</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.location}
                        onChangeText={(text) => setFormData({ ...formData, location: text })}
                        placeholder="Enter location address"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Guests</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.numberOfGuests}
                            onChangeText={(text) => setFormData({ ...formData, numberOfGuests: text })}
                            keyboardType="numeric"
                            placeholder="0"
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Budget</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.budget}
                            onChangeText={(text) => setFormData({ ...formData, budget: text })}
                            keyboardType="numeric"
                            placeholder="0.00"
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Theme</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.theme}
                        onChangeText={(text) => setFormData({ ...formData, theme: text })}
                        placeholder="e.g. Rustic, Modern"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Catering</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.catering}
                        onChangeText={(text) => setFormData({ ...formData, catering: text })}
                        placeholder="Catering details"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Decorations</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.decorations}
                        onChangeText={(text) => setFormData({ ...formData, decorations: text })}
                        placeholder="Decoration details"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Music & Entertainment</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.music}
                        onChangeText={(text) => setFormData({ ...formData, music: text })}
                        placeholder="Music details"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Photography</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.photography}
                        onChangeText={(text) => setFormData({ ...formData, photography: text })}
                        placeholder="Photography details"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Rules & Guidelines</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.rules}
                        onChangeText={(text) => setFormData({ ...formData, rules: text })}
                        placeholder="Any rules for guests..."
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Additional Notes</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.additionalNotes}
                        onChangeText={(text) => setFormData({ ...formData, additionalNotes: text })}
                        placeholder="Any other details..."
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Details</Text>
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
    formGroup: {
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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        borderRadius: 8,
        fontSize: 16,
        color: Colors.light.text,
    },
    textArea: {
        height: 100,
    },
    row: {
        flexDirection: 'row',
    },
    saveButton: {
        backgroundColor: Colors.light.gold,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
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
});
