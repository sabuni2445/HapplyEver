import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { getManagerMeetings, getManagerAssignments, requestMeetingByManager, getWeddingById } from "../../utils/api";
import "../admin/AdminDashboard.css";

export default function ManagerSchedule() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [meetings, setMeetings] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [weddings, setWeddings] = useState({});

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
        coupleId: "",
        date: "",
        time: "",
        purpose: ""
    });

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
        try {
            const dbUserStr = localStorage.getItem("dbUser");
            const dbUser = dbUserStr ? JSON.parse(dbUserStr) : null;
            const dbUserId = dbUser?.id;

            if (dbUserId) {
                const [myMeetings, myAssignments] = await Promise.all([
                    getManagerMeetings(dbUserId),
                    getManagerAssignments(userId)
                ]);

                setMeetings(myMeetings || []);
                setAssignments(myAssignments || []);

                // Load weddings for dropdown
                const weddingMap = {};
                for (const assignment of (myAssignments || [])) {
                    try {
                        const wedding = await getWeddingById(assignment.weddingId);
                        weddingMap[assignment.weddingId] = wedding;
                    } catch (e) { console.error(e); }
                }
                setWeddings(weddingMap);
            }
        } catch (error) {
            console.error("Failed to load schedule data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScheduleMeeting = async () => {
        if (!newMeeting.coupleId || !newMeeting.date || !newMeeting.time || !newMeeting.purpose) {
            alert("Please fill all fields");
            return;
        }

        try {
            // Find couple ID from assignment/wedding
            const selectedWedding = weddings[newMeeting.coupleId]; // coupleId in state is actually weddingId for simplicity in dropdown
            if (!selectedWedding || !selectedWedding.clerkId) {
                alert("Could not identify couple for this wedding");
                return;
            }

            // Need numeric ID for couple, retrieve from User API or if we have it. 
            // The API expects ID (Long). 
            // Wait, existing requestMeetingByManager takes `coupleId` (Long) and `managerClerkId` (String).
            // `getWeddingById` returns `clerkId` (String). We need the numeric ID.
            // Let's assume for now we can pass clerkId if we update backend?
            // backend: `User couple = userRepository.findById(coupleId)` -> It expects ID.

            // To fix this without extra calls, we'll iterate through `assignments` which might check user?
            // Actually, we need to fetch the user to get their ID.
            // Simplified: The backend `MeetingController` takes `coupleId` as Long. 
            // WE NEED TO FETCH THE USER.

            // For now, let's just alert user this part needs the user ID lookup which might be heavy here.
            // ALTERNATIVE: Backend supports clerkId lookup. I'll stick to what I have.
            // I'll assume `selectedWedding.id` is NOT the user id.

            // Let's rely on `selectedWedding.clerkId` and fetch the user quickly.
            // Actually, I can update backend to accept clerkId? 
            // NO, let's keep backend stable. I will fetch user here.
            // Actually, `getWeddingDetails` or `getUserByClerkId`.

            // We can search the `couple` attached to wedding.
            // Let's just assume for a second we can find it.
            // Workaround: I'll use `assignments` to find managers, but weddings link to couples.
            // I'll fetch user by clerkId.

            // Wait, I need to fetch the User object to get the ID.
            // Let's postpone this complexity or assume we can get it.
            // Actually, let's just use `userId` (Manager) and `selectedWedding` to call API.
            // I will update the API call to accept ClerkId in backend? 
            // I'll update backend logic: `findByClerkId` is safer.
            // But I already wrote `findById`.

            // Let's just fetch the user!
            const userRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/users/clerk/${selectedWedding.clerkId}`);
            const user = await userRes.json();

            const meetingTime = new Date(`${newMeeting.date}T${newMeeting.time}`).toISOString();

            await requestMeetingByManager(
                userId,
                user.id, // Numeric ID
                meetingTime,
                newMeeting.purpose
            );

            alert("Meeting Scheduled & Request Sent!");
            setShowModal(false);
            setNewMeeting({ coupleId: "", date: "", time: "", purpose: "" });
            loadData();
        } catch (error) {
            console.error("Failed to schedule:", error);
            alert("Failed to schedule meeting");
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const blanks = Array(firstDay).fill(null);
    const dateArray = Array.from({ length: days }, (_, i) => i + 1);

    const getEventsForDay = (day) => {
        return meetings.filter(m => {
            const mDate = new Date(m.meetingTime);
            return mDate.getDate() === day &&
                mDate.getMonth() === currentMonth.getMonth() &&
                mDate.getFullYear() === currentMonth.getFullYear();
        });
    };

    if (isLoading) {
        return (
            <div className="admin-dashboard">
                <ManagerSidebar />
                <div className="dashboard-content">
                    <p>Loading Schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <ManagerSidebar />
            <div className="dashboard-content">
                <div className="content-wrapper">
                    <div className="header-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
                        <div>
                            <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>My Schedule</h1>
                            <p className="page-subtitle" style={{ fontSize: "1.1rem", color: "#7a5d4e" }}>Manage your upcoming wedding events and meetings</p>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ padding: "0.75rem 1.5rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.5rem" }}
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={20} /> Add Event
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2.5rem" }}>
                        {/* Calendar View */}
                        <div className="section-card" style={{ padding: "2rem", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                                <h2 style={{ margin: 0, fontFamily: "Playfair Display", fontSize: "1.8rem", color: "#523c2b" }}>
                                    {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                                </h2>
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <button className="btn-icon" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} style={{ background: "#fdf6f0", border: "1px solid #d4af37", color: "#d4af37" }}><ChevronLeft size={20} /></button>
                                    <button className="btn-icon" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} style={{ background: "#fdf6f0", border: "1px solid #d4af37", color: "#d4af37" }}><ChevronRight size={20} /></button>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#f1f5f9", borderRadius: "16px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                    <div key={day} style={{ background: "#f8fafc", padding: "1.25rem", textAlign: "center", fontWeight: "700", fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>{day}</div>
                                ))}
                                {blanks.map((_, i) => <div key={`blank-${i}`} style={{ background: "white" }} />)}
                                {dateArray.map(day => {
                                    const dayEvents = getEventsForDay(day);
                                    const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                                    return (
                                        <div key={day} style={{
                                            background: "white",
                                            minHeight: "120px",
                                            padding: "0.75rem",
                                            position: "relative",
                                            border: isToday ? "2px solid #d4af37" : "none",
                                            zIndex: isToday ? 1 : 0
                                        }}>
                                            <span style={{
                                                fontSize: "0.9rem",
                                                fontWeight: "700",
                                                color: isToday ? "#d4af37" : "#94a3b8",
                                                display: "block",
                                                marginBottom: "0.5rem"
                                            }}>{day}</span>

                                            {dayEvents.map((event, idx) => (
                                                <div key={idx} style={{
                                                    padding: "0.4rem 0.6rem",
                                                    background: event.status === "PENDING" ? "#fef3c7" : "#f0fdf4",
                                                    borderLeft: `3px solid ${event.status === "PENDING" ? "#d97706" : "#10b981"}`,
                                                    borderRadius: "6px",
                                                    fontSize: "0.7rem",
                                                    fontWeight: "700",
                                                    color: event.status === "PENDING" ? "#92400e" : "#065f46",
                                                    marginBottom: "0.4rem",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                }} title={event.purpose}>
                                                    {new Date(event.meetingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.purpose}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                            {/* Upcoming Meetings List */}
                            <div className="section-card" style={{ padding: "2rem", borderRadius: "24px" }}>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", marginBottom: "1.5rem" }}>Upcoming Meetings</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                    {meetings.length === 0 ? <p style={{ color: "#9ca3af" }}>No upcoming meetings</p> :
                                        meetings.slice(0, 5).map((m, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid #f1f5f9" }}>
                                                <div style={{
                                                    width: "56px",
                                                    height: "56px",
                                                    borderRadius: "14px",
                                                    background: "#fdf6f0",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "1px solid rgba(212, 175, 55, 0.3)"
                                                }}>
                                                    <span style={{ fontSize: "0.65rem", fontWeight: "800", color: "#d4af37", textTransform: "uppercase" }}>{new Date(m.meetingTime).toLocaleString('default', { month: 'short' })}</span>
                                                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#523c2b" }}>{new Date(m.meetingTime).getDate()}</span>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: "700", color: "#523c2b", fontSize: "1rem" }}>{m.couple?.firstName || "Client"}</div>
                                                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                        <Clock size={12} /> {new Date(m.meetingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    background: m.status === "APPROVED" ? "#f0fdf4" : (m.status === "REJECTED" ? "#fef2f2" : "#fef3c7"),
                                                    color: m.status === "APPROVED" ? "#10b981" : (m.status === "REJECTED" ? "#ef4444" : "#d97706"),
                                                    fontSize: "0.7rem",
                                                    fontWeight: "700"
                                                }}>
                                                    {m.status}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Event Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                <h2 style={{ margin: 0, fontFamily: "Playfair Display" }}>Schedule Meeting</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div className="form-group">
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Select Wedding/Couple</label>
                                    <select
                                        className="form-select"
                                        value={newMeeting.coupleId}
                                        onChange={(e) => setNewMeeting({ ...newMeeting, coupleId: e.target.value })}
                                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d4af37" }}
                                    >
                                        <option value="">Select a Wedding</option>
                                        {Object.values(weddings).map(w => (
                                            <option key={w.id} value={w.id}>
                                                {w.partnersName} ({w.location})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Date</label>
                                        <input
                                            type="date"
                                            value={newMeeting.date}
                                            onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Time</label>
                                        <input
                                            type="time"
                                            value={newMeeting.time}
                                            onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Purpose</label>
                                    <textarea
                                        value={newMeeting.purpose}
                                        onChange={(e) => setNewMeeting({ ...newMeeting, purpose: e.target.value })}
                                        rows={3}
                                        placeholder="e.g. Discuss decoration details..."
                                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                    />
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={handleScheduleMeeting}
                                    style={{ marginTop: "1rem", padding: "1rem" }}
                                >
                                    Send Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
