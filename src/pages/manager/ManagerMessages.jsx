import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import ManagerSidebar from "../../components/ManagerSidebar";
import { MessageSquare, Send, User, Search, MoreVertical, Phone, Video, Info } from "lucide-react";
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
    const [searchQuery, setSearchQuery] = useState("");
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
            const interval = setInterval(loadInbox, 5000);
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

    const filteredConversations = conversations.filter(c =>
        `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="admin-dashboard">
                <ManagerSidebar />
                <div className="dashboard-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="loader-premium"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <ManagerSidebar />
            <div className="dashboard-content" style={{ padding: "0", background: "#f8fafc" }}>
                <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

                    {/* Conversations Sidebar */}
                    <div style={{
                        width: "380px",
                        backgroundColor: "#fff",
                        borderRight: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "10px 0 30px rgba(0,0,0,0.02)"
                    }}>
                        <div style={{ padding: "2rem 1.5rem 1.5rem" }}>
                            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#523c2b", marginBottom: "0.5rem", fontFamily: "Playfair Display" }}>Messages</h1>
                            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Communicate with couples and your team</p>

                            <div style={{ position: "relative" }}>
                                <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.85rem 1rem 0.85rem 2.8rem",
                                        borderRadius: "14px",
                                        border: "1px solid #e2e8f0",
                                        backgroundColor: "#f8fafc",
                                        outline: "none",
                                        fontSize: "0.95rem",
                                        transition: "all 0.3s ease",
                                        ":focus": { borderColor: "#d4af37", background: "#fff" }
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "0 1rem" }}>
                            {filteredConversations.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
                                    <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: "1rem" }} />
                                    <p>No conversations found</p>
                                </div>
                            ) : (
                                filteredConversations.map(c => (
                                    <div
                                        key={c.user.clerkId}
                                        onClick={() => setActiveChat(c)}
                                        style={{
                                            padding: "1.25rem 1rem",
                                            borderRadius: "16px",
                                            background: activeChat?.user.clerkId === c.user.clerkId ? "linear-gradient(135deg, #fdf6f0 0%, #fff 100%)" : "transparent",
                                            border: activeChat?.user.clerkId === c.user.clerkId ? "1px solid rgba(212, 175, 55, 0.2)" : "1px solid transparent",
                                            marginBottom: "0.5rem",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem"
                                        }}
                                        className="conv-card-premium"
                                    >
                                        <div style={{ position: "relative" }}>
                                            <div style={{
                                                width: "52px",
                                                height: "52px",
                                                borderRadius: "16px",
                                                background: "linear-gradient(135deg, #d4af37 0%, #b8962e 100%)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                                boxShadow: "0 4px 10px rgba(212, 175, 55, 0.3)"
                                            }}>
                                                <User size={24} />
                                            </div>
                                            <div style={{
                                                position: "absolute",
                                                bottom: "-2px",
                                                right: "-2px",
                                                width: "14px",
                                                height: "14px",
                                                background: "#10b981",
                                                border: "3px solid #fff",
                                                borderRadius: "50%"
                                            }}></div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
                                                <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "1rem" }}>{c.user.firstName} {c.user.lastName}</span>
                                                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{formatTime(c.lastMessage.sentAt)}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <p style={{
                                                    fontSize: "0.875rem",
                                                    color: activeChat?.user.clerkId === c.user.clerkId ? "#7a5d4e" : "#64748b",
                                                    margin: 0,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                }}>
                                                    {c.lastMessage.sender.clerkId === userId ? "You: " : ""}{c.lastMessage.content}
                                                </p>
                                                {c.unreadCount > 0 && <span style={{
                                                    background: "#d4af37",
                                                    color: "white",
                                                    fontSize: "0.7rem",
                                                    padding: "2px 8px",
                                                    borderRadius: "20px",
                                                    fontWeight: "800",
                                                    marginLeft: "0.5rem",
                                                    boxShadow: "0 2px 6px rgba(212, 175, 55, 0.4)"
                                                }}>{c.unreadCount}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Main Area */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
                        {activeChat ? (
                            <>
                                {/* Chat Header */}
                                <div style={{
                                    padding: "1.25rem 2rem",
                                    borderBottom: "1px solid #e2e8f0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                                    zIndex: 10
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "14px",
                                            background: "linear-gradient(135deg, #fdf6f0 0%, #f5e6d3 100%)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#d4af37",
                                            border: "1px solid rgba(212, 175, 55, 0.2)"
                                        }}>
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#1e293b" }}>{activeChat.user.firstName} {activeChat.user.lastName}</h3>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></div>
                                                <span style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: "600" }}>Online</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}>
                                        <button className="chat-action-btn"><Phone size={20} /></button>
                                        <button className="chat-action-btn"><Video size={20} /></button>
                                        <button className="chat-action-btn"><Info size={20} /></button>
                                        <button className="chat-action-btn"><MoreVertical size={20} /></button>
                                    </div>
                                </div>

                                {/* Messages Container */}
                                <div style={{
                                    flex: 1,
                                    padding: "2rem",
                                    overflowY: "auto",
                                    background: "#f8fafc",
                                    backgroundImage: "radial-gradient(#d4af37 0.5px, transparent 0.5px)",
                                    backgroundSize: "30px 30px",
                                    backgroundOpacity: "0.05",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1.25rem"
                                }}>
                                    {messages.map((msg, index) => (
                                        <div
                                            key={msg.id || index}
                                            style={{
                                                alignSelf: msg.sender.clerkId === userId ? "flex-end" : "flex-start",
                                                maxWidth: "65%",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: msg.sender.clerkId === userId ? "flex-end" : "flex-start"
                                            }}
                                        >
                                            <div style={{
                                                padding: "1rem 1.25rem",
                                                background: msg.sender.clerkId === userId
                                                    ? "linear-gradient(135deg, #d4af37 0%, #b8962e 100%)"
                                                    : "#fff",
                                                color: msg.sender.clerkId === userId ? "#fff" : "#1e293b",
                                                borderRadius: msg.sender.clerkId === userId ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                                                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                                                fontSize: "0.95rem",
                                                lineHeight: "1.5",
                                                position: "relative"
                                            }}>
                                                {msg.content}
                                            </div>
                                            <span style={{
                                                fontSize: "0.7rem",
                                                color: "#94a3b8",
                                                marginTop: "0.5rem",
                                                fontWeight: "600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px"
                                            }}>
                                                {formatTime(msg.sentAt)}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div style={{ padding: "1.5rem 2rem 2rem", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
                                    <div style={{
                                        display: "flex",
                                        gap: "1rem",
                                        background: "#f8fafc",
                                        padding: "0.5rem",
                                        borderRadius: "20px",
                                        border: "1px solid #e2e8f0",
                                        alignItems: "center",
                                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Type message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            style={{
                                                flex: 1,
                                                padding: "0.75rem 1rem",
                                                background: "transparent",
                                                border: "none",
                                                outline: "none",
                                                fontSize: "1rem",
                                                color: "#1e293b"
                                            }}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "16px",
                                                background: "linear-gradient(135deg, #d4af37 0%, #b8962e 100%)",
                                                color: "white",
                                                border: "none",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                transition: "all 0.3s ease",
                                                boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)"
                                            }}
                                            className="send-btn-premium"
                                        >
                                            <Send size={22} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
                                <div style={{
                                    width: "120px",
                                    height: "120px",
                                    background: "#fff",
                                    borderRadius: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#d4af37",
                                    marginBottom: "2rem",
                                    boxShadow: "0 20px 40px rgba(0,0,0,0.05)"
                                }}>
                                    <MessageSquare size={52} />
                                </div>
                                <h2 style={{ fontFamily: "Playfair Display", color: "#523c2b", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Your Inbox</h2>
                                <p style={{ color: "#64748b", fontSize: "1rem" }}>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                .conv-card-premium:hover {
                    background: #fdf6f0 !important;
                    transform: translateX(5px);
                }
                .chat-action-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: transparent;
                    border: 1px solid #f1f5f9;
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .chat-action-btn:hover {
                    background: #f8fafc;
                    color: #d4af37;
                    border-color: #d4af37;
                }
                .send-btn-premium:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 15px rgba(212, 175, 55, 0.4);
                }
                .loader-premium {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f4f6;
                    border-top: 3px solid #d4af37;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
