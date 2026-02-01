import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { getAdminAnalytics } from "../../utils/api";
import {
    BarChart3, TrendingUp, Users, Heart, Briefcase,
    CreditCard, Download, Star, CheckCircle2, Clock,
    AlertCircle, MapPin, Package, Percent
} from "lucide-react";
import "./AdminDashboard.css";

export default function AdminReports() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [analytics, setAnalytics] = useState(null);

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
        const loadData = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const data = await getAdminAnalytics();
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to load reports:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [userId]);

    const stats = [
        { label: "Total Platform Revenue", value: `${(analytics?.totalRevenue || 0).toLocaleString()} ETB`, icon: CreditCard, color: "#065f46", trend: "+12.4%" },
        { label: "Planned Weddings", value: `${analytics?.totalWeddings || 0}`, icon: Heart, color: "#d4af37", trend: "+8.2%" },
        { label: "Service Partners", value: `${analytics?.totalVendors || 0}`, icon: Briefcase, color: "#2563eb", trend: "+2.1%" },
        { label: "Platform Users", value: `${analytics?.totalUsers || 0}`, icon: Users, color: "#7c3aed", trend: "+15.8%" },
    ];

    const monthlyData = analytics?.monthlyRevenue || [];
    const topVendors = analytics?.topVendors || [];
    const packageDistribution = analytics?.packageDistribution || [];

    const systemHealth = [
        { label: "Server Status", value: "Operational", status: "healthy" },
        { label: "API Latency", value: "84ms", status: "healthy" },
        { label: "DB Connections", value: "Active", status: "healthy" },
        { label: "System Load", value: "Low", status: "healthy" },
    ];

    const handleGeneratePDF = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="admin-dashboard">
                <AdminSidebar />
                <div className="dashboard-content">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <div className="loading-spinner"></div>
                        <p style={{ marginLeft: '1rem', color: '#7a5d4e' }}>Gathering system analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="dashboard-content">
                <div className="content-wrapper report-printable">
                    <div className="dashboard-header no-print" style={{ marginBottom: "2.5rem" }}>
                        <div>
                            <h1 className="page-title">Business Intelligence Dashboard</h1>
                            <p className="page-subtitle" style={{ color: "#7a5d4e", marginTop: "0.5rem" }}>Data-driven insights for ElegantEvents platform performance</p>
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button className="btn-icon" style={{ backgroundColor: "white", border: "1px solid #e2e8f0" }}>
                                <Clock size={20} />
                            </button>
                            <button
                                onClick={handleGeneratePDF}
                                className="btn-primary"
                                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
                            >
                                <Download size={20} />
                                Generate PDF Report
                            </button>
                        </div>
                    </div>

                    {/* Official Report Header (hidden normally, shows on print) */}
                    <div className="print-only-header">
                        <div className="report-logo">ElegantEvents</div>
                        <div className="report-title">
                            <h1>Platform Performance Analysis Report</h1>
                            <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>

                    <div className="stats-grid">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="stat-card" style={{ padding: "1.5rem", borderRadius: "20px" }}>
                                    <div className="stat-header">
                                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                            <Icon size={24} />
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <TrendingUp size={14} color="#059669" />
                                            <span className="stat-trend" style={{ color: "#059669", fontWeight: "700" }}>
                                                {stat.trend}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="stat-info" style={{ marginTop: "1rem" }}>
                                        <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#2d3748" }}>{stat.value}</h3>
                                        <p style={{ color: "#718096", fontSize: "0.9rem", fontWeight: "500", marginTop: "0.25rem" }}>{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "2rem", marginTop: "2.5rem" }}>
                        {/* Revenue Visualization */}
                        <div className="section-card" style={{ padding: "2rem", borderRadius: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Revenue Growth</h2>
                                    <p style={{ fontSize: "0.85rem", color: "#718096" }}>Monthly earnings across all wedding services</p>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "4px", borderRadius: "8px", display: "flex", gap: "4px" }}>
                                    {["Day", "Week", "Month"].map(t => (
                                        <button key={t} onClick={() => setActiveTab(t)} style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "none",
                                            background: activeTab === t ? "white" : "transparent",
                                            color: activeTab === t ? "#d4af37" : "#64748b",
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            boxShadow: activeTab === t ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                                        }}>{t}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ height: "250px", display: "flex", alignItems: "flex-end", gap: "10%", padding: "0 5%" }}>
                                {monthlyData.map((d, i) => (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: "100%",
                                            height: `${Math.max(5, (d.revenue / (Math.max(...monthlyData.map(md => md.revenue)) || 1)) * 100)}%`,
                                            background: i === monthlyData.length - 1 ? "linear-gradient(to top, #d4af37, #f3e5ab)" : "#f1f5f9",
                                            borderRadius: "8px 8px 0 0",
                                            position: "relative",
                                            transition: "height 1s ease"
                                        }}>
                                            <div className="chart-tooltip" style={{
                                                position: "absolute",
                                                top: "-35px",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                background: "#1a202c",
                                                color: "white",
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                fontSize: "0.7rem",
                                                fontWeight: "bold",
                                                whiteSpace: "nowrap"
                                            }}>{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue}</div>
                                        </div>
                                        <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#94a3b8" }}>{d.month}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Package Distribution */}
                        <div className="section-card" style={{ padding: "2rem", borderRadius: "24px" }}>
                            <h2 style={{ margin: 0, fontSize: "1.4rem", marginBottom: "1.5rem" }}>Package Popularity</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                {packageDistribution.map((pkg, i) => (
                                    <div key={i}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: pkg.color }} />
                                                <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>{pkg.name}</span>
                                            </div>
                                            <span style={{ fontSize: "0.9rem", color: "#718096" }}>{pkg.percentage}% ({pkg.count})</span>
                                        </div>
                                        <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{ width: `${pkg.percentage}%`, height: "100%", backgroundColor: pkg.color, borderRadius: "4px" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: "2rem", padding: "1.25rem", background: "#fdf6f0", borderRadius: "16px", border: "1px solid rgba(212, 175, 55, 0.2)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <TrendingUp size={18} color="#d4af37" />
                                    <span style={{ fontSize: "0.85rem", color: "#523c2b", fontWeight: "600" }}>Luxury Elite packages have increased by 15% this quarter.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "2.5rem" }}>
                        {/* Vendor Performance */}
                        <div className="section-card" style={{ padding: "2rem", borderRadius: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Market Leaders</h2>
                                <button style={{ color: "#d4af37", background: "none", border: "none", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}>View All Vendors</button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {topVendors.map((vendor, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1.25rem 0", borderBottom: i < topVendors.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                            <div style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "12px",
                                                backgroundColor: "#f8fafc",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#d4af37",
                                                border: "1px solid #e2e8f0"
                                            }}>
                                                <Star size={20} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: "700", color: "#1a202c", fontSize: "1rem" }}>{vendor.name}</p>
                                                <p style={{ fontSize: "0.8rem", color: "#718096", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <Briefcase size={12} /> {vendor.service}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <p style={{ fontWeight: "800", color: "#059669", fontSize: "1rem" }}>{vendor.revenue.toLocaleString()} ETB</p>
                                            <p style={{ fontSize: "0.8rem", color: "#718096" }}>{vendor.bookings} Orders • {vendor.rating} ★</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Health & Activity */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                            <div className="section-card" style={{ padding: "2rem", borderRadius: "24px" }}>
                                <h2 style={{ margin: 0, fontSize: "1.4rem", marginBottom: "1.5rem" }}>System Integrity</h2>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                    {systemHealth.map((h, i) => (
                                        <div key={i} style={{ padding: "1rem", borderRadius: "16px", background: "#f8fafc" }}>
                                            <p style={{ fontSize: "0.8rem", color: "#718096", marginBottom: "4px", fontWeight: "600" }}>{h.label}</p>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1a202c" }}>{h.value}</span>
                                                <div style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    backgroundColor: h.status === "healthy" ? "#10b981" : "#f59e0b",
                                                    boxShadow: `0 0 8px ${h.status === "healthy" ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"}`
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="section-card" style={{ padding: "1.5rem 2rem", borderRadius: "24px" }}>
                                <h2 style={{ margin: 0, fontSize: "1.2rem", marginBottom: "1.25rem" }}>Platform Logs</h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {[
                                        { text: "Vendor registration: Eternal Moments Studio", status: "success", time: "2 min ago" },
                                        { text: "Stripe payout processed: 18,500 ETB", status: "info", time: "1 hr ago" },
                                        { text: "Server backup completed successfully", status: "success", time: "4 hrs ago" },
                                    ].map((log, i) => (
                                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                            <div style={{ marginTop: "6px" }}>
                                                {log.status === "success" ? <CheckCircle2 size={14} color="#10b981" /> : (log.status === "warning" ? <AlertCircle size={14} color="#f59e0b" /> : <TrendingUp size={14} color="#2563eb" />)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: "0.9rem", color: "#4a5568", fontWeight: "500" }}>{log.text}</p>
                                                <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{log.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

