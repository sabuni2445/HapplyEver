import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import ProtocolSidebar from "../../components/ProtocolSidebar";
import { getProtocolAssignments, getGuestByCode, getWeddingById, getGuests, checkInGuest } from "../../utils/api";
import {
  QrCode, CheckCircle, XCircle, Users, Calendar,
  Search, Info, Clock, UserCheck, UserPlus,
  ArrowRight, BarChart, Download, MapPin
} from "lucide-react";
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
  const [recentCheckIns, setRecentCheckIns] = useState([
    { name: "Abebe Balcha", time: "10 min ago", status: "VIP" },
    { name: "Sara Kebede", time: "15 min ago", status: "Guest" },
    { name: "Dawit Isaac", time: "22 min ago", status: "VVIP" }
  ]);
  const codeInputRef = useRef(null);

  useEffect(() => {
    const dbUserStr = localStorage.getItem("dbUser");
    if (dbUserStr) {
      try {
        const dbUser = JSON.parse(dbUserStr);
        if (dbUser.clerkId) {
          setUserId(dbUser.clerkId);
          return;
        }
      } catch (e) { }
    }
    if (clerkUserId) setUserId(clerkUserId);
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

      const details = {};
      const guestsData = {};
      for (const assignment of assignmentsData) {
        try {
          const wedding = await getWeddingById(assignment.weddingId);
          details[assignment.weddingId] = wedding;
          const weddingGuests = await getGuests(assignment.coupleClerkId);
          guestsData[assignment.weddingId] = weddingGuests;
        } catch (error) {
          console.error("Failed to load data:", error);
        }
      }
      setWeddingDetails(details);
      setGuests(guestsData);
      if (assignmentsData.length > 0 && !selectedWedding) {
        setSelectedWedding(assignmentsData[0].weddingId);
      }
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
    } catch (error) {
      setGuest(null);
      alert("Guest not found with code: " + code);
    } finally {
      setIsScanning(false);
    }
  };

  const handleVerifyGuest = async () => {
    if (!guest) return;
    try {
      await checkInGuest(guest.id);

      const newCheckIn = {
        name: `${guest.firstName} ${guest.lastName}`,
        time: "Just now",
        status: guest.priority || "Guest"
      };
      setRecentCheckIns([newCheckIn, ...recentCheckIns.slice(0, 4)]);
      alert(`Guest ${guest.firstName} ${guest.lastName} verified successfully!`);

      // Refresh data to update counts and list
      loadData();

      setGuest(null);
      setScannedCode("");
      if (codeInputRef.current) {
        codeInputRef.current.value = "";
        codeInputRef.current.focus();
      }
    } catch (error) {
      console.error("Failed to check in guest:", error);
      alert("Failed to confirm arrival. Please try again.");
    }
  };

  const selectedWeddingGuests = selectedWedding ? (guests[selectedWedding] || []) : [];
  const selectedWeddingDetail = selectedWedding ? weddingDetails[selectedWedding] : null;
  const checkedInCount = selectedWeddingGuests.filter(g => g.checkedIn).length;
  const totalExpected = selectedWeddingDetail?.numberOfGuests || selectedWeddingGuests.length || 0;
  const attendanceRate = totalExpected > 0 ? Math.round((checkedInCount / totalExpected) * 100) : 0;

  if (isLoading) {
    return (
      <div className="protocol-dashboard dark-theme">
        <ProtocolSidebar />
        <div className="dashboard-content">
          <div className="loading-container">
            <div className="modern-spinner"></div>
            <p>Syncing event details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="protocol-dashboard dark-theme">
      <ProtocolSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <header className="page-header-modern">
            <div>
              <h1 className="page-title">Event Assistant Dashboard</h1>
              <p className="page-subtitle">Guest management and event coordination</p>
            </div>
            <div className="header-actions">
              <span className="live-status" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}><Clock size={14} /> ACTIVE EVENT</span>
            </div>
          </header>

          <div className="task-intel-grid">
            <div className="intel-card">
              <div className="intel-icon"><Users /></div>
              <div className="intel-data">
                <h3>{totalExpected}</h3>
                <span>Guest Count</span>
              </div>
            </div>
            <div className="intel-card">
              <div className="intel-icon active"><UserCheck /></div>
              <div className="intel-data">
                <h3>{checkedInCount}</h3>
                <span>Arrived</span>
              </div>
            </div>
            <div className="intel-card">
              <div className="intel-icon urgent"><Clock /></div>
              <div className="intel-data">
                <h3>{Math.max(0, totalExpected - checkedInCount)}</h3>
                <span>Still Expected</span>
              </div>
            </div>
            <div className="intel-card">
              <div className="intel-icon secured"><Clock /></div>
              <div className="intel-data">
                <h3>14:00</h3>
                <span>Starts At</span>
              </div>
            </div>
          </div>

          <div className="protocol-main-grid">
            {/* Primary Verification Section */}
            <div className="verification-zone" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="task-card-modern" style={{ borderLeft: 'none' }}>
                <div className="column-header">
                  <QrCode size={20} color="#d4af37" />
                  <h2>Guest Check-in</h2>
                </div>

                <div className="scanner-body" style={{ marginTop: '1.5rem' }}>
                  <div className="search-box-large" style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '15px' }}>
                    <Search size={24} color="#94a3b8" />
                    <input
                      ref={codeInputRef}
                      type="text"
                      style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', outline: 'none' }}
                      placeholder="Scan QR or Enter Name/Code..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleScanCode(e.target.value);
                      }}
                    />
                    <button
                      className="btn-accept"
                      style={{ padding: '0.5rem 2rem' }}
                      onClick={() => handleScanCode(codeInputRef.current?.value)}
                      disabled={isScanning}
                    >
                      {isScanning ? "Checking..." : "Check In"}
                    </button>
                  </div>

                  {guest ? (
                    <div className="guest-result-modern" style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div className="modern-result-header" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <CheckCircle size={48} color="#10b981" />
                        <div>
                          <h3 style={{ margin: 0, color: '#10b981' }}>Welcome!</h3>
                          <p style={{ margin: 0, color: '#94a3b8' }}>Guest Found</p>
                        </div>
                      </div>
                      <div className="modern-guest-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                        <div className="detail-item">
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Guest Name</label>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{guest.firstName} {guest.lastName}</span>
                        </div>
                        <div className="detail-item">
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Category</label>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{guest.priority || "General"}</span>
                        </div>
                        <div className="detail-item">
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Table Assignment</label>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#d4af37' }}>{guest.tableNumber || "TBD"}</span>
                        </div>
                      </div>
                      <button onClick={handleVerifyGuest} className="btn-complete-modern" style={{ marginTop: '2rem' }}>
                        Confirm Arrival <ArrowRight size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="scanner-placeholder" style={{ textAlign: 'center', padding: '4rem', opacity: 0.3 }}>
                      <QrCode size={64} />
                      <p>Waiting for guest...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="task-card-modern" style={{ borderLeft: 'none' }}>
                <div className="column-header">
                  <Calendar size={20} color="#d4af37" />
                  <h2>Selected Event</h2>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ color: '#d4af37' }}>{selectedWeddingDetail?.partnersName || "Loading..."}</h3>
                  <p>{selectedWeddingDetail?.weddingDate ? new Date(selectedWeddingDetail.weddingDate).toLocaleDateString() : "Date TBD"}</p>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                    <MapPin size={14} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
                    Main Hall
                  </p>
                </div>
              </div>
            </div>

            {/* Side Panel: Recent Activity */}
            <div className="activity-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="task-card-modern" style={{ borderLeft: 'none' }}>
                <div className="column-header">
                  <Clock size={20} />
                  <h2>Recent Arrivals</h2>
                </div>
                <div className="activity-timeline" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {recentCheckIns.map((log, i) => (
                    <div key={i} className="timeline-item" style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                        <UserCheck size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{log.name}</strong>
                          <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{log.time}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: log.status === 'VIP' ? '#f59e0b' : '#94a3b8' }}>{log.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Guest List Detail */}
          {selectedWedding && (
            <div className="task-card-modern" style={{ marginTop: '3rem', borderLeft: 'none' }}>
              <div className="column-header" style={{ marginBottom: '2rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={20} />
                  <h2>Guest List: {selectedWeddingDetail?.partnersName}</h2>
                </div>
                <button className="btn-accept" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Download size={16} /> DOWNLOAD CSV
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '1rem', opacity: 0.5, fontSize: '0.8rem' }}>NAME</th>
                      <th style={{ padding: '1rem', opacity: 0.5, fontSize: '0.8rem' }}>ACCESS CODE</th>
                      <th style={{ padding: '1rem', opacity: 0.5, fontSize: '0.8rem' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWeddingGuests.map(g => (
                      <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1.25rem' }}>{g.firstName} {g.lastName}</td>
                        <td style={{ padding: '1.25rem' }}><code style={{ color: '#d4af37' }}>{g.uniqueCode}</code></td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            background: g.checkedIn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: g.checkedIn ? '#10b981' : '#94a3b8',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {g.checkedIn ? 'ARRIVED' : 'PENDING'}
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










