import { Star } from "lucide-react";
import "./ServiceCard.css";

export default function ServiceCard({ service, onClick }) {
  return (
    <div className="service-card" onClick={onClick}>
      {service.imageUrl && (
        <div className="service-card-image">
          <img src={service.imageUrl} alt={service.serviceName} />
          {service.status === "ACTIVE" && (
            <span className="service-status-badge">Available</span>
          )}
        </div>
      )}
      <div className="service-card-content">
        <div className="service-card-header">
          <h3>{service.serviceName}</h3>
          {service.averageRating > 0 && (
            <div className="service-rating">
              <Star size={16} fill="#d4af37" color="#d4af37" />
              <span>{service.averageRating.toFixed(1)}</span>
              <span className="rating-count">({service.ratingCount})</span>
            </div>
          )}
        </div>
        {service.category && (
          <p className="service-category">{service.category}</p>
        )}
        <p className="service-description">
          {service.description?.substring(0, 100)}...
        </p>
        {service.price && (
          <div className="service-price">
            ${service.price.toFixed(2)}
            {service.amount && <span> / {service.amount}</span>}
          </div>
        )}
        <button className="service-view-btn">View Details</button>
      </div>
    </div>
  );
}









