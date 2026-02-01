import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { QrCode, Settings, LogOut, User, CheckCircle } from "lucide-react";

export default function ProtocolSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();
  const [hoveredPath, setHoveredPath] = useState(null);

  const menuItems = [
    { path: "/protocol/dashboard", icon: QrCode, label: "Scanner" },
    { path: "/protocol/tasks", icon: CheckCircle, label: "Missions" },
    { path: "/protocol/profile", icon: User, label: "Profile" },
    { path: "/protocol/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      width: "260px",
      backgroundColor: "#ffffff",
      borderRight: "1px solid rgba(212, 175, 55, 0.2)",
      display: "flex",
      flexDirection: "column",
      zIndex: 9999,
      boxShadow: "4px 0 24px rgba(0, 0, 0, 0.02)"
    }}>
      <div style={{
        padding: "32px 24px",
        borderBottom: "1px solid rgba(212, 175, 55, 0.08)",
        background: "#ffffff"
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "26px",
          color: "#d4af37",
          margin: 0,
          fontWeight: "800",
          letterSpacing: "-0.5px"
        }}>
          ElegantEvents
        </h2>
        <div style={{
          marginTop: "8px",
          display: "inline-block",
          padding: "4px 12px",
          backgroundColor: "#fdf6f0",
          borderRadius: "20px",
          border: "1px solid rgba(212, 175, 55, 0.3)"
        }}>
          <span style={{
            color: "#d4af37",
            fontSize: "12px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            Protocol
          </span>
        </div>
      </div>

      <div style={{
        flex: 1,
        padding: "20px 16px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        background: "#ffffff"
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isHovered = hoveredPath === item.path;
          const currentColor = isActive ? "#ffffff" : (isHovered ? "#d4af37" : "#523c2b");

          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(null)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                backgroundColor: isActive
                  ? "#d4af37"
                  : (isHovered ? "#fdf6f0" : "transparent"),
                color: currentColor,
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isHovered && !isActive ? "translateX(5px)" : "none",
                boxShadow: isActive ? "0 4px 15px rgba(212, 175, 55, 0.25)" : "none",
                visibility: "visible",
                opacity: 1
              }}
            >
              <Icon
                size={20}
                color={currentColor}
                style={{
                  minWidth: "20px",
                  transition: "all 0.25s ease",
                  display: "inline-block",
                  visibility: "visible",
                  opacity: 1
                }}
              />
              <span style={{
                marginLeft: "12px",
                fontSize: "15px",
                fontWeight: isActive ? "600" : "500",
                fontFamily: "'Montserrat', sans-serif",
                display: "block",
                visibility: "visible",
                opacity: 1,
                color: "inherit"
              }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "24px 16px", borderTop: "1px solid rgba(212, 175, 55, 0.08)" }}>
        <button
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ef4444";
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fff1f2";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            width: "100%",
            padding: "12px 16px",
            backgroundColor: "#fff1f2",
            color: "#ef4444",
            border: "1px solid #fee2e2",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            fontFamily: "'Montserrat', sans-serif",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}

