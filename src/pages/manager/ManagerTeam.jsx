import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import { getUsersByRole, getProtocolStats } from "../../utils/api";
import { Users, UserCheck, Mail, Phone, Star, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import "./ManagerTeam.css";

export default function ManagerTeam() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [protocols, setProtocols] = useState([]);
    const [stats, setStats] = useState({});
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

            // Fetch stats for each protocol
            const statsMap = {};
            await Promise.all((protocolsData || []).map(async (p) => {
                try {
                    const protocolStats = await getProtocolStats(p.clerkId);
                    statsMap[p.clerkId] = protocolStats;
                } catch (e) {
                    console.error(`Failed to load stats for ${p.clerkId}`, e);
                    statsMap[p.clerkId] = { totalTasks: 0, rejectedTasks: 0, completedTasks: 0, averageRating: 0, reviewCount: 0 };
                }
            }));
            setStats(statsMap);
        } catch (error) {
            console.error("Failed to load team:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="manager-team-page">
                <ManagerSidebar />
                <div className="dashboard-content">
                    <div className="loading-container">
                        <div className="modern-spinner"></div>
                        <p>Synchronizing team performance data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="manager-team-page">
            <ManagerSidebar />
            <div className="dashboard-content">
                <div className="content-wrapper">
                    <div className="header-flex">
                        <div>
                            <h1 className="page-title">Elite Protocol Force</h1>
                            <p className="page-subtitle">Tactical performance overview and personnel management</p>
                        </div>
                        <div className="live-badge">
                            <span className="dot pulse"></span>
                            MONITORING ACTIVE
                        </div>
                    </div>

                    <div className="stats-grid-modern">
                        <div className="stat-card-modern">
                            <div className="stat-icon-wrapper blue">
                                <Users size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{protocols.length}</h3>
                                <p>Active Officers</p>
                            </div>
                        </div>
                        <div className="stat-card-modern">
                            <div className="stat-icon-wrapper gold">
                                <Star size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{
                                    Object.values(stats).length > 0
                                        ? (Object.values(stats).reduce((acc, curr) => acc + curr.averageRating, 0) / Object.values(stats).length).toFixed(1)
                                        : "0.0"
                                }</h3>
                                <p>Force Average Rating</p>
                            </div>
                        </div>
                        <div className="stat-card-modern">
                            <div className="stat-icon-wrapper green">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{Object.values(stats).reduce((acc, curr) => acc + curr.completedTasks, 0)}</h3>
                                <p>Objectives Secured</p>
                            </div>
                        </div>
                    </div>

                    <div className="protocol-performance-container">
                        <div className="section-header-modern">
                            <h2>Personnel Roster</h2>
                            <div className="filters-placeholder">Performance Analysis</div>
                        </div>

                        <div className="protocol-grid">
                            {protocols.map(p => {
                                const pStats = stats[p.clerkId] || { totalTasks: 0, rejectedTasks: 0, completedTasks: 0, averageRating: 0, reviewCount: 0 };
                                return (
                                    <div key={p.clerkId} className="protocol-scorecard">
                                        <div className="scorecard-top">
                                            <div className="officer-profile">
                                                <div className="avatar-wrapper">
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} alt={p.firstName} />
                                                    ) : (
                                                        <UserCheck size={28} color="#d4af37" />
                                                    )}
                                                </div>
                                                <div className="officer-identity">
                                                    <h4>{p.firstName} {p.lastName}</h4>
                                                    <span>@{p.username || "protocol"}</span>
                                                </div>
                                            </div>
                                            <div className="rating-badge">
                                                <Star size={16} fill="#d4af37" color="#d4af37" />
                                                {pStats.averageRating.toFixed(1)}
                                            </div>
                                        </div>

                                        <div className="scorecard-stats">
                                            <div className="mini-stat">
                                                <span className="stat-label">Tasks Rejected</span>
                                                <div className="stat-value-row">
                                                    <AlertCircle size={14} color="#ef4444" />
                                                    <span className="value rejected">{pStats.rejectedTasks}</span>
                                                </div>
                                            </div>
                                            <div className="mini-stat">
                                                <span className="stat-label">Tasks Secured</span>
                                                <div className="stat-value-row">
                                                    <CheckCircle size={14} color="#10b981" />
                                                    <span className="value completed">{pStats.completedTasks}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="performance-meter">
                                            <div className="meter-label">
                                                <span>Mission Success Rate</span>
                                                <span>{pStats.totalTasks > 0 ? Math.round((pStats.completedTasks / pStats.totalTasks) * 100) : 0}%</span>
                                            </div>
                                            <div className="meter-bar">
                                                <div
                                                    className="meter-fill"
                                                    style={{ width: `${pStats.totalTasks > 0 ? (pStats.completedTasks / pStats.totalTasks) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="scorecard-footer">
                                            <div className="contact-links">
                                                <a href={`mailto:${p.email}`} title={p.email}><Mail size={16} /></a>
                                                {p.phoneNumber && <a href={`tel:${p.phoneNumber}`} title={p.phoneNumber}><Phone size={16} /></a>}
                                            </div>
                                            <button className="btn-details" onClick={() => window.open(`mailto:${p.email}`)}>
                                                Assign New Mission
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

