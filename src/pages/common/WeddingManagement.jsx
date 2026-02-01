import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getWeddingDetails, getAssignmentByWedding, getUserByClerkId, getUsersByRole, getCoupleBookings, getServiceById, initializeChapaPayment, getWeddingById, getPaymentsByWedding, createPaymentSchedule, verifyChapaPayment, sendMessage, getTasksByWedding, createTask, updateTaskStatus, deleteTask, acceptTask, rejectTask, completeTask, getGuestsByWeddingId, completeWedding } from "../../utils/api";
import { Calendar, Video, MessageCircle, DollarSign, CheckCircle, Clock, X, MapPin, Users, RefreshCw, Briefcase, UserCheck } from "lucide-react";
import CoupleSidebar from "../../components/CoupleSidebar";
import ManagerSidebar from "../../components/ManagerSidebar";
import "./WeddingManagement.css";

export default function WeddingManagement({ role = "couple" }) {
  const { userId: clerkUserId } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const weddingIdParam = searchParams.get("weddingId");
  // Refreshed version: v2.0.5 - Ensures couple/wedding state sync

  // Get userId from Clerk or from localStorage (for DB-based login)
  const [userId, setUserId] = useState(null);
  const [wedding, setWedding] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [manager, setManager] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [couple, setCouple] = useState(null);
  const [bookedServices, setBookedServices] = useState([]);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [guests, setGuests] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", category: "GENERAL", assignedRole: "MANAGER", assignedProtocolId: null });
  const [availableProtocols, setAvailableProtocols] = useState([]);
  const [completionData, setCompletionData] = useState({ rating: 5, feedback: "" });
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showManagerInput, setShowManagerInput] = useState(false);
  const [managerMessage, setManagerMessage] = useState("");
  const [showProtocolInput, setShowProtocolInput] = useState(false);
  const [protocolMessage, setProtocolMessage] = useState("");
  const [showCoupleInput, setShowCoupleInput] = useState(false);
  const [coupleMessage, setCoupleMessage] = useState("");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  useEffect(() => {
    // Check for DB-based login user in localStorage
    const dbUserStr = localStorage.getItem("dbUser");
    if (dbUserStr) {
      try {
        const dbUser = JSON.parse(dbUserStr);
        if (dbUser.clerkId) {
          setUserId(dbUser.clerkId);
          return;
        }
      } catch (e) {
        console.error("Failed to parse dbUser:", e);
      }
    }
    // Fallback to Clerk userId
    if (clerkUserId) {
      setUserId(clerkUserId);
    }
  }, [clerkUserId]);

  // Function to refresh only payment data
  const refreshPaymentData = useCallback(async () => {
    if (!wedding?.id) return;

    try {
      console.log("Refreshing payment data for wedding:", wedding.id);
      const payments = await getPaymentsByWedding(wedding.id);
      if (payments && payments.length > 0) {
        const schedule = payments.map(p => ({
          id: p.id,
          amount: parseFloat(p.amount),
          dueDate: p.dueDate || null,
          status: p.status,
          paidAmount: p.status === "PAID" ? parseFloat(p.amount) : 0,
          paymentNumber: p.paymentNumber,
          totalPayments: p.totalPayments
        }));
        console.log("Updated payment schedule:", schedule);
        setPaymentSchedule(schedule);
      } else {
        console.log("No payments found");
      }
    } catch (error) {
      console.error("Failed to refresh payment data:", error);
    }
  }, [wedding?.id]);

  useEffect(() => {
    if (userId || (role === "manager" && weddingIdParam)) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [userId, role, weddingIdParam]);

  // Refresh payment data when returning from payment or when window regains focus
  useEffect(() => {
    if (!wedding?.id) return;

    // Check URL params for payment return indicators
    const params = new URLSearchParams(window.location.search);
    const paymentReturn = params.get('payment') === 'return' ||
      params.get('status') === 'success' ||
      params.get('tx_ref');
    const txRefParam = params.get('tx_ref') || localStorage.getItem('lastTxRef');

    const timeouts = [];

    // Always refresh payment data when component loads (in case payment was completed)
    // This ensures we get the latest status even if URL params are missing
    const handleInitialRefresh = () => {
      refreshPaymentData();
    };

    // Immediate refresh on load
    handleInitialRefresh();

    // If we have a tx_ref, try to verify directly with Chapa and refresh
    if (paymentReturn && txRefParam) {
      (async () => {
        try {
          console.log("Verifying payment via Chapa for txRef:", txRefParam);
          await verifyChapaPayment(txRefParam);
          await refreshPaymentData();
        } catch (err) {
          console.error("Verification via Chapa failed:", err);
        }
      })();
    }

    if (paymentReturn) {
      // Retry mechanism to check payment status multiple times
      // Backend callback might take a few seconds to process
      let retryCount = 0;
      const maxRetries = 6; // Increased retries

      const checkPaymentStatus = () => {
        console.log(`Checking payment status(attempt ${retryCount + 1}/${maxRetries})...`);
        refreshPaymentData();
        retryCount++;

        if (retryCount < maxRetries) {
          // Check again after increasing delays: 1s, 2s, 3s, 4s, 5s, 6s
          const delay = 1000 * retryCount;
          const timeoutId = setTimeout(checkPaymentStatus, delay);
          timeouts.push(timeoutId);
        } else {
          console.log("Finished checking payment status");
          // Clean up URL parameter after final check
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      };

      // Start checking immediately and then with delays
      checkPaymentStatus(); // First check immediately
    }

    const handleFocus = () => {
      // Reload payment data when window regains focus (user might be returning from payment)
      console.log("Window focused - refreshing payment data");
      refreshPaymentData();
    };

    const handleVisibilityChange = () => {
      // Refresh when page becomes visible (user returns from payment)
      if (!document.hidden) {
        console.log("Page visible - refreshing payment data");
        refreshPaymentData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic refresh every 10 seconds as backup (only when page is visible)
    const intervalId = setInterval(() => {
      if (!document.hidden && wedding?.id) {
        refreshPaymentData();
      }
    }, 10000); // Refresh every 10 seconds

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      // Clear all pending timeouts
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [wedding?.id, refreshPaymentData]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let weddingData;
      if (role === "couple") {
        if (!userId) {
          setIsLoading(false);
          return;
        }
        weddingData = await getWeddingDetails(userId);
        setCouple({ clerkId: userId });
      } else if (role === "manager") {
        // For managers, get weddingId from URL params
        // For managers, get weddingId from URL params
        if (!weddingIdParam) {
          console.warn("No weddingId in URL params for manager - redirecting to dashboard");
          // Use window.location as navigate might not be available consistently inside loadData if not passed
          window.location.href = "/manager/dashboard";
          return;
        }
        try {
          const weddingId = parseInt(weddingIdParam);
          if (isNaN(weddingId)) {
            console.error("Invalid weddingId:", weddingIdParam);
            window.location.href = "/manager/dashboard";
            return;
          }
          console.log("Loading wedding for manager, ID:", weddingId);
          weddingData = await getWeddingById(weddingId);
          console.log("Wedding data loaded:", weddingData);
          if (!weddingData) {
            console.error("Wedding not found for ID:", weddingId);
            setIsLoading(false);
            return;
          }
          // Set couple for manager view
          if (weddingData.clerkId) {
            setCouple({ clerkId: weddingData.clerkId });
          }
        } catch (error) {
          console.error("Error loading wedding for manager:", error);
          console.error("Error details:", error.response?.data || error.message);
          setIsLoading(false);
          return;
        }
      }

      if (!weddingData) {
        console.error("No wedding data loaded after all attempts");
        setIsLoading(false);
        return;
      }

      if (weddingData) {
        setWedding(weddingData);

        // Load assignment
        if (weddingData.id) {
          try {
            const assignmentData = await getAssignmentByWedding(weddingData.id);
            setAssignment(assignmentData);

            if (assignmentData?.managerClerkId) {
              const managerData = await getUserByClerkId(assignmentData.managerClerkId);
              setManager(managerData);
            }

            if (assignmentData?.protocolClerkId) {
              const protocolData = await getUserByClerkId(assignmentData.protocolClerkId);
              setProtocol({ ...protocolData, job: assignmentData.protocolJob });
            }

            if (role === "manager" && weddingData.clerkId) {
              const coupleData = await getUserByClerkId(weddingData.clerkId);
              setCouple(coupleData);
            }

            // Load available protocols for task assignment
            if (role === "manager") {
              try {
                const protocols = await getUsersByRole("PROTOCOL");
                setAvailableProtocols(protocols);
              } catch (error) {
                console.error("Failed to load protocols:", error);
              }
            }
          } catch (error) {
            console.error("Failed to load assignment:", error);
          }
        }

        // Load booked services
        try {
          const bookings = await getCoupleBookings(weddingData.clerkId || userId);
          const acceptedBookings = bookings.filter(b => b.status === "ACCEPTED");

          // Load service details for each booking (like vendor bookings do)
          const bookingsWithServices = await Promise.all(
            acceptedBookings.map(async (booking) => {
              try {
                const service = await getServiceById(booking.serviceId);
                return { ...booking, service };
              } catch {
                return { ...booking, service: null };
              }
            })
          );

          setBookedServices(bookingsWithServices);

          // Calculate total cost (services + 10k service charge)
          const servicesTotal = bookingsWithServices.reduce((sum, booking) => {
            return sum + (booking.service?.price || 0);
          }, 0);
          const SERVICE_CHARGE = 10000; // 10k service charge
          const totalCost = servicesTotal + SERVICE_CHARGE;

          // Load payment schedule from backend
          try {
            const payments = await getPaymentsByWedding(weddingData.id);
            if (payments && payments.length > 0) {
              // Check if we have multiple payments (old 3-payment system) - replace with single payment
              if (payments.length > 1 && totalCost > SERVICE_CHARGE && weddingData.clerkId) {
                // Replace multiple payments with single payment
                const defaultSchedule = [
                  { amount: totalCost, dueDate: null, status: "PENDING", paidAmount: 0, description: "One-Time Full Payment" }
                ];
                try {
                  const result = await createPaymentSchedule(weddingData.id, weddingData.clerkId, defaultSchedule);
                  if (result.payments && result.payments.length > 0) {
                    const schedule = result.payments.map(p => ({
                      id: p.id,
                      amount: parseFloat(p.amount),
                      dueDate: p.dueDate || null,
                      status: p.status,
                      paidAmount: p.status === "PAID" ? parseFloat(p.amount) : 0,
                      paymentNumber: p.paymentNumber,
                      totalPayments: p.totalPayments
                    }));
                    setPaymentSchedule(schedule);
                  }
                } catch (error) {
                  console.error("Failed to replace payment schedule:", error);
                  // Fallback: show existing payments if replacement fails
                  const schedule = payments.map(p => ({
                    id: p.id,
                    amount: parseFloat(p.amount),
                    dueDate: p.dueDate || null,
                    status: p.status,
                    paidAmount: p.status === "PAID" ? parseFloat(p.amount) : 0,
                    paymentNumber: p.paymentNumber,
                    totalPayments: p.totalPayments
                  }));
                  setPaymentSchedule(schedule);
                }
              } else {
                // Single payment or no need to replace - use existing payments
                const schedule = payments.map(p => ({
                  id: p.id,
                  amount: parseFloat(p.amount),
                  dueDate: p.dueDate || null,
                  status: p.status,
                  paidAmount: p.status === "PAID" ? parseFloat(p.amount) : 0,
                  paymentNumber: p.paymentNumber,
                  totalPayments: p.totalPayments
                }));
                setPaymentSchedule(schedule);
              }
            } else if (totalCost > SERVICE_CHARGE && weddingData.clerkId) {
              // Initialize single one-time payment for full amount - save to DB immediately
              const defaultSchedule = [
                { amount: totalCost, dueDate: null, status: "PENDING", paidAmount: 0, description: "One-Time Full Payment" }
              ];
              try {
                // Save payment schedule to DB
                const result = await createPaymentSchedule(weddingData.id, weddingData.clerkId, defaultSchedule);
                if (result.payments && result.payments.length > 0) {
                  // Convert backend payments to frontend format
                  const schedule = result.payments.map(p => ({
                    id: p.id,
                    amount: parseFloat(p.amount),
                    dueDate: p.dueDate || null,
                    status: p.status,
                    paidAmount: p.status === "PAID" ? parseFloat(p.amount) : 0,
                    paymentNumber: p.paymentNumber,
                    totalPayments: p.totalPayments
                  }));
                  setPaymentSchedule(schedule);
                }
              } catch (error) {
                console.error("Failed to create payment schedule:", error);
                // Fallback to local schedule if saving fails (this won't work for payments, but better than nothing)
                setPaymentSchedule(defaultSchedule.map((item, index) => ({ ...item, id: index + 1 })));
              }
            }
          } catch (error) {
            console.error("Failed to load payments:", error);
            // Don't initialize schedule on error - let user retry
          }
        } catch (error) {
          console.error("Failed to load bookings:", error);
        }

        // Load tasks and guests
        if (weddingData.id) {
          try {
            const [tasksData, guestsData] = await Promise.all([
              getTasksByWedding(weddingData.id),
              getGuestsByWeddingId(weddingData.id)
            ]);
            setTasks(tasksData || []);
            setGuests(guestsData || []);
          } catch (error) {
            console.error("Failed to load tasks/guests:", error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const SERVICE_CHARGE = 10000; // 10,000 ETB service charge

  const calculateServicesTotal = () => {
    // Redundancy check: only count unique service IDs AND only those that are ACCEPTED
    const uniqueServiceIds = new Set();
    return bookedServices.reduce((sum, booking) => {
      if (booking.status === "ACCEPTED" && booking.serviceId && !uniqueServiceIds.has(booking.serviceId)) {
        uniqueServiceIds.add(booking.serviceId);
        return sum + (booking.service?.price || 0);
      }
      return sum;
    }, 0);
  };

  const calculateTotalCost = () => {
    return calculateServicesTotal() + SERVICE_CHARGE;
  };

  const calculatePaidAmount = () => {
    return paymentSchedule.reduce((sum, payment) => sum + payment.paidAmount, 0);
  };

  const getPaymentStatus = () => {
    const total = calculateTotalCost();
    const paid = calculatePaidAmount();
    if (paid === 0) return "NOT_PAID";
    if (paid >= total) return "FULLY_PAID";
    const percentage = (paid / total) * 100;
    if (percentage >= 66) return "MOSTLY_PAID";
    if (percentage >= 33) return "PARTIALLY_PAID";
    return "MINIMAL_PAID";
  };

  if (isLoading) {
    return (
      <div className="wedding-management">
        <div className="management-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="wedding-management">
        <div className="management-content">
          <h1>Wedding Management</h1>
          <p>No wedding found. Please create wedding details first.</p>
        </div>
      </div>
    );
  }

  const totalCost = calculateTotalCost();
  const paidAmount = calculatePaidAmount();
  const remainingAmount = totalCost - paidAmount;
  const paymentStatus = getPaymentStatus();

  const Sidebar = role === "couple" ? CoupleSidebar : ManagerSidebar;

  return (
    <div className="wedding-management" style={{ display: "flex" }}>
      <Sidebar />
      <div className="management-content" style={{ marginLeft: role === "couple" ? "260px" : "280px", flex: 1 }}>
        <div className="management-header">
          <h1>Wedding Management</h1>
          <p className="subtitle">{couple?.firstName || "Your"} & {wedding.partnersName || "Partner"}'s Wedding</p>
        </div>


        {/* Payment Overview */}
        <div className="section-card">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <DollarSign size={24} color="#d4af37" />
              <h2>Payment Status</h2>
            </div>
            <button
              onClick={() => {
                console.log("Manual refresh triggered");
                refreshPaymentData();
              }}
              style={{
                padding: "0.5rem 1rem",
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem"
              }}
              title="Refresh payment status"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="budget-summary-card" style={{
            background: "linear-gradient(135deg, #d4af37 0%, #b8962e 100%)",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            color: "white",
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <DollarSign size={24} />
                <h2 style={{ margin: 0, color: "white" }}>Budget Summary</h2>
              </div>
              <button
                onClick={refreshPaymentData}
                style={{
                  padding: "0.5rem 1rem",
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  color: "white"
                }}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
              <div>
                <p style={{ opacity: 0.8, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Services Subtotal</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "600" }}>ETB {calculateServicesTotal().toLocaleString()}</p>
                <p style={{ opacity: 0.8, fontSize: "0.8rem", marginTop: "0.5rem" }}>+ ETB {SERVICE_CHARGE.toLocaleString()} Service Charge</p>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: "2rem" }}>
                <p style={{ opacity: 0.8, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Total Paid</p>
                <p style={{ fontSize: "1.8rem", fontWeight: "700" }}>ETB {paidAmount.toLocaleString()}</p>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: "2rem" }}>
                <p style={{ opacity: 0.8, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Remaining Balance</p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <p style={{ fontSize: "1.8rem", fontWeight: "700", margin: 0 }}>ETB {remainingAmount.toLocaleString()}</p>
                  {role === "couple" && remainingAmount > 0 && (
                    <button
                      onClick={async () => {
                        if (isProcessingPayment) return;
                        setIsProcessingPayment(true);
                        try {
                          const user = await getUserByClerkId(userId);
                          const txRef = `wedding-${wedding.id}-final-${Date.now()}`;
                          localStorage.setItem("lastTxRef", txRef);

                          const result = await initializeChapaPayment({
                            email: user.email,
                            firstName: user.firstName || "User",
                            lastName: user.lastName || "",
                            amount: remainingAmount,
                            txRef,
                            coupleClerkId: userId,
                            returnUrl: `${window.location.origin}/couple/wedding-management?payment=return&tx_ref=${txRef}`
                          });

                          if (result?.success && result.checkout_url) {
                            window.location.href = result.checkout_url;
                          } else {
                            alert("Failed to initialize balance payment");
                          }
                        } catch (e) {
                          console.error(e);
                          alert("Error processing balance payment");
                        } finally {
                          setIsProcessingPayment(false);
                        }
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "white",
                        color: "#d4af37",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontSize: "0.8rem"
                      }}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {role === "manager" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary"
              style={{ marginTop: "1rem" }}
            >
              Manage Payment
            </button>
          )}

          {/* Payment */}
          {paymentSchedule.length > 0 && (
            <div className="payment-schedule" style={{ marginTop: "2rem" }}>
              <h3>Payment</h3>
              <div className="schedule-list">
                {paymentSchedule.map((payment, index) => (
                  <div key={payment.id} className="schedule-item">
                    <div className="schedule-info">
                      <h4>{payment.description || "One-Time Full Payment"}</h4>
                      <p>ETB {payment.amount.toLocaleString()}</p>
                      {payment.dueDate && (
                        <p className="due-date">
                          Due: {new Date(payment.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="schedule-status">
                      <div className={`status - badge status - ${payment.status.toLowerCase()} `}>
                        {payment.status}
                      </div>
                      {payment.paidAmount > 0 && (
                        <p className="paid-amount">Paid: ETB {payment.paidAmount.toLocaleString()}</p>
                      )}
                      {role === "couple" && payment.status === "PENDING" && (
                        <button
                          onClick={async () => {
                            if (!wedding || !userId) {
                              alert("Payment information not available");
                              return;
                            }

                            setIsProcessingPayment(true);
                            try {
                              // Validate payment amount
                              if (!payment.amount || payment.amount <= 0) {
                                alert("Invalid payment amount. Please contact support.");
                                setIsProcessingPayment(false);
                                return;
                              }

                              // Get user details for payment
                              const user = await getUserByClerkId(userId);

                              if (!user) {
                                alert("User information not found. Please try again.");
                                setIsProcessingPayment(false);
                                return;
                              }

                              // Validate required fields
                              if (!user.email) {
                                alert("Email address is required for payment. Please update your profile.");
                                setIsProcessingPayment(false);
                                return;
                              }

                              const txRef = `wedding - ${wedding.id} -payment - ${payment.id} -${Date.now()} `;
                              // Store txRef for verification after redirect
                              localStorage.setItem("lastTxRef", txRef);

                              const paymentData = {
                                email: user.email,
                                firstName: user.firstName || "User",
                                lastName: user.lastName || "",
                                phoneNumber: user.phoneNumber || "",
                                amount: payment.amount,
                                txRef,
                                coupleClerkId: userId,
                                returnUrl: `${window.location.origin} /couple/wedding - management ? payment =return& tx_ref=${txRef} `
                              };

                              const result = await initializeChapaPayment(paymentData);

                              if (result && result.success && result.checkout_url) {
                                // Redirect to Chapa payment page
                                window.location.href = result.checkout_url;
                              } else {
                                const errorMessage = result?.error || result?.message || "Unknown error";
                                alert("Failed to initialize payment: " + errorMessage);
                                console.error("Payment initialization failed:", result);
                              }
                            } catch (error) {
                              console.error("Payment error:", error);
                              const errorMessage = error.response?.data?.error ||
                                error.response?.data?.message ||
                                error.message ||
                                "Failed to process payment";
                              alert("Payment Error: " + errorMessage);
                            } finally {
                              setIsProcessingPayment(false);
                            }
                          }}
                          className="btn-pay"
                          disabled={isProcessingPayment}
                        >
                          {isProcessingPayment ? "Processing..." : "Pay Now"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booked Services */}
        <div className="section-card">
          <div className="section-header">
            <CheckCircle size={24} color="#10b981" />
            <h2>Booked Services</h2>
          </div>

          {bookedServices.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
              No services booked yet
            </p>
          ) : (
            <div className="services-list">
              {bookedServices.map((booking) => (
                <div key={booking.id} className="service-item">
                  <div className="service-info">
                    <h4>{booking.service?.serviceName || "Service"}</h4>
                    <p>{booking.service?.description || ""}</p>
                    <div className="service-details">
                      <span>Category: {booking.service?.category || "N/A"}</span>
                      <span>Price: ETB {booking.service?.price?.toLocaleString() || "0"}</span>
                    </div>
                  </div>
                  <div className="service-price">
                    <h3>ETB {booking.service?.price?.toLocaleString() || "0"}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Wedding Team Section */}
        {
          (manager || protocol) && (
            <div className="section-card">
              <div className="section-header">
                <Users size={24} color="#2563eb" />
                <h2>Wedding Team</h2>
              </div>
              <div className="team-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
                {manager && role !== "manager" && (
                  <div className="team-member-card" style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#d4af37", display: "flex", alignItems: "center", justifyCenter: "center", color: "white" }}>
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0 }}>{manager.firstName} {manager.lastName}</h4>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Wedding Manager</p>
                      </div>
                    </div>
                    <div className="team-actions" style={{ display: "flex", gap: "0.5rem" }}>
                      {role === "couple" ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {!showManagerInput ? (
                            <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                              <button
                                onClick={() => setShowManagerInput(true)}
                                className="btn-primary btn-small"
                                style={{ flex: 1 }}
                              >
                                Inbox
                              </button>
                              <button
                                onClick={() => setShowMeetingModal(true)}
                                className="btn-outline btn-small"
                                style={{ flex: 1 }}
                              >
                                Request Meeting
                              </button>
                            </div>
                          ) : (
                            <div className="inline-message-box" style={{ marginTop: "0.5rem" }}>
                              <textarea
                                value={managerMessage}
                                onChange={(e) => setManagerMessage(e.target.value)}
                                placeholder="Message your manager..."
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  borderRadius: "8px",
                                  border: "1px solid #d4af37",
                                  fontSize: "0.85rem",
                                  marginBottom: "0.5rem",
                                  resize: "none"
                                }}
                                rows={2}
                              />
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                  onClick={async () => {
                                    if (!managerMessage.trim()) return;
                                    setIsSendingMessage(true);
                                    try {
                                      await sendMessage(userId, manager.clerkId, managerMessage);
                                      alert("Message sent!");
                                      setManagerMessage("");
                                      setShowManagerInput(false);
                                      // Couples don't have /manager/messages, they might have /couple/messages
                                      navigate("/couple/messages");
                                    } catch (e) {
                                      alert("Failed to send message");
                                    } finally {
                                      setIsSendingMessage(false);
                                    }
                                  }}
                                  className="btn-primary btn-small"
                                  disabled={isSendingMessage}
                                  style={{ flex: 1 }}
                                >
                                  {isSendingMessage ? "..." : "Send"}
                                </button>
                                <button
                                  onClick={() => setShowManagerInput(false)}
                                  className="btn-secondary btn-small"
                                  style={{ flex: 1, background: "#ef4444", borderColor: "#ef4444" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                      {role === "manager" && manager.clerkId !== userId && (
                        <button onClick={() => {
                          const meetingRoom = `manager-${userId}-${manager.clerkId}`.replace(/[^a-zA-Z0-9]/g, "");
                          window.open(`https://meet.jit.si/${meetingRoom}`, "_blank");
                        }} className="btn-primary btn-small" style={{ flex: 1 }}>Meet</button>
                      )}
                    </div>
                  </div>
                )}
                {protocol && (
                  <div className="team-member-card" style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyCenter: "center", color: "white" }}>
                        <UserCheck size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0 }}>{protocol.firstName} {protocol.lastName}</h4>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Protocol Officer</p>
                      </div>
                    </div>
                    <div style={{ marginBottom: "1rem", padding: "0.5rem", background: "#d1fae5", borderRadius: "8px", textAlign: "center" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#065f46" }}>Job: {protocol.job || "General Support"}</span>
                    </div>
                    <div className="team-actions" style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => window.open(`mailto:${protocol.email}`, "_blank")} className="btn-secondary btn-small" style={{ flex: 1 }}>Email</button>
                      {role === "manager" && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {!showProtocolInput ? (
                            <button
                              onClick={() => setShowProtocolInput(true)}
                              className="btn-outline btn-small"
                              style={{ width: "100%" }}
                            >
                              Inbox
                            </button>
                          ) : (
                            <div className="inline-message-box" style={{ marginTop: "0.5rem" }}>
                              <textarea
                                value={protocolMessage}
                                onChange={(e) => setProtocolMessage(e.target.value)}
                                placeholder="Type a message..."
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  borderRadius: "8px",
                                  border: "1px solid #d4af37",
                                  fontSize: "0.85rem",
                                  marginBottom: "0.5rem",
                                  resize: "none"
                                }}
                                rows={2}
                              />
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                  onClick={async () => {
                                    if (!protocolMessage.trim()) return;
                                    setIsSendingMessage(true);
                                    try {
                                      await sendMessage(userId, protocol.clerkId, protocolMessage);
                                      alert("Message sent!");
                                      setProtocolMessage("");
                                      setShowProtocolInput(false);
                                      navigate("/manager/messages");
                                    } catch (e) {
                                      alert("Failed to send message");
                                    } finally {
                                      setIsSendingMessage(false);
                                    }
                                  }}
                                  className="btn-primary btn-small"
                                  disabled={isSendingMessage}
                                  style={{ flex: 1 }}
                                >
                                  {isSendingMessage ? "..." : "Send"}
                                </button>
                                <button
                                  onClick={() => setShowProtocolInput(false)}
                                  className="btn-secondary btn-small"
                                  style={{ flex: 1, background: "#ef4444", borderColor: "#ef4444" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }

        {/* Task List Section */}
        <div className="section-card">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={24} color="#10b981" />
              <h2>Wedding Task List</h2>
            </div>
            {role === "manager" && (
              <button onClick={() => setShowTaskModal(true)} className="btn-primary" style={{ padding: "0.5rem 1rem" }}>
                Create To-Do Task
              </button>
            )}
          </div>
          <div className="task-list" style={{ marginTop: "1rem" }}>
            {tasks.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>No tasks yet</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      onClick={async () => {
                        const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
                        try {
                          await updateTaskStatus(task.id, newStatus);
                          setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                        } catch (e) { console.error(e); }
                      }}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        border: "2px solid #d1d5db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: task.status === "COMPLETED" ? "#10b981" : "transparent",
                        borderColor: task.status === "COMPLETED" ? "#10b981" : "#d1d5db",
                        cursor: "pointer"
                      }}>
                      {task.status === "COMPLETED" && <CheckCircle size={16} color="white" />}
                    </div>
                    <div>
                      <span style={{
                        textDecoration: task.status === "COMPLETED" ? "line-through" : "none",
                        color: task.status === "COMPLETED" ? "#94a3b8" : "#1e293b",
                        fontWeight: "500",
                        display: "block"
                      }}>
                        {task.title}
                      </span>
                      {task.description && (
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{task.description}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: task.assignedRole?.toUpperCase() === "MANAGER" ? "#dbeafe" : task.assignedRole?.toUpperCase() === "COUPLE" ? "#fef3c7" : "#d1fae5",
                      color: task.assignedRole?.toUpperCase() === "MANAGER" ? "#1e40af" : task.assignedRole?.toUpperCase() === "COUPLE" ? "#92400e" : "#065f46"
                    }}>
                      {task.assignedRole}
                    </span>
                    {role === "manager" && (
                      <button
                        onClick={async () => {
                          try {
                            await deleteTask(task.id);
                            setTasks(tasks.filter(t => t.id !== task.id));
                          } catch (e) { console.error(e); }
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact Section */}
        {
          ((role === "couple" && manager) || (role === "manager" && couple)) && (
            <div className="section-card">
              <div className="section-header">
                <MessageCircle size={24} color="#d4af37" />
                <h2>Contact</h2>
              </div>

              <div className="contact-info">
                {role === "couple" && manager && (
                  <>
                    <h4>Your Wedding Manager</h4>
                    <p>{manager.firstName} {manager.lastName}</p>
                    <div className="contact-actions">
                      {!showManagerInput ? (
                        <button
                          onClick={() => setShowManagerInput(true)}
                          className="btn-primary"
                          style={{ width: "100%" }}
                        >
                          <MessageCircle size={18} />
                          Inbox Manager
                        </button>
                      ) : (
                        <div className="inline-message-box" style={{ width: "100%", marginTop: "0.5rem" }}>
                          <textarea
                            value={managerMessage}
                            onChange={(e) => setManagerMessage(e.target.value)}
                            placeholder="Message your manager..."
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              borderRadius: "8px",
                              border: "1px solid #d4af37",
                              fontSize: "0.95rem",
                              marginBottom: "0.5rem",
                              resize: "none"
                            }}
                            rows={3}
                          />
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={async () => {
                                if (!managerMessage.trim()) return;
                                setIsSendingMessage(true);
                                try {
                                  await sendMessage(userId, manager.clerkId, managerMessage);
                                  alert("Message sent!");
                                  setManagerMessage("");
                                  setShowManagerInput(false);
                                  navigate("/couple/messages");
                                } catch (e) {
                                  alert("Failed to send message");
                                } finally {
                                  setIsSendingMessage(false);
                                }
                              }}
                              className="btn-primary"
                              disabled={isSendingMessage}
                              style={{ flex: 1 }}
                            >
                              {isSendingMessage ? "..." : "Send"}
                            </button>
                            <button
                              onClick={() => setShowManagerInput(false)}
                              className="btn-secondary"
                              style={{ flex: 1, background: "#ef4444", borderColor: "#ef4444", color: "white" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {role === "manager" && couple && (
                  <>
                    <h4>Couple</h4>
                    <p>{couple.firstName} {couple.lastName}</p>
                    <p>{couple.email}</p>
                    <div className="contact-actions">
                      {!showCoupleInput ? (
                        <button
                          onClick={() => setShowCoupleInput(true)}
                          className="btn-primary"
                          style={{ width: "100%" }}
                        >
                          <MessageCircle size={18} />
                          Inbox Couple
                        </button>
                      ) : (
                        <div className="inline-message-box" style={{ width: "100%", marginTop: "0.5rem" }}>
                          <textarea
                            value={coupleMessage}
                            onChange={(e) => setCoupleMessage(e.target.value)}
                            placeholder="Message the couple..."
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              borderRadius: "8px",
                              border: "1px solid #d4af37",
                              fontSize: "0.95rem",
                              marginBottom: "0.5rem",
                              resize: "none"
                            }}
                            rows={3}
                          />
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={async () => {
                                if (!coupleMessage.trim()) return;
                                setIsSendingMessage(true);
                                try {
                                  await sendMessage(userId, couple.clerkId, coupleMessage);
                                  alert("Message sent!");
                                  setCoupleMessage("");
                                  setShowCoupleInput(false);
                                  navigate("/manager/messages");
                                } catch (e) {
                                  alert("Failed to send message");
                                } finally {
                                  setIsSendingMessage(false);
                                }
                              }}
                              className="btn-primary"
                              disabled={isSendingMessage}
                              style={{ flex: 1 }}
                            >
                              {isSendingMessage ? "..." : "Send"}
                            </button>
                            <button
                              onClick={() => setShowCoupleInput(false)}
                              className="btn-secondary"
                              style={{ flex: 1, background: "#ef4444", borderColor: "#ef4444", color: "white" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        }

        {/* Task Creation Modal */}
        {
          showTaskModal && (
            <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h2 style={{ margin: 0, fontFamily: "Playfair Display" }}>New To-Do Task</h2>
                  <button onClick={() => setShowTaskModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Task Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="e.g. Call the catering service"
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      rows={3}
                      placeholder="Task details..."
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Assign To</label>
                    <select
                      className="form-select"
                      value={newTask.assignedRole}
                      onChange={(e) => setNewTask({ ...newTask, assignedRole: e.target.value })}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    >
                      <option value="MANAGER">Manager (Me)</option>
                      <option value="COUPLE">Couple</option>
                      <option value="PROTOCOL">Protocol Officer</option>
                    </select>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={async () => {
                      if (!newTask.title.trim()) {
                        alert("Please enter a task title");
                        return;
                      }
                      try {
                        const task = await createTask(
                          wedding.id,
                          newTask.title,
                          newTask.description,
                          "GENERAL",
                          newTask.assignedRole,
                          null,
                          null
                        );
                        setTasks([...tasks, task]);
                        setShowTaskModal(false);
                        setNewTask({ title: "", description: "", category: "GENERAL", assignedRole: "MANAGER" });
                      } catch (e) {
                        console.error(e);
                        alert("Failed to create task");
                      }
                    }}
                    style={{ marginTop: "1rem", padding: "1rem" }}
                  >
                    Add To-Do Task
                  </button>
                </div>
              </div>
            </div>
          )
        }
        {role === "manager" && assignment?.status !== "COMPLETED" && (
          <div className="section-card" style={{ marginTop: "2rem", borderTop: "2px solid #e2e8f0", paddingTop: "2rem" }}>
            <div className="section-header">
              <CheckCircle size={24} color="#d4af37" />
              <h2>Wedding Completion & Review</h2>
            </div>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Finalize this wedding and rate the Protocol Officer's performance. This will move the wedding to history for all parties.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="form-group">
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Rate Protocol Performance</label>
                <div style={{ display: "flex", gap: "1rem", fontSize: "1.5rem" }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setCompletionData({ ...completionData, rating: star })}
                      style={{ cursor: "pointer", color: star <= completionData.rating ? "#d4af37" : "#cbd5e1" }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Feedback for Protocol</label>
                <textarea
                  value={completionData.feedback}
                  onChange={(e) => setCompletionData({ ...completionData, feedback: e.target.value })}
                  placeholder="Share your experience working with the protocol officer..."
                  rows={4}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
              </div>

              <button
                className="btn-primary"
                disabled={isCompleting}
                onClick={async () => {
                  if (!window.confirm("Are you sure you want to mark this wedding as completed? This action cannot be undone.")) return;

                  setIsCompleting(true);
                  try {
                    await completeWedding(wedding.id, userId, completionData.rating, completionData.feedback);
                    alert("Wedding completed successfully!");
                    window.location.href = "/manager/dashboard";
                  } catch (e) {
                    console.error(e);
                    alert("Failed to complete wedding. Please check tasks and payments.");
                  } finally {
                    setIsCompleting(false);
                  }
                }}
                style={{ padding: "1rem", backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                {isCompleting ? "Processing..." : "Mark Wedding as Completed"}
              </button>
            </div>
          </div>
        )}
        {
          showMeetingModal && (
            <div className="modal-overlay" onClick={() => setShowMeetingModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h2 style={{ margin: 0, fontFamily: "Playfair Display" }}>Request Meeting</h2>
                  <button onClick={() => setShowMeetingModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Purpose of Meeting</label>
                    <textarea
                      value={meetingPurpose}
                      onChange={(e) => setMeetingPurpose(e.target.value)}
                      rows={3}
                      placeholder="e.g. Discuss catering menu, review budget..."
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Preferred Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button
                      className="btn-primary"
                      disabled={isSubmittingMeeting}
                      onClick={async () => {
                        if (!meetingPurpose.trim() || !meetingTime) {
                          alert("Please provide both purpose and time for the meeting.");
                          return;
                        }
                        setIsSubmittingMeeting(true);
                        try {
                          await requestMeeting({
                            coupleId: wedding.id,
                            meetingTime: meetingTime,
                            purpose: meetingPurpose
                          });
                          alert("Meeting request sent!");
                          setMeetingPurpose("");
                          setMeetingTime("");
                          setShowMeetingModal(false);
                        } catch (e) {
                          console.error(e);
                          alert("Failed to send meeting request.");
                        } finally {
                          setIsSubmittingMeeting(false);
                        }
                      }}
                      style={{ flex: 1, padding: "1rem" }}
                    >
                      {isSubmittingMeeting ? "Sending..." : "Send Request"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowMeetingModal(false)}
                      style={{ flex: 1, padding: "1rem" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
}

