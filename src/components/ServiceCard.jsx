import { Star } from "lucide-react";
import "./ServiceCard.css";

export default function ServiceCard({ service, onClick }) {
  return (
    <div className="editorial-service-card" onClick={onClick}>
      <div className="card-image-wrapper">
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.serviceName} className="card-img" />
        ) : (
          <div className="card-img-placeholder"></div>
        )}
        <div className="card-image-overlay">
          <span className="card-category-tag">{service.category}</span>
        </div>
      </div>

      <div className="card-info">
        <div className="card-row">
          <h3 className="card-name">{service.serviceName}</h3>
          {service.averageRating > 0 && (
            <div className="card-rating">
              <Star size={12} fill="#d4af37" color="#d4af37" />
              <span>{service.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="card-short-desc">
          {service.description?.length > 85
            ? `${service.description.substring(0, 85)}...`
            : service.description}
        </p>

        <div className="card-footer-editorial">
          <p className="card-price-label">
            From <span className="price-accent">ETB {service.price?.toLocaleString()}</span>
          </p>
          <div className="card-cta-link">
            <span>Discover</span>
            <div className="cta-underline"></div>
          </div>
        </div>
      </div>
    </div>
  );
}









