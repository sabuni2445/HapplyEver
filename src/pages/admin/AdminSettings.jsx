import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { getUserFromDatabase, updateUserProfile } from "../../utils/api";
import { Save, User, Mail, Phone } from "lucide-react";
import "./AdminDashboard.css";

export default function AdminSettings() {
  const { userId: clerkUserId, user: clerkUser } = useAuth();
  const [userId, setUserId] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    imageUrl: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Check for DB-based login user in localStorage
    const dbUserStr = localStorage.getItem("dbUser");
    if (dbUserStr) {
      try {
        const dbUserObj = JSON.parse(dbUserStr);
        if (dbUserObj.clerkId) {
          setUserId(dbUserObj.clerkId);
          return;
        }
      } catch (e) {
        console.error("Failed to parse dbUser:", e);
      }
    }
    // Fallback to Clerk userId
    if (clerkUserId) {
      setUserId(clerkUserId);
    }
  }, [clerkUserId]);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;
    try {
      const userData = await getUserFromDatabase(userId);
      setDbUser(userData);
      setFormData({
        firstName: userData.firstName || clerkUser?.firstName || "",
        lastName: userData.lastName || clerkUser?.lastName || "",
        phoneNumber: userData.phoneNumber || "",
        imageUrl: userData.imageUrl || clerkUser?.imageUrl || ""
      });
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateUserProfile(userId, formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadUserData();
    } catch (error) {
      alert("Failed to update profile: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Settings</h1>

          <div className="section-card">
            <h2>Profile Settings</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  <User size={18} />
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <User size={18} />
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <Mail size={18} />
                  Email
                </label>
                <input
                  type="email"
                  value={dbUser?.email || clerkUser?.emailAddresses[0]?.emailAddress || ""}
                  disabled
                  style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                />
                <small style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                  Email cannot be changed
                </small>
              </div>

              <div className="form-group">
                <label>
                  <Phone size={18} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Profile Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {formData.imageUrl && (
                <div style={{ marginBottom: "1rem" }}>
                  <img
                    src={formData.imageUrl}
                    alt="Profile Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #d4af37"
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              {saveSuccess && (
                <div style={{
                  padding: "1rem",
                  background: "#d1fae5",
                  color: "#065f46",
                  borderRadius: "8px",
                  marginBottom: "1rem"
                }}>
                  Profile updated successfully!
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}









