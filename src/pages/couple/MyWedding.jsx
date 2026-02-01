import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import CoupleSidebar from "../../components/CoupleSidebar";
import { getWeddingDetails, deleteWeddingDetails, getAssignmentByWedding, getUserByClerkId, getPaymentsByWedding, getCoupleBookings } from "../../utils/api";
import WeddingCountdown from "../../components/WeddingCountdown";
import GuestMessaging from "../../components/GuestMessaging";
import { Edit, Trash2, Calendar, MapPin, Users, DollarSign, UserCheck, Shield, MessageCircle, Video } from "lucide-react";
import "./CoupleDashboard.css";

export default function MyWedding() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [wedding, setWedding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [manager, setManager] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadWedding = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const weddingData = await getWeddingDetails(userId);
        setWedding(weddingData);

        // Load assignment info if wedding exists
        if (weddingData?.id) {
          try {
            const assignmentData = await getAssignmentByWedding(weddingData.id);
            setAssignment(assignmentData);

            // Load manager info
            if (assignmentData?.managerClerkId) {
              try {
                const managerData = await getUserByClerkId(assignmentData.managerClerkId);
                setManager(managerData);
              } catch (error) {
                console.error("Failed to load manager:", error);
              }
            }

            // Load protocol info
            if (assignmentData?.protocolClerkId) {
              try {
                const protocolData = await getUserByClerkId(assignmentData.protocolClerkId);
                setProtocol(protocolData);
              } catch (error) {
                console.error("Failed to load protocol:", error);
              }
            }
          } catch (error) {
            // No assignment found, that's okay
            console.log("No assignment found for this wedding");
          }
        }
        // Load payments and bookings for budget tracking
        if (weddingData?.id) {
          try {
            const [paymentsData, bookingsData] = await Promise.all([
              getPaymentsByWedding(weddingData.id),
              getCoupleBookings(userId)
            ]);
            setPayments(paymentsData || []);
            setBookings(bookingsData || []);
          } catch (error) {
            console.error("Failed to load budget data:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load wedding:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWedding();
  }, [userId]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your wedding details? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      // Note: You'll need to add a delete endpoint in the backend
      await deleteWeddingDetails(userId);
      navigate("/couple/dashboard");
    } catch (error) {
      console.error("Failed to delete wedding:", error);
      alert("Failed to delete wedding details");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="couple-dashboard">
        <CoupleSidebar />
        <div className="dashboard-content">
          <div className="content-wrapper">
            <p>Loading wedding details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="couple-dashboard">
        <CoupleSidebar />
        <div className="dashboard-content">
          <div className="content-wrapper">
            <h1 className="page-title">My Wedding</h1>
            <p style={{ color: "#7a5d4e", marginBottom: "2rem" }}>
              No wedding details found. <a href="/couple/dashboard" style={{ color: "#d4af37" }}>Create your wedding details</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div>
              <h1 className="page-title">My Wedding</h1>
              <p className="page-subtitle">Your special day details</p>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {assignment?.status === "COMPLETED" ? (
                <div style={{
                  padding: "0.75rem 1.5rem",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                  color: "#16a34a",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  border: "1px solid #16a34a"
                }}>
                  <CheckCircle size={18} />
                  Journey Completed
                </div>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/couple/dashboard")}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#f3f4f6",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: "#523c2b",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <Edit size={18} />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#fee2e2",
                      border: "none",
                      borderRadius: "8px",
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      color: "#991b1b",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      opacity: isDeleting ? 0.6 : 1
                    }}
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {wedding.weddingDate && (
            <WeddingCountdown weddingDate={wedding.weddingDate} />
          )}

          {/* Budget Summary Card */}
          <div style={{
            background: "linear-gradient(135deg, #d4af37 0%, #b8962e 100%)",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            color: "white",
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)"
          }}>
            <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <DollarSign size={24} />
              Budget Summary
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
              <div>
                <p style={{ opacity: 0.8, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Total Budget</p>
                <p style={{ fontSize: "1.8rem", fontWeight: "700" }}>ETB {(wedding.budget || 0).toLocaleString()}</p>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: "2rem" }}>
                <p style={{ opacity: 0.8, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Total Paid</p>
                <p style={{ fontSize: "1.8rem", fontWeight: "700" }}>
                  ETB {payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: "2rem" }}>
                <p style={{ opacity: 0.8, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Outstanding Balance</p>
                <p style={{ fontSize: "1.8rem", fontWeight: "700" }}>
                  ETB {payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Manager and Protocol Section */}
          {(manager || protocol) && (
            <div style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderRadius: "16px",
              padding: "2rem",
              marginBottom: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <h2 style={{ marginBottom: "1.5rem", color: "#92400e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UserCheck size={24} />
                Your Wedding Team
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {manager && (
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#d4af37",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "600"
                      }}>
                        {manager.firstName?.[0] || "M"}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: "#523c2b" }}>Wedding Manager</h3>
                        <p style={{ margin: 0, color: "#7a5d4e", fontSize: "0.9rem" }}>
                          {manager.firstName} {manager.lastName}
                        </p>
                        {manager.email && (
                          <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.85rem" }}>
                            {manager.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                      <button
                        onClick={() => window.open(`mailto:${manager.email}`, "_blank")}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#d4af37",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <MessageCircle size={16} />
                        Chat
                      </button>
                      <button
                        onClick={() => {
                          // Create Jitsi meeting URL
                          const meetingRoom = `manager-${userId}-${manager.clerkId}`.replace(/[^a-zA-Z0-9]/g, "");
                          window.open(`https://meet.jit.si/${meetingRoom}`, "_blank");
                        }}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <Video size={16} />
                        Meeting
                      </button>
                    </div>
                  </div>
                )}

                {protocol && (
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "600"
                      }}>
                        {protocol.firstName?.[0] || "P"}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: "#523c2b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Shield size={18} />
                          Protocol Officer
                        </h3>
                        <p style={{ margin: 0, color: "#7a5d4e", fontSize: "0.9rem" }}>
                          {protocol.firstName} {protocol.lastName}
                        </p>
                        {protocol.email && (
                          <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.85rem" }}>
                            {protocol.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                      <button
                        onClick={() => window.open(`mailto:${protocol.email}`, "_blank")}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#7c3aed",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <MessageCircle size={16} />
                        Chat
                      </button>
                      <button
                        onClick={() => {
                          // Create Jitsi meeting URL
                          const meetingRoom = `protocol-${userId}-${protocol.clerkId}`.replace(/[^a-zA-Z0-9]/g, "");
                          window.open(`https://meet.jit.si/${meetingRoom}`, "_blank");
                        }}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <Video size={16} />
                        Meeting
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "2.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "grid", gap: "2rem" }}>
              {wedding.partnersName && (
                <div className="wedding-detail-item">
                  <h3>Partner's Name</h3>
                  <p>{wedding.partnersName}</p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                {wedding.weddingDate && (
                  <div className="wedding-detail-item">
                    <Calendar size={20} color="#d4af37" />
                    <div>
                      <h4>Wedding Date</h4>
                      <p>{new Date(wedding.weddingDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {wedding.weddingTime && (
                  <div className="wedding-detail-item">
                    <Calendar size={20} color="#d4af37" />
                    <div>
                      <h4>Wedding Time</h4>
                      <p>{wedding.weddingTime}</p>
                    </div>
                  </div>
                )}

                {wedding.location && (
                  <div className="wedding-detail-item">
                    <MapPin size={20} color="#d4af37" />
                    <div>
                      <h4>Location</h4>
                      <p>{wedding.location}</p>
                    </div>
                  </div>
                )}

                {wedding.numberOfGuests && (
                  <div className="wedding-detail-item">
                    <Users size={20} color="#d4af37" />
                    <div>
                      <h4>Number of Guests</h4>
                      <p>{wedding.numberOfGuests}</p>
                    </div>
                  </div>
                )}

                {wedding.budget && (
                  <div className="wedding-detail-item">
                    <DollarSign size={20} color="#d4af37" />
                    <div>
                      <h4>Budget</h4>
                      <p>${wedding.budget.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {wedding.venue && (
                <div className="wedding-detail-item">
                  <h3>Venue</h3>
                  <p>{wedding.venue}</p>
                </div>
              )}

              {wedding.theme && (
                <div className="wedding-detail-item">
                  <h3>Theme</h3>
                  <p>{wedding.theme}</p>
                </div>
              )}

              {wedding.catering && (
                <div className="wedding-detail-item">
                  <h3>Catering</h3>
                  <p>{wedding.catering}</p>
                </div>
              )}

              {wedding.decorations && (
                <div className="wedding-detail-item">
                  <h3>Decorations</h3>
                  <p>{wedding.decorations}</p>
                </div>
              )}

              {wedding.music && (
                <div className="wedding-detail-item">
                  <h3>Music & Entertainment</h3>
                  <p>{wedding.music}</p>
                </div>
              )}

              {wedding.photography && (
                <div className="wedding-detail-item">
                  <h3>Photography</h3>
                  <p>{wedding.photography}</p>
                </div>
              )}

              {wedding.rules && (
                <div className="wedding-detail-item">
                  <h3>Rules & Guidelines</h3>
                  <p>{wedding.rules}</p>
                </div>
              )}

              {wedding.additionalNotes && (
                <div className="wedding-detail-item">
                  <h3>Additional Notes</h3>
                  <p>{wedding.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Guest Messaging Section */}
          {wedding && (
            <div style={{ marginTop: "2rem" }}>
              <GuestMessaging weddingId={wedding.id} coupleClerkId={userId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

