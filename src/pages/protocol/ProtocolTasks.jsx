import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getUserByClerkId, getTasksByProtocol, acceptTask, rejectTask, completeTask } from "../../utils/api";
import { CheckCircle, XCircle, Clock, AlertCircle, ShieldAlert, Zap, Briefcase, ListChecks, ArrowRight, MessageSquare } from "lucide-react";
import ProtocolSidebar from "../../components/ProtocolSidebar";
import "./ProtocolDashboard.css";

export default function ProtocolTasks() {
    const { userId: clerkUserId } = useAuth();
    const [userId, setUserId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        const loadUser = async () => {
            try {
                if (clerkUserId) {
                    const userData = await getUserByClerkId(clerkUserId);
                    setUserId(userData.id);
                } else {
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        setUserId(user.id);
                    }
                }
            } catch (error) {
                console.error("Failed to load user:", error);
            }
        };
        loadUser();
    }, [clerkUserId]);

    useEffect(() => {
        if (userId) loadTasks();
    }, [userId]);

    const loadTasks = async () => {
        try {
            setIsLoading(true);
            const tasksData = await getTasksByProtocol(userId);
            setTasks(tasksData);
        } catch (error) {
            console.error("Failed to load tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (taskId) => {
        try {
            await acceptTask(taskId);
            loadTasks();
        } catch (error) {
            console.error("Failed to accept task:", error);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) return;
        try {
            await rejectTask(selectedTask.id, rejectionReason);
            setShowRejectModal(false);
            setRejectionReason("");
            setSelectedTask(null);
            loadTasks();
        } catch (error) {
            console.error("Failed to reject task:", error);
        }
    };

    const handleComplete = async (taskId) => {
        try {
            await completeTask(taskId);
            loadTasks();
        } catch (error) {
            console.error("Failed to complete task:", error);
        }
    };

    const getStatusIndicator = (status) => {
        const config = {
            PENDING_ACCEPTANCE: { color: "#f59e0b", label: "AWAITING ACTION", icon: Clock },
            ACCEPTED: { color: "#3b82f6", label: "CONFIRMED", icon: ShieldAlert },
            IN_PROGRESS: { color: "#8b5cf6", label: "ACTIVE", icon: Zap },
            COMPLETED: { color: "#10b981", label: "SECURED", icon: CheckCircle },
            REJECTED: { color: "#ef4444", label: "DECLINED", icon: XCircle }
        };
        const s = config[status] || config.PENDING_ACCEPTANCE;
        const Icon = s.icon;
        return (
            <div className="status-indicator-modern" style={{ borderColor: s.color, color: s.color }}>
                <Icon size={14} />
                <span>{s.label}</span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="protocol-dashboard">
                <ProtocolSidebar />
                <div className="dashboard-content">
                    <div className="loading-container">
                        <div className="modern-spinner"></div>
                        <p>Synchronizing operational data...</p>
                    </div>
                </div>
            </div>
        );
    }

    const pending = tasks.filter(t => t.status === "PENDING_ACCEPTANCE");
    const active = tasks.filter(t => t.status === "ACCEPTED" || t.status === "IN_PROGRESS");
    const history = tasks.filter(t => t.status === "COMPLETED" || t.status === "REJECTED");

    return (
        <div className="protocol-dashboard dark-theme">
            <ProtocolSidebar />
            <div className="dashboard-content">
                <div className="content-wrapper">
                    <header className="page-header-modern">
                        <div>
                            <h1 className="page-title">Mission Manifest</h1>
                            <p className="page-subtitle">Tactical task management and deployment tracking</p>
                        </div>
                        <div className="header-actions">
                            <span className="live-status"><span className="dot pulse"></span> NETWORK ACTIVE</span>
                        </div>
                    </header>

                    <div className="task-intel-grid">
                        <div className="intel-card">
                            <div className="intel-icon"><AlertCircle /></div>
                            <div className="intel-data">
                                <h3>{pending.length}</h3>
                                <span>Awaiting Deployment</span>
                            </div>
                        </div>
                        <div className="intel-card">
                            <div className="intel-icon active"><Zap /></div>
                            <div className="intel-data">
                                <h3>{active.length}</h3>
                                <span>In Active Operation</span>
                            </div>
                        </div>
                        <div className="intel-card">
                            <div className="intel-icon secured"><CheckCircle /></div>
                            <div className="intel-data">
                                <h3>{history.length}</h3>
                                <span>Secured Objectives</span>
                            </div>
                        </div>
                    </div>

                    <div className="mission-columns">
                        {/* Column 1: Pending Acceptance */}
                        <div className="mission-column">
                            <div className="column-header">
                                <Clock size={18} />
                                <h2>Deployment Requests</h2>
                                <span className="count-badge">{pending.length}</span>
                            </div>
                            <div className="task-stack">
                                {pending.map(task => (
                                    <div key={task.id} className="task-card-modern urgent">
                                        <div className="card-top">
                                            {getStatusIndicator(task.status)}
                                            <span className="category-label">{task.category}</span>
                                        </div>
                                        <h4>{task.title}</h4>
                                        <p className="task-wedding-name" style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                                            Wedding: {task.wedding?.partnersName || 'General Operation'}
                                        </p>
                                        <p>{task.description}</p>
                                        <div className="card-footer">
                                            <div className="due-date"><Clock size={12} /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}</div>
                                            <div className="action-row">
                                                <button className="btn-accept" onClick={() => handleAccept(task.id)}>ACCEPT</button>
                                                <button className="btn-reject-mini" onClick={() => { setSelectedTask(task); setShowRejectModal(true); }}>REJECT</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {pending.length === 0 && <div className="empty-state-mini">No pending deployments</div>}
                            </div>
                        </div>

                        {/* Column 2: Active Operations */}
                        <div className="mission-column">
                            <div className="column-header">
                                <Zap size={18} color="#8b5cf6" />
                                <h2>Active Operations</h2>
                                <span className="count-badge primary">{active.length}</span>
                            </div>
                            <div className="task-stack">
                                {active.map(task => (
                                    <div key={task.id} className="task-card-modern active">
                                        <div className="card-top">
                                            {getStatusIndicator(task.status)}
                                            <span className="category-label">{task.category}</span>
                                        </div>
                                        <h4>{task.title}</h4>
                                        <p className="task-wedding-name" style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                                            Wedding: {task.wedding?.partnersName || 'General Operation'}
                                        </p>
                                        <p>{task.description}</p>
                                        <button className="btn-complete-modern" onClick={() => handleComplete(task.id)}>
                                            COMPLETE OBJECTIVE <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ))}
                                {active.length === 0 && <div className="empty-state-mini">All sectors clear</div>}
                            </div>
                        </div>

                        {/* Column 3: Secured History */}
                        <div className="mission-column">
                            <div className="column-header">
                                <ListChecks size={18} color="#10b981" />
                                <h2>Objective History</h2>
                                <span className="count-badge secured">{history.length}</span>
                            </div>
                            <div className="task-stack">
                                {history.map(task => (
                                    <div key={task.id} className={`task-card-modern secured ${task.status.toLowerCase()}`}>
                                        <div className="card-top">
                                            {getStatusIndicator(task.status)}
                                            <span className="category-label">{task.category}</span>
                                        </div>
                                        <h4>{task.title}</h4>
                                        <p className="task-wedding-name" style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                                            Wedding: {task.wedding?.partnersName || 'General Operation'}
                                        </p>
                                        {task.status === 'REJECTED' && (
                                            <div className="rejection-note">
                                                <MessageSquare size={14} />
                                                <span>{task.rejectionReason}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {history.length === 0 && <div className="empty-state-mini">Archive empty</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal remains with improved styling in CSS */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-content-modern" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Decline Deployment</h2>
                            <button onClick={() => setShowRejectModal(false)}><XCircle /></button>
                        </div>
                        <div className="modal-body">
                            <p className="mission-ref">Ref: {selectedTask?.title}</p>
                            <label>Operational Justification Required</label>
                            <textarea
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="State reason for declining this objective..."
                            />
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>BACK</button>
                                <button className="btn-confirm-reject" onClick={handleReject}>CONFIRM DECLINE</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
