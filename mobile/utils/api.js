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

export const uploadGalleryItem = async (weddingId, formData) => {
  try {
    const response = await api.post(`gallery/upload/${weddingId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading gallery item:", error);
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

export const getWeddingMessagesForGuest = async (weddingId, guestId) => {
  try {
    const response = await api.get(`wedding-messages/wedding/${weddingId}/guest/${guestId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching messages for guest:", error);
    throw error;
  }
};

export default api;
