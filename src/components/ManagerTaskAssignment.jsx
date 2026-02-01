import { useState, useEffect } from "react";
import { createTask, getUsersByRole, getManagerAssignments, getTasksByWedding } from "../utils/api";
import { Briefcase, X } from "lucide-react";

const STANDARD_TASKS = [
    "Guest Welcoming",
    "QR Code Check-in",
    "Table Assistance",
    "VIP Escort",
    "Gift Table Supervision",
    "Ceremony Seating",
    "Cocktail Hour Support",
    "Vendor Coordination",
    "Emergency Point of Contact"
];

export default function ManagerTaskAssignment({ managerId }) {
    const [assignments, setAssignments] = useState([]);
    const [protocols, setProtocols] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [selectedWeddingId, setSelectedWeddingId] = useState("");
    const [selectedTask, setSelectedTask] = useState("");
    const [customTask, setCustomTask] = useState("");
    const [selectedProtocolId, setSelectedProtocolId] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");

    useEffect(() => {
        loadData();
    }, [managerId]);

    const loadData = async () => {
        try {
            const [myAssignments, protocolUsers] = await Promise.all([
                getManagerAssignments(managerId),
                getUsersByRole("PROTOCOL")
            ]);
            setAssignments(myAssignments || []);
            setProtocols(protocolUsers || []);

            // Fetch tasks for all managed weddings
            if (myAssignments && myAssignments.length > 0) {
                const allTasksPromises = myAssignments.map(a => getTasksByWedding(a.weddingId));
                const allTasksResults = await Promise.all(allTasksPromises);

                // Flatten and filter for PROTOCOL assigned tasks
                const flattenedTasks = allTasksResults.flat().filter(t => t.assignedRole === "PROTOCOL");
                setTasks(flattenedTasks);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();

        if (!selectedWeddingId || !selectedProtocolId || (!selectedTask && !customTask)) {
            alert("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            const taskTitle = selectedTask === "Other" ? customTask : selectedTask;
            const taskDescription = description || taskTitle;

            // Convert datetime-local to ISO string, or use default 7 days from now
            let taskDueDate;
            if (dueDate) {
                taskDueDate = new Date(dueDate).toISOString();
            } else {
                taskDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            }

            console.log("Creating task with:", {
                weddingId: parseInt(selectedWeddingId),
                title: taskTitle,
                description: taskDescription,
                category: "GENERAL",
                assignedRole: "PROTOCOL",
                assignedProtocolId: parseInt(selectedProtocolId),
                dueDate: taskDueDate
            });

            await createTask(
                parseInt(selectedWeddingId), // Ensure it's a number
                taskTitle,
                taskDescription,
                "GENERAL", // Category hidden from UI
                "PROTOCOL",
                parseInt(selectedProtocolId), // Ensure it's a number
                taskDueDate
            );

            alert("Task assigned successfully!");

            // Reset form
            setSelectedWeddingId("");
            setSelectedTask("");
            setCustomTask("");
            setSelectedProtocolId("");
            setDescription("");
            setDueDate("");
            setShowForm(false);

            // Refresh tracking list
            loadData();
        } catch (error) {
            console.error("Error assigning task:", error);
            console.error("Error response:", error.response?.data);
            alert(`Failed to assign task: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENDING_ACCEPTANCE': return { bg: '#fef3c7', text: '#d97706', label: 'PENDING' };
            case 'ACCEPTED': return { bg: '#dcfce7', text: '#16a34a', label: 'ACCEPTED' };
            case 'REJECTED': return { bg: '#fee2e2', text: '#dc2626', label: 'REJECTED' };
            case 'COMPLETED': return { bg: '#d1fae5', text: '#059669', label: 'COMPLETED' };
            default: return { bg: '#f3f4f6', text: '#6b7280', label: status };
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ marginBottom: "2rem" }}>
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        width: "100%",
                        padding: "1.5rem",
                        background: "linear-gradient(135deg, #ffffff 0%, #fdf6f0 100%)",
                        border: "2px dashed #d4af37",
                        borderRadius: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                        color: "#523c2b",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                        transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #fdf6f0 0%, #f8ede0 100%)";
                        e.currentTarget.style.borderColor = "#b8962e";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 0%, #fdf6f0 100%)";
                        e.currentTarget.style.borderColor = "#d4af37";
                    }}
                >
                    <Briefcase size={24} color="#d4af37" />
                    Assign Task to Protocol Officer
                </button>
            ) : (
                <div style={{
                    background: "white",
                    borderRadius: "20px",
                    padding: "2rem",
                    border: "2px solid #d4af37",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h3 style={{ margin: 0, fontFamily: "Playfair Display", color: "#523c2b", fontSize: "1.5rem" }}>
                            Assign Mission
                        </h3>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{ background: "none", border: "none", cursor: "pointer" }}
                        >
                            <X size={24} color="#6b7280" />
                        </button>
                    </div>

                    <form onSubmit={handleAssign} style={{ display: "grid", gap: "1.25rem" }}>
                        {/* Wedding Selection */}
                        <div>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#523c2b" }}>
                                Select Wedding *
                            </label>
                            <select
                                value={selectedWeddingId}
                                onChange={(e) => setSelectedWeddingId(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "1rem"
                                }}
                            >
                                <option value="">Choose a wedding...</option>
                                {assignments.map((assignment) => (
                                    <option key={assignment.weddingId} value={assignment.weddingId}>
                                        {assignment.wedding?.partnersName || `Wedding #${assignment.weddingId}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Task Selection */}
                        <div>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#523c2b" }}>
                                Select Task *
                            </label>
                            <select
                                value={selectedTask}
                                onChange={(e) => setSelectedTask(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "1rem"
                                }}
                            >
                                <option value="">Choose a task...</option>
                                {STANDARD_TASKS.map((task) => (
                                    <option key={task} value={task}>{task}</option>
                                ))}
                                <option value="Other">Other (Custom)</option>
                            </select>
                        </div>

                        {/* Custom Task Input */}
                        {selectedTask === "Other" && (
                            <div>
                                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#523c2b" }}>
                                    Custom Task Name *
                                </label>
                                <input
                                    type="text"
                                    value={customTask}
                                    onChange={(e) => setCustomTask(e.target.value)}
                                    placeholder="Enter custom task name"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "10px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "1rem"
                                    }}
                                />
                            </div>
                        )}

                        {/* Protocol Officer Selection */}
                        <div>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#523c2b" }}>
                                Assign To Protocol Officer *
                            </label>
                            <select
                                value={selectedProtocolId}
                                onChange={(e) => setSelectedProtocolId(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "1rem"
                                }}
                            >
                                <option value="">Choose an officer...</option>
                                {protocols.map((protocol) => (
                                    <option key={protocol.id} value={protocol.id}>
                                        {protocol.firstName} {protocol.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#523c2b" }}>
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Specific instructions..."
                                rows={3}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "1rem",
                                    resize: "vertical"
                                }}
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#523c2b" }}>
                                Due Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "1rem"
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: "1rem",
                                background: submitting ? "#9ca3af" : "#d4af37",
                                color: "white",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "1.1rem",
                                fontWeight: "600",
                                cursor: submitting ? "not-allowed" : "pointer",
                                transition: "all 0.3s ease"
                            }}
                        >
                            {submitting ? "Assigning..." : "Assign Mission"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
