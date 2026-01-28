import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { BarChart3, TrendingUp, Users, Heart, Briefcase, CreditCard, Download } from "lucide-react";
import "./AdminDashboard.css";

export default function AdminReports() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
        const loadData = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                // Simulate loading analytics data
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error("Failed to load reports:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [userId]);

    const stats = [
        { label: "Total Revenue", value: "1,250,000 ETB", icon: CreditCard, color: "#065f46", trend: "+12.5%" },
        { label: "Active Weddings", value: "48", icon: Heart, color: "#d4af37", trend: "+5.2%" },
        { label: "Total Users", value: "1,240", icon: Users, color: "#2563eb", trend: "+8.1%" },
        { label: "Vendor Services", value: "156", icon: Briefcase, color: "#7c3aed", trend: "+2.4%" },
    ];

    if (isLoading) {
        return (
            <div className="admin-dashboard">
                <AdminSidebar />
                <div className="dashboard-content">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="dashboard-content">
                <div className="content-wrapper">
                    <div className="dashboard-header">
                        <h1 className="page-title">System Analytics & Reports</h1>
                        <button className="btn-primary">
                            <Download size={20} />
                            Export Report
                        </button>
                    </div>

                    <div className="stats-grid">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="stat-card">
                                    <div className="stat-header">
                                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                            <Icon size={24} />
                                        </div>
                                        <span className="stat-trend" style={{ color: stat.trend.startsWith("+") ? "#059669" : "#dc2626" }}>
                                            {stat.trend}
                                        </span>
                                    </div>
                                    <div className="stat-info">
                                        <h3>{stat.value}</h3>
                                        <p>{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="section-card" style={{ marginTop: "2rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <h2>Monthly Growth</h2>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <select style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #d1d5db" }}>
                                    <option>Last 6 Months</option>
                                    <option>Last Year</option>
                                </select>
                            </div>
                        </div>

                        <div style={{
                            height: "300px",
                            width: "100%",
                            backgroundColor: "#f9fafb",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px dashed #d1d5db"
                        }}>
                            <div style={{ textAlign: "center", color: "#6b7280" }}>
                                <BarChart3 size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                                <p>Interactive charts will be rendered here</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "2rem" }}>
                        <div className="section-card">
                            <h2>Top Vendors</h2>
                            <div style={{ marginTop: "1rem" }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none" }}>
                                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f3f4f6" }} />
                                            <div>
                                                <p style={{ fontWeight: "600", color: "#523c2b" }}>Vendor Name {i}</p>
                                                <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Photography</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <p style={{ fontWeight: "600", color: "#065f46" }}>{(150000 / i).toLocaleString()} ETB</p>
                                            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>{15 - i} Bookings</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="section-card">
                            <h2>Recent Activity</h2>
                            <div style={{ marginTop: "1rem" }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ display: "flex", gap: "1rem", padding: "1rem 0", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none" }}>
                                        <div style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            backgroundColor: i === 1 ? "#d4af37" : (i === 2 ? "#2563eb" : "#059669"),
                                            marginTop: "6px"
                                        }} />
                                        <div>
                                            <p style={{ color: "#523c2b", fontSize: "0.95rem" }}>
                                                {i === 1 ? "New wedding registered: Abebe & Sara" : (i === 2 ? "New user joined as Vendor" : "Payment completed for Booking #123")}
                                            </p>
                                            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>{i * 2} hours ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
