import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getGuests, sendWeddingMessage, getWeddingMessages } from "../utils/api";
import { MessageCircle, Send, Users } from "lucide-react";
import "./GuestMessaging.css";

export default function GuestMessaging({ weddingId, coupleClerkId }) {
  const { userId } = useAuth();
  const [guests, setGuests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("ALL");
  const [messageText, setMessageText] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (weddingId && coupleClerkId) {
      loadGuests();
      loadMessages();
    }
  }, [weddingId, coupleClerkId]);

  const loadGuests = async () => {
    try {
      const guestsData = await getGuests(coupleClerkId);
      setGuests(guestsData);
    } catch (error) {
      console.error("Failed to load guests:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await getWeddingMessages(weddingId);
      setMessages(messagesData);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert("Please enter a message");
      return;
    }

    setIsSending(true);
    try {
      await sendWeddingMessage({
        weddingId: weddingId,
        senderClerkId: coupleClerkId,
        senderType: "COUPLE",
        recipientType: selectedRecipient === "ALL" ? "ALL_GUESTS" : "SPECIFIC_GUEST",
        recipientGuestId: selectedRecipient !== "ALL" ? parseInt(selectedRecipient) : null,
        message: messageText,
        isBroadcast: isBroadcast || selectedRecipient === "ALL"
      });

      setMessageText("");
      setIsBroadcast(false);
      setSelectedRecipient("ALL");
      await loadMessages();
      alert("Message sent successfully!");
    } catch (error) {
      alert("Failed to send message: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="guest-messaging">
      <div className="messaging-header">
        <MessageCircle size={24} color="#d4af37" />
        <h2>Send Message to Guests</h2>
      </div>

      <div className="messaging-form">
        <div className="form-group">
          <label>Recipient</label>
          <select
            value={selectedRecipient}
            onChange={(e) => {
              setSelectedRecipient(e.target.value);
              setIsBroadcast(e.target.value === "ALL");
            }}
            className="form-select"
          >
            <option value="ALL">All Guests (Broadcast)</option>
            {guests.map(guest => (
              <option key={guest.id} value={guest.id.toString()}>
                {guest.firstName} {guest.lastName} {guest.email ? `(${guest.email})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={isBroadcast ? "e.g., See you in 10 minutes!" : "Type your message..."}
            rows="4"
            className="message-input"
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={isSending || !messageText.trim()}
          className="send-btn"
        >
          <Send size={18} />
          {isSending ? "Sending..." : "Send Message"}
        </button>
      </div>

      {/* Messages History */}
      {messages.length > 0 && (
        <div className="messages-history">
          <h3>Recent Messages</h3>
          <div className="messages-list">
            {messages.slice(0, 5).map(msg => (
              <div key={msg.id} className="message-item">
                <div className="message-header">
                  <span className="message-sender">
                    {msg.senderType === "COUPLE" ? "You" : "Guest"}
                  </span>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="message-text">{msg.message}</p>
                {msg.isBroadcast && (
                  <span className="broadcast-badge">Broadcast</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}









