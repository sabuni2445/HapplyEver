import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getGuestByCode,
  getWeddingCard,
  getWeddingDetails,
  getUserFromDatabase,
  getGalleryByWedding,
  uploadGalleryItem,
  getAssignmentByWedding,
  getUserByClerkId,
  submitAttendeeRating,
  getWeddingMessagesForGuest
} from "../../utils/api";
import { formatPartnerNames } from "../../utils/formatPartnerNames";
import {
  QrCode,
  Calendar,
  MapPin,
  Upload,
  X,
  Star,
  Shield,
  Heart,
  ChevronRight,
  Camera,
  MessageSquare,
  Clock
} from "lucide-react";
import "./AttendeeDashboard.css";

const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop";

export default function AttendeeDashboard() {
  const [searchParams] = useSearchParams();
  const uniqueCodeFromUrl = searchParams.get("code");
  const coupleClerkIdFromUrl = searchParams.get("couple");

  const [currentUser, setCurrentUser] = useState(null); // The couple user
  const [guest, setGuest] = useState(null);
  const [wedding, setWedding] = useState(null);
  const [weddingCard, setWeddingCard] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [protocol, setProtocol] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingType, setRatingType] = useState(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showFullCardModal, setShowFullCardModal] = useState(false);
  const [fullImage, setFullImage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!uniqueCodeFromUrl) {
        setIsLoading(false);
        return;
      }

      try {
        const guestData = await getGuestByCode(uniqueCodeFromUrl);
        setGuest(guestData);

        const coupleId = coupleClerkIdFromUrl || guestData.coupleClerkId;

        if (coupleId) {
          const [userData, weddingData] = await Promise.all([
            getUserFromDatabase(coupleId),
            getWeddingDetails(coupleId),
          ]);
          const cardData = await getWeddingCard(coupleId);

          let processedCard = cardData;
          if (cardData && cardData.cardDesign) {
            try {
              const extraData = JSON.parse(cardData.cardDesign);
              processedCard = { ...cardData, ...extraData };
            } catch (e) {
              console.error("Failed to parse card design", e);
            }
          }

          setCurrentUser(userData);
          setWedding(weddingData);
          setWeddingCard(processedCard);

          if (weddingData.id) {
            const [gallery, assignmentData, messagesData] = await Promise.all([
              getGalleryByWedding(weddingData.id, true).catch(() => []),
              getAssignmentByWedding(weddingData.id).catch(() => null),
              getWeddingMessagesForGuest(weddingData.id, guestData.id).catch(() => [])
            ]);

            setGalleryItems(gallery);
            setMessages(messagesData);

            if (assignmentData?.protocolClerkId) {
              const protocolData = await getUserByClerkId(assignmentData.protocolClerkId);
              setProtocol(protocolData);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [uniqueCodeFromUrl, coupleClerkIdFromUrl]);

  const handleUpload = async () => {
    if (!uploadFile || !guest || !wedding) return;
    setIsUploading(true);
    try {
      const attendeeIdentifier = guest.firstName || guest.uniqueCode;
      await uploadGalleryItem(guest.uniqueCode, wedding.id, {
        weddingId: wedding.id,
        fileUrl: uploadFile.dataUrl,
        fileType: uploadFile.type,
        caption: uploadCaption || `Shared by ${attendeeIdentifier}`
      });

      const updatedGallery = await getGalleryByWedding(wedding.id, true);
      setGalleryItems(updatedGallery);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadCaption("");
    } catch (error) {
      alert("Failed to share moment: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!guest || !wedding || !ratingType) return;
    try {
      const ratedId = ratingType === 'PROTOCOL' ? protocol?.clerkId : ratingType === 'COUPLE' ? wedding.clerkId : String(wedding.id);
      await submitAttendeeRating({
        guestId: guest.id,
        weddingId: wedding.id,
        ratedType: ratingType,
        ratedId: ratedId,
        rating: rating,
        comment: ratingComment
      });
      alert("Thank you for your feedback!");
      setShowRatingModal(false);
      setRatingComment("");
      setRating(5);
    } catch (error) {
      alert("Failed to submit rating.");
    }
  };

  if (isLoading) {
    return (
      <div className="attendee-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="section-subtitle">Unveiling your experience...</p>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="attendee-dashboard" style={{
        backgroundImage: `url(${HERO_IMAGE_URL})`,
        backgroundSize: 'cover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        minHeight: '100vh'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} />
        <div className="editorial-card" style={{ textAlign: 'center', position: 'relative', width: '100%', maxWidth: '500px' }}>
          <h1 className="hero-title" style={{ color: 'var(--wedding-text)', fontSize: '2.5rem', marginBottom: '1rem' }}>HapplyEver</h1>
          <p className="link-subtitle" style={{ color: 'var(--wedding-text-soft)', marginBottom: '2rem' }}>Experience the magic of the celebration.</p>
          <p className="section-subtitle">Please use the unique link provided in your invitation.</p>
        </div>
      </div>
    );
  }

  const partnersDisplay = formatPartnerNames(`${currentUser?.firstName || ""} & ${wedding?.partnersName || ""}`);

  return (
    <div className="attendee-dashboard">
      {/* Hero Banner */}
      <section className="hero-banner">
        <img src={HERO_IMAGE_URL} alt="Hero" className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-pretitle">Welcome to the celebration of</span>
          <h1 className="hero-title">{partnersDisplay.toUpperCase()}</h1>
          <div className="hero-divider" />
          <p className="hero-subtitle">Honored Guest, {guest.firstName}</p>
        </div>
      </section>

      <main className="dashboard-main">
        <div className="editorial-grid">

          {/* Entry Pass Card */}
          <div className="editorial-card qr-section">
            <div className="qr-header">
              <Shield size={18} color="var(--wedding-gold)" fill="var(--wedding-gold)" />
              <span>COLLECTOR'S ENTRY PASS</span>
            </div>
            <div className="qr-image-wrapper">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${guest.uniqueCode}&color=000`}
                alt="QR Code"
                className="qr-code-img"
              />
            </div>
            <div className="qr-badge">{guest.uniqueCode}</div>
            <p className="section-subtitle" style={{ marginTop: '1.5rem', padding: '0 2rem' }}>
              Present this digital pass at the reception desk for priority check-in.
            </p>
          </div>

          {/* Invitation Access Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {weddingCard ? (
              <div className="editorial-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="section-title-group" style={{ marginBottom: '1.5rem' }}>
                  <h2 className="section-title" style={{ fontSize: '1.8rem' }}>The Invitation</h2>
                </div>
                <p className="section-subtitle" style={{ marginBottom: '2rem' }}>View the bespoke digital keepsake prepared for this occasion.</p>

                <button onClick={() => setShowFullCardModal(true)} className="invitation-link-bar" style={{ width: '100%', border: 'none', textAlign: 'left' }}>
                  <div className="link-icon-box">
                    <Heart size={24} color="var(--wedding-gold)" />
                  </div>
                  <div className="link-text-box">
                    <span className="link-title">Digital Keepsake</span>
                    <span className="link-subtitle">Click to view the animated invitation</span>
                  </div>
                  <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                </button>
              </div>
            ) : (
              <div className="editorial-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: 0.8 }}>
                <div className="section-title-group" style={{ marginBottom: '1.5rem' }}>
                  <h2 className="section-title" style={{ fontSize: '1.8rem' }}>The Invitation</h2>
                </div>
                <p className="section-subtitle">The digital keepsake for this wedding is currently being handcrafted.</p>
                <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '1rem', border: '1px dashed #ccc', textAlign: 'center' }}>
                  <span className="link-subtitle" style={{ color: '#999' }}>Available Soon</span>
                </div>
              </div>
            )}

            {/* Quick Feedback Links */}
            <div className="editorial-card" style={{ padding: '2rem' }}>
              <h3 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Journal</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {protocol && (
                  <button onClick={() => { setRatingType('PROTOCOL'); setShowRatingModal(true); }} style={{
                    flex: 1, padding: '1rem', borderRadius: '1rem', border: '1px solid #eee', background: '#F9FBFB', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <Shield size={20} color="#6AA1D8" />
                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Protocol</span>
                  </button>
                )}
                <button onClick={() => { setRatingType('WEDDING'); setShowRatingModal(true); }} style={{
                  flex: 1, padding: '1rem', borderRadius: '1rem', border: '1px solid #eee', background: '#FDF6F0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Heart size={20} color="#D86A6A" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Wedding</span>
                </button>
              </div>
            </div>
          </div>

          {/* Shared Moments Gallery */}
          <div className="editorial-card card-full-width">
            <div className="section-title-group">
              <div>
                <h2 className="section-title">Shared Moments</h2>
                <p className="section-subtitle">Capture and contribute to the eternal gallery</p>
              </div>
              <button className="upload-trigger" onClick={() => setShowUploadModal(true)}>
                <Camera size={16} />
                SHARE MOMENT
              </button>
            </div>

            {galleryItems.length > 0 ? (
              <div className="masonry-gallery">
                {galleryItems.map((item) => (
                  <div key={item.id} className="gallery-item" onClick={() => setFullImage(item)}>
                    {item.fileType === "IMAGE" ? (
                      <img src={item.fileUrl} className="gallery-media" alt="Gallery" />
                    ) : (
                      <video src={item.fileUrl} className="gallery-media" muted />
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', color: 'white', fontSize: '0.8rem' }}>
                      {item.caption || "A beautiful moment"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', background: '#f9f9f9', borderRadius: '1rem' }}>
                <p className="section-subtitle">No moments shared yet. Be the first to contribute.</p>
              </div>
            )}
          </div>

          {/* Event Logistics */}
          <div className="editorial-card card-full-width logistics-card">
            <div className="logistics-item">
              <MapPin size={32} color="var(--wedding-gold)" />
              <div>
                <span className="logistics-label">THE VENUE</span>
                <p className="logistics-value">{wedding?.location || "Loading location..."}</p>
                {wedding?.location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.location)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="map-btn"
                  >
                    GET DIRECTIONS →
                  </a>
                )}
              </div>
            </div>

            <div className="logistics-v-divider" />

            <div className="logistics-item">
              <Calendar size={32} color="var(--wedding-gold)" />
              <div>
                <span className="logistics-label">THE DATE</span>
                <p className="logistics-value">
                  {wedding?.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Coming Soon"}
                </p>
                {wedding?.weddingTime && (
                  <p className="logistics-value" style={{ marginTop: '0.5rem', fontSize: '1.1rem', opacity: 0.7 }}>
                    Commencing at {wedding.weddingTime}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Messages from the couple */}
          {messages.length > 0 && (
            <div className="editorial-card card-full-width" style={{ background: '#F9FBFB' }}>
              <h2 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MessageSquare size={24} color="#6AA1D8" />
                Latest News
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {messages.slice(0, 3).map((msg) => (
                  <div key={msg.id} style={{ padding: '2rem', background: 'white', borderRadius: '1.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6AA1D8', letterSpacing: '0.1rem' }}>MESSAGE FROM COUPLE</span>
                      <span style={{ fontSize: '0.7rem', color: '#ccc' }}><Clock size={10} style={{ marginRight: 4 }} />{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', lineHeight: 1.6 }}>{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fff' }}>
        <p style={{ fontFamily: 'Playfair Display', fontSize: '1rem', letterSpacing: '0.2rem', opacity: 0.5 }}>HAPPLYEVER EXPERIENCE</p>
      </footer>

      {/* MODALS */}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="editorial-card" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>
            <h3 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Share a Moment</h3>
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
              style={{ marginBottom: '1.5rem', width: '100%' }}
            />
            {uploadFile && (
              <div style={{ marginBottom: '1.5rem' }}>
                {uploadFile.type === "IMAGE" ? (
                  <img src={uploadFile.dataUrl} alt="Preview" style={{ width: '100%', borderRadius: '1rem', maxHeight: '200px', objectFit: 'cover' }} />
                ) : (
                  <video src={uploadFile.dataUrl} style={{ width: '100%', borderRadius: '1rem', maxHeight: '200px' }} controls />
                )}
              </div>
            )}
            <input
              type="text"
              className="comment-input"
              placeholder="Caption (optional)"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #ddd', marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                className="upload-trigger"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isUploading ? "UPLOADING..." : "SHARE"}
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="upload-trigger"
                style={{ flex: 1, justifyContent: 'center', background: '#f3f4f6', color: '#1a1a1a' }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="editorial-card" style={{ width: '100%', maxWidth: '500px', padding: '3rem', textAlign: 'center' }}>
            <h3 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Leave Your Mark</h3>
            <p className="section-subtitle" style={{ marginBottom: '2rem' }}>How was your experience with {ratingType === 'PROTOCOL' ? 'the protocol team' : 'the celebration'}?</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {[1, 2, 3, 4, 5].map(v => (
                <Star
                  key={v}
                  size={32}
                  onClick={() => setRating(v)}
                  color={v <= rating ? "var(--wedding-gold)" : "#eee"}
                  fill={v <= rating ? "var(--wedding-gold)" : "#eee"}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>

            <textarea
              placeholder="Share a thoughtful comment..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid #ddd', minHeight: '120px', marginBottom: '2rem', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleRatingSubmit} className="upload-trigger" style={{ flex: 1, justifyContent: 'center' }}>SUBMIT</button>
              <button onClick={() => setShowRatingModal(false)} className="upload-trigger" style={{ flex: 1, justifyContent: 'center', background: '#f3f4f6', color: '#1a1a1a' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Digital Invitation Modal */}
      {showFullCardModal && weddingCard && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <button onClick={() => setShowFullCardModal(false)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', zIndex: 2001, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <X size={24} />
          </button>

          <div className="digital-invitation-container" style={{
            position: 'relative',
            backgroundColor: weddingCard.backgroundColor || '#fff',
            overflow: 'hidden',
            borderRadius: '1.5rem',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            width: '100%',
            maxWidth: '500px',
            aspectRatio: '0.7',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Background Media */}
            {weddingCard.backgroundVideo ? (
              <video
                src={weddingCard.backgroundVideo}
                autoPlay loop muted playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: (weddingCard.resizeMode || 'cover'),
                  transform: `scale(${weddingCard.backgroundScale || 1.0})`,
                  zIndex: 1
                }}
              />
            ) : weddingCard.backgroundImage ? (
              <img
                src={weddingCard.backgroundImage}
                alt="Background"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: (weddingCard.resizeMode || 'cover'),
                  transform: `scale(${weddingCard.backgroundScale || 1.0})`,
                  zIndex: 1
                }}
              />
            ) : null}

            {/* Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: weddingCard.backgroundColor || '#000',
              opacity: weddingCard.overlayOpacity !== undefined ? weddingCard.overlayOpacity : 0.3,
              zIndex: 2
            }} />

            {/* Content Plate */}
            <div style={{
              position: 'relative',
              zIndex: 10,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: weddingCard.textAlign === 'left' ? 'flex-start' : weddingCard.textAlign === 'right' ? 'flex-end' : 'center',
              padding: '2rem'
            }}>
              <div className="text-plate" style={{
                backgroundColor: weddingCard.plateType === 'SOLID' ? (weddingCard.plateColor || 'rgba(255,255,255,0.85)') : weddingCard.plateType === 'GLASS' ? 'rgba(255,255,255,0.75)' : weddingCard.plateType === 'NONE' ? 'transparent' : 'rgba(255,255,255,0.85)',
                textAlign: weddingCard.textAlign || 'center',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '100%',
                border: weddingCard.plateType === 'NONE' ? 'none' : '1px solid rgba(255,255,255,0.5)',
                boxShadow: weddingCard.plateType === 'NONE' ? 'none' : '0 10px 30px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: weddingCard.textAlign === 'left' ? 'flex-start' : weddingCard.textAlign === 'right' ? 'flex-end' : 'center',
                borderLeft: weddingCard.textAlign === 'left' ? `6px solid ${weddingCard.accentColor || 'var(--wedding-gold)'}` : undefined,
                borderRight: weddingCard.textAlign === 'right' ? `6px solid ${weddingCard.accentColor || 'var(--wedding-gold)'}` : undefined,
              }}>
                <span className="plate-editorial-title" style={{
                  color: weddingCard.accentColor || 'var(--wedding-gold)',
                  marginBottom: '1rem',
                  fontSize: '0.7rem',
                  letterSpacing: '3px',
                  fontWeight: 700
                }}>THE WEDDING OF</span>

                <h1 className="plate-names" style={{
                  color: weddingCard.textColor || '#1a1a1a',
                  fontFamily: weddingCard.fontFamily || 'Playfair Display',
                  fontSize: `${(parseFloat(weddingCard.nameFontSize) || 3) * 0.8}rem`,
                  margin: '0.5rem 0',
                  lineHeight: 1.2
                }}>
                  {partnersDisplay}
                </h1>

                <div className="plate-divider" style={{
                  height: '2px',
                  width: '40px',
                  backgroundColor: weddingCard.accentColor || 'var(--wedding-gold)',
                  margin: '1.5rem 0'
                }} />

                <p style={{
                  color: weddingCard.textColor || '#1a1a1a',
                  fontFamily: weddingCard.fontFamily || 'Cormorant Garamond',
                  fontSize: `${(parseFloat(weddingCard.fontSize) || 1.2) * 1}rem`,
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  marginBottom: '1.5rem'
                }}>
                  {weddingCard.customText || "We invite you to celebrate our special day!"}
                </p>

                <div style={{ color: weddingCard.textColor || '#1a1a1a', opacity: 0.8, textAlign: 'inherit' }}>
                  <p style={{ fontFamily: 'Playfair Display', fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {wedding?.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ""}
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '0.9rem' }}>
                    {wedding?.location}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Gallery Preview */}
      {fullImage && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <button onClick={() => setFullImage(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', zIndex: 2001 }}>
            <X size={24} />
          </button>
          <div style={{ maxWidth: '90%', maxHeight: '90%' }}>
            {fullImage.fileType === "IMAGE" ? (
              <img src={fullImage.fileUrl} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '1rem' }} />
            ) : (
              <video src={fullImage.fileUrl} controls style={{ width: '100%', height: '100%', borderRadius: '1rem' }} />
            )}
            <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Playfair Display', fontSize: '1.5rem' }}>{fullImage.caption || "A beautiful moment"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
