import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getUserFromDatabase, updateUserProfile, getManagerAssignments, getAdminAnalytics } from "../../utils/api";
import { User, Save, Upload, Star, Award, Briefcase, CheckCircle, Clock, ShieldCheck, TrendingUp, Users, Zap, Activity } from "lucide-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import CoupleSidebar from "../../components/CoupleSidebar";
import AdminSidebar from "../../components/AdminSidebar";
import VendorSidebar from "../../components/VendorSidebar";
import ProtocolSidebar from "../../components/ProtocolSidebar";
import "./Profile.css";

export default function Profile() {
  const { userId: clerkUserId } = useAuth();
  const { user: clerkUser } = useUser();
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    imageUrl: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [managerStats, setManagerStats] = useState({ active: 0, completed: 0, sessions: 0 });
  const [adminStats, setAdminStats] = useState({ revenue: 0, users: 0, weddings: 0 });

  useEffect(() => {
    const dbUserStr = localStorage.getItem("dbUser");
    if (dbUserStr) {
      try {
        const dbUser = JSON.parse(dbUserStr);
        if (dbUser.clerkId) {
          setUserId(dbUser.clerkId);
          setUser(dbUser);
          setFormData({
            firstName: dbUser.firstName || "",
            lastName: dbUser.lastName || "",
            phoneNumber: dbUser.phoneNumber || "",
            imageUrl: dbUser.imageUrl || ""
          });
          if (dbUser.imageUrl) setImagePreview(dbUser.imageUrl);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to parse dbUser:", e);
      }
    }
    if (clerkUserId) setUserId(clerkUserId);
  }, [clerkUserId]);

  useEffect(() => {
    if (userId) loadUser();
    else setIsLoading(false);
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const userData = await getUserFromDatabase(userId);
      setUser(userData);
      setFormData({
        firstName: userData.firstName || clerkUser?.firstName || "",
        lastName: userData.lastName || clerkUser?.lastName || "",
        phoneNumber: userData.phoneNumber || "",
        imageUrl: userData.imageUrl || ""
      });
      if (userData.imageUrl) setImagePreview(userData.imageUrl);

      // Branch fetching based on role
      const roleStr = userData.selectedRole?.toUpperCase();
      if (roleStr === "MANAGER") fetchManagerStats();
      if (roleStr === "ADMIN") fetchAdminStats();

    } catch (error) {
      console.error("Failed to load user:", error);
      if (clerkUser) {
        setFormData({
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          phoneNumber: "",
          imageUrl: clerkUser.imageUrl || ""
        });
        if (clerkUser.imageUrl) setImagePreview(clerkUser.imageUrl);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const data = await getAdminAnalytics();
      setAdminStats({
        revenue: data.totalRevenue,
        users: data.totalUsers,
        weddings: data.totalWeddings
      });
    } catch (e) {
      console.error("Admin stats fail", e);
    }
  };

  const fetchManagerStats = async () => {
    try {
      const assignments = await getManagerAssignments(userId);
      const active = assignments.filter(a => a.status !== "COMPLETED").length;
      const completed = assignments.filter(a => a.status === "COMPLETED").length;
      setManagerStats({ active, completed, sessions: assignments.length });
    } catch (e) {
      console.error("Stats fail", e);
    }
  };

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
      await loadUser();
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container"><p>Loading profile...</p></div>
      </div>
    );
  }

  const role = (user?.selectedRole || "").toLowerCase();
  const Sidebar =
    role === "manager" ? ManagerSidebar :
      role === "admin" ? AdminSidebar :
        role === "protocol" ? ProtocolSidebar :
          role === "vendor" ? VendorSidebar :
            role === "user" ? CoupleSidebar :
              null;

  return (
    <div className="profile-page" style={{ display: Sidebar ? "flex" : "block" }}>
      {Sidebar && <Sidebar />}
      <div className="profile-main-content" style={{
        flex: 1,
        marginLeft: Sidebar ? (role === "manager" ? "280px" : role === "admin" ? "280px" : "260px") : "0",
        padding: "2rem"
      }}>
        <div className="profile-container">
          <div className="profile-header">
            <div className="header-with-badge">
              <h1><User size={32} /> My Profile</h1>
              {role === "manager" && (
                <div className="manager-badge"><Award size={16} /><span>Verified Specialist</span></div>
              )}
              {role === "admin" && (
                <div className="admin-badge"><ShieldCheck size={16} /><span>System Administrator</span></div>
              )}
            </div>
          </div>

          {role === "admin" && (
            <div className="premium-stats-section">
              <div className="stats-row">
                <div className="premium-card purple">
                  <div className="p-icon"><Zap size={24} /></div>
                  <div className="p-content">
                    <span className="p-label">Revenue Volume</span>
                    <span className="p-value">{(adminStats.revenue || 0).toLocaleString()} <small>ETB</small></span>
                  </div>
                  <div className="p-bg-icon"><TrendingUp /></div>
                </div>
                <div className="premium-card gold">
                  <div className="p-icon"><Users size={24} /></div>
                  <div className="p-content">
                    <span className="p-label">User Community</span>
                    <span className="p-value">{adminStats.users} <small>Members</small></span>
                  </div>
                  <div className="p-bg-icon"><Users /></div>
                </div>
                <div className="premium-card red">
                  <div className="p-icon"><Activity size={24} /></div>
                  <div className="p-content">
                    <span className="p-label">Global Weddings</span>
                    <span className="p-value">{adminStats.weddings} <small>Events</small></span>
                  </div>
                  <div className="p-bg-icon"><Star /></div>
                </div>
              </div>
            </div>
          )}

          {role === "manager" && (
            <div className="manager-stats-grid">
              <div className="stat-pill red">
                <Clock size={16} /><div className="v-stack"><span className="s-label">Active Weddings</span><span className="s-value">{managerStats.active}</span></div>
              </div>
              <div className="stat-pill gold">
                <Star size={16} /><div className="v-stack"><span className="s-label">Legacy Created</span><span className="s-value">{managerStats.completed} Weddings</span></div>
              </div>
              <div className="stat-pill purple">
                <CheckCircle size={16} /><div className="v-stack"><span className="s-label">Success Rate</span><span className="s-value">100%</span></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-image-section">
              <div className="image-upload-area">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="profile-image-preview" />
                ) : (
                  <div className="profile-image-placeholder"><User size={64} /></div>
                )}
                <label className="image-upload-btn">
                  <Upload size={18} /> Upload Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group"><label>First Name</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required /></div>
              <div className="form-group"><label>Last Name</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={clerkUser?.emailAddresses?.[0]?.emailAddress || user?.email || ""} disabled style={{ background: "#f3f4f6", cursor: "not-allowed" }} /></div>
              <div className="form-group"><label>Phone Number</label><input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+1234567890" /></div>
              {user?.selectedRole && (
                <div className="form-group"><label>Role</label><input type="text" value={user.selectedRole} disabled style={{ background: "#f3f4f6", cursor: "not-allowed", textTransform: "capitalize" }} /></div>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" disabled={isSaving} className="btn-primary">
                <Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
