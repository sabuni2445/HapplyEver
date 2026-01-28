import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import { getUserFromDatabase, updateUserProfile } from "../../utils/api";
import "./CoupleDashboard.css";

export default function CoupleProfile() {
  const { userId } = useAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (userId) {
        try {
          const userData = await getUserFromDatabase(userId);
          setUser(userData);
        } catch (error) {
          console.error("Failed to load user:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="couple-dashboard">
        <CoupleSidebar />
        <div className="dashboard-content">
          <div className="content-wrapper">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Profile</h1>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            {user && (
              <div style={{ display: "grid", gap: "1.5rem" }}>
                <div>
                  <label style={{ fontWeight: "600", color: "#523c2b", display: "block", marginBottom: "0.5rem" }}>Email</label>
                  <p style={{ color: "#7a5d4e" }}>{user.email}</p>
                </div>
                <div>
                  <label style={{ fontWeight: "600", color: "#523c2b", display: "block", marginBottom: "0.5rem" }}>Name</label>
                  <p style={{ color: "#7a5d4e" }}>{user.firstName} {user.lastName}</p>
                </div>
                {user.phoneNumber && (
                  <div>
                    <label style={{ fontWeight: "600", color: "#523c2b", display: "block", marginBottom: "0.5rem" }}>Phone</label>
                    <p style={{ color: "#7a5d4e" }}>{user.phoneNumber}</p>
                  </div>
                )}
                {user.imageUrl && (
                  <div>
                    <label style={{ fontWeight: "600", color: "#523c2b", display: "block", marginBottom: "0.5rem" }}>Profile Picture</label>
                    <img src={user.imageUrl} alt="Profile" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover" }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}









