import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import WeddingDetailsForm from "../../components/WeddingDetailsForm";
import { getUserFromDatabase, getWeddingDetails, getGalleryByWedding, uploadGalleryItem } from "../../utils/api";
import { Image as ImageIcon, Video, Upload, X, Plus } from "lucide-react";
import "./CoupleDashboard.css";

export default function CoupleDashboard() {
  const { userId } = useAuth();
  const [user, setUser] = useState(null);
  const [wedding, setWedding] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    if (userId) {
      try {
        const userData = await getUserFromDatabase(userId);
        setUser(userData);

        const weddingData = await getWeddingDetails(userId);
        setWedding(weddingData);

        if (weddingData?.id) {
          setIsLoadingGallery(true);
          const gallery = await getGalleryByWedding(weddingData.id, true);
          setGalleryItems(gallery);
          setIsLoadingGallery(false);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setIsLoadingGallery(false);
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

  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Wedding Details</h1>
          <p className="page-subtitle">Plan your perfect day</p>
          <WeddingDetailsForm userId={userId} />

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

