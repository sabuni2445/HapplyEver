import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import { getManagerAssignments, getTasksByWedding, getUsersByRole } from "../../utils/api";
import { Briefcase, Clock, CheckCircle, XCircle, User, Heart } from "lucide-react";

export default function ManagerMissions() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        if (clerkUserId) {
            setUserId(clerkUserId);
        }
    }, [clerkUserId]);

    useEffect(() => {
        if (userId) {
            loadData();
        }
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const assignments = await getManagerAssignments(userId);

            if (assignments && assignments.length > 0) {
                const allTasksPromises = assignments.map(a => getTasksByWedding(a.weddingId));
                const allTasksResults = await Promise.all(allTasksPromises);

                const flattenedTasks = allTasksResults.flat().filter(t => t.assignedRole === "PROTOCOL");
                setTasks(flattenedTasks);
            }
        } catch (error) {
            console.error("Error loading missions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENDING_ACCEPTANCE': return { bg: '#fef3c7', text: '#d97706', label: 'PENDING', icon: Clock };
            case 'ACCEPTED': return { bg: '#dcfce7', text: '#16a34a', label: 'ACCEPTED', icon: CheckCircle };
            case 'REJECTED': return { bg: '#fee2e2', text: '#dc2626', label: 'REJECTED', icon: XCircle };
            case 'COMPLETED': return { bg: '#d1fae5', text: '#059669', label: 'COMPLETED', icon: CheckCircle };
            default: return { bg: '#f3f4f6', text: '#6b7280', label: status, icon: Briefcase };
        }
    };

    return (
        <div className="manager-dashboard">
            <ManagerSidebar />
            <div className="dashboard-content">
                <div className="content-wrapper">
                    <div className="welcome-section" style={{ marginBottom: "2.5rem" }}>
                        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>Mission Manifest</h1>
                        <p className="page-subtitle" style={{ fontSize: "1.1rem", color: "#7a5d4e" }}>
                            Track the status of all missions assigned to protocol officers.
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "4rem" }}>Loading missions...</div>
                    ) : tasks.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: "center", padding: "4rem", background: "white", borderRadius: "20px", border: "1px dashed #d4af37" }}>
                            <Briefcase size={64} color="#fdf6f0" style={{ marginBottom: "1rem" }} />
                            <h3 style={{ color: "#523c2b" }}>No missions assigned yet</h3>
                            <p style={{ color: "#7a5d4e" }}>Assigned missions will appear here for tracking.</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "1.5rem" }}>
                            {tasks.map((task) => {
                                const styles = getStatusStyles(task.status);
                                const StatusIcon = styles.icon;
                                return (
                                    <div key={task.id} style={{
                                        background: "white",
                                        borderRadius: "20px",
                                        padding: "1.75rem",
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                                        border: "1px solid rgba(212, 175, 55, 0.1)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "1.25rem",
                                        position: "relative",
                                        overflow: "hidden"
                                    }}>
                                        <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: styles.text }}></div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                                    <span style={{
                                                        background: "#fdf6f0",
                                                        color: "#d4af37",
                                                        padding: "4px 10px",
                                                        borderRadius: "6px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: "700"
                                                    }}>
                                                        {task.category || "GENERAL"}
                                                    </span>
                                                    <div style={{ color: "#64748b", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                        <Heart size={14} color="#d4af37" />
                                                        {task.wedding?.partnersName || `Wedding #${task.weddingId}`}
                                                    </div>
                                                </div>
                                                <h3 style={{ margin: 0, color: "#523c2b", fontSize: "1.25rem", fontFamily: "Playfair Display" }}>{task.title}</h3>
                                            </div>
                                            <div style={{
                                                padding: "6px 14px",
                                                borderRadius: "20px",
                                                fontSize: "0.75rem",
                                                fontWeight: "800",
                                                background: styles.bg,
                                                color: styles.text,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                textTransform: "uppercase"
                                            }}>
                                                <StatusIcon size={14} />
                                                {styles.label}
                                            </div>
                                        </div>

                                        <p style={{ margin: 0, color: "#7a5d4e", fontSize: "0.95rem", lineHeight: "1.6" }}>
                                            {task.description}
                                        </p>

                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingTop: "1.25rem",
                                            borderTop: "1px solid #f1f5f9",
                                            marginTop: "auto"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px" }}>
                                                    <User size={18} color="#64748b" />
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>ASSIGNED OFFICER</p>
                                                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#1e293b", fontWeight: "700" }}>
                                                        {task.assignedProtocol?.firstName} {task.assignedProtocol?.lastName}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>DUE BY</p>
                                                <p style={{ margin: 0, fontSize: "0.9rem", color: "#1e293b", fontWeight: "700" }}>
                                                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        {task.status === "REJECTED" && task.rejectionReason && (
                                            <div style={{
                                                background: "#fff1f2",
                                                padding: "1rem",
                                                borderRadius: "12px",
                                                border: "1px solid #fee2e2",
                                                marginTop: "0.5rem"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626", marginBottom: "0.25rem" }}>
                                                    <XCircle size={16} />
                                                    <strong style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>Rejection Reason</strong>
                                                </div>
                                                <p style={{ margin: 0, fontSize: "0.9rem", color: "#991b1b" }}>{task.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
