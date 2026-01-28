import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { X, Star, Calendar, DollarSign, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { getServiceRatings, getAverageRating, getVendorBookings, updateServiceAvailabilityStatus } from "../utils/api";
import "./VendorServiceDetailsModal.css";

export default function VendorServiceDetailsModal({ service, onClose, onServiceUpdate }) {
  const { userId } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentService, setCurrentService] = useState(service);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setCurrentService(service);
  }, [service]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [ratingsData, ratingData, bookingsData] = await Promise.all([
          getServiceRatings(currentService.id),
          getAverageRating(currentService.id),
          getVendorBookings(currentService.clerkId)
        ]);
        
        setRatings(ratingsData);
        setAverageRating(ratingData.average || 0);
        // Filter bookings for this specific service
        const serviceBookings = bookingsData.filter(b => b.serviceId === currentService.id);
        setBookings(serviceBookings);
      } catch (error) {
        console.error("Failed to load service details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentService?.id) {
      loadData();
    }
  }, [currentService.id, currentService.clerkId]);

  const getAvailabilityColor = (status) => {
    switch (status) {
      case "AVAILABLE": return { bg: "#d1fae5", text: "#065f46" };
      case "BOOKED": return { bg: "#fee2e2", text: "#991b1b" };
      case "UNAVAILABLE": return { bg: "#f3f4f6", text: "#6b7280" };
      default: return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case "PENDING": return { bg: "#fef3c7", text: "#92400e" };
      case "ACCEPTED": return { bg: "#d1fae5", text: "#065f46" };
      case "REJECTED": return { bg: "#fee2e2", text: "#991b1b" };
      case "COMPLETED": return { bg: "#dbeafe", text: "#1e40af" };
      default: return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Change service status to ${newStatus}?`)) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateServiceAvailabilityStatus(userId, currentService.id, newStatus);
      const updatedService = { ...currentService, availabilityStatus: newStatus };
      setCurrentService(updatedService);
      if (onServiceUpdate) {
        onServiceUpdate(updatedService);
      }
      alert("Status updated successfully!");
    } catch (error) {
      alert("Failed to update status: " + (error.response?.data?.error || error.message));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const availabilityColors = getAvailabilityColor(currentService.availabilityStatus);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content vendor-service-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-body">
          {currentService.imageUrl && (
            <div className="service-modal-image">
              <img src={currentService.imageUrl} alt={currentService.serviceName} />
            </div>
          )}

          <div className="service-modal-header">
            <h2>{currentService.serviceName}</h2>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              {averageRating > 0 && (
                <div className="service-rating-large">
                  <Star size={20} fill="#d4af37" color="#d4af37" />
                  <span>{averageRating.toFixed(1)}</span>
                  <span className="rating-count">({ratings.length})</span>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{
                  background: availabilityColors.bg,
                  color: availabilityColors.text,
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600"
                }}>
                  {currentService.availabilityStatus || "AVAILABLE"}
                </span>
                {currentService.availabilityStatus === "BOOKED" && (
                  <button
                    onClick={() => handleStatusChange("AVAILABLE")}
                    disabled={isUpdatingStatus}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: isUpdatingStatus ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      opacity: isUpdatingStatus ? 0.6 : 1
                    }}
                    title="Mark as Available"
                  >
                    <RefreshCw size={14} />
                    Make Available
                  </button>
                )}
              </div>
            </div>
          </div>

          {currentService.category && (
            <p className="service-category-badge">{currentService.category}</p>
          )}

          <div className="service-details-grid">
            {currentService.price && (
              <div className="detail-item">
                <DollarSign size={20} />
                <div>
                  <strong>Price:</strong>
                  <p>${currentService.price.toFixed(2)} {currentService.amount && `/ ${currentService.amount}`}</p>
                </div>
              </div>
            )}
            {currentService.duration && (
              <div className="detail-item">
                <Calendar size={20} />
                <div>
                  <strong>Duration:</strong>
                  <p>{currentService.duration}</p>
                </div>
              </div>
            )}
          </div>

          <div className="service-description-full">
            <h3>Description</h3>
            <p>{currentService.description}</p>
          </div>

          {/* Bookings Section */}
          <div className="bookings-section">
            <h3>Bookings ({bookings.length})</h3>
            {isLoading ? (
              <p>Loading...</p>
            ) : bookings.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No bookings for this service yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {bookings.map((booking) => {
                  const statusColors = getBookingStatusColor(booking.status);
                  return (
                    <div key={booking.id} className="booking-item">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <div>
                          <strong>Booking #{booking.id}</strong>
                          <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "0.25rem 0" }}>
                            From: {booking.coupleClerkId}
                          </p>
                        </div>
                        <span style={{
                          background: statusColors.bg,
                          color: statusColors.text,
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600"
                        }}>
                          {booking.status}
                        </span>
                      </div>
                      {booking.eventDate && (
                        <p style={{ color: "#7a5d4e", fontSize: "0.9rem" }}>
                          Date: {new Date(booking.eventDate).toLocaleDateString()}
                        </p>
                      )}
                      {booking.location && (
                        <p style={{ color: "#7a5d4e", fontSize: "0.9rem" }}>
                          Location: {booking.location}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ratings Section */}
          {ratings.length > 0 && (
            <div className="ratings-section">
              <h3>Reviews ({ratings.length})</h3>
              {ratings.map((rating) => (
                <div key={rating.id} className="rating-item">
                  <div className="rating-header">
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < rating.rating ? "#d4af37" : "none"}
                          color="#d4af37"
                        />
                      ))}
                    </div>
                    <span className="rating-date">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.comment && <p className="rating-comment">{rating.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

