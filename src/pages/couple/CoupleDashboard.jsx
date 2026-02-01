import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import WeddingDetailsForm from "../../components/WeddingDetailsForm";
import { getUserFromDatabase, getWeddingDetails, getGalleryByWedding, uploadGalleryItem, getAssignmentByWedding, submitCoupleFeedback, getCoupleBookings, getServiceById } from "../../utils/api";
import { Image as ImageIcon, Video, Upload, X, Plus, Star, Heart, CheckCircle, MessageSquare } from "lucide-react";
import "./CoupleDashboard.css";

export default function CoupleDashboard() {
  const { userId } = useAuth();
  const [user, setUser] = useState(null);
  const [wedding, setWedding] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [bookedServices, setBookedServices] = useState([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [ratings, setRatings] = useState({
    wedding: 5,
    app: 5,
    manager: 5,
    protocol: 5
  });
  const [comments, setComments] = useState({
    wedding: "",
    app: "",
    manager: "",
    protocol: ""
  });
  const fileInputRef = useRef(null);

  const loadData = async () => {
    if (userId) {
      try {
        const userData = await getUserFromDatabase(userId);
        setUser(userData);

        const weddingData = await getWeddingDetails(userId);
        setWedding(weddingData);

        if (weddingData?.id) {
          const [assignmentData, gallery, bookings] = await Promise.all([
            getAssignmentByWedding(weddingData.id),
            getGalleryByWedding(weddingData.id, true),
            getCoupleBookings(userId)
          ]);

          setAssignment(assignmentData);
          setGalleryItems(gallery);

          // Filter accepted bookings and load service names
          const accepted = bookings.filter(b => b.status === "ACCEPTED");
          const bookingsWithServices = await Promise.all(
            accepted.map(async (b) => {
              try {
                const s = await getServiceById(b.serviceId);
                return { ...b, serviceName: s.serviceName };
              } catch { return b; }
            })
          );
          setBookedServices(bookingsWithServices);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !wedding) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", "Shared from dashboard");
      formData.append("fileType", file.type.startsWith("video/") ? "VIDEO" : "IMAGE");

      await uploadGalleryItem(wedding.id, formData);
      await loadData();
      alert("Media uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload media.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submitOverallFeedback = async () => {
    if (feedbackSubmitted) return;

    const feedbackList = [
      { category: "WEDDING", rating: ratings.wedding, comment: comments.wedding, weddingId: wedding.id },
      { category: "APP", rating: ratings.app, comment: comments.app, weddingId: wedding.id },
      { category: "MANAGER", rating: ratings.manager, comment: comments.manager, weddingId: wedding.id, targetId: assignment?.managerClerkId },
      { category: "PROTOCOL", rating: ratings.protocol, comment: comments.protocol, weddingId: wedding.id, targetId: assignment?.protocolClerkId }
    ];

    try {
      await submitCoupleFeedback({ feedbacks: feedbackList, coupleClerkId: userId });
      setFeedbackSubmitted(true);
      alert("Thank you for your beautiful feedback!");
    } catch (error) {
      console.error("Feedback failed:", error);
      alert("Failed to save feedback.");
    }
  };

  const isCompleted = assignment?.status === "COMPLETED";

  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          {isCompleted ? (
            <div className="completion-experience animate-fade-in">
              <div className="experience-hero">
                <Heart size={48} className="heart-iconPulse" />
                <h1 className="hero-title">A Beautiful Journey Concluded</h1>
                <p className="hero-subtitle">Congratulations on your wedding, {user?.firstName}! Your journey with ElegantEvents has been an honor.</p>
              </div>

              {!feedbackSubmitted ? (
                <div className="feedback-flow-card">
                  <h2 className="section-title-premium">Rate Your Experience</h2>
                  <p className="section-desc">We'd love to hear about your beautiful journey.</p>

                  <div className="rating-grid">
                    {[
                      { key: "wedding", label: "Overall Wedding", icon: <Heart size={20} /> },
                      { key: "manager", label: "Wedding Manager", icon: <CheckCircle size={20} /> },
                      { key: "protocol", label: "Service Protocol", icon: <Users size={20} /> },
                      { key: "app", label: "ElegantEvents App", icon: <Star size={20} /> },
                    ].map((item) => (
                      <div key={item.key} className="rating-row-premium">
                        <div className="rating-label-group">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={24}
                              fill={star <= ratings[item.key] ? "#d4af37" : "none"}
                              color={star <= ratings[item.key] ? "#d4af37" : "#e2e8f0"}
                              onClick={() => setRatings({ ...ratings, [item.key]: star })}
                              style={{ cursor: "pointer" }}
                            />
                          ))}
                        </div>
                        <textarea
                          placeholder="Tell us more (optional)..."
                          value={comments[item.key]}
                          onChange={(e) => setComments({ ...comments, [item.key]: e.target.value })}
                          className="reflex-input"
                        />
                      </div>
                    ))}
                  </div>

                  <button onClick={submitOverallFeedback} className="btn-grand-gold">
                    Submit My Experience
                  </button>
                </div>
              ) : (
                <div className="feedback-thank-you">
                  <div className="thank-you-card">
                    <CheckCircle size={64} color="#10b981" />
                    <h2>Feedback Received</h2>
                    <p>Your kind words have been safely stored. We wish you a lifetime of happiness!</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <h1 className="page-title">Wedding Details</h1>
              <p className="page-subtitle">Plan your perfect day</p>
              <WeddingDetailsForm userId={userId} />
            </>
          )}

          {/* Shared Gallery Section */}
          {wedding && (
            <div className="gallery-section">
              <div className="gallery-header">
                <h3 className="gallery-title">
                  <ImageIcon size={24} />
                  Shared Wedding Gallery
                </h3>
                <div className="gallery-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                  />
                  <button
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      "Uploading..."
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Photo/Video
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isLoadingGallery ? (
                <p className="empty-gallery">Loading gallery...</p>
              ) : galleryItems.length === 0 ? (
                <p className="empty-gallery">
                  No photos or videos shared yet. Start uploading your memories!
                </p>
              ) : (
                <div className="gallery-grid">
                  {galleryItems.map(item => (
                    <div key={item.id} className="gallery-item">
                      {item.fileType === "IMAGE" ? (
                        <img src={item.fileUrl} alt={item.caption || "Gallery"} />
                      ) : (
                        <video src={item.fileUrl} controls />
                      )}
                      {item.caption && (
                        <div className="gallery-caption">
                          {item.caption}
                        </div>
                      )}
                      <div className="gallery-type-badge">
                        {item.fileType === "IMAGE" ? <ImageIcon size={16} /> : <Video size={16} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

