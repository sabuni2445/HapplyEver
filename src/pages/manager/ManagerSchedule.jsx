import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import "../admin/AdminDashboard.css";

export default function ManagerSchedule() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // January 2026

    const events = [
        { day: 24, type: "wedding", title: "Wedding: Anji & Abebe", time: "10:00 AM", location: "Sheraton Addis" },
        { day: 15, type: "meeting", title: "Meeting: Sarah & Tom", time: "2:00 PM", location: "Bole Office" },
        { day: 10, type: "visit", title: "Site Visit: Grand Hall", time: "11:30 AM", location: "Bole" },
        { day: 28, type: "meeting", title: "Vendor Sync: Catering", time: "4:00 PM", location: "Online" },
    ];

    const getEventsForDay = (day) => events.filter(e => e.day === day);

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
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [userId]);

    if (isLoading) {
        return (
            <div className="admin-dashboard">
                <ManagerSidebar />
                <div className="dashboard-content">
                    <p>Loading...</p>
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
                        <button className="btn-primary" style={{ padding: "0.75rem 1.5rem", borderRadius: "12px" }}>
                            + Add Event
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2.5rem" }}>
                        {/* Calendar View */}
                        <div className="section-card" style={{ padding: "2rem", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                                <h2 style={{ margin: 0, fontFamily: "Playfair Display", fontSize: "1.8rem", color: "#523c2b" }}>
                                    {currentMonth.toLocaleString('default', { month: 'long' })} 2026
                                </h2>
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <button className="btn-icon" style={{ background: "#fdf6f0", border: "1px solid #d4af37", color: "#d4af37" }}><ChevronLeft size={20} /></button>
                                    <button className="btn-icon" style={{ background: "#fdf6f0", border: "1px solid #d4af37", color: "#d4af37" }}><ChevronRight size={20} /></button>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#f1f5f9", borderRadius: "16px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                    <div key={day} style={{ background: "#f8fafc", padding: "1.25rem", textAlign: "center", fontWeight: "700", fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>{day}</div>
                                ))}
                                {Array.from({ length: 31 }).map((_, i) => {
                                    const day = i + 1;
                                    const dayEvents = getEventsForDay(day);
                                    const isToday = day === 23; // Mocking today as Jan 23

                                    return (
                                        <div key={i} style={{
                                            background: "white",
                                            minHeight: "120px",
                                            padding: "0.75rem",
                                            position: "relative",
                                            transition: "all 0.2s ease",
                                            cursor: "pointer",
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
                                                    background: event.type === "wedding" ? "#fdf6f0" : (event.type === "meeting" ? "#f0fdf4" : "#f5f3ff"),
                                                    borderLeft: `3px solid ${event.type === "wedding" ? "#d4af37" : (event.type === "meeting" ? "#10b981" : "#7c3aed")}`,
                                                    borderRadius: "6px",
                                                    fontSize: "0.7rem",
                                                    fontWeight: "700",
                                                    color: event.type === "wedding" ? "#92400e" : (event.type === "meeting" ? "#065f46" : "#4c1d95"),
                                                    marginBottom: "0.4rem",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                }}>
                                                    {event.title}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                            {/* Today's Focus */}
                            <div className="section-card" style={{ padding: "2rem", borderRadius: "24px", background: "linear-gradient(135deg, #523c2b 0%, #3e2d21 100%)", color: "white" }}>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <Clock size={20} color="#d4af37" /> Today's Focus
                                </h3>
                                <div style={{ background: "rgba(255,255,255,0.1)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ color: "#d4af37", fontWeight: "700", fontSize: "0.9rem", marginBottom: "0.5rem" }}>2:00 PM - 3:30 PM</div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.5rem" }}>Final Walkthrough</div>
                                    <div style={{ fontSize: "0.9rem", opacity: 0.8, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <MapPin size={14} /> Sheraton Addis, Grand Ballroom
                                    </div>
                                    <button style={{ marginTop: "1.5rem", width: "100%", padding: "0.75rem", borderRadius: "10px", background: "white", color: "#523c2b", border: "none", fontWeight: "700", cursor: "pointer" }}>
                                        View Details
                                    </button>
                                </div>
                            </div>

                            {/* Upcoming Weddings */}
                            <div className="section-card" style={{ padding: "2rem", borderRadius: "24px" }}>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", marginBottom: "1.5rem" }}>Upcoming Weddings</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                    {[
                                        { date: "Jan 24", couple: "Anji & Abebe", location: "Sheraton Addis", status: "Ready" },
                                        { date: "Feb 12", couple: "Sarah & Tom", location: "Bole Hall", status: "Planning" },
                                        { date: "Mar 05", couple: "Helen & Dawit", location: "Hilton Hotel", status: "Initial" },
                                    ].map((w, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "1.25rem", paddingBottom: i < 2 ? "1.25rem" : 0, borderBottom: i < 2 ? "1px solid #f1f5f9" : "none" }}>
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
                                                <span style={{ fontSize: "0.65rem", fontWeight: "800", color: "#d4af37", textTransform: "uppercase" }}>{w.date.split(' ')[0]}</span>
                                                <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#523c2b" }}>{w.date.split(' ')[1]}</span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: "700", color: "#523c2b", fontSize: "1rem" }}>{w.couple}</div>
                                                <div style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                    <MapPin size={12} /> {w.location}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: "4px 10px",
                                                borderRadius: "12px",
                                                background: w.status === "Ready" ? "#f0fdf4" : "#f1f5f9",
                                                color: w.status === "Ready" ? "#10b981" : "#64748b",
                                                fontSize: "0.7rem",
                                                fontWeight: "700"
                                            }}>
                                                {w.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button style={{ marginTop: "2rem", width: "100%", padding: "0.75rem", borderRadius: "12px", background: "transparent", color: "#d4af37", border: "1px solid #d4af37", fontWeight: "700", cursor: "pointer" }}>
                                    View All Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
