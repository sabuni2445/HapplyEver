import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getServices, deleteService, updateServiceAvailabilityStatus, createService, updateService } from '@/utils/api';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function VendorScreen() {
    const { user } = useUser();
    const [services, setServices] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);

    // Form state
    const [serviceName, setServiceName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const loadData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const servicesData = await getServices(user.id);
                setServices(servicesData || []);
            } catch (error) {
                console.error("Error loading vendor services:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [user]);

    const handleDelete = (serviceId: number) => {
        Alert.alert(
            "Delete Service",
            "Are you sure you want to delete this service?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteService(user!.id, serviceId);
                            loadData();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete service.");
                        }
                    }
                }
            ]
        );
    };

    const handleToggleStatus = async (service: any) => {
        const newStatus = service.availabilityStatus === 'AVAILABLE' ? 'BOOKED' : 'AVAILABLE';
        try {
            await updateServiceAvailabilityStatus(user!.id, service.id, newStatus);
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to update status.");
        }
    };

    const handleSaveService = async () => {
        if (!serviceName || !price) {
            Alert.alert("Error", "Service name and price are required.");
            return;
        }

        const serviceData = {
            serviceName,
            category,
            description,
            price: parseFloat(price),
            imageUrl,
            status: 'ACTIVE',
            availabilityStatus: 'AVAILABLE'
        };

        try {
            if (editingService) {
                await updateService(user!.id, editingService.id, serviceData);
            } else {
                await createService(user!.id, serviceData);
            }
            setShowAddModal(false);
            resetForm();
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to save service.");
        }
    };

    const resetForm = () => {
        setServiceName("");
        setCategory("");
        setDescription("");
        setPrice("");
        setImageUrl("");
        setEditingService(null);
    };

    const openEditModal = (service: any) => {
        setEditingService(service);
        setServiceName(service.serviceName);
        setCategory(service.category || "");
        setDescription(service.description || "");
        setPrice(service.price.toString());
        setImageUrl(service.imageUrl || "");
        setShowAddModal(true);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
                style={styles.background}
            />

            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Vendor Dashboard</Text>
                    <Text style={styles.subtitle}>Manage your wedding services</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setShowAddModal(true); }}>
                    <IconSymbol name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
            >
                {isLoading ? (
                    <Text style={styles.infoText}>Loading services...</Text>
                ) : services.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name="briefcase.fill" size={64} color="#e5e7eb" />
                        <Text style={styles.emptyText}>No services yet.</Text>
                        <TouchableOpacity style={styles.createButton} onPress={() => setShowAddModal(true)}>
                            <Text style={styles.createButtonText}>Add Your First Service</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    services.map((service) => (
                        <View key={service.id} style={styles.serviceCard}>
                            {service.imageUrl && (
                                <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
                            )}
                            <View style={styles.serviceInfo}>
                                <View style={styles.serviceHeader}>
                                    <Text style={styles.serviceName}>{service.serviceName}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: service.availabilityStatus === 'AVAILABLE' ? '#ecfdf5' : '#fee2e2' }]}>
                                        <Text style={[styles.statusText, { color: service.availabilityStatus === 'AVAILABLE' ? '#10b981' : '#ef4444' }]}>
                                            {service.availabilityStatus}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.serviceCategory}>{service.category || "Uncategorized"}</Text>
                                <Text style={styles.servicePrice}>ETB {service.price.toLocaleString()}</Text>
                                <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>

                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(service)}>
                                        <IconSymbol name="pencil" size={16} color={Colors.light.gold} />
                                        <Text style={styles.actionBtnText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(service)}>
                                        <IconSymbol name="arrow.left.arrow.right" size={16} color={Colors.light.gold} />
                                        <Text style={styles.actionBtnText}>Status</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(service.id)}>
                                        <IconSymbol name="trash" size={16} color="#ef4444" />
                                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingService ? "Edit Service" : "Add New Service"}</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.form}>
                            <Text style={styles.label}>Service Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={serviceName}
                                onChangeText={setServiceName}
                                placeholder="e.g. Premium Photography"
                            />

                            <Text style={styles.label}>Category</Text>
                            <TextInput
                                style={styles.input}
                                value={category}
                                onChangeText={setCategory}
                                placeholder="e.g. Photography, Catering"
                            />

                            <Text style={styles.label}>Price (ETB) *</Text>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />

                            <Text style={styles.label}>Image URL</Text>
                            <TextInput
                                style={styles.input}
                                value={imageUrl}
                                onChangeText={setImageUrl}
                                placeholder="https://example.com/image.jpg"
                            />

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                placeholder="Describe your service..."
                            />

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveService}>
                                <Text style={styles.saveButtonText}>Save Service</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
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
        marginTop: 4,
    },
    addButton: {
        backgroundColor: Colors.light.gold,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    content: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    infoText: {
        textAlign: 'center',
        marginTop: 40,
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Regular,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.textSecondary,
        marginTop: 16,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: Colors.light.gold,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontFamily: Fonts.Cormorant.Bold,
    },
    serviceCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: Colors.light.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    serviceImage: {
        width: '100%',
        height: 180,
    },
    serviceInfo: {
        padding: 20,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    serviceName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 20,
        color: Colors.light.text,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    serviceCategory: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 8,
    },
    servicePrice: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 18,
        color: Colors.light.gold,
        marginBottom: 8,
    },
    serviceDescription: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 16,
        lineHeight: 20,
    },
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 16,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fdf6f0',
        gap: 6,
    },
    deleteBtn: {
        backgroundColor: '#fff1f2',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.gold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
    },
    form: {
        marginBottom: 24,
    },
    label: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: Colors.light.gold,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
        fontFamily: Fonts.Cormorant.Bold,
    },
});
