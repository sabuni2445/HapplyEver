import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllWeddings } from "../../utils/api";
import { Heart, Search, Calendar, MapPin, Users } from "lucide-react";
import "./AdminDashboard.css";

export default function AdminWeddings() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [weddings, setWeddings] = useState([]);
    const [filteredWeddings, setFilteredWeddings] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
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
                const data = await getAllWeddings();
                setWeddings(data || []);
                setFilteredWeddings(data || []);
            } catch (error) {
                console.error("Failed to load weddings:", error);
                setWeddings([]);
                setFilteredWeddings([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [userId]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = weddings.filter(wedding =>
                wedding.partnersName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                wedding.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredWeddings(filtered);
        } else {
            setFilteredWeddings(weddings);
        }
    }, [searchTerm, weddings]);

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
                        <h1 className="page-title">Wedding Management</h1>
                    </div>

                    <div className="section-card">
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <Search size={20} color="#6b7280" />
                            <input
                                type="text"
                                placeholder="Search by partner name or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    fontSize: "1rem"
                                }}
                            />
                        </div>
                    </div>

                    <div className="section-card">
                        <h2>All Weddings ({filteredWeddings.length})</h2>
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Partners</th>
                                        <th>Date</th>
                                        <th>Location</th>
                                        <th>Guests</th>
                                        <th>Budget</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWeddings.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                                No weddings found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredWeddings.map(wedding => (
                                            <tr key={wedding.id}>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <Heart size={16} color="#d4af37" />
                                                        <span>{wedding.partnersName}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <Calendar size={14} color="#6b7280" />
                                                        <span>{new Date(wedding.weddingDate).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <MapPin size={14} color="#6b7280" />
                                                        <span>{wedding.location}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <Users size={14} color="#6b7280" />
                                                        <span>{wedding.guestCount}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: "600", color: "#065f46" }}>
                                                        {wedding.budget?.toLocaleString()} ETB
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
