import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import { MessageSquare, Send, User } from "lucide-react";
import "../admin/AdminDashboard.css";

export default function ManagerMessages() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
                    <h1 className="page-title">Messages</h1>
                    <p className="page-subtitle">Communicate with couples and your team</p>

                    <div className="section-card" style={{ height: "600px", display: "flex", flexDirection: "column", padding: 0 }}>
                        <div style={{ display: "flex", flex: 1 }}>
                            {/* Sidebar */}
                            <div style={{ width: "300px", borderRight: "1px solid #e5e7eb", padding: "1.5rem" }}>
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <input type="text" placeholder="Search conversations..." style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db" }} />
                                </div>
                                <div className="conversations-list">
                                    {[
                                        { id: 1, name: "John & Jane", lastMsg: "When is the next meeting?", time: "10:30 AM", unread: 2 },
                                        { id: 2, name: "Protocol Officer Mike", lastMsg: "QR scanner is ready.", time: "Yesterday", unread: 0 },
                                        { id: 3, name: "Sarah & Tom", lastMsg: "Thanks for the update!", time: "Monday", unread: 0 },
                                    ].map(c => (
                                        <div key={c.id} style={{ padding: "1rem", borderRadius: "12px", background: c.id === 1 ? "#fdf6f0" : "transparent", marginBottom: "0.5rem", cursor: "pointer" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                                <span style={{ fontWeight: "600" }}>{c.name}</span>
                                                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{c.time}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: "0.85rem", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>{c.lastMsg}</span>
                                                {c.unread > 0 && <span style={{ background: "#d4af37", color: "white", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", fontWeight: "700" }}>{c.unread}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                <div style={{ padding: "1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0 }}>John & Jane</h3>
                                        <span style={{ fontSize: "0.8rem", color: "#10b981" }}>Online</span>
                                    </div>
                                </div>

                                <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", background: "#f9fafb" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ alignSelf: "flex-start", maxWidth: "70%", padding: "1rem", background: "white", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                                            Hi, we wanted to check if the catering menu has been finalized?
                                        </div>
                                        <div style={{ alignSelf: "flex-end", maxWidth: "70%", padding: "1rem", background: "#d4af37", color: "white", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                                            Hello! Yes, I'm just waiting for the final confirmation from the vendor. I'll update you by this afternoon.
                                        </div>
                                        <div style={{ alignSelf: "flex-start", maxWidth: "70%", padding: "1rem", background: "white", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                                            Great, thank you!
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
                                    <div style={{ display: "flex", gap: "1rem" }}>
                                        <input type="text" placeholder="Type your message..." style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db" }} />
                                        <button className="btn-primary" style={{ padding: "0.75rem" }}>
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
