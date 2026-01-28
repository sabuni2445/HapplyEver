import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sync user from Clerk to database
export const syncUserToDatabase = async (user) => {
  try {
    const userData = {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      imageUrl: user.imageUrl || user.profileImageUrl || '',
    };

    const response = await api.post('/users/sync', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user from database by Clerk ID
export const getUserFromDatabase = async (clerkId) => {
  try {
    const response = await api.get(`/users/clerk/${clerkId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // User not found
    }
    throw error;
  }
};

// Update user role
export const updateUserRole = async (clerkId, selectedRole) => {
  try {
    const response = await api.patch(`/users/${clerkId}/role`, {
      selectedRole,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (clerkId, profileData) => {
  try {
    const response = await api.patch(`/users/${clerkId}/profile`, profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Save wedding details
export const saveWeddingDetails = async (clerkId, weddingData) => {
  try {
    const response = await api.post(`/weddings/${clerkId}`, weddingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get wedding details
export const getWeddingDetails = async (clerkId) => {
  try {
    const response = await api.get(`/weddings/${clerkId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Delete wedding details
export const deleteWeddingDetails = async (clerkId) => {
  try {
    const response = await api.delete(`/weddings/${clerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create service
export const createService = async (clerkId, serviceData) => {
  try {
    const response = await api.post(`/services/${clerkId}`, serviceData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get services
export const getServices = async (clerkId) => {
  try {
    const response = await api.get(`/services/${clerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update service
export const updateService = async (clerkId, serviceId, serviceData) => {
  try {
    const response = await api.put(`/services/${clerkId}/${serviceId}`, serviceData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete service
export const deleteService = async (clerkId, serviceId) => {
  try {
    const response = await api.delete(`/services/${clerkId}/${serviceId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all active services (for couples to browse)
export const getAllServices = async () => {
  try {
    const response = await api.get('/services/all');
    return response.data;
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
};

// Get service by ID
export const getServiceById = async (serviceId) => {
  try {
    const response = await api.get(`/services/id/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching service:", error);
    throw error;
  }
};

// Update service availability status
export const updateServiceAvailabilityStatus = async (clerkId, serviceId, status) => {
  try {
    const response = await api.patch(`/services/${clerkId}/${serviceId}/status`, { availabilityStatus: status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Booking APIs
export const createBooking = async (coupleClerkId, bookingData) => {
  try {
    const response = await api.post(`/bookings/couple/${coupleClerkId}`, bookingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCoupleBookings = async (coupleClerkId) => {
  try {
    const response = await api.get(`/bookings/couple/${coupleClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVendorBookings = async (vendorClerkId) => {
  try {
    const response = await api.get(`/bookings/vendor/${vendorClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBookingStatus = async (bookingId, vendorClerkId, status) => {
  try {
    const response = await api.patch(`/bookings/${bookingId}/vendor/${vendorClerkId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Rating APIs
export const createRating = async (coupleClerkId, ratingData) => {
  try {
    const response = await api.post(`/ratings/couple/${coupleClerkId}`, ratingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getServiceRatings = async (serviceId) => {
  try {
    const response = await api.get(`/ratings/service/${serviceId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAverageRating = async (serviceId) => {
  try {
    const response = await api.get(`/ratings/service/${serviceId}/average`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Guest APIs
export const createGuests = async (coupleClerkId, guestsData) => {
  try {
    const response = await api.post(`/guests/${coupleClerkId}`, { guests: guestsData });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getGuests = async (coupleClerkId) => {
  try {
    const response = await api.get(`/guests/${coupleClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getGuestByCode = async (uniqueCode) => {
  try {
    const response = await api.get(`/guests/code/${uniqueCode}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Wedding Card APIs
export const createOrUpdateWeddingCard = async (coupleClerkId, cardData) => {
  try {
    const response = await api.post(`/wedding-cards/${coupleClerkId}`, cardData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWeddingCard = async (coupleClerkId) => {
  try {
    const response = await api.get(`/wedding-cards/${coupleClerkId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Admin APIs
export const getAllUsers = async (adminClerkId) => {
  try {
    const response = await api.get(`/users/all?adminClerkId=${adminClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createManager = async (adminClerkId, userData) => {
  try {
    const response = await api.post(`/users/create-manager?adminClerkId=${adminClerkId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createProtocol = async (adminClerkId, userData) => {
  try {
    const response = await api.post(`/users/create-protocol?adminClerkId=${adminClerkId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const setUserPassword = async (adminClerkId, targetClerkId, password) => {
  try {
    const response = await api.post(`/users/set-password?adminClerkId=${adminClerkId}&targetClerkId=${targetClerkId}`, { password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (clerkId, adminClerkId) => {
  try {
    const response = await api.delete(`/users/${clerkId}?adminClerkId=${adminClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllWeddings = async () => {
  try {
    const response = await api.get('/weddings/all');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWeddingById = async (weddingId) => {
  try {
    const response = await api.get(`/weddings/id/${weddingId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Assignment APIs
export const assignWeddingToManager = async (weddingId, managerClerkId, adminClerkId) => {
  try {
    const response = await api.post(`/assignments/wedding/${weddingId}/manager/${managerClerkId}?adminClerkId=${adminClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignProtocolToWedding = async (weddingId, protocolClerkId, managerClerkId, protocolJob = "") => {
  try {
    const response = await api.post(`/assignments/wedding/${weddingId}/protocol/${protocolClerkId}?managerClerkId=${managerClerkId}&protocolJob=${encodeURIComponent(protocolJob)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllAssignments = async () => {
  try {
    const response = await api.get('/assignments/all');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getManagerAssignments = async (managerClerkId) => {
  try {
    const response = await api.get(`/assignments/manager/${managerClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProtocolAssignments = async (protocolClerkId) => {
  try {
    const response = await api.get(`/assignments/protocol/${protocolClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAssignmentByWedding = async (weddingId) => {
  try {
    const response = await api.get(`/assignments/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getUserByClerkId = async (clerkId) => {
  try {
    const response = await api.get(`/users/clerk/${clerkId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getUsersByRole = async (role) => {
  try {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Chapa Payment API
export const initializeChapaPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/chapa/initialize', paymentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Verify Chapa payment by tx_ref
export const verifyChapaPayment = async (txRef) => {
  try {
    const response = await api.get(`/payments/chapa/verify?txRef=${encodeURIComponent(txRef)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get payments by wedding ID
export const getPaymentsByWedding = async (weddingId) => {
  try {
    const response = await api.get(`/payments/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

// Get payments by couple clerk ID
export const getPaymentsByCouple = async (coupleClerkId) => {
  try {
    const response = await api.get(`/payments/couple/${coupleClerkId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

// Create payment schedule
export const createPaymentSchedule = async (weddingId, coupleClerkId, schedule) => {
  try {
    const response = await api.post('/payments/schedule', {
      weddingId,
      coupleClerkId,
      schedule
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Gallery APIs
export const uploadGalleryItem = async (clerkId, itemData) => {
  try {
    const response = await api.post(`/gallery/upload?clerkId=${clerkId}`, itemData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getGalleryByWedding = async (weddingId, approvedOnly = true) => {
  try {
    const response = await api.get(`/gallery/wedding/${weddingId}?approvedOnly=${approvedOnly}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getGalleryByUser = async (clerkId) => {
  try {
    const response = await api.get(`/gallery/user/${clerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteGalleryItem = async (itemId, clerkId) => {
  try {
    const response = await api.delete(`/gallery/${itemId}?clerkId=${clerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateGalleryApproval = async (itemId, isApproved, adminClerkId) => {
  try {
    const response = await api.patch(`/gallery/${itemId}/approval?isApproved=${isApproved}&adminClerkId=${adminClerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Attendee Rating APIs
export const submitAttendeeRating = async (ratingData) => {
  try {
    const response = await api.post('/attendee-ratings/submit', ratingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAttendeeRatingsByWedding = async (weddingId) => {
  try {
    const response = await api.get(`/attendee-ratings/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAttendeeRatingsByGuest = async (guestId) => {
  try {
    const response = await api.get(`/attendee-ratings/guest/${guestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAttendeeRatingsByRated = async (ratedType, ratedId) => {
  try {
    const response = await api.get(`/attendee-ratings/rated/${ratedType}/${ratedId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Wedding Message APIs
export const sendWeddingMessage = async (messageData) => {
  try {
    const response = await api.post('/wedding-messages/send', messageData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWeddingMessages = async (weddingId) => {
  try {
    const response = await api.get(`/wedding-messages/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWeddingMessagesForGuest = async (weddingId, guestId) => {
  try {
    const response = await api.get(`/wedding-messages/wedding/${weddingId}/guest/${guestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// AI Image Generation
export const generateAIImage = async (prompt) => {
  try {
    const response = await api.post('/ai/generate-image', { prompt });
    return response.data;
  } catch (error) {
    console.error("Error generating AI image:", error);
    throw error;
  }
};

// DB Login API (for manager, protocol, admin, attendee)
export const loginWithCredentials = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
