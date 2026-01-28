import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getUserFromDatabase, updateUserProfile } from "../../utils/api";
import { User, Save, Upload } from "lucide-react";
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

  useEffect(() => {
    // Check for DB-based login user in localStorage
    const dbUserStr = localStorage.getItem("dbUser");
    if (dbUserStr) {
      try {
        const dbUser = JSON.parse(dbUserStr);
        if (dbUser.clerkId) {
          setUserId(dbUser.clerkId);
          // Also use dbUser as initial user data
          setUser(dbUser);
          setFormData({
            firstName: dbUser.firstName || "",
            lastName: dbUser.lastName || "",
            phoneNumber: dbUser.phoneNumber || "",
            imageUrl: dbUser.imageUrl || ""
          });
          if (dbUser.imageUrl) {
            setImagePreview(dbUser.imageUrl);
          }
          setIsLoading(false);
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
      loadUser();
    } else {
      setIsLoading(false);
    }
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
      if (userData.imageUrl) {
        setImagePreview(userData.imageUrl);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      // Fallback to Clerk user data
      if (clerkUser) {
        setFormData({
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          phoneNumber: "",
          imageUrl: clerkUser.imageUrl || ""
        });
        if (clerkUser.imageUrl) {
          setImagePreview(clerkUser.imageUrl);
        }
      }
    } finally {
      setIsLoading(false);
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
        <div className="profile-container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>
            <User size={32} />
            My Profile
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-image-section">
            <div className="image-upload-area">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="profile-image-preview" />
              ) : (
                <div className="profile-image-placeholder">
                  <User size={64} />
                </div>
              )}
              <label className="image-upload-btn">
                <Upload size={18} />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={clerkUser?.emailAddresses?.[0]?.emailAddress || user?.email || ""}
                disabled
                style={{ background: "#f3f4f6", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1234567890"
              />
            </div>

            {user?.selectedRole && (
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={user.selectedRole}
                  disabled
                  style={{ background: "#f3f4f6", cursor: "not-allowed", textTransform: "capitalize" }}
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSaving} className="btn-primary">
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

