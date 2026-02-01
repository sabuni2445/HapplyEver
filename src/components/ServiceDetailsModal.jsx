import { useState, useEffect } from "react";
import { X, Star, Calendar, MapPin, DollarSign, Clock, User, ShieldCheck } from "lucide-react";
import { createBooking, getServiceRatings, createRating, getUserByClerkId } from "../utils/api";
import BookingForm from "./BookingForm";
import RatingForm from "./RatingForm";
import "./ServiceDetailsModal.css";

export default function ServiceDetailsModal({ service, coupleClerkId, onClose }) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratingsData, vendorData] = await Promise.all([
          getServiceRatings(service.id),
          getUserByClerkId(service.clerkId)
        ]);
        setRatings(ratingsData);
        setVendor(vendorData);
      } catch (error) {
        console.error("Failed to load modal data:", error);
      }
    };
    fetchData();
  }, [service.id, service.clerkId]);

  const handleBookingSuccess = () => {
    setBookingSuccess(true);
    setShowBookingForm(false);
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content editorial-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-body">
          <div className="service-hero">
            {isVideo(service.videoUrl || service.imageUrl) ? (
              <video
                src={service.videoUrl || service.imageUrl}
                className="hero-video"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              service.imageUrl && <img src={service.imageUrl} alt={service.serviceName} className="hero-img" />
            )}
            <div className="hero-overlay">
              <div className="hero-content">
                <div className="hero-badge-row">
                  <span className="hero-pretitle">PREMIUM PARTNER</span>
                  {vendor?.packageType === 'PREMIUM' && (
                    <div className="premium-badge">
                      <ShieldCheck size={12} />
                      <span>VERIFIED PRO</span>
                    </div>
                  )}
                </div>
                <h2 className="hero-title">{service.serviceName}</h2>
                <div className="hero-meta">
                  <span className="category-tag">{service.category}</span>
                  {service.averageRating > 0 && (
                    <div className="rating-tag">
                      <Star size={14} fill="#d4af37" color="#d4af37" />
                      <span>{service.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="service-info-section">
            <div className="info-grid">
              {service.price && (
                <div className="info-card">
                  <p className="info-label">Investment</p>
                  <p className="info-value">ETB {service.price.toLocaleString()}</p>
                  <p className="info-sub">{service.amount || "starting rate"}</p>
                </div>
              )}
              {service.location && (
                <div className="info-card">
                  <p className="info-label">Location</p>
                  <p className="info-value">{service.location}</p>
                  <p className="info-sub">Service Area</p>
                </div>
              )}
              {service.duration && (
                <div className="info-card">
                  <p className="info-label">Duration</p>
                  <p className="info-value">{service.duration}</p>
                  <p className="info-sub">Estimated Time</p>
                </div>
              )}
            </div>

            <div className="editorial-layout-split">
              <div className="editorial-main-col">
                <div className="editorial-description">
                  <h3 className="section-title-small">The Experience</h3>
                  <p className="description-text">{service.description}</p>
                </div>

                {ratings.length > 0 && !showBookingForm && !showRatingForm && (
                  <div className="editorial-reviews">
                    <h3 className="section-title-small">Kind Words</h3>
                    <div className="reviews-list">
                      {ratings.slice(0, 3).map((rating) => (
                        <div key={rating.id} className="review-card">
                          <div className="review-header">
                            <div className="review-rating">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  fill={i < rating.rating ? "#d4af37" : "none"}
                                  color="#d4af37"
                                />
                              ))}
                            </div>
                            <span className="review-date">
                              {new Date(rating.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="review-text">"{rating.comment}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="editorial-side-col">
                <div className="vendor-mini-profile">
                  <h3 className="section-title-small">Presented By</h3>
                  <div className="vendor-card-compact">
                    {vendor?.imageUrl ? (
                      <img src={vendor.imageUrl} alt={vendor.firstName} className="vendor-avatar" />
                    ) : (
                      <div className="vendor-avatar-placeholder"><User size={20} /></div>
                    )}
                    <div className="vendor-details">
                      <p className="vendor-name">{vendor ? `${vendor.firstName} ${vendor.lastName}` : "Professional Vendor"}</p>
                      <p className="vendor-role">Wedding Specialist</p>
                    </div>
                  </div>
                  <p className="vendor-bio">
                    Dedicated to making your special day extraordinary with bespoke {service.category?.toLowerCase() || 'service'} solutions.
                  </p>
                </div>

                <div className="side-actions">
                  {!showBookingForm && !showRatingForm && (
                    <>
                      <button
                        className="btn-editorial-primary"
                        onClick={() => setShowBookingForm(true)}
                      >
                        Check Availability
                      </button>
                      <button
                        className="btn-editorial-secondary"
                        onClick={() => setShowRatingForm(true)}
                      >
                        Add a Review
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {bookingSuccess && (
              <div className="success-banner">
                <span className="success-icon">✨</span>
                <p>Your request has been gracefully delivered to {service.serviceName}.</p>
              </div>
            )}

            {showBookingForm && (
              <div className="form-container-reveal">
                <div className="form-reveal-header">
                  <button onClick={() => setShowBookingForm(false)} className="back-link">← Return to Service</button>
                </div>
                <BookingForm
                  service={service}
                  coupleClerkId={coupleClerkId}
                  onSuccess={handleBookingSuccess}
                  onCancel={() => setShowBookingForm(false)}
                />
              </div>
            )}

            {showRatingForm && (
              <div className="form-container-reveal">
                <div className="form-reveal-header">
                  <button onClick={() => setShowRatingForm(false)} className="back-link">← Return to Service</button>
                </div>
                <RatingForm
                  service={service}
                  coupleClerkId={coupleClerkId}
                  onSuccess={() => {
                    setShowRatingForm(false);
                    loadRatings();
                  }}
                  onCancel={() => setShowRatingForm(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

