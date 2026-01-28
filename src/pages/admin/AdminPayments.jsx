import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { CreditCard, Search, Calendar, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import "./AdminDashboard.css";

export default function AdminPayments() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
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
                // Mock data for now as we don't have a global payments endpoint yet
                const mockPayments = [
                    { id: 1, wedding: "Abebe & Sara", amount: 50000, status: "COMPLETED", date: "2023-10-15", method: "Chapa" },
                    { id: 2, wedding: "Kebede & Tigist", amount: 25000, status: "PENDING", date: "2023-11-02", method: "Chapa" },
                    { id: 3, wedding: "Samuel & Helen", amount: 75000, status: "COMPLETED", date: "2023-09-20", method: "Chapa" },
                    { id: 4, wedding: "Dawit & Martha", amount: 15000, status: "FAILED", date: "2023-10-28", method: "Chapa" },
                ];
                setPayments(mockPayments);
                setFilteredPayments(mockPayments);
            } catch (error) {
                console.error("Failed to load payments:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [userId]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = payments.filter(payment =>
                payment.wedding?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.status?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPayments(filtered);
        } else {
            setFilteredPayments(payments);
        }
    }, [searchTerm, payments]);

    const getStatusIcon = (status) => {
        switch (status) {
            case "COMPLETED": return <CheckCircle size={14} color="#065f46" />;
            case "PENDING": return <Clock size={14} color="#92400e" />;
            case "FAILED": return <XCircle size={14} color="#991b1b" />;
            default: return null;
        }
    };

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
                        <h1 className="page-title">Payment Transactions</h1>
                    </div>

                    <div className="section-card">
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <Search size={20} color="#6b7280" />
                            <input
                                type="text"
                                placeholder="Search by wedding or status..."
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
                        <h2>All Transactions ({filteredPayments.length})</h2>
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Wedding</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                                No transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPayments.map(payment => (
                                            <tr key={payment.id}>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <CreditCard size={16} color="#d4af37" />
                                                        <span>{payment.wedding}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <DollarSign size={14} color="#065f46" />
                                                        <span style={{ fontWeight: "600" }}>{payment.amount?.toLocaleString()} ETB</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <Calendar size={14} color="#6b7280" />
                                                        <span>{new Date(payment.date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td>{payment.method}</td>
                                                <td>
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                        padding: "0.25rem 0.75rem",
                                                        borderRadius: "12px",
                                                        fontSize: "0.85rem",
                                                        fontWeight: "600",
                                                        background: payment.status === "COMPLETED" ? "#d1fae5" : (payment.status === "PENDING" ? "#fef3c7" : "#fee2e2"),
                                                        color: payment.status === "COMPLETED" ? "#065f46" : (payment.status === "PENDING" ? "#92400e" : "#991b1b"),
                                                        width: "fit-content"
                                                    }}>
                                                        {getStatusIcon(payment.status)}
                                                        <span>{payment.status}</span>
                                                    </div>
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
