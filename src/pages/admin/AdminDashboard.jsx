import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllUsers, getAllWeddings, assignWeddingToManager, createManager, createProtocol, deleteUser } from "../../utils/api";
import { UserPlus, Users, Calendar, Settings, Trash2, UserCheck } from "lucide-react";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { userId: clerkUserId } = useAuth();
  const [userId, setUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [managers, setManagers] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserRole, setNewUserRole] = useState("MANAGER");
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [selectedManager, setSelectedManager] = useState("");
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
    if (userId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const loadData = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [usersData, weddingsData] = await Promise.all([
        getAllUsers(userId),
        getAllWeddings()
      ]);
      setUsers(usersData || []);
      setWeddings(weddingsData || []);
      setManagers((usersData || []).filter(u => u.selectedRole === "MANAGER"));
      setProtocols((usersData || []).filter(u => u.selectedRole === "PROTOCOL"));
    } catch (error) {
      console.error("Failed to load data:", error);
      setUsers([]);
      setWeddings([]);
      setManagers([]);
      setProtocols([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      clerkId: formData.get("clerkId"),
      email: formData.get("email"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      username: formData.get("username"),
      imageUrl: formData.get("imageUrl") || "",
      password: formData.get("password") || "" // Optional password
    };

    try {
      if (newUserRole === "MANAGER") {
        await createManager(userId, userData);
      } else if (newUserRole === "PROTOCOL") {
        await createProtocol(userId, userData);
      }
      alert("User created successfully!");
      setShowCreateUserModal(false);
      loadData();
    } catch (error) {
      alert("Failed to create user: " + (error.response?.data?.error || error.message));
    }
  };

  const handleAssignWedding = async () => {
    if (!selectedWedding || !selectedManager) {
      alert("Please select both wedding and manager");
      return;
    }

    try {
      await assignWeddingToManager(selectedWedding.id, selectedManager, userId);
      alert("Wedding assigned successfully!");
      setSelectedWedding(null);
      setSelectedManager("");
      loadData();
    } catch (error) {
      alert("Failed to assign wedding: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (clerkId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(clerkId, userId);
      alert("User deleted successfully!");
      loadData();
    } catch (error) {
      alert("Failed to delete user: " + (error.response?.data?.error || error.message));
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
            <h1 className="page-title">Admin Dashboard</h1>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="btn-primary"
            >
              <UserPlus size={20} />
              Create Manager/Protocol
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <Users size={32} color="#d4af37" />
              <div>
                <h3>{users.length}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <UserCheck size={32} color="#10b981" />
              <div>
                <h3>{managers.length}</h3>
                <p>Managers</p>
              </div>
            </div>
            <div className="stat-card">
              <Settings size={32} color="#7c3aed" />
              <div>
                <h3>{protocols.length}</h3>
                <p>Protocol Officers</p>
              </div>
            </div>
            <div className="stat-card">
              <Calendar size={32} color="#ef4444" />
              <div>
                <h3>{weddings.length}</h3>
                <p>Weddings</p>
              </div>
            </div>
          </div>

          {/* Assign Wedding Section */}
          <div className="section-card">
            <h2>Assign Wedding to Manager</h2>
            <div className="assign-form">
              <select
                value={selectedWedding?.id || ""}
                onChange={(e) => {
                  const wedding = weddings.find(w => w.id === parseInt(e.target.value));
                  setSelectedWedding(wedding);
                }}
                className="form-select"
              >
                <option value="">Select Wedding</option>
                {weddings.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.partnersName} - {w.weddingDate ? new Date(w.weddingDate).toLocaleDateString() : "No date"}
                  </option>
                ))}
              </select>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="form-select"
              >
                <option value="">Select Manager</option>
                {managers.map(m => (
                  <option key={m.clerkId} value={m.clerkId}>
                    {m.firstName} {m.lastName} ({m.email})
                  </option>
                ))}
              </select>
              <button onClick={handleAssignWedding} className="btn-primary">
                Assign
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="section-card">
            <div className="section-header">
              <h2>User Management</h2>
              <div className="search-bar">
                <input type="text" placeholder="Search users..." className="form-input" />
              </div>
            </div>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.clerkId}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.imageUrl ? (
                              <img src={user.imageUrl} alt={user.firstName} />
                            ) : (
                              <div className="avatar-placeholder">{user.firstName[0]}</div>
                            )}
                          </div>
                          <div className="user-name">
                            {user.firstName} {user.lastName}
                            <span className="username">@{user.username || 'user'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.selectedRole?.toLowerCase()}`}>
                          {user.selectedRole}
                        </span>
                      </td>
                      <td>
                        <span className="status-indicator status-active">Active</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleDeleteUser(user.clerkId)}
                            className="btn-icon btn-danger"
                            disabled={user.selectedRole === "ADMIN"}
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create {newUserRole}</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Role</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                  <option value="MANAGER">Manager</option>
                  <option value="PROTOCOL">Protocol Officer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Clerk ID *</label>
                <input type="text" name="clerkId" required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" required />
              </div>
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" name="firstName" required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" name="username" />
              </div>
              <div className="form-group">
                <label>Password (Optional - can be set later)</label>
                <input type="password" name="password" placeholder="Leave empty to set later" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" onClick={() => setShowCreateUserModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

