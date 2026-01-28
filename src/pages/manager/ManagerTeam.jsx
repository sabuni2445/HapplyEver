import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import { getUsersByRole } from "../../utils/api";
import { Users, UserCheck, Mail, Phone, Shield } from "lucide-react";
import "../admin/AdminDashboard.css";

export default function ManagerTeam() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [protocols, setProtocols] = useState([]);
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
            loadData();
        } else {
            setIsLoading(false);
        }
    }, [userId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const protocolsData = await getUsersByRole("PROTOCOL");
            setProtocols(protocolsData || []);
        } catch (error) {
            console.error("Failed to load team:", error);
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="page-title">My Team</h1>
                    <p className="page-subtitle">Manage and coordinate with protocol officers</p>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <Users size={32} color="#10b981" />
                            <div>
                                <h3>{protocols.length}</h3>
                                <p>Protocol Officers</p>
                            </div>
                        </div>
                    </div>

                    <div className="section-card">
                        <h2>Protocol Officers</h2>
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Officer</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {protocols.map(p => (
                                        <tr key={p.clerkId}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <UserCheck size={20} color="#10b981" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: "600" }}>{p.firstName} {p.lastName}</div>
                                                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>@{p.username || "protocol"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                                                        <Mail size={14} color="#6b7280" /> {p.email}
                                                    </div>
                                                    {p.phoneNumber && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                                                            <Phone size={14} color="#6b7280" /> {p.phoneNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="role-badge role-protocol">Active</span>
                                            </td>
                                            <td>
                                                <button onClick={() => window.open(`mailto:${p.email}`)} className="btn-primary btn-small">
                                                    Contact
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
