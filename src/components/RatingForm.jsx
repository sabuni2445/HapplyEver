import { useState } from "react";
import { Star } from "lucide-react";
import { createRating } from "../utils/api";
import "./RatingForm.css";

export default function RatingForm({ service, coupleClerkId, onSuccess, onCancel }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createRating(coupleClerkId, {
        serviceId: service.id,
        rating: rating,
        comment: comment || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rating-form-container">
      <h3>Rate & Review</h3>
      <p className="form-subtitle">Share your experience with {service.serviceName}</p>

      <form onSubmit={handleSubmit} className="rating-form">
        <div className="rating-stars-input">
          <label>Rating *</label>
          <div className="stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="star-button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={32}
                  fill={star <= (hoveredRating || rating) ? "#d4af37" : "none"}
                  color="#d4af37"
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="rating-text">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        <div className="form-group">
          <label>Comment (Optional)</label>
          <textarea
            placeholder="Share your experience..."
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={isSubmitting || rating === 0}>
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </form>
    </div>
  );
}









