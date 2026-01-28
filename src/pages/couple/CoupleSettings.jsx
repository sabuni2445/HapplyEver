import CoupleSidebar from "../../components/CoupleSidebar";
import "./CoupleDashboard.css";

export default function CoupleSettings() {
  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Settings</h1>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <p style={{ color: "#7a5d4e" }}>Settings page coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}









