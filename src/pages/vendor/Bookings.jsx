import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import VendorSidebar from "../../components/VendorSidebar";
import { getVendorBookings, updateBookingStatus, getServiceById } from "../../utils/api";
import "./VendorDashboard.css";

export default function Bookings() {
  const { userId } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const bookingsData = await getVendorBookings(userId);
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

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, userId, status);
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status } : b
      ));
    } catch (error) {
      console.error("Failed to update booking:", error);
      alert("Failed to update booking status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "#fef3c7";
      case "ACCEPTED": return "#d1fae5";
      case "REJECTED": return "#fee2e2";
      case "COMPLETED": return "#dbeafe";
      default: return "#f3f4f6";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "PENDING": return "#92400e";
      case "ACCEPTED": return "#065f46";
      case "REJECTED": return "#991b1b";
      case "COMPLETED": return "#1e40af";
      default: return "#6b7280";
    }
  };

  return (
    <div className="vendor-dashboard">
      <VendorSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Booking Requests</h1>
          <p className="page-subtitle">Manage your service bookings</p>

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
              <p style={{ color: "#7a5d4e" }}>No booking requests yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {bookings.map((booking) => (
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
                      <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                        From: {booking.coupleClerkId}
                      </p>
                      {booking.service?.category && (
                        <p style={{ color: "#7a5d4e", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          {booking.service.category}
                        </p>
                      )}
                    </div>
                    <span style={{
                      background: getStatusColor(booking.status),
                      color: getStatusTextColor(booking.status),
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

                  {booking.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "ACCEPTED")}
                        style={{
                          flex: 1,
                          padding: "0.75rem 1.5rem",
                          background: "#d1fae5",
                          color: "#065f46",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "REJECTED")}
                        style={{
                          flex: 1,
                          padding: "0.75rem 1.5rem",
                          background: "#fee2e2",
                          color: "#991b1b",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

