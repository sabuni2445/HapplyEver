import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import VendorSidebar from "../../components/VendorSidebar";
import VendorServiceDetailsModal from "../../components/VendorServiceDetailsModal";
import { getServices, deleteService } from "../../utils/api";
import "./VendorDashboard.css";

export default function VendorDashboard() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const servicesData = await getServices(userId);
        setServices(servicesData);
      } catch (error) {
        console.error("Failed to load services:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadServices();
  }, [userId]);

  const handleDelete = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    
    try {
      await deleteService(userId, serviceId);
      setServices(services.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };

  return (
    <div className="vendor-dashboard">
      <VendorSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">My Services</h1>
          <p className="page-subtitle">Manage your services</p>
          
          {isLoading ? (
            <p>Loading services...</p>
          ) : services.length === 0 ? (
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "3rem",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <p style={{ color: "#7a5d4e", marginBottom: "1rem" }}>No services yet</p>
              <button
                onClick={() => navigate("/vendor/add-service")}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "linear-gradient(135deg, #d4af37, #b89627)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1rem"
                }}
              >
                Add Your First Service
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem"
            }}>
              {services.map((service) => (
                <div key={service.id} style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  position: "relative"
                }}>
                  {service.imageUrl && (
                    <img 
                      src={service.imageUrl} 
                      alt={service.serviceName}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "1rem"
                      }}
                    />
                  )}
                  <div style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: service.status === "ACTIVE" ? "#d1fae5" : "#fee2e2",
                    color: service.status === "ACTIVE" ? "#065f46" : "#991b1b",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    fontWeight: "600"
                  }}>
                    {service.status}
                  </div>
                  <h3 style={{ 
                    fontFamily: "Playfair Display, serif",
                    color: "#523c2b",
                    marginBottom: "0.5rem",
                    fontSize: "1.5rem"
                  }}>
                    {service.serviceName}
                  </h3>
                  {service.category && (
                    <p style={{ color: "#7a5d4e", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                      {service.category}
                    </p>
                  )}
                  <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.95rem" }}>
                    {service.description?.substring(0, 100)}...
                  </p>
                  {service.price && (
                    <p style={{ 
                      fontSize: "1.25rem", 
                      fontWeight: "600", 
                      color: "#d4af37",
                      marginBottom: "1rem"
                    }}>
                      ${service.price.toFixed(2)}
                      {service.amount && <span style={{ fontSize: "0.9rem", color: "#7a5d4e" }}> / {service.amount}</span>}
                    </p>
                  )}
                  {service.availabilityStatus && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={{
                        background: service.availabilityStatus === "AVAILABLE" ? "#d1fae5" : 
                                   service.availabilityStatus === "BOOKED" ? "#fee2e2" : "#f3f4f6",
                        color: service.availabilityStatus === "AVAILABLE" ? "#065f46" : 
                               service.availabilityStatus === "BOOKED" ? "#991b1b" : "#6b7280",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "600"
                      }}>
                        {service.availabilityStatus}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button
                      onClick={() => setSelectedService(service)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        background: "#e0f2fe",
                        border: "1px solid #bae6fd",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#0369a1",
                        fontWeight: "500"
                      }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/vendor/edit-service/${service.id}`)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#523c2b",
                        fontWeight: "500"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#991b1b",
                        fontWeight: "500"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedService && (
            <VendorServiceDetailsModal
              service={selectedService}
              onClose={() => setSelectedService(null)}
              onServiceUpdate={(updatedService) => {
                setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
                setSelectedService(updatedService);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

