import { Star, CheckCircle } from "lucide-react";
import "./ServiceSelectionCard.css";

export default function ServiceSelectionCard({ service, isSelected, onSelect, onRequestBooking }) {
  return (
    <div className={`service-selection-card ${isSelected ? "selected" : ""}`}>
      {service.imageUrl && (
        <div className="card-image">
          <img src={service.imageUrl} alt={service.serviceName} />
        </div>
      )}
      <div className="card-content">
        <div className="card-header">
          <h5>{service.serviceName}</h5>
          {isSelected && <CheckCircle size={18} color="#065f46" />}
        </div>
        {service.averageRating > 0 && (
          <div className="card-rating">
            <Star size={14} fill="#d4af37" color="#d4af37" />
            <span>{service.averageRating.toFixed(1)}</span>
            <span className="rating-count">({service.ratingCount})</span>
          </div>
        )}
        {service.price && (
          <p className="card-price">${service.price.toFixed(2)} {service.amount && `/ ${service.amount}`}</p>
        )}
        <p className="card-description">{service.description?.substring(0, 80)}...</p>
        <div className="card-actions">
          <button
            type="button"
            onClick={onSelect}
            className={`btn-select ${isSelected ? "selected" : ""}`}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
          <button
            type="button"
            onClick={onRequestBooking}
            className="btn-request"
          >
            Request Booking
          </button>
        </div>
      </div>
    </div>
  );
}









