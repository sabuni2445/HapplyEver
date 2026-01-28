import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import { getWeddingDetails, createOrUpdateWeddingCard, getWeddingCard } from "../../utils/api";
import WeddingCardEditor from "./WeddingCardEditor";
import { Heart, CheckCircle, Sparkles } from "lucide-react";
import "./CoupleDashboard.css";

const THEMES = [
  { id: "classic", name: "Classic Elegance", description: "Timeless and sophisticated", color: "#d4af37" },
  { id: "modern", name: "Modern Minimalist", description: "Clean and contemporary", color: "#523c2b" },
  { id: "romantic", name: "Romantic Blush", description: "Soft and dreamy", color: "#d48bb8" },
  { id: "tropical", name: "Tropical Paradise", description: "Vibrant and exotic", color: "#10b981" },
  { id: "vintage", name: "Vintage Charm", description: "Nostalgic and warm", color: "#92400e" },
  { id: "royal", name: "Royal Luxury", description: "Opulent and grand", color: "#7c3aed" },
];

export default function WeddingCardPage() {
  const { userId } = useAuth();
  const [wedding, setWedding] = useState(null);
  const [weddingCard, setWeddingCard] = useState(null);
  const [wantsDigitalCard, setWantsDigitalCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const weddingData = await getWeddingDetails(userId);
        setWedding(weddingData);
        
        const cardData = await getWeddingCard(userId);
        if (cardData) {
          setWeddingCard(cardData);
          setWantsDigitalCard(cardData.digitalCardEnabled);
          if (cardData.digitalCardEnabled) {
            setShowEditor(true);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userId]);

  const handleSaveCard = async (cardData) => {
    setIsSaving(true);
    try {
      const result = await createOrUpdateWeddingCard(userId, cardData);
      setWeddingCard(result.card);
      setWantsDigitalCard(true);
      alert("Wedding card saved successfully! QR codes will be generated for your guests.");
    } catch (error) {
      console.error("Failed to save wedding card:", error);
      alert("Failed to save wedding card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="couple-dashboard">
        <CoupleSidebar />
        <div className="dashboard-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="couple-dashboard">
        <CoupleSidebar />
        <div className="dashboard-content">
          <div className="content-wrapper">
            <h1 className="page-title">Digital Wedding Card</h1>
            <p>Please create your wedding details first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="couple-dashboard">
      <CoupleSidebar />
      <div className="dashboard-content">
        <div className="content-wrapper">
          <h1 className="page-title">Digital Wedding Card</h1>
          <p className="page-subtitle">Create a beautiful digital invitation for your guests</p>

          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <div style={{ marginBottom: "2rem" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                cursor: "pointer",
                fontSize: "1.1rem",
                color: "#523c2b"
              }}>
                <input
                  type="checkbox"
                  checked={wantsDigitalCard}
                  onChange={(e) => {
                    setWantsDigitalCard(e.target.checked);
                    setShowEditor(e.target.checked);
                  }}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <span>I want to create a digital wedding card</span>
              </label>
            </div>

            {wantsDigitalCard && showEditor && (
              <WeddingCardEditor
                wedding={wedding}
                onSave={handleSaveCard}
                initialCard={weddingCard}
              />
            )}
          </div>

          {weddingCard && weddingCard.digitalCardEnabled && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ marginBottom: "1rem", color: "#523c2b" }}>Your Wedding Card</h3>
              <p style={{ color: "#7a5d4e", marginBottom: "1rem" }}>
                Your digital wedding card has been created! Guests will receive QR codes to access their personalized cards.
              </p>
              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Theme: <strong>{THEMES.find(t => t.id === weddingCard.theme)?.name || weddingCard.theme}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

