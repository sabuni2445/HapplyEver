import { useState, useRef, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Upload, Type, Palette, Eye, Save, X, AlignLeft, AlignCenter, AlignRight, Maximize2, Video, Image } from "lucide-react";
import { formatPartnerNames } from "../../utils/formatPartnerNames";
import { getUserFromDatabase, generateAIImage } from "../../utils/api";
import { Sparkles, Loader2 } from "lucide-react";
import "./WeddingCardEditor.css";

export default function WeddingCardEditor({ wedding, onSave, initialCard }) {
  const { userId } = useAuth();
  const { user } = useUser();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(initialCard?.theme || "classic");
  const [backgroundImage, setBackgroundImage] = useState(initialCard?.backgroundImage || null);
  const [backgroundVideo, setBackgroundVideo] = useState(initialCard?.backgroundVideo || null);
  const [backgroundType, setBackgroundType] = useState(initialCard?.backgroundVideo ? "video" : "image");
  const [customText, setCustomText] = useState(initialCard?.customText || "");
  const [textColor, setTextColor] = useState(initialCard?.textColor || "#523c2b");
  const [backgroundColor, setBackgroundColor] = useState(initialCard?.backgroundColor || "#ffffff");
  const [accentColor, setAccentColor] = useState(initialCard?.accentColor || "#d4af37");
  const [fontSize, setFontSize] = useState(initialCard?.fontSize || "1.5rem");
  const [nameFontSize, setNameFontSize] = useState(initialCard?.nameFontSize || initialCard?.fontSize || "3rem");
  const [fontFamily, setFontFamily] = useState(initialCard?.fontFamily || "Playfair Display");
  const [textAlign, setTextAlign] = useState(initialCard?.textAlign || "center");
  const [overlayOpacity, setOverlayOpacity] = useState(initialCard?.overlayOpacity || 0.3);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Load current user's name
  useEffect(() => {
    const loadUser = async () => {
      if (userId) {
        try {
          const userData = await getUserFromDatabase(userId);
          setCurrentUser(userData);
        } catch (error) {
          // Fallback to Clerk user data
          if (user) {
            setCurrentUser({
              firstName: user.firstName || "",
              lastName: user.lastName || ""
            });
          }
        }
      }
    };
    loadUser();
  }, [userId, user]);

  // Update nameFontSize when initialCard changes
  useEffect(() => {
    if (initialCard?.nameFontSize) {
      setNameFontSize(initialCard.nameFontSize);
    } else if (initialCard?.fontSize && !initialCard?.nameFontSize) {
      // If no nameFontSize exists but fontSize does, use a larger default for names
      setNameFontSize(initialCard.fontSize);
    }
  }, [initialCard]);

  const THEMES = [
    {
      id: "classic",
      name: "Classic",
      color: "#d4af37",
      backgroundImage: "https://images.unsplash.com/photo-1519167758481-83f29da9c9fe?w=800&q=80",
      description: "Elegant gold and ivory tones"
    },
    {
      id: "modern",
      name: "Modern",
      color: "#523c2b",
      backgroundImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      description: "Contemporary minimalist design"
    },
    {
      id: "romantic",
      name: "Romantic",
      color: "#d48bb8",
      backgroundImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
      description: "Soft pink roses and pastels"
    },
    {
      id: "tropical",
      name: "Tropical",
      color: "#10b981",
      backgroundImage: "https://images.unsplash.com/photo-1519167758481-83f29da9c9fe?w=800&q=80",
      description: "Vibrant tropical paradise"
    },
    {
      id: "vintage",
      name: "Vintage",
      color: "#92400e",
      backgroundImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
      description: "Timeless vintage elegance"
    },
    {
      id: "royal",
      name: "Royal",
      color: "#7c3aed",
      backgroundImage: "https://images.unsplash.com/photo-1519167758481-83f29da9c9fe?w=800&q=80",
      description: "Luxurious royal purple"
    },
    {
      id: "ethiopian-traditional",
      name: "Ethiopian Traditional",
      color: "#DC143C",
      backgroundImage: "https://images.unsplash.com/photo-1519167758481-83f29da9c9fe?w=800&q=80",
      description: "Traditional Ethiopian cultural design"
    },
    {
      id: "ethiopian-modern",
      name: "Ethiopian Modern",
      color: "#FFD700",
      backgroundImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      description: "Modern Ethiopian fusion style"
    },
    {
      id: "habesha-elegant",
      name: "Habesha Elegant",
      color: "#8B4513",
      backgroundImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
      description: "Elegant Habesha cultural theme"
    },
    {
      id: "tigray-heritage",
      name: "Tigray Heritage",
      color: "#228B22",
      backgroundImage: "https://images.unsplash.com/photo-1519167758481-83f29da9c9fe?w=800&q=80",
      description: "Tigray cultural heritage theme"
    },
    {
      id: "amhara-classic",
      name: "Amhara Classic",
      color: "#4169E1",
      backgroundImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      description: "Classic Amhara cultural design"
    },
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result);
        setBackgroundType("image");
        setBackgroundVideo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundVideo(reader.result);
        setBackgroundType("video");
        setBackgroundImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateAIImage(aiPrompt);
      if (result && result.imageUrl) {
        setBackgroundImage(result.imageUrl);
        setBackgroundType("image");
        setBackgroundVideo(null);
        alert("AI Image generated successfully!");
      }
    } catch (error) {
      console.error("Failed to generate AI image:", error);
      alert("Failed to generate AI image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const cardData = {
      theme: selectedTheme,
      digitalCardEnabled: true,
      backgroundImage: backgroundType === "image" ? backgroundImage : null,
      backgroundVideo: backgroundType === "video" ? backgroundVideo : null,
      customText,
      textColor,
      backgroundColor,
      accentColor,
      fontSize,
      nameFontSize,
      fontFamily,
      textAlign,
      overlayOpacity,
      cardDesign: JSON.stringify({
        theme: selectedTheme,
        backgroundImage: backgroundType === "image" ? backgroundImage : null,
        backgroundVideo: backgroundType === "video" ? backgroundVideo : null,
        backgroundType,
        customText,
        textColor,
        backgroundColor,
        accentColor,
        fontSize,
        nameFontSize,
        fontFamily,
        textAlign,
        overlayOpacity
      })
    };
    onSave(cardData);
  };

  const removeImage = () => {
    setBackgroundImage(null);
    setBackgroundVideo(null);
    setBackgroundType("image");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  return (
    <div className="card-editor">
      <div className="editor-layout">
        {/* Left Panel - Controls */}
        <div className="editor-controls">
          <h3>Customize Your Card</h3>

          {/* Theme Selection */}
          <div className="control-section">
            <label className="control-label">
              <Palette size={18} />
              Theme
            </label>
            <div className="theme-grid">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    setAccentColor(theme.color);
                    // Apply theme background image if available
                    if (theme.backgroundImage) {
                      setBackgroundImage(theme.backgroundImage);
                      setBackgroundType("image");
                      setBackgroundVideo(null);
                    }
                  }}
                  className={`theme-btn ${selectedTheme === theme.id ? "active" : ""}`}
                  style={{ borderColor: theme.color }}
                  title={theme.description}
                >
                  <div
                    className="theme-color"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Type Selection */}
          <div className="control-section">
            <label className="control-label">
              <Palette size={18} />
              Background Type
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={() => setBackgroundType("image")}
                className={`btn-toggle ${backgroundType === "image" ? "active" : ""}`}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  border: `2px solid ${backgroundType === "image" ? "#d4af37" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  background: backgroundType === "image" ? "#fef3c7" : "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <Image size={18} />
                Image
              </button>
              <button
                type="button"
                onClick={() => setBackgroundType("video")}
                className={`btn-toggle ${backgroundType === "video" ? "active" : ""}`}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  border: `2px solid ${backgroundType === "video" ? "#d4af37" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  background: backgroundType === "video" ? "#fef3c7" : "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <Video size={18} />
                Video
              </button>
            </div>
          </div>

          {/* AI Image Generation */}
          <div className="control-section">
            <label className="control-label">
              <Sparkles size={18} color="#d4af37" />
              AI Image Generator
            </label>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.75rem" }}>
              Describe the background you want, and our AI will create it for you!
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., A romantic sunset over the Ethiopian highlands with gold accents and white roses..."
                className="custom-text-input"
                rows={2}
                style={{ fontSize: "0.9rem" }}
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiPrompt.trim()}
                style={{
                  padding: "0.75rem",
                  background: isGenerating || !aiPrompt.trim() ? "#e5e7eb" : "#523c2b",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isGenerating || !aiPrompt.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Image Upload */}
          {backgroundType === "image" && (
            <div className="control-section">
              <label className="control-label">
                <Upload size={18} />
                Background Image
              </label>
              {backgroundImage ? (
                <div className="image-preview-container">
                  <img src={backgroundImage} alt="Background" className="preview-image" />
                  <button onClick={removeImage} className="remove-image-btn">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-btn"
                >
                  <Upload size={20} />
                  Upload Image
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>
          )}

          {/* Video Upload */}
          {backgroundType === "video" && (
            <div className="control-section">
              <label className="control-label">
                <Video size={18} />
                Background Video
              </label>
              {backgroundVideo ? (
                <div className="image-preview-container">
                  <video src={backgroundVideo} className="preview-image" controls style={{ maxHeight: "200px" }} />
                  <button onClick={() => { setBackgroundVideo(null); if (videoInputRef.current) videoInputRef.current.value = ""; }} className="remove-image-btn">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="upload-btn"
                >
                  <Video size={20} />
                  Upload Video
                </button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ display: "none" }}
              />
            </div>
          )}

          {/* Custom Text */}
          <div className="control-section">
            <label className="control-label">
              <Type size={18} />
              Custom Message
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter your custom message here..."
              className="custom-text-input"
              rows={4}
            />
          </div>

          {/* Typography */}
          <div className="control-section">
            <label className="control-label">
              <Type size={18} />
              Typography
            </label>
            <div className="form-group-small">
              <label>Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="form-select-small"
              >
                <option value="Playfair Display">Playfair Display</option>
                <option value="Cormorant Garamond">Cormorant Garamond</option>
                <option value="Dancing Script">Dancing Script</option>
                <option value="Great Vibes">Great Vibes</option>
                <option value="Lora">Lora</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Open Sans">Open Sans</option>
              </select>
            </div>
            <div className="form-group-small">
              <label>General Font Size</label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={parseFloat(fontSize) || 2}
                onChange={(e) => setFontSize(e.target.value + "rem")}
                className="slider"
              />
              <span className="slider-value">{fontSize}</span>
            </div>
            <div className="form-group-small">
              <label>Names Font Size *</label>
              <input
                type="range"
                min="1.5"
                max="6"
                step="0.1"
                value={parseFloat(nameFontSize) || 3}
                onChange={(e) => setNameFontSize(e.target.value + "rem")}
                className="slider"
              />
              <span className="slider-value">{nameFontSize}</span>
              <small style={{ display: "block", color: "#6b7280", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                Adjust the font size specifically for the couple's names
              </small>
            </div>
            <div className="form-group-small">
              <label>Text Alignment</label>
              <div className="text-align-buttons">
                <button
                  type="button"
                  onClick={() => setTextAlign("left")}
                  className={`align-btn ${textAlign === "left" ? "active" : ""}`}
                >
                  <AlignLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setTextAlign("center")}
                  className={`align-btn ${textAlign === "center" ? "active" : ""}`}
                >
                  <AlignCenter size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setTextAlign("right")}
                  className={`align-btn ${textAlign === "right" ? "active" : ""}`}
                >
                  <AlignRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Color Pickers */}
          <div className="control-section">
            <label className="control-label">
              <Palette size={18} />
              Colors
            </label>
            <div className="color-pickers">
              <div className="color-picker-item">
                <label>Text Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="color-text-input"
                  />
                </div>
              </div>
              <div className="color-picker-item">
                <label>Background Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="color-text-input"
                  />
                </div>
              </div>
              <div className="color-picker-item">
                <label>Accent Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="color-text-input"
                  />
                </div>
              </div>
            </div>
            {(backgroundImage || backgroundVideo) && (
              <div className="form-group-small">
                <label>Background Overlay Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="slider"
                />
                <span className="slider-value">{(overlayOpacity * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>

          <button onClick={handleSave} className="save-btn">
            <Save size={18} />
            Save Card
          </button>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="editor-preview">
          <div className="preview-header">
            <Eye size={20} />
            <span>Live Preview</span>
            <button
              onClick={() => setShowFullPreview(!showFullPreview)}
              className="preview-toggle"
              title="Full Screen Preview"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <div
            className={`card-preview ${showFullPreview ? "full-preview" : ""}`}
            style={{
              backgroundImage: backgroundImage && backgroundType === "image" ? `url(${backgroundImage})` : "none",
              backgroundColor: !backgroundImage && !backgroundVideo ? backgroundColor : "transparent",
              backgroundSize: backgroundImage && backgroundType === "image" ? "cover" : "auto",
              backgroundPosition: backgroundImage && backgroundType === "image" ? "center" : "initial",
              backgroundRepeat: backgroundImage && backgroundType === "image" ? "no-repeat" : "initial",
              position: "relative",
              height: showFullPreview ? "100vh" : "600px",
              width: showFullPreview ? "100vw" : "100%",
              overflow: "hidden"
            }}
          >
            {backgroundVideo && backgroundType === "video" && (
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  zIndex: 0
                }}
              >
                <source src={backgroundVideo} type="video/mp4" />
              </video>
            )}
            {(backgroundImage || backgroundVideo) && (
              <div
                className="image-overlay"
                style={{
                  backgroundColor: backgroundColor,
                  opacity: overlayOpacity,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                }}
              />
            )}
            <div
              className="preview-content"
              style={{
                color: textColor,
                fontFamily: fontFamily,
                textAlign: textAlign,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                className="preview-header-text"
                style={{
                  color: accentColor,
                  fontSize: nameFontSize,
                  fontFamily: fontFamily,
                  textTransform: "uppercase",
                }}
              >
                {(() => {
                  // Combine current user's name with partner's name
                  const currentUserName = currentUser
                    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
                    : "";
                  const partnerName = wedding?.partnersName || "";

                  // If we have both names, combine them
                  if (currentUserName && partnerName) {
                    return formatPartnerNames(`${currentUserName} & ${partnerName}`);
                  }
                  // If only partner name, use it
                  if (partnerName) {
                    return formatPartnerNames(partnerName);
                  }
                  // If only current user name, use it
                  if (currentUserName) {
                    return formatPartnerNames(currentUserName);
                  }
                  // Fallback
                  return "WEDDING INVITATION";
                })()}
              </div>
              {wedding?.weddingDate && (
                <div className="preview-date" style={{ fontFamily: fontFamily }}>
                  {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {wedding.weddingTime && ` at ${wedding.weddingTime}`}
                </div>
              )}
              {wedding?.location && (
                <div className="preview-location" style={{ fontFamily: fontFamily }}>
                  {wedding.location}
                </div>
              )}
              {customText && (
                <div
                  className="preview-custom-text"
                  style={{ fontFamily: fontFamily, fontSize: "1.1rem" }}
                >
                  {customText}
                </div>
              )}
              <div
                className="preview-footer"
                style={{ color: accentColor, fontFamily: fontFamily }}
              >
                We look forward to celebrating with you!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

