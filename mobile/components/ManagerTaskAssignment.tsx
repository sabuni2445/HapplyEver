import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import {
    getManagerAssignments,
    createTask
} from '@/utils/api';

interface ManagerTaskAssignmentProps {
    managerId: string;
    onTaskAssigned?: () => void;
}

export default function ManagerTaskAssignment({ managerId, onTaskAssigned }: ManagerTaskAssignmentProps) {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedWeddingId, setSelectedWeddingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedRole, setAssignedRole] = useState("MANAGER");

    // Dropdown visibility
    const [showWeddingDropdown, setShowWeddingDropdown] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);

    useEffect(() => {
        loadData();
    }, [managerId]);

    const loadData = async () => {
        try {
            const myAssignments = await getManagerAssignments(managerId);
            setAssignments(myAssignments || []);

            if (myAssignments && myAssignments.length > 0) {
                setSelectedWeddingId(myAssignments[0].weddingId);
            }
        } catch (error) {
            console.error("Error loading task assignment data:", error);
            Alert.alert("Error", "Failed to load weddings");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedWeddingId) {
            Alert.alert("Required", "Please select a wedding.");
            return;
        }
        if (!title.trim()) {
            Alert.alert("Required", "Please enter a task title.");
            return;
        }

        setSubmitting(true);
        try {
            await createTask({
                weddingId: selectedWeddingId,
                title: title,
                description: description,
                category: 'GENERAL',
                assignedRole: assignedRole,
                assignedProtocolId: null,
                dueDate: null,
            });

            Alert.alert("Success", "Task assigned successfully!");

            // Reset form
            setTitle("");
            setDescription("");
            setAssignedRole("MANAGER");

            if (onTaskAssigned) onTaskAssigned();

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to add task.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <ActivityIndicator color={Colors.light.gold} />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>New To-Do Task</Text>

            {/* Wedding Selector */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Wedding</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => { setShowWeddingDropdown(!showWeddingDropdown); setShowRoleDropdown(false); }}>
                    <Text style={styles.dropdownText}>
                        {assignments.find(a => a.weddingId === selectedWeddingId)?.wedding?.partnersName || "Select Wedding"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>

                {showWeddingDropdown && (
                    <View style={styles.dropdownList}>
                        {assignments.map((assignment, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setSelectedWeddingId(assignment.weddingId);
                                    setShowWeddingDropdown(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{assignment.wedding?.partnersName || `Wedding #${assignment.weddingId}`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Task Title */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Task Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Call the florist"
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Task details..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />
            </View>

            {/* Assign To Selector */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Assign To</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => { setShowRoleDropdown(!showRoleDropdown); setShowWeddingDropdown(false); }}>
                    <Text style={styles.dropdownText}>{assignedRole}</Text>
                    <Ionicons name="chevron-down" size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>

                {showRoleDropdown && (
                    <View style={styles.dropdownList}>
                        {['MANAGER', 'PROTOCOL', 'COUPLE'].map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setAssignedRole(role);
                                    setShowRoleDropdown(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{role}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleAssign}
                disabled={submitting}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Add To-Do Task</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.Playfair.Bold,
        color: Colors.light.text,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
    },
    inputGroup: {
        marginBottom: 16,
        zIndex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.textSecondary,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    dropdown: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 14,
        color: Colors.light.text,
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1000,
        maxHeight: 200,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownItemText: {
        fontSize: 14,
        color: Colors.light.text,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: Colors.light.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: Colors.light.gold,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
