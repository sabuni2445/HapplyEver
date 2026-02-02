import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithCredentials } from "../utils/api";
import { Sparkles, Mail, Lock, AlertCircle, Heart, Calendar, Users, CheckCircle } from "lucide-react";
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

  const features = [
    { icon: Calendar, text: "Manage your wedding timeline" },
    { icon: Users, text: "Coordinate with vendors & guests" },
    { icon: Heart, text: "Create unforgettable moments" },
    { icon: CheckCircle, text: "Track every detail seamlessly" }
  ];

  return (
    <div className="login-page">
      <div className="login-split-container">
        {/* Left Side - Branding */}
        <div className="login-brand-side">
          <div className="brand-content">
            <div className="brand-logo">
              <Sparkles size={56} strokeWidth={1.5} />
              <h1>ElegantEvents</h1>
            </div>
            <p className="brand-tagline">
              Your dream wedding, perfectly orchestrated
            </p>

            <div className="features-list">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <div className="feature-icon">
                    <feature.icon size={20} />
                  </div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-side">
          <div className="form-container">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue managing your events</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>
                  <Mail size={18} />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="email"
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
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="button-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="form-footer">
              <button
                onClick={() => navigate("/")}
                className="back-link"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
