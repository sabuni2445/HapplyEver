import { useState, useEffect } from "react";
import { X, Star, Calendar, MapPin, DollarSign, Clock } from "lucide-react";
import { createBooking, getServiceRatings, createRating } from "../utils/api";
import BookingForm from "./BookingForm";
import RatingForm from "./RatingForm";
import "./ServiceDetailsModal.css";

export default function ServiceDetailsModal({ service, coupleClerkId, onClose }) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const loadRatings = async () => {
    try {
      const ratingsData = await getServiceRatings(service.id);
      setRatings(ratingsData);
    } catch (error) {
      console.error("Failed to load ratings:", error);
    }
  };

  useEffect(() => {
    loadRatings();
  }, [service.id]);

  const handleBookingSuccess = () => {
    setBookingSuccess(true);
    setShowBookingForm(false);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-body">
          {service.imageUrl && (
            <div className="service-modal-image">
              <img src={service.imageUrl} alt={service.serviceName} />
            </div>
          )}

          <div className="service-modal-header">
            <h2>{service.serviceName}</h2>
            {service.averageRating > 0 && (
              <div className="service-rating-large">
                <Star size={20} fill="#d4af37" color="#d4af37" />
                <span>{service.averageRating.toFixed(1)}</span>
                <span className="rating-count">({service.ratingCount} reviews)</span>
              </div>
            )}
          </div>

          {service.category && (
            <p className="service-category-badge">{service.category}</p>
          )}

          <div className="service-details-grid">
            {service.price && (
              <div className="detail-item">
                <DollarSign size={20} />
                <div>
                  <strong>Price:</strong>
                  <p>${service.price.toFixed(2)} {service.amount && `/ ${service.amount}`}</p>
                </div>
              </div>
            )}
            {service.duration && (
              <div className="detail-item">
                <Clock size={20} />
                <div>
                  <strong>Duration:</strong>
                  <p>{service.duration}</p>
                </div>
              </div>
            )}
            {service.location && (
              <div className="detail-item">
                <MapPin size={20} />
                <div>
                  <strong>Location:</strong>
                  <p>{service.location}</p>
                </div>
              </div>
            )}
            {service.availability && (
              <div className="detail-item">
                <Calendar size={20} />
                <div>
                  <strong>Availability:</strong>
                  <p>{service.availability}</p>
                </div>
              </div>
            )}
          </div>

          <div className="service-description-full">
            <h3>Description</h3>
            <p>{service.description}</p>
          </div>

          {bookingSuccess && (
            <div className="success-message">
              ✅ Booking request sent! The vendor will review and respond.
            </div>
          )}

          {!showBookingForm && !showRatingForm && (
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => setShowBookingForm(true)}
              >
                Request Booking
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowRatingForm(true)}
              >
                Rate & Review
              </button>
            </div>
          )}

          {showBookingForm && (
            <BookingForm
              service={service}
              coupleClerkId={coupleClerkId}
              onSuccess={handleBookingSuccess}
              onCancel={() => setShowBookingForm(false)}
            />
          )}

          {showRatingForm && (
            <RatingForm
              service={service}
              coupleClerkId={coupleClerkId}
              onSuccess={() => {
                setShowRatingForm(false);
                loadRatings();
              }}
              onCancel={() => setShowRatingForm(false)}
            />
          )}

          {ratings.length > 0 && (
            <div className="ratings-section">
              <h3>Reviews</h3>
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

