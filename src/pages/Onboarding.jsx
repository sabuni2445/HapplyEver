import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { updateUserProfile, updateUserRole, getUserFromDatabase, syncUserToDatabase } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const { isSignedIn, userId } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    imageUrl: "",
    selectedRole: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load user data from database
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId || !user) return;

      setIsLoading(true);
      try {
        // First sync user to database if not exists
        let userData = await getUserFromDatabase(userId);
        
        if (!userData) {
          // User doesn't exist, create it
          const syncResult = await syncUserToDatabase(user);
          userData = syncResult.user;
        }

        setDbUser(userData);
        
        // Initialize form with existing data
        setFormData({
          firstName: userData.firstName || user.firstName || "",
          lastName: userData.lastName || user.lastName || "",
          phoneNumber: userData.phoneNumber || "",
          imageUrl: userData.imageUrl || user.imageUrl || user.profileImageUrl || "",
          selectedRole: userData.selectedRole || "",
        });

        // Set image preview if URL exists
        if (userData.imageUrl || user.imageUrl || user.profileImageUrl) {
          setImagePreview(userData.imageUrl || user.imageUrl || user.profileImageUrl);
        }

        // Auto-redirect if profile is completed
        if (userData.profileCompleted && userData.selectedRole) {
          const dashboardMap = {
            USER: "/couple/dashboard",
            VENDOR: "/vendor/dashboard",
            ADMIN: "/admin/dashboard",
            MANAGER: "/manager/dashboard",
            PROTOCOL: "/protocol/dashboard",
            ATTENDEE: "/attendee/dashboard",
          };
          const dashboard = dashboardMap[userData.selectedRole] || "/couple/dashboard";
          navigate(dashboard);
        }
      } catch (err) {
        setSaveError("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    if (userLoaded && user && userId) {
      loadUserData();
    }
  }, [userLoaded, user, userId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveError("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSaveError("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      setSaveError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          imageUrl: reader.result, // Store as base64 for now
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setSaveError("User ID not available");
      return;
    }

    if (!formData.selectedRole) {
      setSaveError("Please select a role");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Ensure user exists in database first
      let userData = await getUserFromDatabase(userId);
      if (!userData) {
        // User doesn't exist, create it first
        await syncUserToDatabase(user);
      }

      // Update profile (phone number, image, name)
      const profileUpdate = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        imageUrl: formData.imageUrl, // This will be base64 or URL
      };

      await updateUserProfile(userId, profileUpdate);

      // Update role
      await updateUserRole(userId, formData.selectedRole);

      setSaveSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        const dashboardMap = {
          USER: "/couple/dashboard",
          VENDOR: "/vendor/dashboard",
        };
        const dashboard = dashboardMap[formData.selectedRole] || "/couple/dashboard";
        navigate(dashboard);
      }, 1500);

    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to save profile";
      setSaveError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <p style={{ color: "#6b7280" }}>Please sign in to continue</p>
      </div>
    );
  }

  if (!userLoaded || !user || isLoading) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ 
          padding: "2rem", 
          background: "#fef3c7", 
          borderRadius: "12px",
          maxWidth: "400px"
        }}>
          <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>⏳ Loading...</p>
          <p style={{ color: "#6b7280" }}>Please wait while we load your profile</p>
        </div>
      </div>
    );
  }

  const userEmail = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || "";

  return (
    <div style={{ 
      padding: "2rem", 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fdf6f0 0%, #fff9f3 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{ 
        maxWidth: "600px", 
        width: "100%",
        background: "white",
        borderRadius: "16px",
        padding: "2.5rem",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ 
          marginBottom: "0.5rem",
          fontFamily: "Playfair Display, serif",
          color: "#523c2b",
          fontSize: "2.5rem"
        }}>
          Complete Your Profile
        </h1>
        <p style={{ 
          marginBottom: "2rem", 
          color: "#7a5d4e",
          fontSize: "1.1rem"
        }}>
          Let's set up your account. You can update this information anytime.
        </p>

        {/* Current Info Display */}
        <div style={{ 
          marginBottom: "2rem", 
          padding: "1.5rem", 
          background: "#f9fafb", 
          borderRadius: "12px",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{ 
            marginBottom: "1rem", 
            color: "#523c2b",
            fontSize: "1.2rem"
          }}>
            Your Information
          </h3>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <p><strong>Email:</strong> {userEmail}</p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {/* Name Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#523c2b"
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#523c2b"
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#523c2b"
              }}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1234567890"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
              />
            </div>

            {/* Profile Image Upload */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#523c2b"
              }}>
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  background: "white"
                }}
              />
              {imagePreview && (
                <div style={{ marginTop: "1rem", textAlign: "center" }}>
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #d4af37",
                      boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)"
                    }}
                  />
                  <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#6b7280" }}>
                    {imageFile?.name || "Current profile picture"}
                  </p>
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#523c2b"
              }}>
                I am a... *
              </label>
              <select
                name="selectedRole"
                value={formData.selectedRole}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  background: "white"
                }}
              >
                <option value="">Select your role</option>
                <option value="USER">Couple</option>
                <option value="VENDOR">Vendor</option>
              </select>
            </div>

            {/* Error Message */}
            {saveError && (
              <div style={{
                padding: "1rem",
                background: "#fee2e2",
                borderRadius: "8px",
                color: "#991b1b"
              }}>
                ❌ {saveError}
              </div>
            )}

            {/* Success Message */}
            {saveSuccess && (
              <div style={{
                padding: "1rem",
                background: "#d1fae5",
                borderRadius: "8px",
                color: "#065f46"
              }}>
                ✅ Profile saved successfully! Redirecting...
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "white",
                background: isSaving ? "#9ca3af" : "linear-gradient(135deg, #d4af37, #b89627)",
                border: "none",
                borderRadius: "8px",
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: isSaving ? "none" : "0 4px 12px rgba(212, 175, 55, 0.4)",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                if (!isSaving) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(212, 175, 55, 0.5)";
                }
              }}
              onMouseOut={(e) => {
                if (!isSaving) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(212, 175, 55, 0.4)";
                }
              }}
            >
              {isSaving ? "Saving..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
