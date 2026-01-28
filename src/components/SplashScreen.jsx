import "./SplashScreen.css";

import { useClerk, useAuth } from "@clerk/clerk-react";

import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { Sparkles, Heart, ArrowRight } from "lucide-react";

import { useUserSync } from "../hooks/useUserSync";

export default function SplashScreen() {

  const { redirectToSignIn } = useClerk();

  const { isSignedIn, isLoaded } = useAuth();

  const navigate = useNavigate();

  const { dbUser, isSyncing } = useUserSync(); // Sync user to database

  // If already signed in, check if onboarded

  useEffect(() => {

    if (isLoaded && isSignedIn && !isSyncing) {

      // Check if user needs onboarding

      const selectedRole = dbUser?.selectedRole || localStorage.getItem("selectedRole");

      if (selectedRole) {

        // Already onboarded, go to dashboard

        const dashboardMap = {
          ADMIN: "/admin/dashboard",
          MANAGER: "/manager/dashboard",
          PROTOCOL: "/protocol/dashboard",
          ATTENDEE: "/attendee/dashboard",
          VENDOR: "/vendor/dashboard",
          USER: "/couple/dashboard",
        };

        navigate(dashboardMap[selectedRole] || "/couple/dashboard");

      } else {

        // Needs onboarding

        navigate("/onboarding");

      }

    }

  }, [isSignedIn, isLoaded, isSyncing, dbUser, navigate]);

  const handleLogin = () => {

    // Redirect to Clerk's hosted sign-in page

    redirectToSignIn({

      redirectUrl: "/onboarding", // After login, go to onboarding

    });

  };

  return (

    <div className="splash-screen">

      {/* Background Elements */}

      <div className="splash-bg-gradient"></div>

      <div className="splash-particles"></div>



      {/* Main Content */}

      <div className="splash-content">

        {/* Logo */}

        <div className="splash-logo">

          <div className="logo-icon">

            <Sparkles size={48} />

          </div>

          <h1 className="logo-text">ElegantEvents</h1>

          <p className="logo-subtitle">Where Dreams Become Reality</p>

        </div>

        {/* Welcome Message */}

        <div className="splash-message">

          <h2 className="welcome-title">Welcome to Your Wedding Journey</h2>

          <p className="welcome-description">

            Plan your perfect day with our comprehensive wedding management platform.

            From guest lists to vendor coordination, we've got you covered.

          </p>

        </div>

        {/* Login Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "400px", margin: "0 auto" }}>
          <button className="splash-login-button" onClick={handleLogin}>
            <span>Login with Clerk</span>
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => navigate("/login")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "18px 48px",
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#523c2b",
              background: "white",
              border: "2px solid #d4af37",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(212, 175, 55, 0.2)",
              transition: "all 0.3s ease",
              fontFamily: "inherit",
              width: "100%"
            }}
          >
            <span>Login Here (Manager/Protocol)</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Features Preview */}

        <div className="splash-features">

          <div className="feature-item">

            <Heart size={24} />

            <span>Guest Management</span>

          </div>

          <div className="feature-item">

            <Sparkles size={24} />

            <span>Vendor Coordination</span>

          </div>

          <div className="feature-item">

            <Heart size={24} />

            <span>Event Planning</span>

          </div>

        </div>

      </div>

      {/* Floating Hearts */}

      <div className="floating-hearts">

        {[...Array(20)].map((_, i) => (

          <div

            key={i}

            className="floating-heart"

            style={{

              left: `${Math.random() * 100}%`,

              animationDelay: `${i * 0.2}s`,

              fontSize: `${Math.random() * 20 + 16}px`,

            }}

          >

            ❤️

          </div>

        ))}

      </div>

    </div>

  );

}

