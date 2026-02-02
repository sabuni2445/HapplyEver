import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { Settings, LogOut, UserCheck, User, DollarSign, Users, MessageSquare, Calendar, Briefcase } from "lucide-react";

export default function ManagerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();
  const [hoveredPath, setHoveredPath] = useState(null);

  const menuItems = [
    { path: "/manager/dashboard", icon: UserCheck, label: "Dashboard" },
    { path: "/manager/wedding-management", icon: DollarSign, label: "Wedding Management" },
    { path: "/manager/team", icon: Users, label: "My Team" },
    { path: "/manager/missions", icon: Briefcase, label: "Mission Tracking" },
    { path: "/manager/messages", icon: MessageSquare, label: "Messages" },
    { path: "/manager/schedule", icon: Calendar, label: "Schedule" },
    { path: "/manager/profile", icon: User, label: "Profile" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.log("Clerk signout skipped or failed");
    }
    localStorage.removeItem("dbUser");
    localStorage.removeItem("selectedRole");
    localStorage.removeItem("dbAuthToken");
    navigate("/");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      width: "280px",
      // Transparent to blend with main background
      backgroundColor: "transparent",
      display: "flex",
      flexDirection: "column",
      zIndex: 9999,
      padding: "24px"
    }}>
      <div style={{
        padding: "0 12px 32px 12px",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "28px",
          color: "#d4af37",
          margin: "0 0 12px 0",
          fontWeight: "800",
          letterSpacing: "-0.5px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          ElegantEvents
        </h2>
        <div style={{
          display: "inline-block",
          padding: "6px 16px",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          borderRadius: "20px",
          border: "1px solid rgba(212, 175, 55, 0.2)",
          backdropFilter: "blur(10px)"
        }}>
          <span style={{
            color: "#d4af37",
            fontSize: "12px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            Manager
          </span>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isHovered = hoveredPath === item.path;

          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(null)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 20px",
                borderRadius: "16px",
                cursor: "pointer",
                backgroundColor: isActive
                  ? "#d4af37"
                  : (isHovered ? "rgba(255, 255, 255, 0.6)" : "transparent"),
                color: isActive ? "#ffffff" : (isHovered ? "#523c2b" : "#6b7280"),
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isHovered && !isActive ? "translateX(4px)" : "none",
                boxShadow: isActive
                  ? "0 10px 25px -5px rgba(212, 175, 55, 0.4)"
                  : (isHovered ? "0 4px 12px rgba(0,0,0,0.05)" : "none"),
                position: "relative",
                overflow: "hidden"
              }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                style={{
                  minWidth: "22px",
                  transition: "all 0.3s ease",
                }}
              />
              <span style={{
                marginLeft: "14px",
                fontSize: "15px",
                fontWeight: isActive ? "600" : "500",
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: "0.3px"
              }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ paddingTop: "24px" }}>
        <button
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#fff";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
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
            padding: "14px 16px",
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            color: "#ef4444",
            border: "1px solid rgba(239, 68, 68, 0.1)",
            borderRadius: "16px",
            fontSize: "15px",
            fontWeight: "600",
            fontFamily: "'Montserrat', sans-serif",
            cursor: "pointer",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)"
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
