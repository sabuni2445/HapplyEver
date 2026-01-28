import { useState, useEffect } from "react";
import { Package, DollarSign, Image, FileText, CheckCircle } from "lucide-react";
import { createService, updateService } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./AddServiceForm.css";

export default function AddServiceForm({ userId, initialService = null, isEdit = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serviceName: "",
    status: "ACTIVE",
    amount: "",
    price: "",
    description: "",
    category: "",
    duration: "",
    location: "",
    availability: "",
    availabilityStatus: "AVAILABLE",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialService?.imageUrl || null);
  const [videoFile, setVideoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (initialService && isEdit) {
      setFormData({
        serviceName: initialService.serviceName || "",
        status: initialService.status || "ACTIVE",
        amount: initialService.amount || "",
        price: initialService.price || "",
        description: initialService.description || "",
        category: initialService.category || "",
        duration: initialService.duration || "",
        location: initialService.location || "",
        availability: initialService.availability || "",
        availabilityStatus: initialService.availabilityStatus || "AVAILABLE",
      });
      if (initialService.imageUrl) {
        setImagePreview(initialService.imageUrl);
      }
    }
  }, [initialService, isEdit]);

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
      if (!file.type.startsWith('image/')) {
        setSaveError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSaveError("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      setSaveError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setSaveError("Please select a video file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setSaveError("Video size must be less than 50MB");
        return;
      }
      setVideoFile(file);
      setSaveError(null);
      
      // Convert video to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          videoUrl: reader.result,
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

    if (!formData.serviceName || !formData.description) {
      setSaveError("Service name and description are required");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      let imageUrl = formData.imageUrl;
      
      // Convert image to base64 if new image uploaded
      if (imageFile) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        imageUrl = base64;
      } else if (isEdit && initialService?.imageUrl && !imageUrl) {
        // Keep existing image if not changed
        imageUrl = initialService.imageUrl;
      }

      const serviceData = {
        serviceName: formData.serviceName,
        status: formData.status,
        category: formData.category || null,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        amount: formData.amount || null,
        duration: formData.duration || null,
        location: formData.location || null,
        availability: formData.availability || null,
        availabilityStatus: formData.availabilityStatus || "AVAILABLE",
        imageUrl: imageUrl || null,
        videoUrl: formData.videoUrl || null,
      };

      if (isEdit && initialService) {
        await updateService(userId, initialService.id, serviceData);
      } else {
        await createService(userId, serviceData);
      }
      
      setSaveSuccess(true);
      
      if (!isEdit) {
        // Reset form only for new services
        setFormData({
          serviceName: "",
          status: "ACTIVE",
          amount: "",
          price: "",
          description: "",
          category: "",
          duration: "",
          location: "",
          availability: "",
          availabilityStatus: "AVAILABLE",
        });
        setImageFile(null);
        setImagePreview(null);
        setVideoFile(null);
      }
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/vendor/dashboard");
      }, 2000);
    } catch (err) {
      setSaveError(err.response?.data?.error || err.message || "Failed to save service");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-service-form-container">
      <form onSubmit={handleSubmit} className="service-form">
        <div className="form-section">
          <h3 className="section-title">
            <Package size={20} />
            Service Information
          </h3>
          
          <div className="form-group">
            <label>Service Name *</label>
            <input
              type="text"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleInputChange}
              placeholder="e.g., Wedding Photography, Catering Service"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Category
                <button
                  type="button"
                  onClick={() => {
                    const newCategory = prompt("Enter new category name:");
                    if (newCategory && newCategory.trim()) {
                      setFormData({ ...formData, category: newCategory.trim().toUpperCase() });
                    }
                  }}
                  style={{
                    background: "#d4af37",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}
                  title="Add New Category"
                >
                  +
                </button>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Select category</option>
                <option value="PHOTOGRAPHY">Photography</option>
                <option value="VIDEOGRAPHY">Videography</option>
                <option value="CATERING">Catering</option>
                <option value="DECORATION">Decoration</option>
                <option value="MUSIC">Music & Entertainment</option>
                <option value="VENUE">Venue</option>
                <option value="FLOWERS">Flowers</option>
                <option value="TRANSPORTATION">Transportation</option>
                <option value="MAKEUP">Makeup & Beauty</option>
                <option value="PLANNING">Wedding Planning</option>
                <option value="OTHER">Other</option>
              </select>
              {formData.category && !["PHOTOGRAPHY", "VIDEOGRAPHY", "CATERING", "DECORATION", "MUSIC", "VENUE", "FLOWERS", "TRANSPORTATION", "MAKEUP", "PLANNING", "OTHER"].includes(formData.category) && (
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                  placeholder="Custom category"
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            <div className="form-group">
              <label>
                <CheckCircle size={16} />
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your service in detail..."
              rows="5"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <DollarSign size={20} />
            Pricing & Availability
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Amount/Quantity</label>
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="e.g., Per hour, Per package"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 4 hours, Full day"
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Service location"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Availability</label>
            <input
              type="text"
              name="availability"
              value={formData.availability}
              onChange={handleInputChange}
              placeholder="e.g., Weekends only, All week"
            />
          </div>

          <div className="form-group">
            <label>Availability Status *</label>
            <select
              name="availabilityStatus"
              value={formData.availabilityStatus}
              onChange={handleInputChange}
              required
            >
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <Image size={20} />
            Media
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Service Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div style={{ marginTop: "1rem" }}>
                  <img 
                    src={imagePreview} 
                    alt="Service preview" 
                    style={{
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "2px solid #d4af37"
                    }}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Service Video</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
              />
              {videoFile && (
                <p style={{ marginTop: "0.5rem", color: "#7a5d4e", fontSize: "0.9rem" }}>
                  Selected: {videoFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {saveError && (
          <div className="error-message">
            ❌ {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="success-message">
            ✅ Service saved successfully!
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Update Service" : "Create Service"}
        </button>
      </form>
    </div>
  );
}

