import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import { getWeddingDetails, createGuests, getGuests } from "../../utils/api";
import { UserPlus, Mail, Phone, X, Copy, ExternalLink, QrCode } from "lucide-react";
import "./CoupleDashboard.css";

export default function GuestManagement() {
  const { userId } = useAuth();
  const [wedding, setWedding] = useState(null);
  const [guests, setGuests] = useState([]);
  const [guestForms, setGuestForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const weddingData = await getWeddingDetails(userId);
        setWedding(weddingData);
        
        const guestsData = await getGuests(userId);
        setGuests(guestsData);
        
        // Initialize guest forms based on numberOfGuests
        const numberOfGuests = weddingData?.numberOfGuests || 0;
        const existingCount = guestsData?.length || 0;
        const remaining = Math.max(0, numberOfGuests - existingCount);
        
        if (remaining > 0) {
          setGuestForms(Array(remaining).fill(null).map(() => ({
            firstName: "",
            lastName: "",
            phoneNumber: "",
            email: "",
            priority: "STANDARD",
            seatNumber: ""
          })));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userId]);

  const handleGuestChange = (index, field, value) => {
    const updated = [...guestForms];
    updated[index] = { ...updated[index], [field]: value };
    setGuestForms(updated);
  };

  const addGuestForm = () => {
    setGuestForms([...guestForms, {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      priority: "STANDARD",
      seatNumber: ""
    }]);
  };

  const removeGuestForm = (index) => {
    const updated = guestForms.filter((_, i) => i !== index);
    setGuestForms(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (guestForms.length === 0) {
      alert("Please add at least one guest");
      return;
    }

    // Validate that each guest has at least name and either phone or email
    const invalidGuests = guestForms.filter(
      g => !g.firstName || (!g.phoneNumber && !g.email)
    );
    
    if (invalidGuests.length > 0) {
      alert("Please fill in at least the name and either phone number or email for all guests");
      return;
    }

    setIsSaving(true);
    try {
      const result = await createGuests(userId, guestForms);
      setGuests([...guests, ...result.guests]);
      setGuestForms([]);
      alert("Guests added successfully! QR codes and invitation links have been generated.");
    } catch (error) {
      console.error("Failed to save guests:", error);
      alert("Failed to save guests. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="couple-dashboard">
        <CoupleSidebar />
        <div className="dashboard-content">
          <p>Loading...</p>
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
            <h1 className="page-title">Guest Management</h1>
            <p>Please create your wedding details first before adding guests.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalGuests = wedding.numberOfGuests || 0;
  const addedGuests = guests.length;
  const remaining = Math.max(0, totalGuests - addedGuests);

  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Guest Management</h1>
          <p className="page-subtitle">
            Add your wedding guests ({addedGuests}/{totalGuests} added)
          </p>

          {guests.length > 0 && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ marginBottom: "1rem", color: "#523c2b" }}>Added Guests</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {guests.map((guest) => {
                  const invitationUrl = `${window.location.origin}/attendee/dashboard?code=${guest.uniqueCode}&couple=${userId}`;
                  return (
                    <div key={guest.id} style={{
                      padding: "1.5rem",
                      background: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <div>
                          <p style={{ fontWeight: "600", color: "#523c2b", marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                            {guest.firstName} {guest.lastName}
                          </p>
                          {guest.email && (
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                              <Mail size={14} style={{ display: "inline", marginRight: "0.25rem" }} />
                              {guest.email}
                            </p>
                          )}
                          {guest.phoneNumber && (
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                              <Phone size={14} style={{ display: "inline", marginRight: "0.25rem" }} />
                              {guest.phoneNumber}
                            </p>
                          )}
                          {guest.priority && guest.priority !== "STANDARD" && (
                            <p style={{ 
                              fontSize: "0.75rem", 
                              color: guest.priority === "VVIP" ? "#7c3aed" : "#d4af37", 
                              fontWeight: "600",
                              background: guest.priority === "VVIP" ? "#ede9fe" : "#fef3c7", 
                              padding: "0.25rem 0.5rem", 
                              borderRadius: "4px", 
                              display: "inline-block",
                              marginRight: "0.5rem"
                            }}>
                              {guest.priority}
                            </p>
                          )}
                          {guest.seatNumber && (
                            <p style={{ 
                              fontSize: "0.75rem", 
                              color: "#10b981", 
                              fontWeight: "500",
                              background: "#d1fae5", 
                              padding: "0.25rem 0.5rem", 
                              borderRadius: "4px", 
                              display: "inline-block",
                              marginRight: "0.5rem"
                            }}>
                              Seat: {guest.seatNumber}
                            </p>
                          )}
                          <p style={{ fontSize: "0.75rem", color: "#9ca3af", fontFamily: "monospace", background: "#f3f4f6", padding: "0.25rem 0.5rem", borderRadius: "4px", display: "inline-block" }}>
                            Code: {guest.uniqueCode}
                          </p>
                        </div>
                        {guest.qrCodeUrl && (
                          <div style={{ textAlign: "center" }}>
                            <img 
                              src={guest.qrCodeUrl} 
                              alt="QR Code" 
                              style={{
                                width: "80px",
                                height: "80px",
                                border: "2px solid #d4af37",
                                borderRadius: "8px",
                                padding: "0.25rem",
                                background: "white"
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.5rem", fontWeight: "500" }}>
                          Invitation Link:
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <input
                            type="text"
                            value={invitationUrl}
                            readOnly
                            style={{
                              flex: 1,
                              padding: "0.5rem",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontFamily: "monospace",
                              background: "white"
                            }}
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(invitationUrl);
                              alert("Invitation link copied to clipboard!");
                            }}
                            style={{
                              padding: "0.5rem",
                              background: "#d4af37",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title="Copy Link"
                          >
                            <Copy size={16} />
                          </button>
                          <a
                            href={invitationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "0.5rem",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textDecoration: "none"
                            }}
                            title="Open Link"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {remaining > 0 && (
            <form onSubmit={handleSubmit} style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#523c2b" }}>Add Guests ({remaining} remaining)</h3>
                <button
                  type="button"
                  onClick={addGuestForm}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#d4af37",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: "600"
                  }}
                >
                  <UserPlus size={18} />
                  Add Guest
                </button>
              </div>

              {guestForms.map((guest, index) => (
                <div key={index} style={{
                  padding: "1.5rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  background: "#f9fafb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ color: "#523c2b" }}>Guest {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeGuestForm(index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444"
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "#523c2b", fontWeight: "500" }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={guest.firstName}
                        onChange={(e) => handleGuestChange(index, "firstName", e.target.value)}
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
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "#523c2b", fontWeight: "500" }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={guest.lastName}
                        onChange={(e) => handleGuestChange(index, "lastName", e.target.value)}
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "#523c2b", fontWeight: "500" }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={guest.phoneNumber}
                        onChange={(e) => handleGuestChange(index, "phoneNumber", e.target.value)}
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
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "#523c2b", fontWeight: "500" }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={guest.email}
                        onChange={(e) => handleGuestChange(index, "email", e.target.value)}
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
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "#523c2b", fontWeight: "500" }}>
                        Priority (Optional)
                      </label>
                      <select
                        value={guest.priority || "STANDARD"}
                        onChange={(e) => handleGuestChange(index, "priority", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "1rem",
                          background: "white"
                        }}
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="VIP">VIP</option>
                        <option value="VVIP">VVIP</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", color: "#523c2b", fontWeight: "500" }}>
                        Seat Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., A-12, Table 3"
                        value={guest.seatNumber || ""}
                        onChange={(e) => handleGuestChange(index, "seatNumber", e.target.value)}
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

                  <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.5rem" }}>
                    * At least phone number or email is required
                  </p>
                </div>
              ))}

              {guestForms.length > 0 && (
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: isSaving ? "#9ca3af" : "#d4af37",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    cursor: isSaving ? "not-allowed" : "pointer"
                  }}
                >
                  {isSaving ? "Saving..." : "Save Guests"}
                </button>
              )}
            </form>
          )}

          {remaining === 0 && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <p style={{ color: "#7a5d4e", fontSize: "1.1rem" }}>
                All {totalGuests} guests have been added!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

