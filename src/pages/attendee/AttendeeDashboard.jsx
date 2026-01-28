import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getGuestByCode, getWeddingCard, getWeddingDetails, getUserFromDatabase, getGalleryByWedding, uploadGalleryItem, getAssignmentByWedding, getUserByClerkId, submitAttendeeRating, getAttendeeRatingsByGuest, sendWeddingMessage, getWeddingMessagesForGuest } from "../../utils/api";
import { formatPartnerNames } from "../../utils/formatPartnerNames";
import { QrCode, Heart, Calendar, MapPin, Download, Upload, Image as ImageIcon, Video, X, Star, MessageCircle, Bell, Shield } from "lucide-react";
import "./AttendeeDashboard.css";

export default function AttendeeDashboard() {
  // Attendees don't need Clerk auth - they access via unique code from DB
  const [currentUser, setCurrentUser] = useState(null);
  const [searchParams] = useSearchParams();
  const uniqueCode = searchParams.get("code");
  const coupleClerkId = searchParams.get("couple");
  
  const [guest, setGuest] = useState(null);
  const [wedding, setWedding] = useState(null);
  const [weddingCard, setWeddingCard] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingType, setRatingType] = useState(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [notifications, setNotifications] = useState([]);

  // Load current user's name (the couple who created the wedding)
  useEffect(() => {
    const loadUser = async () => {
      if (coupleClerkId) {
        try {
          const userData = await getUserFromDatabase(coupleClerkId);
          setCurrentUser(userData);
        } catch (error) {
          console.error("Failed to load user:", error);
        }
      }
    };
    loadUser();
  }, [coupleClerkId]);

  useEffect(() => {
    const loadData = async () => {
      // If no code in URL, check if it's in the path or try to extract from current URL
      const codeFromUrl = uniqueCode || new URLSearchParams(window.location.search).get("code");
      const coupleFromUrl = coupleClerkId || new URLSearchParams(window.location.search).get("couple");
      
      if (!codeFromUrl) {
        setIsLoading(false);
        return;
      }

      try {
        const guestData = await getGuestByCode(codeFromUrl);
        setGuest(guestData);
        
        if (coupleFromUrl) {
          try {
            const weddingData = await getWeddingDetails(coupleFromUrl);
            setWedding(weddingData);
            
            const cardData = await getWeddingCard(coupleFromUrl);
            if (cardData) {
              setWeddingCard(cardData);
            }
            
            // Load gallery items
            try {
              const gallery = await getGalleryByWedding(weddingData.id, true);
              setGalleryItems(gallery);
            } catch (error) {
              console.error("Failed to load gallery:", error);
            }
            
            // Load assignment and protocol
            try {
              const assignmentData = await getAssignmentByWedding(weddingData.id);
              setAssignment(assignmentData);
              if (assignmentData?.protocolClerkId) {
                const protocolData = await getUserByClerkId(assignmentData.protocolClerkId);
                setProtocol(protocolData);
              }
            } catch (error) {
              console.error("Failed to load assignment:", error);
            }
            
            // Load messages
            try {
              const messagesData = await getWeddingMessagesForGuest(weddingData.id, guestData.id);
              setMessages(messagesData);
            } catch (error) {
              console.error("Failed to load messages:", error);
            }
          } catch (error) {
            console.error("Failed to load wedding data:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load guest data:", error);
        // Show error message
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [uniqueCode, coupleClerkId]);

  if (isLoading) {
    return (
      <div className="attendee-dashboard">
        <div className="dashboard-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!guest && !isLoading) {
    return (
      <div className="attendee-dashboard">
        <div className="dashboard-content">
          <div className="content-wrapper">
            <h1 className="page-title">Welcome!</h1>
            <p>Please use your invitation link with the unique code to access your invitation.</p>
            <p style={{ marginTop: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>
              If you have your unique code, you can access your invitation at:<br />
              <code style={{ background: "#f3f4f6", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                {window.location.origin}/attendee/dashboard?code=YOUR_CODE&couple=COUPLE_ID
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendee-dashboard">
      <div className="dashboard-content">
        <div className="content-wrapper">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 className="page-title">Welcome, {guest.firstName}!</h1>
            <p className="page-subtitle">Your Wedding Invitation</p>
          </div>

          {/* QR Code Section */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <h3 style={{ marginBottom: "1rem", color: "#523c2b" }}>Your Entry QR Code</h3>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Show this QR code at the entrance
            </p>
            {guest.qrCodeUrl && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <img 
                  src={guest.qrCodeUrl} 
                  alt="QR Code" 
                  style={{
                    width: "250px",
                    height: "250px",
                    border: "4px solid #d4af37",
                    borderRadius: "12px",
                    padding: "1rem",
                    background: "white"
                  }}
                />
              </div>
            )}
            <p style={{
              padding: "0.75rem 1.5rem",
              background: "#fef3c7",
              color: "#92400e",
              borderRadius: "8px",
              display: "inline-block",
              fontWeight: "600",
              fontSize: "0.9rem"
            }}>
              Code: {guest.uniqueCode}
            </p>
          </div>

          {/* Wedding Card */}
          {weddingCard && weddingCard.digitalCardEnabled && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#523c2b", textAlign: "center" }}>Wedding Invitation</h3>
              <div style={{
                backgroundImage: weddingCard.backgroundImage && !weddingCard.backgroundVideo ? `url(${weddingCard.backgroundImage})` : "none",
                backgroundColor: !weddingCard.backgroundImage && !weddingCard.backgroundVideo ? (weddingCard.backgroundColor || "#f9fafb") : "transparent",
                backgroundSize: weddingCard.backgroundImage && !weddingCard.backgroundVideo ? "cover" : "auto",
                backgroundPosition: weddingCard.backgroundImage && !weddingCard.backgroundVideo ? "center" : "initial",
                backgroundRepeat: weddingCard.backgroundImage && !weddingCard.backgroundVideo ? "no-repeat" : "initial",
                borderRadius: "12px",
                padding: "3rem",
                textAlign: weddingCard.textAlign || "center",
                border: "2px solid #e5e7eb",
                height: "500px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                position: "relative",
                fontFamily: weddingCard.fontFamily || "Playfair Display, serif",
                overflow: "hidden",
                boxSizing: "border-box"
              }}>
                {weddingCard.backgroundVideo && (
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
                      zIndex: 0,
                      borderRadius: "12px"
                    }}
                  >
                    <source src={weddingCard.backgroundVideo} type="video/mp4" />
                  </video>
                )}
                {(weddingCard.backgroundImage || weddingCard.backgroundVideo) && weddingCard.overlayOpacity && (
                  <div style={{
                    backgroundColor: weddingCard.backgroundColor || "#ffffff",
                    opacity: weddingCard.overlayOpacity,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "12px",
                    zIndex: 1
                  }} />
                )}
                <div style={{
                  position: "relative",
                  zIndex: 2,
                  color: weddingCard.textColor || "#523c2b",
                  fontFamily: weddingCard.fontFamily || "Playfair Display, serif"
                }}>
                  {!weddingCard.backgroundImage && !weddingCard.backgroundVideo && (
                    <Heart size={48} color={weddingCard.accentColor || "#d4af37"} fill={weddingCard.accentColor || "#d4af37"} style={{ marginBottom: "1rem" }} />
                  )}
                  <h2 style={{
                    fontFamily: weddingCard.fontFamily || "Playfair Display, serif",
                    color: weddingCard.accentColor || weddingCard.textColor || "#523c2b",
                    marginBottom: "1rem",
                    fontSize: weddingCard.nameFontSize || weddingCard.fontSize || "3rem",
                    fontWeight: "700",
                    textTransform: "uppercase"
                  }}>
                    {(() => {
                      // Combine current user's name (couple) with partner's name
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
                  </h2>
                  {wedding?.weddingDate && (
                    <div style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "500" }}>
                      <Calendar size={20} style={{ display: "inline", marginRight: "0.5rem" }} />
                      <span>
                        {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      {wedding.weddingTime && (
                        <span style={{ marginLeft: "0.5rem" }}>
                          at {wedding.weddingTime}
                        </span>
                      )}
                    </div>
                  )}
                  {wedding?.location && (
                    <div style={{ marginBottom: "1.5rem", fontSize: "1rem", opacity: 0.9 }}>
                      <MapPin size={20} style={{ display: "inline", marginRight: "0.5rem" }} />
                      <span>{wedding.location}</span>
                    </div>
                  )}
                  {weddingCard.customText && (
                    <div style={{
                      margin: "2rem 0",
                      fontSize: "1.1rem",
                      lineHeight: "1.8",
                      fontStyle: "italic",
                      maxWidth: "500px",
                      marginLeft: "auto",
                      marginRight: "auto"
                    }}>
                      {weddingCard.customText}
                    </div>
                  )}
                  <p style={{
                    marginTop: "2rem",
                    fontSize: "1rem",
                    fontWeight: "500",
                    color: weddingCard.accentColor || weddingCard.textColor || "#523c2b"
                  }}>
                    We look forward to celebrating with you!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thank You Card */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <h3 style={{ marginBottom: "1.5rem", color: "#523c2b" }}>Thank You</h3>
            <div style={{
              background: "linear-gradient(135deg, #fdf6f0 0%, #fff9f3 100%)",
              borderRadius: "12px",
              padding: "3rem",
              border: "2px solid #d4af37"
            }}>
              <Heart size={48} color="#d4af37" fill="#d4af37" style={{ marginBottom: "1rem" }} />
              <p style={{
                color: "#523c2b",
                fontSize: "1.2rem",
                lineHeight: "1.8",
                fontFamily: "Playfair Display, serif"
              }}>
                Thank you for being part of our special day.
                <br />
                Your presence means the world to us.
              </p>
            </div>
          </div>

          {/* Shared Gallery Section */}
          {wedding && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              marginTop: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#523c2b", margin: 0 }}>Shared Gallery</h3>
                {guest && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#d4af37",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <Upload size={18} />
                    Upload Photo/Video
                  </button>
                )}
              </div>
              {galleryItems.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                  No photos or videos yet. {guest && "Be the first to upload!"}
                </p>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1rem"
                }}>
                  {galleryItems.map(item => (
                    <div key={item.id} style={{
                      position: "relative",
                      borderRadius: "8px",
                      overflow: "hidden",
                      aspectRatio: "1",
                      cursor: "pointer"
                    }}>
                      {item.fileType === "IMAGE" ? (
                        <img src={item.fileUrl} alt={item.caption || "Gallery"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <video src={item.fileUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                      )}
                      {item.caption && (
                        <div style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                          color: "white",
                          padding: "0.5rem",
                          fontSize: "0.85rem"
                        }}>
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Modal */}
          {showUploadModal && wedding && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }} onClick={() => setShowUploadModal(false)}>
              <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "2rem",
                maxWidth: "500px",
                width: "90%",
                maxHeight: "90vh",
                overflow: "auto"
              }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: "1.5rem", color: "#523c2b" }}>Upload to Gallery</h3>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setUploadFile({ file, dataUrl: reader.result, type: file.type.startsWith("image/") ? "IMAGE" : "VIDEO" });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ marginBottom: "1rem", width: "100%" }}
                />
                {uploadFile && (
                  <div style={{ marginBottom: "1rem" }}>
                    {uploadFile.type === "IMAGE" ? (
                      <img src={uploadFile.dataUrl} alt="Preview" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "8px" }} />
                    ) : (
                      <video src={uploadFile.dataUrl} controls style={{ width: "100%", maxHeight: "200px", borderRadius: "8px" }} />
                    )}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    marginBottom: "1rem"
                  }}
                />
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={async () => {
                      if (!uploadFile || !guest?.id) return;
                      setIsUploading(true);
                      try {
                        // For attendees, use guest ID or email as identifier instead of Clerk ID
                        const attendeeId = guest.email || guest.phoneNumber || `guest_${guest.id}`;
                        await uploadGalleryItem(attendeeId, {
                          weddingId: wedding.id,
                          fileUrl: uploadFile.dataUrl,
                          fileType: uploadFile.type,
                          caption: uploadCaption
                        });
                        // Reload gallery
                        const gallery = await getGalleryByWedding(wedding.id, true);
                        setGalleryItems(gallery);
                        setShowUploadModal(false);
                        setUploadFile(null);
                        setUploadCaption("");
                      } catch (error) {
                        alert("Failed to upload: " + (error.response?.data?.error || error.message));
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    disabled={!uploadFile || isUploading}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#d4af37",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: uploadFile && !isUploading ? "pointer" : "not-allowed",
                      fontWeight: "600",
                      opacity: uploadFile && !isUploading ? 1 : 0.6
                    }}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                      setUploadCaption("");
                    }}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#f3f4f6",
                      color: "#523c2b",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Location & Wedding Details */}
          {wedding && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              marginTop: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#523c2b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={24} />
                Wedding Details
              </h3>
              
              {wedding.location && (
                <div style={{ marginBottom: "2rem" }}>
                  <h4 style={{ color: "#523c2b", marginBottom: "0.5rem" }}>Location</h4>
                  <p style={{ color: "#6b7280", marginBottom: "1rem" }}>{wedding.location}</p>
                  {/* Google Maps Link */}
                  <div style={{
                    width: "100%",
                    height: "300px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "2px solid #e5e7eb",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "1rem"
                  }}>
                    <MapPin size={48} color="#d4af37" />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: "#d4af37",
                        color: "white",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "600"
                      }}
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                {wedding.weddingDate && (
                  <div>
                    <h4 style={{ color: "#523c2b", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Calendar size={18} />
                      Date & Time
                    </h4>
                    <p style={{ color: "#6b7280" }}>
                      {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {wedding.weddingTime && ` at ${wedding.weddingTime}`}
                    </p>
                  </div>
                )}

                {wedding.rules && (
                  <div>
                    <h4 style={{ color: "#523c2b", marginBottom: "0.5rem" }}>Rules & Guidelines</h4>
                    <p style={{ color: "#6b7280", whiteSpace: "pre-wrap" }}>{wedding.rules}</p>
                  </div>
                )}

                {guest.priority && guest.priority !== "STANDARD" && (
                  <div>
                    <h4 style={{ color: "#523c2b", marginBottom: "0.5rem" }}>Your Priority</h4>
                    <p style={{
                      color: guest.priority === "VVIP" ? "#7c3aed" : "#d4af37",
                      fontWeight: "600",
                      background: guest.priority === "VVIP" ? "#ede9fe" : "#fef3c7",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      display: "inline-block"
                    }}>
                      {guest.priority}
                    </p>
                    {guest.seatNumber && (
                      <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
                        Seat: {guest.seatNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Section */}
          {wedding && guest && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              marginTop: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#523c2b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MessageCircle size={24} />
                Messages
              </h3>
              
              <div style={{
                maxHeight: "400px",
                overflowY: "auto",
                marginBottom: "1rem",
                padding: "1rem",
                background: "#f9fafb",
                borderRadius: "8px"
              }}>
                {messages.length === 0 ? (
                  <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                    No messages yet
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} style={{
                      padding: "1rem",
                      marginBottom: "0.5rem",
                      background: "white",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600", color: "#523c2b" }}>
                          {msg.senderType === "COUPLE" ? "Couple" : "Guest"}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ color: "#6b7280", margin: 0 }}>{msg.message}</p>
                      {msg.isBroadcast && (
                        <span style={{
                          fontSize: "0.75rem",
                          color: "#d4af37",
                          background: "#fef3c7",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          marginTop: "0.5rem",
                          display: "inline-block"
                        }}>
                          Broadcast
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Ratings Section */}
          {wedding && guest && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              marginTop: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ marginBottom: "1.5rem", color: "#523c2b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Star size={24} />
                Rate Your Experience
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                {protocol && (
                  <button
                    onClick={() => {
                      setRatingType("PROTOCOL");
                      setShowRatingModal(true);
                    }}
                    style={{
                      padding: "1.5rem",
                      background: "#f9fafb",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#7c3aed";
                      e.currentTarget.style.background = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.background = "#f9fafb";
                    }}
                  >
                    <Shield size={32} color="#7c3aed" style={{ marginBottom: "0.5rem" }} />
                    <h4 style={{ color: "#523c2b", margin: "0.5rem 0" }}>Rate Protocol</h4>
                    <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>
                      {protocol.firstName} {protocol.lastName}
                    </p>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setRatingType("WEDDING");
                    setShowRatingModal(true);
                  }}
                  style={{
                    padding: "1.5rem",
                    background: "#f9fafb",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d4af37";
                    e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                >
                  <Heart size={32} color="#d4af37" style={{ marginBottom: "0.5rem" }} />
                  <h4 style={{ color: "#523c2b", margin: "0.5rem 0" }}>Rate Wedding</h4>
                  <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>
                    Overall experience
                  </p>
                </button>
                
                {coupleClerkId && (
                  <button
                    onClick={() => {
                      setRatingType("COUPLE");
                      setShowRatingModal(true);
                    }}
                    style={{
                      padding: "1.5rem",
                      background: "#f9fafb",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.3s ease"
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#10b981";
                      e.currentTarget.style.background = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.background = "#f9fafb";
                    }}
                  >
                    <Heart size={32} color="#10b981" style={{ marginBottom: "0.5rem" }} />
                    <h4 style={{ color: "#523c2b", margin: "0.5rem 0" }}>Rate Couple</h4>
                    <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>
                      Hosts feedback
                    </p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rating Modal */}
          {showRatingModal && wedding && guest && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }} onClick={() => setShowRatingModal(false)}>
              <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "2rem",
                maxWidth: "500px",
                width: "90%"
              }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: "1.5rem", color: "#523c2b" }}>
                  Rate {ratingType === "PROTOCOL" ? "Protocol" : ratingType === "WEDDING" ? "Wedding" : "Couple"}
                </h3>
                
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#523c2b", fontWeight: "500" }}>
                    Rating (1-5 stars)
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        <Star
                          size={32}
                          color={star <= rating ? "#d4af37" : "#e5e7eb"}
                          fill={star <= rating ? "#d4af37" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#523c2b", fontWeight: "500" }}>
                    Comment (optional)
                  </label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your feedback..."
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontFamily: "inherit"
                    }}
                  />
                </div>
                
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={async () => {
                      try {
                        let ratedId = "";
                        if (ratingType === "PROTOCOL" && protocol) {
                          ratedId = protocol.clerkId;
                        } else if (ratingType === "WEDDING") {
                          ratedId = wedding.id.toString();
                        } else if (ratingType === "COUPLE" && coupleClerkId) {
                          ratedId = coupleClerkId;
                        }
                        
                        await submitAttendeeRating({
                          weddingId: wedding.id,
                          guestId: guest.id,
                          ratedType: ratingType,
                          ratedId: ratedId,
                          rating: rating,
                          comment: ratingComment
                        });
                        
                        alert("Rating submitted successfully!");
                        setShowRatingModal(false);
                        setRating(5);
                        setRatingComment("");
                        setRatingType(null);
                      } catch (error) {
                        alert("Failed to submit rating: " + (error.response?.data?.error || error.message));
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#d4af37",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Submit Rating
                  </button>
                  <button
                    onClick={() => {
                      setShowRatingModal(false);
                      setRating(5);
                      setRatingComment("");
                      setRatingType(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#f3f4f6",
                      color: "#523c2b",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

