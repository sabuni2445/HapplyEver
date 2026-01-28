import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithCredentials } from "../utils/api";
import { Sparkles, Mail, Lock, AlertCircle } from "lucide-react";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await loginWithCredentials(formData.email, formData.password);
      
      if (response.success && response.user) {
        // Store user info in localStorage
        localStorage.setItem("dbUser", JSON.stringify(response.user));
        localStorage.setItem("selectedRole", response.user.selectedRole);
        localStorage.setItem("dbAuthToken", response.token || "db-auth");
        
        // Navigate based on role
        const dashboardMap = {
          ADMIN: "/admin/dashboard",
          MANAGER: "/manager/dashboard",
          PROTOCOL: "/protocol/dashboard",
          ATTENDEE: "/attendee/dashboard",
        };
        
        const dashboard = dashboardMap[response.user.selectedRole] || "/";
        navigate(dashboard);
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <Sparkles size={40} color="#d4af37" />
            <h1>ElegantEvents</h1>
          </div>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={18} />
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <button
            onClick={() => navigate("/")}
            className="back-button"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}









