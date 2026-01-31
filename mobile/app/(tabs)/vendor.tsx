import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, Alert, Modal, TextInput, ActivityIndicator, Switch } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getServices, deleteService, updateServiceAvailabilityStatus, createService, updateService, getServiceRatings, getAverageRating, getUserFromDatabase } from '@/utils/api';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function VendorScreen() {
    const { user } = useUser();
    const [services, setServices] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [serviceRatings, setServiceRatings] = useState<any[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [packageType, setPackageType] = useState('NORMAL');

    // Form state
    const [serviceName, setServiceName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [amount, setAmount] = useState("");
    const [duration, setDuration] = useState("");
    const [location, setLocation] = useState("");
    const [availability, setAvailability] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
    const [newCategory, setNewCategory] = useState("");

    const predefinedCategories = ["Photography", "Catering", "Decoration", "Venue", "Music", "Videography", "Makeup", "Transport"];

    const loadData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const [servicesData, dbUser] = await Promise.all([
                    getServices(user.id),
                    getUserFromDatabase(user.id) // Correctly fetch user package info
                ]);
                setServices(servicesData || []);
                setPackageType(dbUser?.packageType || 'NORMAL');
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
            // Update local state for responsiveness
            if (selectedService && selectedService.id === service.id) {
                setSelectedService({ ...selectedService, availabilityStatus: newStatus });
            }
            loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to update status.");
        }
    };

    const pickImages = async () => {
        let maxImages = 1;
        if (packageType === 'GOLD') maxImages = 5;
        if (packageType === 'PREMIUM') maxImages = 10;

        if (images.length >= maxImages) {
            Alert.alert("Limit Reached", `Your ${packageType} plan allows up to ${maxImages} images per service.`);
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: maxImages - images.length,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const selectedImages = result.assets.map(asset => {
                // Ensure prefix is present
                return asset.base64?.startsWith('data:image')
                    ? asset.base64
                    : `data:image/jpeg;base64,${asset.base64}`;
            });
            setImages([...images, ...selectedImages].slice(0, maxImages));
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
            imageUrl: images.join(','),
            amount,
            duration,
            location,
            availability,
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
        setAmount("");
        setDuration("");
        setLocation("");
        setAvailability("");
        setImages([]);
        setEditingService(null);
    };

    const openEditModal = (service: any) => {
        setEditingService(service);
        setServiceName(service.serviceName);
        setCategory(service.category || "");
        setDescription(service.description || "");
        setPrice(service.price.toString());
        setAmount(service.amount || "");
        setDuration(service.duration || "");
        setLocation(service.location || "");
        setAvailability(service.availability || "");

        // Ensure stored images have proper prefix if missing
        const existingImages = service.imageUrl ? service.imageUrl.split(',').map((img: string) => {
            return img.startsWith('data:image') || img.startsWith('http') ? img : `data:image/jpeg;base64,${img}`;
        }) : [];
        setImages(existingImages);
        setShowAddModal(true);
    };

    const openDetailModal = async (service: any) => {
        setSelectedService(service);
        setShowDetailModal(true);
        try {
            const [ratings, avg] = await Promise.all([
                getServiceRatings(service.id),
                getAverageRating(service.id)
            ]);
            setServiceRatings(ratings || []);
            setAverageRating(avg.average || 0);
        } catch (error) {
            console.error("Error loading ratings:", error);
        }
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
                    <ActivityIndicator size="large" color={Colors.light.gold} style={{ marginTop: 40 }} />
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
                            <View style={styles.cardImageContainer}>
                                {service.imageUrl ? (
                                    <Image
                                        source={{
                                            uri: service.imageUrl.split(',')[0].startsWith('data:image') || service.imageUrl.split(',')[0].startsWith('http')
                                                ? service.imageUrl.split(',')[0]
                                                : `data:image/jpeg;base64,${service.imageUrl.split(',')[0]}`
                                        }}
                                        style={styles.serviceImage}
                                    />
                                ) : (
                                    <View style={[styles.serviceImage, styles.placeholderImage]}>
                                        <IconSymbol name="photo" size={48} color="#e5e7eb" />
                                    </View>
                                )}
                                <View style={[styles.statusBadgeOverlay, { backgroundColor: service.availabilityStatus === 'AVAILABLE' ? '#ecfdf5' : '#fee2e2' }]}>
                                    <Text style={[styles.statusText, { color: service.availabilityStatus === 'AVAILABLE' ? '#10b981' : '#ef4444' }]}>
                                        {service.availabilityStatus}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.serviceInfo}>
                                <View style={styles.serviceHeader}>
                                    <Text style={styles.serviceName}>{service.serviceName}</Text>
                                    <Text style={styles.servicePrice}>ETB {service.price.toLocaleString()}</Text>
                                </View>

                                <View style={styles.metaRow}>
                                    <Text style={styles.serviceCategory}>{service.category || "Uncategorized"}</Text>
                                    {service.averageRating > 0 && (
                                        <View style={styles.ratingBadge}>
                                            <IconSymbol name="star.fill" size={12} color={Colors.light.gold} />
                                            <Text style={styles.ratingText}>{service.averageRating.toFixed(1)}</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>

                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => openDetailModal(service)}>
                                        <IconSymbol name="eye.fill" size={16} color={Colors.light.gold} />
                                        <Text style={styles.actionBtnText}>View</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(service)}>
                                        <IconSymbol name="pencil" size={16} color={Colors.light.gold} />
                                        <Text style={styles.actionBtnText}>Edit</Text>
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
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={category}
                                    onValueChange={(itemValue) => {
                                        if (itemValue === "ADD_NEW") {
                                            setShowCategoryPrompt(true);
                                        } else {
                                            setCategory(itemValue);
                                        }
                                    }}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Category" value="" />
                                    {predefinedCategories.map(cat => (
                                        <Picker.Item key={cat} label={cat} value={cat} />
                                    ))}
                                    {category && !predefinedCategories.includes(category) && (
                                        <Picker.Item label={category} value={category} />
                                    )}
                                    <Picker.Item label="+ Add New Category" value="ADD_NEW" />
                                </Picker>
                            </View>

                            <Text style={styles.label}>Price (ETB) *</Text>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />

                            <Text style={styles.label}>Amount / Units</Text>
                            <TextInput
                                style={styles.input}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="e.g. Per session, Per plate"
                            />

                            <Text style={styles.label}>Duration</Text>
                            <TextInput
                                style={styles.input}
                                value={duration}
                                onChangeText={setDuration}
                                placeholder="e.g. 4 hours, Full day"
                            />

                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                style={styles.input}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="e.g. Addis Ababa, Remote"
                            />

                            <Text style={styles.label}>Availability</Text>
                            <TextInput
                                style={styles.input}
                                value={availability}
                                onChangeText={setAvailability}
                                placeholder="e.g. Mon-Fri, 9AM-5PM"
                            />

                            <Text style={styles.label}>
                                Images ({images.length}/{packageType === 'NORMAL' ? 1 : packageType === 'GOLD' ? 5 : 10})
                            </Text>
                            <View style={styles.imagePickerRow}>
                                {images.map((img, index) => (
                                    <View key={index} style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: img }} style={styles.imagePreview} />
                                        <TouchableOpacity
                                            style={styles.removeImage}
                                            onPress={() => setImages(images.filter((_, i) => i !== index))}
                                        >
                                            <IconSymbol name="xmark.circle.fill" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {images.length < (packageType === 'NORMAL' ? 1 : packageType === 'GOLD' ? 5 : 10) && (
                                    <TouchableOpacity style={styles.pickImageBtn} onPress={pickImages}>
                                        <IconSymbol name="camera.fill" size={24} color={Colors.light.gold} />
                                        <Text style={styles.pickImageText}>Add</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

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

            {/* Detail Modal */}
            <Modal visible={showDetailModal} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '95%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Service Details</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedService && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <ScrollView horizontal pagingEnabled style={styles.detailGallery}>
                                    {(selectedService.imageUrl || "").split(',').filter(Boolean).map((img: string, i: number) => (
                                        <Image
                                            key={i}
                                            source={{ uri: img.startsWith('data:image') || img.startsWith('http') ? img : `data:image/jpeg;base64,${img}` }}
                                            style={styles.detailGalleryImage}
                                        />
                                    ))}
                                    {!(selectedService.imageUrl) && (
                                        <View style={[styles.detailGalleryImage, styles.placeholderImage]}>
                                            <IconSymbol name="photo" size={64} color="#e5e7eb" />
                                        </View>
                                    )}
                                </ScrollView>

                                <View style={styles.detailBody}>
                                    <View style={styles.detailHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailName}>{selectedService.serviceName}</Text>
                                            <Text style={styles.detailCategory}>{selectedService.category}</Text>
                                        </View>
                                        <View style={styles.detailPriceContainer}>
                                            <Text style={styles.detailPriceText}>ETB {selectedService.price.toLocaleString()}</Text>
                                            <Text style={styles.detailAmountText}>{selectedService.amount || 'Per session'}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionLabel}>Status & Availability</Text>
                                        <View style={styles.statusRow}>
                                            <Text style={styles.statusLabel}>Currently {selectedService.availabilityStatus}</Text>
                                            <Switch
                                                value={selectedService.availabilityStatus === 'AVAILABLE'}
                                                onValueChange={() => handleToggleStatus(selectedService)}
                                                trackColor={{ false: '#fee2e2', true: '#ecfdf5' }}
                                                thumbColor={selectedService.availabilityStatus === 'AVAILABLE' ? '#10b981' : '#ef4444'}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionLabel}>Description</Text>
                                        <Text style={styles.detailDescription}>{selectedService.description}</Text>
                                    </View>

                                    <View style={styles.detailGrid}>
                                        <View style={styles.gridItem}>
                                            <IconSymbol name="clock.fill" size={16} color={Colors.light.gold} />
                                            <Text style={styles.gridLabel}>Duration</Text>
                                            <Text style={styles.gridValue}>{selectedService.duration || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.gridItem}>
                                            <IconSymbol name="mappin.and.ellipse" size={16} color={Colors.light.gold} />
                                            <Text style={styles.gridLabel}>Location</Text>
                                            <Text style={styles.gridValue}>{selectedService.location || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.gridItem}>
                                            <IconSymbol name="calendar" size={16} color={Colors.light.gold} />
                                            <Text style={styles.gridLabel}>Availability</Text>
                                            <Text style={styles.gridValue}>{selectedService.availability || 'N/A'}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionLabel}>Client Ratings</Text>
                                            {averageRating > 0 && (
                                                <View style={styles.avgBadge}>
                                                    <IconSymbol name="star.fill" size={14} color="#fff" />
                                                    <Text style={styles.avgText}>{averageRating.toFixed(1)}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {serviceRatings.length === 0 ? (
                                            <Text style={styles.noRatings}>No ratings yet.</Text>
                                        ) : (
                                            serviceRatings.map((rating: any, i: number) => (
                                                <View key={i} style={styles.ratingCard}>
                                                    <View style={styles.ratingHeader}>
                                                        <View style={styles.ratingStars}>
                                                            {[1, 2, 3, 4, 5].map((s: number) => (
                                                                <IconSymbol
                                                                    key={s}
                                                                    name="star.fill"
                                                                    size={12}
                                                                    color={s <= rating.rating ? Colors.light.gold : '#e5e7eb'}
                                                                />
                                                            ))}
                                                        </View>
                                                        <Text style={styles.ratingDate}>
                                                            {new Date(rating.createdAt).toLocaleDateString()}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.ratingComment}>"{rating.comment}"</Text>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Custom Category Prompt */}
            <Modal visible={showCategoryPrompt} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.promptContent}>
                        <Text style={styles.modalTitle}>New Category</Text>
                        <TextInput
                            style={styles.input}
                            value={newCategory}
                            onChangeText={setNewCategory}
                            placeholder="Enter category name"
                            autoFocus
                        />
                        <View style={styles.promptButtons}>
                            <TouchableOpacity
                                style={[styles.promptBtn, { backgroundColor: '#f3f4f6' }]}
                                onPress={() => setShowCategoryPrompt(false)}
                            >
                                <Text style={[styles.promptBtnText, { color: Colors.light.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.promptBtn, { backgroundColor: Colors.light.gold }]}
                                onPress={() => {
                                    if (newCategory) {
                                        setCategory(newCategory);
                                        setNewCategory("");
                                        setShowCategoryPrompt(false);
                                    }
                                }}
                            >
                                <Text style={styles.promptBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>
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
    pickerContainer: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    imagePickerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    removeImage: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    pickImageBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.gold,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fdf6f0',
    },
    pickImageText: {
        fontSize: 10,
        color: Colors.light.gold,
        fontFamily: Fonts.Cormorant.Bold,
        marginTop: 4,
    },
    promptContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '80%',
        alignSelf: 'center',
    },
    promptButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    promptBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    promptBtnText: {
        fontFamily: Fonts.Cormorant.Bold,
        color: '#fff',
    },
    cardImageContainer: {
        position: 'relative',
        width: '100%',
        height: 180,
    },
    placeholderImage: {
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadgeOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fdf6f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.gold,
    },
    detailGallery: {
        height: 250,
        borderRadius: 24,
        overflow: 'hidden',
    },
    detailGalleryImage: {
        width: 350,
        height: 250,
    },
    detailBody: {
        paddingVertical: 24,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    detailName: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 24,
        color: Colors.light.text,
    },
    detailCategory: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    detailPriceContainer: {
        alignItems: 'flex-end',
    },
    detailPriceText: {
        fontFamily: Fonts.Playfair.Bold,
        fontSize: 22,
        color: Colors.light.gold,
    },
    detailAmountText: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Regular,
    },
    detailSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontFamily: Fonts.Cormorant.Bold,
        fontSize: 18,
        color: Colors.light.text,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fdf6f0',
        padding: 12,
        borderRadius: 12,
    },
    statusLabel: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.text,
    },
    detailDescription: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 16,
        color: Colors.light.textSecondary,
        lineHeight: 24,
    },
    detailGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 8,
    },
    gridItem: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
    },
    gridLabel: {
        fontSize: 10,
        color: Colors.light.textSecondary,
        fontFamily: Fonts.Cormorant.Bold,
        marginTop: 4,
    },
    gridValue: {
        fontSize: 12,
        color: Colors.light.text,
        fontFamily: Fonts.Cormorant.Regular,
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    avgBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.gold,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    avgText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    noRatings: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontStyle: 'italic',
    },
    ratingCard: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    ratingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingStars: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingDate: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    ratingComment: {
        fontFamily: Fonts.Cormorant.Regular,
        fontSize: 14,
        color: Colors.light.text,
        fontStyle: 'italic',
    },
});
