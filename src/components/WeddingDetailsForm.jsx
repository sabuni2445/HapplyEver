import { useState, useEffect } from "react";
import { Calendar, MapPin, DollarSign, Users, Clock, FileText } from "lucide-react";
import { saveWeddingDetails, getWeddingDetails } from "../utils/api";
import ServiceSelectionSection from "./ServiceSelectionSection";
import BookingForm from "./BookingForm";
import "./WeddingDetailsForm.css";

export default function WeddingDetailsForm({ userId }) {
  const [formData, setFormData] = useState({
    partnersName: "",
    weddingDate: "",
    location: "",
    budget: "",
    numberOfGuests: "",
    rules: "",
    time: "",
    theme: "",
    venue: "",
    catering: "",
    decorations: "",
    music: "",
    photography: "",
    additionalNotes: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Selected services from vendors
  const [selectedServices, setSelectedServices] = useState({
    music: null,
    catering: null,
    photography: null,
    decorations: null,
    venue: null,
  });

  // Load existing wedding details
  useEffect(() => {
    const loadWeddingDetails = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const wedding = await getWeddingDetails(userId);
        if (wedding) {
          // Format date and time for input fields
          const formattedDate = wedding.weddingDate 
            ? new Date(wedding.weddingDate).toISOString().split('T')[0]
            : "";
          const formattedTime = wedding.weddingTime 
            ? wedding.weddingTime.substring(0, 5) // Format HH:mm
            : "";
          
          setFormData({
            partnersName: wedding.partnersName || "",
            weddingDate: formattedDate,
            location: wedding.location || "",
            budget: wedding.budget?.toString() || "",
            numberOfGuests: wedding.numberOfGuests?.toString() || "",
            rules: wedding.rules || "",
            time: formattedTime,
            theme: wedding.theme || "",
            venue: wedding.venue || "",
            catering: wedding.catering || "",
            decorations: wedding.decorations || "",
            music: wedding.music || "",
            photography: wedding.photography || "",
            additionalNotes: wedding.additionalNotes || "",
          });
        }
      } catch (error) {
        // Wedding not found, that's okay
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWeddingDetails();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTextareaChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setSaveError("User ID not available");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const weddingData = {
        partnersName: formData.partnersName,
        weddingDate: formData.weddingDate || null,
        weddingTime: formData.time || null,
        location: formData.location,
        venue: formData.venue,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        numberOfGuests: formData.numberOfGuests ? parseInt(formData.numberOfGuests) : null,
        theme: formData.theme,
        catering: formData.catering,
        decorations: formData.decorations,
        music: formData.music,
        photography: formData.photography,
        rules: formData.rules,
        additionalNotes: formData.additionalNotes,
      };

      await saveWeddingDetails(userId, weddingData);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.error || err.message || "Failed to save wedding details");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="wedding-details-form-container">
        <p>Loading wedding details...</p>
      </div>
    );
  }

  return (
    <div className="wedding-details-form-container">
      <form onSubmit={handleSubmit} className="wedding-form">
        <div className="form-section">
          <h3 className="section-title">
            <Users size={20} />
            Basic Information
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Partner's Name *</label>
              <input
                type="text"
                name="partnersName"
                value={formData.partnersName}
                onChange={handleInputChange}
                placeholder="Enter your partner's name"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                Wedding Date *
              </label>
              <input
                type="date"
                name="weddingDate"
                value={formData.weddingDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Clock size={16} />
                Wedding Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Users size={16} />
                Number of Guests *
              </label>
              <input
                type="number"
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={handleInputChange}
                placeholder="Expected number of guests"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <MapPin size={20} />
            Location & Venue
          </h3>
          
          <div className="form-group">
            <label>Wedding Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State, Country"
              required
            />
          </div>

          <ServiceSelectionSection
            category="VENUE"
            label="Venue"
            coupleClerkId={userId}
            selectedService={selectedServices.venue}
            onServiceSelect={(service) => {
              setSelectedServices({ ...selectedServices, venue: service });
              setFormData({ ...formData, venue: service.serviceName });
            }}
            onBookingRequest={(service) => {
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            }}
          />
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label>Or Enter Your Own Venue Name</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              placeholder="Name of the venue (optional if you selected a vendor above)"
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <DollarSign size={20} />
            Budget & Planning
          </h3>
          
          <div className="form-group">
            <label>Total Budget *</label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="Enter your budget"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <FileText size={20} />
            Additional Details
          </h3>
          
          <div className="form-group">
            <label>Wedding Theme</label>
            <input
              type="text"
              name="theme"
              value={formData.theme}
              onChange={handleInputChange}
              placeholder="e.g., Rustic, Modern, Classic, Beach"
            />
          </div>

          <ServiceSelectionSection
            category="CATERING"
            label="Catering"
            coupleClerkId={userId}
            selectedService={selectedServices.catering}
            onServiceSelect={(service) => {
              setSelectedServices({ ...selectedServices, catering: service });
              setFormData({ ...formData, catering: service.serviceName });
            }}
            onBookingRequest={(service) => {
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            }}
          />
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label>Or Enter Your Own Catering Preferences</label>
            <input
              type="text"
              name="catering"
              value={formData.catering}
              onChange={handleInputChange}
              placeholder="e.g., Buffet, Plated, Cocktail style (optional if you selected a vendor above)"
            />
          </div>

          <ServiceSelectionSection
            category="DECORATION"
            label="Decorations"
            coupleClerkId={userId}
            selectedService={selectedServices.decorations}
            onServiceSelect={(service) => {
              setSelectedServices({ ...selectedServices, decorations: service });
              setFormData({ ...formData, decorations: service.serviceName });
            }}
            onBookingRequest={(service) => {
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            }}
          />
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label>Or Enter Your Own Decorations Style</label>
            <input
              type="text"
              name="decorations"
              value={formData.decorations}
              onChange={handleInputChange}
              placeholder="Describe your decoration preferences (optional if you selected a vendor above)"
            />
          </div>

          <ServiceSelectionSection
            category="MUSIC"
            label="Music & Entertainment"
            coupleClerkId={userId}
            selectedService={selectedServices.music}
            onServiceSelect={(service) => {
              setSelectedServices({ ...selectedServices, music: service });
              setFormData({ ...formData, music: service.serviceName });
            }}
            onBookingRequest={(service) => {
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            }}
          />
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label>Or Enter Your Own Music/Entertainment</label>
            <input
              type="text"
              name="music"
              value={formData.music}
              onChange={handleInputChange}
              placeholder="e.g., DJ, Live band, String quartet (optional if you selected a vendor above)"
            />
          </div>

          <ServiceSelectionSection
            category="PHOTOGRAPHY"
            label="Photography & Videography"
            coupleClerkId={userId}
            selectedService={selectedServices.photography}
            onServiceSelect={(service) => {
              setSelectedServices({ ...selectedServices, photography: service });
              setFormData({ ...formData, photography: service.serviceName });
            }}
            onBookingRequest={(service) => {
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            }}
          />
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label>Or Enter Your Own Photography</label>
            <input
              type="text"
              name="photography"
              value={formData.photography}
              onChange={handleInputChange}
              placeholder="Photography preferences (optional if you selected a vendor above)"
            />
          </div>

          <div className="form-group">
            <label>Rules & Guidelines</label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleTextareaChange}
              placeholder="Any special rules or guidelines for guests..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleTextareaChange}
              placeholder="Any other important information..."
              rows="4"
            />
          </div>
        </div>

        {saveError && (
          <div className="error-message">
            ❌ {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="success-message">
            ✅ Wedding details saved successfully!
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Wedding Details"}
        </button>
      </form>
    </div>
  );
}

