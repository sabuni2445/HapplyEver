import { useState, useEffect } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { Settings as SettingsIcon, Bell, Shield, Moon, Globe } from "lucide-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import VendorSidebar from "../../components/VendorSidebar";
import ManagerSidebar from "../../components/ManagerSidebar";
import AdminSidebar from "../../components/AdminSidebar";
import ProtocolSidebar from "../../components/ProtocolSidebar";
import "./Settings.css";

export default function Settings() {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const location = useLocation();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: "en"
  });

  // Determine role from path
  const getRole = () => {
    const path = location.pathname;
    if (path.includes("/couple/")) return "couple";
    if (path.includes("/vendor/")) return "vendor";
    if (path.includes("/manager/")) return "manager";
    if (path.includes("/admin/")) return "admin";
    if (path.includes("/protocol/")) return "protocol";
    return "couple"; // default
  };

  const role = getRole();
  const Sidebar = role === "couple" ? CoupleSidebar :
                  role === "vendor" ? VendorSidebar :
                  role === "manager" ? ManagerSidebar :
                  role === "admin" ? AdminSidebar :
                  role === "protocol" ? ProtocolSidebar : CoupleSidebar;

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = {
      emailNotifications: localStorage.getItem("setting_emailNotifications") === "true" || true,
      smsNotifications: localStorage.getItem("setting_smsNotifications") === "true" || false,
      darkMode: localStorage.getItem("setting_darkMode") === "true" || false,
      language: localStorage.getItem("setting_language") || "en"
    };
    setSettings(savedSettings);
  }, []);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(`setting_${key}`, value);
    // TODO: Save to backend when API is ready
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="settings-page" style={{ display: "flex" }}>
      <Sidebar />
      <div className="settings-container" style={{ marginLeft: role === "couple" || role === "vendor" ? "260px" : "280px", flex: 1 }}>
        <div className="settings-header">
          <h1>
            <SettingsIcon size={32} />
            Settings
          </h1>
        </div>

        <div className="settings-sections">
          {/* Notifications */}
          <div className="settings-section">
            <div className="section-header">
              <Bell size={24} color="#d4af37" />
              <h2>Notifications</h2>
            </div>
            <div className="settings-list">
              <div className="setting-item">
                <div>
                  <h3>Email Notifications</h3>
                  <p>Receive email updates about your wedding events</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div>
                  <h3>SMS Notifications</h3>
                  <p>Receive text message notifications</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange("smsNotifications", e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="settings-section">
            <div className="section-header">
              <Moon size={24} color="#d4af37" />
              <h2>Preferences</h2>
            </div>
            <div className="settings-list">
              <div className="setting-item">
                <div>
                  <h3>Dark Mode</h3>
                  <p>Toggle dark theme (coming soon)</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange("darkMode", e.target.checked)}
                    disabled
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div>
                  <h3>Language</h3>
                  <p>Select your preferred language</p>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange("language", e.target.value)}
                  className="language-select"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="settings-section">
            <div className="section-header">
              <Shield size={24} color="#d4af37" />
              <h2>Privacy & Security</h2>
            </div>
            <div className="settings-list">
              <div className="setting-item">
                <div>
                  <h3>Account Security</h3>
                  <p>Manage your account password and security settings</p>
                </div>
                <button className="btn-secondary" onClick={() => window.open("/user/security", "_blank")}>
                  Manage
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="settings-section">
            <div className="section-header">
              <Globe size={24} color="#d4af37" />
              <h2>Account</h2>
            </div>
            <div className="settings-list">
              <button className="btn-danger" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

