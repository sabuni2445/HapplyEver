import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import ServiceCard from "../../components/ServiceCard";
import ServiceDetailsModal from "../../components/ServiceDetailsModal";
import { getAllServices, getAverageRating } from "../../utils/api";
import "./CoupleDashboard.css";

export default function BrowseServices() {
  const { userId } = useAuth();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const servicesData = await getAllServices();
        // Load ratings for each service
        // Filter out booked services
        const availableServices = servicesData.filter(s => 
          s.availabilityStatus !== "BOOKED" || !s.availabilityStatus
        );
        
        const servicesWithRatings = await Promise.all(
          availableServices.map(async (service) => {
            try {
              const ratingData = await getAverageRating(service.id);
              return { ...service, averageRating: ratingData.average || 0, ratingCount: ratingData.count || 0 };
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
    loadServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(services.map(s => s.category).filter(Boolean))];

  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Browse Services</h1>
          <p className="page-subtitle">Find the perfect vendors for your wedding</p>

          {/* Search and Filter */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p>Loading services...</p>
          ) : filteredServices.length === 0 ? (
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "3rem",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <p style={{ color: "#7a5d4e" }}>No services found</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem"
            }}>
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onClick={() => setSelectedService(service)}
                />
              ))}
            </div>
          )}

          {selectedService && (
            <ServiceDetailsModal
              service={selectedService}
              coupleClerkId={userId}
              onClose={() => setSelectedService(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

