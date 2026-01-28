import { useState } from "react";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";
import { createBooking } from "../utils/api";
import "./BookingForm.css";

export default function BookingForm({ service, coupleClerkId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    eventDate: "",
    eventTime: "",
    location: "",
    specialRequests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const bookingData = {
        serviceId: service.id,
        eventDate: formData.eventDate || null,
        eventTime: formData.eventTime || null,
        location: formData.location || null,
        specialRequests: formData.specialRequests || null,
      };
      const response = await createBooking(coupleClerkId, bookingData);
      
      // Show success message
      setSuccess(true);
      
      // Wait a moment to show the success message, then call onSuccess
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response.booking || bookingData);
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to send booking request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-form-container">
      <h3>Request Booking</h3>
      <p className="form-subtitle">Send a booking request to {service.serviceName}</p>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-row">
          <div className="form-group">
            <label>
              <Calendar size={16} />
              Event Date
            </label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>
              <Clock size={16} />
              Event Time
            </label>
            <input
              type="time"
              value={formData.eventTime}
              onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            <MapPin size={16} />
            Location
          </label>
          <input
            type="text"
            placeholder="Event location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>
            <FileText size={16} />
            Special Requests
          </label>
          <textarea
            placeholder="Any special requests or notes..."
            rows="4"
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
          />
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="success-message" style={{
            padding: "1rem",
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: "8px",
            marginBottom: "1rem",
            textAlign: "center",
            fontWeight: "600"
          }}>
            ✅ Request sent! Waiting for vendor approval...
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel} disabled={isSubmitting || success}>
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={isSubmitting || success}>
            {isSubmitting ? "Sending..." : success ? "Sent!" : "Send Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

