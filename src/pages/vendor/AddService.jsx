import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import VendorSidebar from "../../components/VendorSidebar";
import AddServiceForm from "../../components/AddServiceForm";
import "./VendorDashboard.css";

export default function AddService() {
  const { userId } = useAuth();

  return (
    <div className="vendor-dashboard">
      <VendorSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Add Service</h1>
          <p className="page-subtitle">Create a new service offering</p>
          <AddServiceForm userId={userId} />
        </div>
      </div>
    </div>
  );
}









