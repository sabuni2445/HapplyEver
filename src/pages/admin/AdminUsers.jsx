import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllUsers, createManager, createProtocol, deleteUser, setUserPassword } from "../../utils/api";
import { UserPlus, Trash2, Edit, Search, Lock } from "lucide-react";
import "./AdminDashboard.css";

export default function AdminUsers() {
  const { userId: clerkUserId } = useAuth();
  const [userId, setUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserRole, setNewUserRole] = useState("MANAGER");
  const [isLoading, setIsLoading] = useState(true);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [passwordValue, setPasswordValue] = useState("");

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

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const usersData = await getAllUsers(userId);
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Failed to load users:", error);
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
      e.target.reset();
      loadData();
    } catch (error) {
      alert("Failed to create user: " + (error.response?.data?.error || error.message));
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

  const handleSetPassword = (user) => {
    setSelectedUserForPassword(user);
    setPasswordValue("");
    setShowSetPasswordModal(true);
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (!passwordValue || passwordValue.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      await setUserPassword(userId, selectedUserForPassword.clerkId, passwordValue);
      alert("Password set successfully!");
      setShowSetPasswordModal(false);
      setSelectedUserForPassword(null);
      setPasswordValue("");
    } catch (error) {
      alert("Failed to set password: " + (error.response?.data?.error || error.message));
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
            <h1 className="page-title">User Management</h1>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="btn-primary"
            >
              <UserPlus size={20} />
              Create User
            </button>
          </div>

          {/* Search */}
          <div className="section-card">
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <Search size={20} color="#6b7280" />
              <input
                type="text"
                placeholder="Search by name or email..."
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

          {/* Users List */}
          <div className="section-card">
            <h2>All Users ({filteredUsers.length})</h2>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.clerkId}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {user.imageUrl && (
                              <img
                                src={user.imageUrl}
                                alt={user.firstName}
                                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                              />
                            )}
                            <span>{user.firstName} {user.lastName}</span>
                          </div>
                        </td>
                        <td>{user.email || "N/A"}</td>
                        <td>
                          <span className={`role-badge role-${user.selectedRole?.toLowerCase() || "user"}`}>
                            {user.selectedRole || "USER"}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background: user.profileCompleted ? "#d1fae5" : "#fef3c7",
                            color: user.profileCompleted ? "#065f46" : "#92400e"
                          }}>
                            {user.profileCompleted ? "Active" : "Incomplete"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            {(user.selectedRole === "MANAGER" || user.selectedRole === "PROTOCOL") && (
                              <button
                                onClick={() => handleSetPassword(user)}
                                className="btn-secondary"
                                title="Set Password"
                                style={{ padding: "0.5rem" }}
                              >
                                <Lock size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.clerkId)}
                              className="btn-danger"
                              disabled={user.selectedRole === "ADMIN"}
                              title="Delete User"
                              style={{ padding: "0.5rem" }}
                            >
                              <Trash2 size={16} />
                            </button>
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

      {/* Set Password Modal */}
      {showSetPasswordModal && selectedUserForPassword && (
        <div className="modal-overlay" onClick={() => setShowSetPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Set Password for {selectedUserForPassword.firstName} {selectedUserForPassword.lastName}</h2>
            <form onSubmit={handleSubmitPassword}>
              <div className="form-group">
                <label>Password (minimum 6 characters) *</label>
                <input
                  type="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter password"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Set Password</button>
                <button type="button" onClick={() => setShowSetPasswordModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <input type="text" name="clerkId" required placeholder="user_..." />
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
                <label>Profile Image URL (optional)</label>
                <input type="text" name="imageUrl" placeholder="https://..." />
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

