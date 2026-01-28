import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllServices } from "../../utils/api";
import { Briefcase, Search, Tag, DollarSign, User } from "lucide-react";
import "./AdminDashboard.css";

export default function AdminServices() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
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
                const data = await getAllServices();
                setServices(data || []);
                setFilteredServices(data || []);
            } catch (error) {
                console.error("Failed to load services:", error);
                setServices([]);
                setFilteredServices([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [userId]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = services.filter(service =>
                service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredServices(filtered);
        } else {
            setFilteredServices(services);
        }
    }, [searchTerm, services]);

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
                        <h1 className="page-title">Service Management</h1>
                    </div>

                    <div className="section-card">
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <Search size={20} color="#6b7280" />
                            <input
                                type="text"
                                placeholder="Search by service name, category, or vendor..."
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
                        <h2>All Services ({filteredServices.length})</h2>
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Service Name</th>
                                        <th>Category</th>
                                        <th>Vendor</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredServices.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                                No services found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredServices.map(service => (
                                            <tr key={service.id}>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <Briefcase size={16} color="#d4af37" />
                                                        <span>{service.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <Tag size={14} color="#6b7280" />
                                                        <span>{service.category}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <User size={14} color="#6b7280" />
                                                        <span>{service.vendorName || "Unknown Vendor"}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <DollarSign size={14} color="#065f46" />
                                                        <span style={{ fontWeight: "600" }}>{service.price?.toLocaleString()} ETB</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: "0.25rem 0.75rem",
                                                        borderRadius: "12px",
                                                        fontSize: "0.85rem",
                                                        fontWeight: "600",
                                                        background: service.availabilityStatus === "AVAILABLE" ? "#d1fae5" : "#fee2e2",
                                                        color: service.availabilityStatus === "AVAILABLE" ? "#065f46" : "#991b1b"
                                                    }}>
                                                        {service.availabilityStatus}
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
