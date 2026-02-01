import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add token if needed (though Clerk handles this mostly via session)
// For now, we'll keep it simple as the backend seems to rely on Clerk IDs passed in body/params
// rather than Bearer tokens for most endpoints, based on the web implementation.

// DB Login API (for manager, protocol, admin, attendee)
export const loginWithCredentials = async (email, password) => {
  try {
    const response = await api.post('auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error("Error during credentials login:", error);
    throw error;
  }
};

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

    const response = await api.post('users/sync', userData);
    return response.data;
  } catch (error) {
    console.error("Error syncing user:", error);
    throw error;
  }
};

// Create a new task (for protocol assignment etc)
export const createTask = async (taskData) => {
  try {
    const response = await api.post('tasks/create', taskData);
    return response.data;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const getTasksByWedding = async (weddingId) => {
  try {
    const response = await api.get(`tasks/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

export const getUsersByRole = async (role) => {
  try {
    const response = await api.get(`users/role/${role}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching users by role ${role}:`, error);
    return [];
  }
};

export const getManagerAssignments = async (managerClerkId) => {
  try {
    const response = await api.get(`assignments/manager/${managerClerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching manager assignments:", error);
    return [];
  }
};

// Get user from database by Clerk ID
export const getUserFromDatabase = async (clerkId) => {
  try {
    const response = await api.get(`users/clerk/${clerkId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // User not found
    }
    console.error("Error fetching user:", error);
    throw error;
  }
};

// Get wedding details
export const getWeddingDetails = async (clerkId) => {
  try {
    const response = await api.get(`weddings/${clerkId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error fetching wedding:", error);
    throw error;
  }
};

// Get couple bookings
export const getCoupleBookings = async (coupleClerkId) => {
  try {
    const response = await api.get(`bookings/couple/${coupleClerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

// Get service by ID
export const getServiceById = async (serviceId) => {
  try {
    const response = await api.get(`services/id/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching service:", error);
    throw error;
  }
};

// Get all active services
export const getAllServices = async () => {
  try {
    const response = await api.get('services/all');
    return response.data;
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
};

// Get featured services (PREMIUM package)
export const getFeaturedServices = async () => {
  try {
    const response = await api.get('services/featured');
    return response.data;
  } catch (error) {
    console.error("Error fetching featured services:", error);
    throw error;
  }
};

// Create booking
export const createBooking = async (coupleClerkId, bookingData) => {
  try {
    const response = await api.post(`bookings/couple/${coupleClerkId}`, bookingData);
    return response.data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

// Create service
export const createService = async (clerkId, serviceData) => {
  try {
    const response = await api.post(`services/${clerkId}`, serviceData);
    return response.data;
  } catch (error) {
    console.error("Error creating service:", error);
    throw error;
  }
};

// Get services
export const getServices = async (clerkId) => {
  try {
    const response = await api.get(`services/${clerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
};

// Update service
export const updateService = async (clerkId, serviceId, serviceData) => {
  try {
    const response = await api.put(`services/${clerkId}/${serviceId}`, serviceData);
    return response.data;
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

// Delete service
export const deleteService = async (clerkId, serviceId) => {
  try {
    const response = await api.delete(`services/${clerkId}/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

// Update service availability status
export const updateServiceAvailabilityStatus = async (clerkId, serviceId, status) => {
  try {
    const response = await api.patch(`services/${clerkId}/${serviceId}/status`, { availabilityStatus: status });
    return response.data;
  } catch (error) {
    console.error("Error updating service status:", error);
    throw error;
  }
};

// Get payments by wedding ID
export const getPaymentsByWedding = async (weddingId) => {
  try {
    const response = await api.get(`payments/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    console.error("Error fetching payments:", error);
    throw error;
  }
};

// Initialize Chapa Payment
export const initializeChapaPayment = async (paymentData) => {
  try {
    const response = await api.post('payments/chapa/initialize', paymentData);
    return response.data;
  } catch (error) {
    console.error("Error initializing payment:", error);
    throw error;
  }
};

// Verify Chapa payment
export const verifyChapaPayment = async (txRef) => {
  try {
    const response = await api.get(`payments/chapa/verify?txRef=${encodeURIComponent(txRef)}`);
    return response.data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};

// Get guests
export const getGuests = async (coupleClerkId) => {
  try {
    const response = await api.get(`guests/${coupleClerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching guests:", error);
    throw error;
  }
};

export const getGuestsByWeddingId = async (weddingId) => {
  try {
    const response = await api.get(`guests/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching guests by wedding ID:", error);
    throw error;
  }
};

// Create guests
export const createGuests = async (coupleClerkId, guestsData) => {
  try {
    const response = await api.post(`guests/${coupleClerkId}`, { guests: guestsData });
    return response.data;
  } catch (error) {
    console.error("Error creating guests:", error);
    throw error;
  }
};

// Wedding Details
export const createWeddingDetails = async (clerkId, details) => {
  try {
    const response = await api.post(`weddings/${clerkId}`, details);
    return response.data;
  } catch (error) {
    console.error("Error creating wedding details:", error);
    throw error;
  }
};

export const updateWeddingDetails = async (clerkId, details) => {
  try {
    const response = await api.post(`weddings/${clerkId}`, details);
    return response.data;
  } catch (error) {
    console.error("Error updating wedding details:", error);
    throw error;
  }
};

// Wedding Card
export const getWeddingCard = async (clerkId) => {
  try {
    const response = await api.get(`wedding-cards/${clerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching wedding card:", error);
    return null;
  }
};

export const createOrUpdateWeddingCard = async (clerkId, cardData) => {
  try {
    const response = await api.post(`wedding-cards/${clerkId}`, cardData);
    return response.data;
  } catch (error) {
    console.error("Error saving wedding card:", error);
    throw error;
  }
};

// Gallery
export const getGalleryByWedding = async (weddingId) => {
  try {
    const response = await api.get(`gallery/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return [];
  }
};

export const uploadGalleryItem = async (clerkId, weddingId, itemData) => {
  try {
    // Backend expects GalleryItemRequest JSON object
    const response = await api.post(`gallery/upload?clerkId=${clerkId}`, itemData);
    return response.data;
  } catch (error) {
    console.error("Error uploading gallery item:", error);
    throw error;
  }
};

export const deleteGalleryItem = async (itemId, clerkId) => {
  try {
    const response = await api.delete(`gallery/${itemId}?clerkId=${clerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    throw error;
  }
};

// Ratings
export const createRating = async (ratingData) => {
  try {
    const response = await api.post('ratings', ratingData);
    return response.data;
  } catch (error) {
    console.error("Error creating rating:", error);
    throw error;
  }
};

export const getWeddingMessages = async (weddingId) => {
  try {
    const response = await api.get(`wedding-messages/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

export const sendWeddingMessage = async (messageData) => {
  try {
    const response = await api.post(`wedding-messages/send`, messageData);
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// AI Image Generation
export const generateAIImage = async (prompt) => {
  try {
    const response = await api.post('ai/generate-image', { prompt });
    return response.data;
  } catch (error) {
    console.error("Error generating AI image:", error);
    throw error;
  }
};

// Assignments
export const getAssignmentByWedding = async (weddingId) => {
  try {
    const response = await api.get(`assignments/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error fetching assignment:", error);
    throw error;
  }
};

export const getUserByClerkId = async (clerkId) => {
  try {
    const response = await api.get(`users/clerk/${clerkId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error fetching user by clerk ID:", error);
    throw error;
  }
};

export const getProtocolAssignments = async (protocolClerkId) => {
  try {
    const response = await api.get(`assignments/protocol/${protocolClerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching protocol assignments:", error);
    throw error;
  }
};

export const getGuestByCode = async (code) => {
  try {
    const response = await api.get(`guests/code/${code}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching guest by code:", error);
    throw error;
  }
};

export const checkInGuest = async (guestId) => {
  try {
    const response = await api.patch(`guests/${guestId}/check-in`);
    return response.data;
  } catch (error) {
    console.error("Error checking in guest:", error);
    throw error;
  }
};

export const getWeddingById = async (id) => {
  try {
    const response = await api.get(`weddings/id/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching wedding by ID:", error);
    throw error;
  }
};

export const submitAttendeeRating = async (ratingData) => {
  try {
    const response = await api.post('attendee-ratings/submit', ratingData);
    return response.data;
  } catch (error) {
    console.error("Error submitting attendee rating:", error);
    throw error;
  }
};

// Get ratings by wedding
export const getRatingsByWedding = async (weddingId) => {
  try {
    const response = await api.get(`attendee-ratings/wedding/${weddingId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ratings by wedding:", error);
    throw error;
  }
};

// Get ratings by rated entity (protocol, wedding, couple)
export const getRatingsByRated = async (ratedType, ratedId) => {
  try {
    const response = await api.get(`attendee-ratings/rated/${ratedType}/${ratedId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ratings by rated entity:", error);
    throw error;
  }
};

export const getWeddingMessagesForGuest = async (weddingId, guestId) => {
  try {
    const response = await api.get(`wedding-messages/wedding/${weddingId}/guest/${guestId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching messages for guest:", error);
    throw error;
  }
};

// Vendor Bookings
export const getVendorBookings = async (vendorClerkId) => {
  try {
    const response = await api.get(`bookings/vendor/${vendorClerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vendor bookings:", error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId, vendorClerkId, status) => {
  try {
    const response = await api.patch(`bookings/${bookingId}/vendor/${vendorClerkId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

// Update User Role
export const updateUserRole = async (clerkId, selectedRole) => {
  try {
    const response = await api.patch(`users/${clerkId}/role`, { selectedRole });
    return response.data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// User Package
export const updateUserPackage = async (clerkId, packageType) => {
  try {
    const response = await api.patch(`users/${clerkId}/package`, { packageType });
    return response.data;
  } catch (error) {
    console.error("Error updating user package:", error);
    throw error;
  }
};

// Vendor Package Upgrades
export const initializeVendorPackageUpgrade = async (params) => {
  try {
    const response = await api.post('vendor-packages/initialize', params);
    return response.data;
  } catch (error) {
    console.error("Error initializing package upgrade:", error);
    throw error;
  }
};

export const manualVendorPackageUpgrade = async (params) => {
  try {
    const response = await api.post('vendor-packages/manual-request', params);
    return response.data;
  } catch (error) {
    console.error("Error requesting manual upgrade:", error);
    throw error;
  }
};

export const verifyVendorPackagePayment = async (txRef) => {
  try {
    const response = await api.get(`vendor-packages/verify?txRef=${encodeURIComponent(txRef)}`);
    return response.data;
  } catch (error) {
    console.error("Error verifying package payment:", error);
    throw error;
  }
};

// Ratings for Vendors
export const getServiceRatings = async (serviceId) => {
  try {
    const response = await api.get(`ratings/service/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching service ratings:", error);
    throw error;
  }
};

export const getAverageRating = async (serviceId) => {
  try {
    const response = await api.get(`ratings/service/${serviceId}/average`);
    return response.data;
  } catch (error) {
    console.error("Error fetching average rating:", error);
    throw error;
  }
};

export const getVendorRatings = async (vendorClerkId) => {
  try {
    const response = await api.get(`ratings/vendor/${vendorClerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vendor ratings:", error);
    throw error;
  }
};

export const rateService = async (serviceId, ratingData) => {
  try {
    const response = await api.post(`ratings/service/${serviceId}`, ratingData);
    return response.data;
  } catch (error) {
    console.error("Error rating service:", error);
    throw error;
  }
};

export const rateWedding = async (weddingId, ratingData) => {
  try {
    // Assuming we might have a wedding rating endpoint or just log it for now
    // If not exists, we can create a generic feedback endpoint later
    console.log("Rating wedding:", weddingId, ratingData);
    return { success: true };
  } catch (error) {
    console.error("Error rating wedding:", error);
    throw error;
  }
};

// Meeting Requests
export const requestMeeting = async (meetingData) => {
  try {
    const response = await api.post('meetings/request', meetingData);
    return response.data;
  } catch (error) {
    console.error("Error requesting meeting:", error);
    throw error;
  }
};

export const getCoupleMeetings = async (coupleId) => {
  try {
    const response = await api.get(`meetings/couple/${coupleId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching couple meetings:", error);
    throw error;
  }
};

export const getManagerMeetings = async (managerId) => {
  try {
    const response = await api.get(`meetings/manager/${managerId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching manager meetings:", error);
    throw error;
  }
};

// Messages API
export const getMessages = async (userId) => {
  try {
    const response = await api.get(`messages/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

export const sendMessage = async (senderClerkId, receiverClerkId, content) => {
  try {
    const response = await api.post('messages/send', {
      senderClerkId,
      receiverClerkId,
      content
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const sendMessageByClerkId = async (senderClerkId, receiverClerkId, content) => {
  try {
    const response = await api.post('messages/send', {
      senderClerkId,
      receiverClerkId,
      content
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getInbox = async (clerkId) => {
  try {
    const response = await api.get(`messages/inbox/${clerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return [];
  }
};

// Meeting Requests API
export const getMeetingRequests = async (userId) => {
  try {
    const response = await api.get(`meetings/couple/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching meeting requests:", error);
    return [];
  }
};

export const getConversation = async (user1, user2) => {
  try {
    const response = await api.get('messages/conversation', {
      params: { user1, user2 }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return [];
  }
};

export const getTasksByProtocol = async (protocolId) => {
  try {
    const response = await api.get(`tasks/protocol/${protocolId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching protocol tasks:", error);
    return [];
  }
};

export const acceptTask = async (taskId) => {
  try {
    const response = await api.patch(`tasks/${taskId}/accept`);
    return response.data;
  } catch (error) {
    console.error("Error accepting task:", error);
    throw error;
  }
};

export const rejectTask = async (taskId, reason) => {
  try {
    const response = await api.patch(`tasks/${taskId}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error("Error rejecting task:", error);
    throw error;
  }
};

export const completeTask = async (taskId) => {
  try {
    const response = await api.patch(`tasks/${taskId}/complete`);
    return response.data;
  } catch (error) {
    console.error("Error completing task:", error);
    throw error;
  }
};

export const getAssignmentByCouple = async (coupleClerkId) => {
  try {
    const response = await api.get(`assignments/wedding/couple/${coupleClerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return null;
  }
};

export const updateUserProfile = async (clerkId, profileData) => {
  try {
    const response = await api.patch(`users/${clerkId}/profile`, profileData);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Update wedding status
export const updateWeddingStatus = async (weddingId, status) => {
  try {
    const response = await api.patch(`weddings/${weddingId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating wedding status:", error);
    throw error;
  }
};

// Submit general feedback
export const submitCoupleFeedback = async (feedbackData) => {
  try {
    const response = await api.post('feedback/submit', feedbackData);
    return response.data;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

export default api;
