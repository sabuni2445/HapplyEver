import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { getAllServices, getAverageRating, createBooking } from "../utils/api";
import ServiceSelectionCard from "./ServiceSelectionCard";
import BookingForm from "./BookingForm";
import "./ServiceSelectionSection.css";

export default function ServiceSelectionSection({ 
  category, 
  label, 
  coupleClerkId, 
  selectedService, 
  onServiceSelect,
  onBookingRequest 
}) {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingService, setBookingService] = useState(null);

  useEffect(() => {
    if (showServices) {
      loadServices();
    }
  }, [showServices, category]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const allServices = await getAllServices();
      const categoryServices = allServices.filter(s => 
        s.category === category && 
        s.status === "ACTIVE" &&
        s.availabilityStatus !== "BOOKED" // Don't show booked services
      );
      
      // Load ratings for each service
      const servicesWithRatings = await Promise.all(
        categoryServices.map(async (service) => {
          try {
            const ratingData = await getAverageRating(service.id);
            return { 
              ...service, 
              averageRating: ratingData.average || 0, 
              ratingCount: ratingData.count || 0 
            };
          } catch {
            return { ...service, averageRating: 0, ratingCount: 0 };
          }
        })
      );
      setServices(servicesWithRatings);
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="service-selection-section">
      <div className="section-header">
        <h4>{label}</h4>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {selectedService && (
            <span className="selected-badge">
              Selected: {selectedService.serviceName}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowServices(!showServices)}
            className="toggle-services-btn"
          >
            {showServices ? <X size={18} /> : <Plus size={18} />}
            {showServices ? "Hide" : "Browse"} Services
          </button>
        </div>
      </div>

      {showServices && (
        <div className="services-list">
          {isLoading ? (
            <p>Loading services...</p>
          ) : services.length === 0 ? (
            <p style={{ color: "#6b7280", fontStyle: "italic" }}>
              No {label.toLowerCase()} services available. You can enter your own below.
            </p>
          ) : (
            <>
              <p style={{ color: "#7a5d4e", marginBottom: "1rem", fontSize: "0.9rem" }}>
                Select a vendor or enter your own below:
              </p>
              <div className="services-grid">
                {services.map((service) => (
                  <ServiceSelectionCard
                    key={service.id}
                    service={service}
                    isSelected={selectedService?.id === service.id}
                    onSelect={() => onServiceSelect(service)}
                    onRequestBooking={() => {
                      setBookingService(service);
                      setShowBookingForm(true);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showBookingForm && bookingService && (
        <div className="booking-form-overlay">
          <div className="booking-form-popup">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4>Request Booking: {bookingService.serviceName}</h4>
              <button onClick={() => { setShowBookingForm(false); setBookingService(null); }}>
                <X size={20} />
              </button>
            </div>
            <BookingForm
              service={bookingService}
              coupleClerkId={coupleClerkId}
              onSuccess={() => {
                onBookingRequest(bookingService);
                setShowBookingForm(false);
                setBookingService(null);
              }}
              onCancel={() => { setShowBookingForm(false); setBookingService(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

