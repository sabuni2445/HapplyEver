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
    <div className="booking-form-wrapper">
      <div className="form-header">
        <h3 className="form-title">Inquiry Details</h3>
        <p className="form-subtitle">Curating your experience with {service.serviceName}</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-form-editorial">
        <div className="form-grid">
          <div className="input-group">
            <label className="editorial-label">Preferred Date</label>
            <div className="input-with-icon">
              <Calendar size={18} className="input-icon" />
              <input
                type="date"
                required
                className="editorial-input"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="editorial-label">Event Time</label>
            <div className="input-with-icon">
              <Clock size={18} className="input-icon" />
              <input
                type="time"
                className="editorial-input"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="input-group">
          <label className="editorial-label">Venue Location</label>
          <div className="input-with-icon">
            <MapPin size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Where will the celebration take place?"
              className="editorial-input"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="editorial-label">Bespoke Requirements</label>
          <textarea
            placeholder="Share any specific visions or special accommodations you desire..."
            className="editorial-textarea"
            rows="4"
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
          />
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        <div className="form-actions-editorial">
          <button
            type="button"
            className="btn-link"
            onClick={onCancel}
            disabled={isSubmitting || success}
          >
            Go Back
          </button>
          <button
            type="submit"
            className="btn-gold"
            disabled={isSubmitting || success}
          >
            {isSubmitting ? "Delivering..." : success ? "Request Sent" : "Send Inquiry"}
          </button>
        </div>
      </form>
    </div>
  );
}

