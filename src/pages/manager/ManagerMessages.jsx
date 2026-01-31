import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import { MessageSquare, Send, User, Search } from "lucide-react";
import { getInbox, getConversation, sendMessage, getUserByClerkId } from "../../utils/api";
import "../admin/AdminDashboard.css";

export default function ManagerMessages() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Sync auth
    useEffect(() => {
        const dbUserStr = localStorage.getItem("dbUser");
        if (dbUserStr) {
            try {
                const dbUser = JSON.parse(dbUserStr);
                if (dbUser.clerkId) {
                    setUserId(dbUser.clerkId);
                    return;
                }
            } catch (e) { }
        }
        if (clerkUserId) setUserId(clerkUserId);
    }, [clerkUserId]);

    // Load Inbox
    useEffect(() => {
        if (userId) {
            loadInbox();
            const interval = setInterval(loadInbox, 5000); // Poll for new messages
            return () => clearInterval(interval);
        } else {
            setIsLoading(false);
        }
    }, [userId]);

    // Load Conversation
    useEffect(() => {
        if (userId && activeChat) {
            loadConversation(activeChat.user.clerkId);
            const interval = setInterval(() => loadConversation(activeChat.user.clerkId), 3000);
            return () => clearInterval(interval);
        }
    }, [userId, activeChat]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadInbox = async () => {
        try {
            const msgs = await getInbox(userId);
            // Group messages by other user
            const grouped = {};
            msgs.forEach(m => {
                const other = m.sender.clerkId === userId ? m.receiver : m.sender;
                if (!grouped[other.clerkId]) {
                    grouped[other.clerkId] = {
                        user: other,
                        lastMessage: m,
                        unreadCount: (!m.read && m.receiver.clerkId === userId) ? 1 : 0
                    };
                } else {
                    // Assuming inbox returns latest first, so first one is correct lastMessage
                    // Accumulate unread (mock logic as inbox query is complex for counting)
                    if (!m.read && m.receiver.clerkId === userId) {
                        grouped[other.clerkId].unreadCount++;
                    }
                }
            });
            setConversations(Object.values(grouped));
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to load inbox:", error);
            setIsLoading(false);
        }
    };

    const loadConversation = async (otherUserId) => {
        try {
            const msgs = await getConversation(userId, otherUserId);
            setMessages(msgs);
        } catch (error) {
            console.error("Failed to load conversation:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChat) return;

        try {
            const sent = await sendMessage(userId, activeChat.user.clerkId, newMessage);
            setMessages([...messages, sent]);
            setNewMessage("");
        } catch (error) {
            alert("Failed to send message");
        }
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="admin-dashboard">
                <ManagerSidebar />
                <div className="dashboard-content">
                    <p>Loading Messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <ManagerSidebar />
            <div className="dashboard-content">
                <div className="content-wrapper">
                    <h1 className="page-title">Messages</h1>
                    <p className="page-subtitle">Communicate with couples and your team</p>

                    <div className="section-card" style={{ height: "600px", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
                        <div style={{ display: "flex", flex: 1, height: "100%" }}>
                            {/* Conversations List */}
                            <div style={{ width: "320px", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
                                <div style={{ padding: "1.5rem", borderBottom: "1px solid #f3f4f6" }}>
                                    <div style={{ position: "relative" }}>
                                        <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                                        <input
                                            type="text"
                                            placeholder="Search conversations..."
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                                                borderRadius: "12px",
                                                border: "1px solid #e5e7eb",
                                                backgroundColor: "#f9fafb",
                                                outline: "none"
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="conversations-list" style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
                                    {conversations.length === 0 ? (
                                        <p style={{ textAlign: "center", color: "#9ca3af", marginTop: "2rem" }}>No messages yet</p>
                                    ) : (
                                        conversations.map(c => (
                                            <div
                                                key={c.user.clerkId}
                                                onClick={() => setActiveChat(c)}
                                                style={{
                                                    padding: "1rem",
                                                    borderRadius: "12px",
                                                    background: activeChat?.user.clerkId === c.user.clerkId ? "#fdf6f0" : "transparent",
                                                    marginBottom: "0.25rem",
                                                    cursor: "pointer",
                                                    transition: "background 0.2s"
                                                }}
                                                className="conversation-item"
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                                    <span style={{ fontWeight: "600", color: "#1f2937" }}>{c.user.firstName} {c.user.lastName}</span>
                                                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{formatTime(c.lastMessage.sentAt)}</span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontSize: "0.85rem", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                                                        {c.lastMessage.sender.clerkId === userId ? "You: " : ""}{c.lastMessage.content}
                                                    </span>
                                                    {c.unreadCount > 0 && <span style={{ background: "#d4af37", color: "white", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", fontWeight: "700" }}>{c.unreadCount}</span>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
                                {activeChat ? (
                                    <>
                                        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "#fff" }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "1rem" }}>{activeChat.user.firstName} {activeChat.user.lastName}</h3>
                                                <span style={{ fontSize: "0.8rem", color: "#10b981" }}>Active Now</span>
                                            </div>
                                        </div>

                                        <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", background: "#f9fafb", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            {messages.map((msg, index) => (
                                                <div
                                                    key={msg.id || index}
                                                    style={{
                                                        alignSelf: msg.sender.clerkId === userId ? "flex-end" : "flex-start",
                                                        maxWidth: "70%",
                                                    }}
                                                >
                                                    <div style={{
                                                        padding: "1rem",
                                                        background: msg.sender.clerkId === userId ? "#d4af37" : "white",
                                                        color: msg.sender.clerkId === userId ? "white" : "#1f2937",
                                                        borderRadius: msg.sender.clerkId === userId ? "12px 12px 0 12px" : "12px 12px 12px 0",
                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                                        fontSize: "0.95rem",
                                                        lineHeight: "1.4"
                                                    }}>
                                                        {msg.content}
                                                    </div>
                                                    <div style={{
                                                        fontSize: "0.7rem",
                                                        color: "#9ca3af",
                                                        marginTop: "4px",
                                                        textAlign: msg.sender.clerkId === userId ? "right" : "left"
                                                    }}>
                                                        {formatTime(msg.sentAt)}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        <div style={{ padding: "1.5rem", borderTop: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
                                            <div style={{ display: "flex", gap: "1rem" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Type your message..."
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                    style={{
                                                        flex: 1,
                                                        padding: "0.85rem",
                                                        borderRadius: "12px",
                                                        border: "1px solid #d1d5db",
                                                        backgroundColor: "#f9fafb",
                                                        outline: "none"
                                                    }}
                                                />
                                                <button
                                                    className="btn-primary"
                                                    onClick={handleSendMessage}
                                                    style={{
                                                        padding: "0 1.25rem",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        borderRadius: "12px"
                                                    }}
                                                >
                                                    <Send size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                                        <div style={{ width: "64px", height: "64px", background: "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                                            <MessageSquare size={32} />
                                        </div>
                                        <p style={{ fontSize: "1.1rem" }}>Select a conversation to start messaging</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
