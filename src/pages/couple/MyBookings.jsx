import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import { getCoupleBookings, getServiceById, createRating } from "../../utils/api";
import { Star, MessageSquare, X } from "lucide-react";
import "./CoupleDashboard.css";

export default function MyBookings() {
  const { userId } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadBookings = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const bookingsData = await getCoupleBookings(userId);
        // Load service details for each booking
        const bookingsWithServices = await Promise.all(
          bookingsData.map(async (booking) => {
            try {
              const service = await getServiceById(booking.serviceId);
              return { ...booking, service };
            } catch {
              return { ...booking, service: null };
            }
          })
        );
        setBookings(bookingsWithServices);
      } catch (error) {
        console.error("Failed to load bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, [userId]);

  const handleRateService = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setIsSubmitting(true);
    try {
      await createRating(userId, {
        serviceId: selectedBooking.serviceId,
        bookingId: selectedBooking.id,
        rating,
        comment
      });
      alert("Thank you for your rating!");
      setSelectedBooking(null);
      setRating(5);
      setComment("");
    } catch (error) {
      console.error("Failed to submit rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return { bg: "#fef3c7", text: "#92400e" };
      case "ACCEPTED": return { bg: "#d1fae5", text: "#065f46" };
      case "REJECTED": return { bg: "#fee2e2", text: "#991b1b" };
      case "COMPLETED": return { bg: "#dbeafe", text: "#1e40af" };
      case "CANCELLED": return { bg: "#f3f4f6", text: "#6b7280" };
      default: return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">Track your service booking requests</p>

          {isLoading ? (
            <p>Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "3rem",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <p style={{ color: "#7a5d4e", marginBottom: "1rem" }}>No bookings yet</p>
              <a href="/couple/browse-services" style={{
                color: "#d4af37",
                textDecoration: "none",
                fontWeight: "600"
              }}>Browse Services</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {bookings.map((booking) => {
                const statusColors = getStatusColor(booking.status);
                return (
                  <div
                    key={booking.id}
                    style={{
                      background: "white",
                      borderRadius: "12px",
                      padding: "1.5rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                    }}
                  >
                    {booking.service?.imageUrl && (
                      <img
                        src={booking.service.imageUrl}
                        alt={booking.service.serviceName || "Service"}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginBottom: "1rem"
                        }}
                      />
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div>
                        <h3 style={{ fontFamily: "Playfair Display, serif", color: "#523c2b", marginBottom: "0.5rem" }}>
                          {booking.service?.serviceName || `Booking #${booking.id}`}
                        </h3>
                        {booking.service?.category && (
                          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                            {booking.service.category}
                          </p>
                        )}
                      </div>
                      <span style={{
                        background: statusColors.bg,
                        color: statusColors.text,
                        padding: "0.5rem 1rem",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600"
                      }}>
                        {booking.status}
                      </span>
                    </div>

                    {booking.eventDate && (
                      <p style={{ color: "#7a5d4e", marginBottom: "0.5rem" }}>
                        <strong>Event Date:</strong> {new Date(booking.eventDate).toLocaleDateString()}
                      </p>
                    )}
                    {booking.eventTime && (
                      <p style={{ color: "#7a5d4e", marginBottom: "0.5rem" }}>
                        <strong>Event Time:</strong> {booking.eventTime}
                      </p>
                    )}
                    {booking.location && (
                      <p style={{ color: "#7a5d4e", marginBottom: "0.5rem" }}>
                        <strong>Location:</strong> {booking.location}
                      </p>
                    )}
                    {booking.specialRequests && (
                      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                        <strong>Special Requests:</strong> {booking.specialRequests}
                      </p>
                    )}
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                      Requested: {new Date(booking.createdAt).toLocaleString()}
                    </p>
                    {booking.respondedAt && (
                      <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                        Responded: {new Date(booking.respondedAt).toLocaleString()}
                      </p>
                    )}

                    {booking.status === "ACCEPTED" && (
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        style={{
                          marginTop: "1.5rem",
                          padding: "0.75rem 1.5rem",
                          background: "#d4af37",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <Star size={18} />
                        Rate Service
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Rating Modal */}
          {selectedBooking && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem"
            }}>
              <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "2rem",
                width: "100%",
                maxHeight: "90vh",
                maxWidth: "500px",
                position: "relative",
                overflowY: "auto"
              }}>
                <button
                  onClick={() => setSelectedBooking(null)}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280"
                  }}
                >
                  <X size={24} />
                </button>

                <h2 style={{ fontFamily: "Playfair Display, serif", color: "#523c2b", marginBottom: "1.5rem" }}>
                  Rate {selectedBooking.service?.serviceName || "Service"}
                </h2>

                <form onSubmit={handleRateService}>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#523c2b" }}>
                      Rating
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: star <= rating ? "#d4af37" : "#d1d5db"
                          }}
                        >
                          <Star size={32} fill={star <= rating ? "#d4af37" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#523c2b" }}>
                      Your Review
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this service..."
                      required
                      style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        minHeight: "120px",
                        fontSize: "1rem"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      background: isSubmitting ? "#9ca3af" : "#d4af37",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      cursor: isSubmitting ? "not-allowed" : "pointer"
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

