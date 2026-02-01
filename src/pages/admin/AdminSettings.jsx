import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { getUserFromDatabase, updateUserProfile, getAdminAnalytics } from "../../utils/api";
import {
  Save, User, Mail, Phone, Upload, ShieldCheck,
  TrendingUp, Users, Star, Zap, Activity
} from "lucide-react";
import "./AdminDashboard.css";
import "../common/Profile.css";

export default function AdminSettings() {
  const { userId: clerkUserId } = useAuth();
  const { user: clerkUser } = useUser();
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [analytics, setAnalytics] = useState({ revenue: 0, users: 0, weddings: 0 });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    imageUrl: ""
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
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
    if (clerkUserId) setUserId(clerkUserId);
  }, [clerkUserId]);

  useEffect(() => {
    if (userId) {
      const loadAll = async () => {
        setIsLoading(true);
        try {
          const [userData, analyticsData] = await Promise.all([
            getUserFromDatabase(userId),
            getAdminAnalytics()
          ]);
          setUser(userData);
          setAnalytics({
            revenue: analyticsData.totalRevenue,
            users: analyticsData.totalUsers,
            weddings: analyticsData.totalWeddings
          });
          setFormData({
            firstName: userData.firstName || clerkUser?.firstName || "",
            lastName: userData.lastName || clerkUser?.lastName || "",
            phoneNumber: userData.phoneNumber || "",
            imageUrl: userData.imageUrl || clerkUser?.imageUrl || ""
          });
          setImagePreview(userData.imageUrl || clerkUser?.imageUrl);
        } catch (e) { console.log(e); }
        finally { setIsLoading(false); }
      };
      loadAll();
    }
  }, [userId, clerkUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setIsSaving(true);
    try {
      await updateUserProfile(userId, formData);
      alert("Platform Identity Updated!");
    } catch (e) { alert("Error: " + e.message); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="admin-dashboard"><AdminSidebar /><div className="dashboard-content"><div className="loading-spinner"></div></div></div>;

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper profile-main-content">
          <div className="profile-container" style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div className="profile-header" style={{ marginBottom: "2rem" }}>
              <div className="header-with-badge" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.5rem", color: "#d4af37", margin: 0 }}>Settings</h1>
                <div className="admin-badge" style={{ alignSelf: "center" }}>
                  <ShieldCheck size={20} />
                  <span>System Administrator</span>
                </div>
              </div>
            </div>


            <div className="section-card" style={{ padding: "3rem", borderRadius: "30px", marginTop: "3rem" }}>
              <h2 style={{ fontSize: "2rem", marginBottom: "2.5rem" }}>Identity Management</h2>

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="profile-image-section" style={{ marginBottom: "3rem", display: "flex", justifyContent: "center" }}>
                  <div className="image-upload-area" style={{ width: "180px", height: "180px" }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Admin" className="profile-image-preview" />
                    ) : (
                      <div className="profile-image-placeholder"><User size={80} /></div>
                    )}
                    <label className="image-upload-btn" style={{ bottom: "-10px", right: "-10px" }}>
                      <Upload size={20} />
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>
                  </div>
                </div>

                <div className="form-grid" style={{ gap: "2.5rem" }}>
                  <div className="form-group">
                    <label style={{ color: "#d4af37", fontWeight: "700" }}><User size={16} /> FIRST NAME</label>
                    <input type="text" className="form-input" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "#d4af37", fontWeight: "700" }}><User size={16} /> LAST NAME</label>
                    <input type="text" className="form-input" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "#d4af37", fontWeight: "700" }}><Mail size={16} /> ADMINISTRATIVE EMAIL</label>
                    <input type="email" className="form-input" value={user?.email || clerkUser?.emailAddresses?.[0]?.emailAddress || ""} disabled style={{ background: "#fdf6f0", cursor: "not-allowed", border: "2px dashed rgba(212, 175, 55, 0.2)" }} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "#d4af37", fontWeight: "700" }}><Phone size={16} /> SUPPORT HOTLINE</label>
                    <input type="tel" className="form-input" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+251 ..." />
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: "3rem" }}>
                  <button type="submit" className="btn-primary" disabled={isSaving} style={{ height: "60px", fontSize: "1.2rem" }}>
                    <Save size={24} />
                    {isSaving ? "Updating Platform..." : "Save Identity Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
