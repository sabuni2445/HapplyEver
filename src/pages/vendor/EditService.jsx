import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams, useNavigate } from "react-router-dom";
import VendorSidebar from "../../components/VendorSidebar";
import AddServiceForm from "../../components/AddServiceForm";
import { getServiceById } from "../../utils/api";
import "./VendorDashboard.css";

export default function EditService() {
  const { userId } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadService = async () => {
      if (!userId || !id) return;
      
      setIsLoading(true);
      try {
        const serviceData = await getServiceById(id);
        setService(serviceData);
      } catch (error) {
        console.error("Failed to load service:", error);
        alert("Failed to load service. Redirecting...");
        navigate("/vendor/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadService();
  }, [userId, id, navigate]);

  if (isLoading) {
    return (
      <div className="vendor-dashboard">
        <VendorSidebar />
        <div className="dashboard-content">
          <div className="content-wrapper">
            <p>Loading service...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="vendor-dashboard">
        <VendorSidebar />
        <div className="dashboard-content">
          <div className="content-wrapper">
            <p>Service not found</p>
            <button onClick={() => navigate("/vendor/dashboard")}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      <VendorSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Edit Service</h1>
          <p className="page-subtitle">Update your service details</p>
          <AddServiceForm userId={userId} initialService={service} isEdit={true} />
        </div>
      </div>
    </div>
  );
}









