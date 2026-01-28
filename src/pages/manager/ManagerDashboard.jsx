import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ManagerSidebar from "../../components/ManagerSidebar";
import { getManagerAssignments, assignProtocolToWedding, getUsersByRole, getWeddingById, getUserByClerkId } from "../../utils/api";
import { Calendar, UserCheck, Users, CheckCircle, Video, MessageCircle, X, MapPin, DollarSign, Heart, ArrowRight, Briefcase } from "lucide-react";
import "./ManagerDashboard.css";

export default function ManagerDashboard() {
  const { userId: clerkUserId } = useAuth();
  const navigate = useNavigate();
  // Get userId from Clerk or from localStorage (for DB-based login)
  const [userId, setUserId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState("");
  const [protocolJob, setProtocolJob] = useState("Scan QR Code");
  const [weddingDetails, setWeddingDetails] = useState({});
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [coupleUser, setCoupleUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for DB-based login user in localStorage
    const dbUserStr = localStorage.getItem("dbUser");
    if (dbUserStr) {
      try {
        const dbUser = JSON.parse(dbUserStr);
        if (dbUser.clerkId) {
          setUserId(dbUser.clerkId);
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
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const loadData = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [assignmentsData, protocolsData] = await Promise.all([
        getManagerAssignments(userId),
        getUsersByRole("PROTOCOL")
      ]);
      setAssignments(assignmentsData || []);
      setProtocols(protocolsData || []);

      // Load wedding details for each assignment
      const details = {};
      for (const assignment of (assignmentsData || [])) {
        try {
          const wedding = await getWeddingById(assignment.weddingId);
          details[assignment.weddingId] = wedding;
        } catch (error) {
          console.error("Failed to load wedding:", error);
        }
      }
      setWeddingDetails(details);
    } catch (error) {
      console.error("Failed to load data:", error);
      setAssignments([]);
      setProtocols([]);
      setWeddingDetails({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignProtocol = async () => {
    if (!selectedAssignment || !selectedProtocol) {
      alert("Please select both wedding and protocol officer");
      return;
    }

    try {
      await assignProtocolToWedding(selectedAssignment.weddingId, selectedProtocol, userId, protocolJob);
      alert("Protocol assigned successfully!");
      setSelectedAssignment(null);
      setSelectedProtocol("");
      setProtocolJob("Scan QR Code");
      loadData();
    } catch (error) {
      alert("Failed to assign protocol: " + (error.response?.data?.error || error.message));
    }
  };

  if (isLoading) {
    return (
      <div className="manager-dashboard">
        <ManagerSidebar />
        <div className="dashboard-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-dashboard">
      <ManagerSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <div className="welcome-section" style={{ marginBottom: "2.5rem" }}>
            <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>Welcome back, Manager</h1>
            <p className="page-subtitle" style={{ fontSize: "1.1rem", color: "#7a5d4e" }}>You have {assignments.length} weddings to oversee today.</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
            <div className="stat-card premium" style={{ background: "linear-gradient(135deg, #ffffff 0%, #fdf6f0 100%)", border: "1px solid rgba(212, 175, 55, 0.2)" }}>
              <div className="stat-icon-wrapper" style={{ background: "#fdf6f0", padding: "1rem", borderRadius: "12px" }}>
                <Calendar size={32} color="#d4af37" />
              </div>
              <div>
                <h3 style={{ fontSize: "2rem", margin: 0, color: "#523c2b" }}>{assignments.length}</h3>
                <p style={{ margin: 0, color: "#7a5d4e", fontWeight: "500" }}>Total Weddings</p>
              </div>
            </div>
            <div className="stat-card premium" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <div className="stat-icon-wrapper" style={{ background: "#f0fdf4", padding: "1rem", borderRadius: "12px" }}>
                <UserCheck size={32} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: "2rem", margin: 0, color: "#065f46" }}>{assignments.filter(a => a.protocolClerkId).length}</h3>
                <p style={{ margin: 0, color: "#065f46", fontWeight: "500" }}>Protocols Assigned</p>
              </div>
            </div>
            <div className="stat-card premium" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
              <div className="stat-icon-wrapper" style={{ background: "#f5f3ff", padding: "1rem", borderRadius: "12px" }}>
                <Users size={32} color="#7c3aed" />
              </div>
              <div>
                <h3 style={{ fontSize: "2rem", margin: 0, color: "#4c1d95" }}>{protocols.length}</h3>
                <p style={{ margin: 0, color: "#4c1d95", fontWeight: "500" }}>Available Protocols</p>
              </div>
            </div>
          </div>

          {/* Assign Protocol Section */}
          {selectedAssignment && (
            <div className="section-card animate-fade-in" style={{ border: "2px solid #d4af37", background: "#fffdfa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ margin: 0, fontFamily: "Playfair Display" }}>Assign Protocol Officer</h2>
                <button onClick={() => setSelectedAssignment(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <div className="assign-form" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", alignItems: "end" }}>
                <div className="form-group">
                  <label style={{ fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>Wedding</label>
                  <input
                    type="text"
                    value={weddingDetails[selectedAssignment.weddingId]?.partnersName || `Wedding #${selectedAssignment.weddingId}`}
                    disabled
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc" }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>Select Protocol Officer</label>
                  <select
                    value={selectedProtocol}
                    onChange={(e) => setSelectedProtocol(e.target.value)}
                    className="form-select"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d4af37" }}
                  >
                    <option value="">Select Protocol Officer</option>
                    {protocols.map(p => (
                      <option key={p.clerkId} value={p.clerkId}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>Assign Job/Task</label>
                  <select
                    value={protocolJob}
                    onChange={(e) => setProtocolJob(e.target.value)}
                    className="form-select"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d4af37" }}
                  >
                    <option value="Scan QR Code">Scan QR Code (Entry)</option>
                    <option value="Security">Security & Law</option>
                    <option value="Guest Assistance">Guest Assistance</option>
                    <option value="Catering Oversight">Catering Oversight</option>
                    <option value="VIP Escort">VIP Escort</option>
                  </select>
                </div>
                <button onClick={handleAssignProtocol} className="btn-primary" style={{ height: "48px", padding: "0 2rem" }}>
                  Confirm Assignment
                </button>
              </div>
            </div>
          )}

          {/* Assignments List */}
          <div className="section-card no-border" style={{ background: "transparent", padding: 0, boxShadow: "none" }}>
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 style={{ margin: 0, fontFamily: "Playfair Display", fontSize: "1.8rem" }}>Assigned Weddings</h2>
              <div className="view-filters" style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.9rem", color: "#7a5d4e", fontWeight: "500" }}>Sort by: Date</span>
              </div>
            </div>

            {assignments.length === 0 ? (
              <div className="empty-state" style={{ textAlign: "center", padding: "4rem", background: "white", borderRadius: "20px", border: "1px dashed #d4af37" }}>
                <Heart size={64} color="#fdf6f0" style={{ marginBottom: "1rem" }} />
                <h3 style={{ color: "#523c2b" }}>No weddings assigned yet</h3>
                <p style={{ color: "#7a5d4e" }}>When the admin assigns you a wedding, it will appear here.</p>
              </div>
            ) : (
              <div className="assignments-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
                {assignments.map(assignment => {
                  const wedding = weddingDetails[assignment.weddingId];
                  return (
                    <div key={assignment.id} className="assignment-card premium-hover" style={{
                      background: "white",
                      borderRadius: "24px",
                      padding: "2rem",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                      transition: "all 0.3s ease",
                      border: "1px solid rgba(212, 175, 55, 0.1)",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      <div className="card-accent" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "linear-gradient(90deg, #d4af37, #fdf6f0)" }}></div>

                      <div className="card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                        <div className="wedding-meta">
                          <span className={`status-badge`} style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            background: assignment.status === "CONFIRMED" ? "#f0fdf4" : "#fef3c7",
                            color: assignment.status === "CONFIRMED" ? "#10b981" : "#d4af37",
                            display: "inline-block",
                            marginBottom: "0.5rem"
                          }}>
                            {assignment.status.replace("_", " ")}
                          </span>
                          {assignment.protocolClerkId && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10b981", fontSize: "0.8rem", fontWeight: "600" }}>
                              <CheckCircle size={14} /> Protocol Assigned
                            </div>
                          )}
                        </div>
                        <div className="wedding-icon" style={{ background: "#fdf6f0", padding: "0.75rem", borderRadius: "12px" }}>
                          <Heart size={20} color="#d4af37" />
                        </div>
                      </div>

                      <h3 style={{ fontSize: "1.5rem", color: "#523c2b", marginBottom: "1.5rem", fontFamily: "Playfair Display" }}>
                        {wedding?.partnersName || `Wedding #${assignment.weddingId}`}
                      </h3>

                      {wedding && (
                        <div className="card-body" style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                          <div className="detail-item" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#7a5d4e" }}>
                            <Calendar size={18} color="#d4af37" />
                            <span style={{ fontWeight: "500" }}>{wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Date TBD"}</span>
                          </div>
                          <div className="detail-item" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#7a5d4e" }}>
                            <MapPin size={18} color="#d4af37" />
                            <span style={{ fontWeight: "500" }}>{wedding.location || "Location TBD"}</span>
                          </div>
                          <div className="detail-item" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#7a5d4e" }}>
                            <Users size={18} color="#d4af37" />
                            <span style={{ fontWeight: "500" }}>{wedding.numberOfGuests || "0"} Guests</span>
                          </div>
                        </div>
                      )}

                      <div className="card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9" }}>
                        <button
                          onClick={() => {
                            setSelectedWedding(wedding);
                            if (wedding?.clerkId) {
                              getUserByClerkId(wedding.clerkId).then(setCoupleUser).catch(console.error);
                            }
                          }}
                          className="btn-text"
                          style={{ background: "none", border: "none", color: "#d4af37", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", padding: 0 }}
                        >
                          Details <ArrowRight size={16} />
                        </button>
                        <div className="footer-actions" style={{ display: "flex", gap: "0.75rem" }}>
                          {!assignment.protocolClerkId && (
                            <button
                              onClick={() => setSelectedAssignment(assignment)}
                              className="btn-outline"
                              style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #d4af37", color: "#d4af37", background: "transparent", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem" }}
                            >
                              Add Protocol
                            </button>
                          )}
                          <button
                            onClick={() => {
                              navigate(`/manager/wedding-management?weddingId=${assignment.weddingId}`);
                            }}
                            className="btn-primary"
                            style={{ padding: "0.5rem 1.25rem", borderRadius: "10px", background: "#d4af37", color: "white", border: "none", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem", boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)" }}
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Wedding Details Modal */}
          {selectedWedding && (
            <div className="modal-overlay" onClick={() => setSelectedWedding(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <h2 style={{ fontFamily: "Playfair Display", color: "#523c2b", margin: 0 }}>
                    Wedding Details
                  </h2>
                  <button onClick={() => setSelectedWedding(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <X size={24} color="#6b7280" />
                  </button>
                </div>

                <div style={{ display: "grid", gap: "1.5rem" }}>
                  {selectedWedding.partnersName && (
                    <div>
                      <h3 style={{ color: "#523c2b", marginBottom: "0.5rem" }}>Couple</h3>
                      <p style={{ color: "#7a5d4e" }}>{selectedWedding.partnersName}</p>
                      {coupleUser && (
                        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                          {coupleUser.email}
                        </p>
                      )}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    {selectedWedding.weddingDate && (
                      <div>
                        <Calendar size={20} color="#d4af37" />
                        <h4>Wedding Date</h4>
                        <p>{new Date(selectedWedding.weddingDate).toLocaleDateString()}</p>
                        {selectedWedding.weddingTime && <p>{selectedWedding.weddingTime}</p>}
                      </div>
                    )}
                    {selectedWedding.location && (
                      <div>
                        <MapPin size={20} color="#d4af37" />
                        <h4>Location</h4>
                        <p>{selectedWedding.location}</p>
                      </div>
                    )}
                    {selectedWedding.numberOfGuests && (
                      <div>
                        <Users size={20} color="#d4af37" />
                        <h4>Guests</h4>
                        <p>{selectedWedding.numberOfGuests}</p>
                      </div>
                    )}
                    {selectedWedding.budget && (
                      <div>
                        <DollarSign size={20} color="#d4af37" />
                        <h4>Budget</h4>
                        <p>${selectedWedding.budget.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  {selectedWedding.venue && <div><h4>Venue</h4><p>{selectedWedding.venue}</p></div>}
                  {selectedWedding.theme && <div><h4>Theme</h4><p>{selectedWedding.theme}</p></div>}
                  {selectedWedding.catering && <div><h4>Catering</h4><p>{selectedWedding.catering}</p></div>}
                  {selectedWedding.music && <div><h4>Music</h4><p>{selectedWedding.music}</p></div>}
                  {selectedWedding.photography && <div><h4>Photography</h4><p>{selectedWedding.photography}</p></div>}
                  {selectedWedding.decorations && <div><h4>Decorations</h4><p>{selectedWedding.decorations}</p></div>}
                  {selectedWedding.rules && <div><h4>Rules</h4><p>{selectedWedding.rules}</p></div>}
                  {selectedWedding.additionalNotes && <div><h4>Additional Notes</h4><p>{selectedWedding.additionalNotes}</p></div>}

                  {/* Meeting Request Section */}
                  <div style={{
                    marginTop: "2rem",
                    padding: "1.5rem",
                    background: "#fef3c7",
                    borderRadius: "12px",
                    border: "2px solid #d4af37"
                  }}>
                    <h3 style={{ color: "#92400e", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Video size={20} />
                      Arrange Meeting
                    </h3>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          const meetingRoom = `manager-${userId}-${selectedWedding.clerkId}`.replace(/[^a-zA-Z0-9]/g, "");
                          window.open(`https://meet.jit.si/${meetingRoom}`, "_blank");
                        }}
                        style={{
                          padding: "0.75rem 1.5rem",
                          background: "#10b981",
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
                        <Video size={18} />
                        Online Meeting (Jitsi)
                      </button>
                      <button
                        onClick={() => window.open(`mailto:${coupleUser?.email || ""}?subject=Wedding Planning Meeting Request`, "_blank")}
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
                        <MessageCircle size={18} />
                        Request In-Person Meeting
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}

