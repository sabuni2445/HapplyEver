import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import ProtocolSidebar from "../../components/ProtocolSidebar";
import { getProtocolAssignments, getGuestByCode, getWeddingById, getGuests } from "../../utils/api";
import { QrCode, CheckCircle, XCircle, Users, Calendar, Search } from "lucide-react";
import "./ProtocolDashboard.css";

export default function ProtocolDashboard() {
  const { userId: clerkUserId } = useAuth();
  const [userId, setUserId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [scannedCode, setScannedCode] = useState("");
  const [guest, setGuest] = useState(null);
  const [weddingDetails, setWeddingDetails] = useState({});
  const [guests, setGuests] = useState({});
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const codeInputRef = useRef(null);

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
    if (!userId) return;
    setIsLoading(true);
    try {
      const assignmentsData = await getProtocolAssignments(userId);
      setAssignments(assignmentsData);

      // Load wedding details and guests for each assignment
      const details = {};
      const guestsData = {};
      for (const assignment of assignmentsData) {
        try {
          const wedding = await getWeddingById(assignment.weddingId);
          details[assignment.weddingId] = wedding;

          // Load guests for this wedding
          const weddingGuests = await getGuests(assignment.coupleClerkId);
          guestsData[assignment.weddingId] = weddingGuests;
        } catch (error) {
          console.error("Failed to load data:", error);
        }
      }
      setWeddingDetails(details);
      setGuests(guestsData);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanCode = async (code) => {
    if (!code || code.trim() === "") return;

    setIsScanning(true);
    try {
      const guestData = await getGuestByCode(code.trim());
      setGuest(guestData);
      setScannedCode(code);

      // Load wedding details if available
      if (guestData.weddingId) {
        try {
          const wedding = await getWeddingById(guestData.weddingId);
          setWeddingDetails(prev => ({ ...prev, [guestData.weddingId]: wedding }));
        } catch (error) {
          console.error("Failed to load wedding:", error);
        }
      }
    } catch (error) {
      setGuest(null);
      alert("Guest not found with code: " + code);
    } finally {
      setIsScanning(false);
    }
  };

  const handleVerifyGuest = async () => {
    if (!guest) return;

    // In a real app, you would update the guest's check-in status
    alert(`Guest ${guest.firstName} ${guest.lastName} verified successfully!`);
    setGuest(null);
    setScannedCode("");
    if (codeInputRef.current) {
      codeInputRef.current.value = "";
      codeInputRef.current.focus();
    }
  };

  const selectedWeddingGuests = selectedWedding ? (guests[selectedWedding] || []) : [];
  const selectedWeddingDetail = selectedWedding ? weddingDetails[selectedWedding] : null;

  if (isLoading) {
    return (
      <div className="protocol-dashboard">
        <ProtocolSidebar />
        <div className="dashboard-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="protocol-dashboard">
      <ProtocolSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Protocol Dashboard</h1>
          <p className="page-subtitle">Verify guests at the entrance</p>

          {/* QR Code Scanner Section */}
          <div className="section-card scanner-section">
            <h2>
              <QrCode size={24} />
              Guest Verification
            </h2>
            <div className="scanner-container">
              <div className="code-input-section">
                <div className="input-group">
                  <Search size={20} />
                  <input
                    ref={codeInputRef}
                    type="text"
                    placeholder="Enter or scan QR code..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleScanCode(e.target.value);
                      }
                    }}
                    className="code-input"
                  />
                  <button
                    onClick={() => handleScanCode(codeInputRef.current?.value)}
                    className="btn-primary"
                    disabled={isScanning}
                  >
                    {isScanning ? "Scanning..." : "Verify"}
                  </button>
                </div>
              </div>

              {guest && (
                <div className="guest-verification-result">
                  <div className="verification-header">
                    <CheckCircle size={32} color="#10b981" />
                    <h3>Guest Found</h3>
                  </div>
                  <div className="guest-info">
                    <p><strong>Name:</strong> {guest.firstName} {guest.lastName}</p>
                    {guest.email && <p><strong>Email:</strong> {guest.email}</p>}
                    {guest.phoneNumber && <p><strong>Phone:</strong> {guest.phoneNumber}</p>}
                    <p><strong>Code:</strong> {guest.uniqueCode}</p>
                    {selectedWeddingDetail && (
                      <>
                        <p><strong>Wedding:</strong> {selectedWeddingDetail.partnersName}</p>
                        <p><strong>Date:</strong> {selectedWeddingDetail.weddingDate ? new Date(selectedWeddingDetail.weddingDate).toLocaleDateString() : "Not set"}</p>
                      </>
                    )}
                  </div>
                  {guest.qrCodeUrl && (
                    <div className="qr-display">
                      <img src={guest.qrCodeUrl} alt="QR Code" />
                    </div>
                  )}
                  <button onClick={handleVerifyGuest} className="btn-success">
                    <CheckCircle size={20} />
                    Verify & Check In
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Weddings */}
          <div className="section-card">
            <h2>
              <Calendar size={24} />
              My Assigned Weddings
            </h2>
            {assignments.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                No weddings assigned yet
              </p>
            ) : (
              <div className="weddings-list">
                {assignments.map(assignment => {
                  const wedding = weddingDetails[assignment.weddingId];
                  const weddingGuests = guests[assignment.weddingId] || [];
                  return (
                    <div
                      key={assignment.id}
                      className={`wedding-card ${selectedWedding === assignment.weddingId ? "selected" : ""}`}
                      onClick={() => setSelectedWedding(assignment.weddingId)}
                    >
                      <div className="wedding-card-header">
                        <h3>{wedding?.partnersName || `Wedding #${assignment.weddingId}`}</h3>
                        <span className="status-badge status-active">Active</span>
                      </div>
                      {wedding && (
                        <div className="wedding-card-details">
                          <p>
                            <Calendar size={16} />
                            {wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString() : "Date TBD"}
                            {wedding.weddingTime && ` at ${wedding.weddingTime}`}
                          </p>
                          <p>
                            <Users size={16} />
                            {weddingGuests.length} / {wedding.numberOfGuests || "?"} Guests
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Guest List for Selected Wedding */}
          {selectedWedding && selectedWeddingGuests.length > 0 && (
            <div className="section-card">
              <h2>
                <Users size={24} />
                Guest List - {selectedWeddingDetail?.partnersName || "Wedding"}
              </h2>
              <div className="guests-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Code</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWeddingGuests.map(g => (
                      <tr key={g.id}>
                        <td>{g.firstName} {g.lastName}</td>
                        <td>{g.email || "-"}</td>
                        <td>{g.phoneNumber || "-"}</td>
                        <td><code>{g.uniqueCode}</code></td>
                        <td>
                          <span className={`status-badge status-${g.rsvpStatus?.toLowerCase() || "pending"}`}>
                            {g.rsvpStatus || "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}









