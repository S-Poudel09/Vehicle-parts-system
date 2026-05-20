import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import "./CustomerModule.css";
import {
  HomeIcon,
  CalendarDaysIcon,
  InboxIcon,
  ClockIcon,
  StarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ArrowRightStartOnRectangleIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BellIcon,
  TagIcon
} from "@heroicons/react/24/solid";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  brand: string;
  model: string;
  year?: number;
  odometer?: number;
  primaryDrivingEnvironment?: string;
  engineType?: string;
  vehicleType?: string;
}

interface Appointment {
  id: number;
  appointmentDate: string;
  status: string;
  description?: string;
  vehicle: {
    id: number;
    vehicleNumber: string;
    brand: string;
    model: string;
  };
}

interface PartRequest {
  id: number;
  partName: string;
  description: string;
  status: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
}

interface PurchaseItem {
  partName: string;
  quantity: number;
  price: number;
}

interface Purchase {
  id: number;
  date: string;
  type: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: string;
  items: PurchaseItem[];
}

interface ServiceHistoryItem {
  id: number;
  date: string;
  type: string;
  status: string;
  vehicle: string;
}

interface AiPrediction {
  vehicleId: number;
  vehicleName: string;
  component: string;
  probability: number;
  severity: "High" | "Medium" | "Low";
  remainingLife: string;
  reason: string;
  recommendedAction: string;
}

const tabMeta: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Secure Customer Dashboard",
    subtitle: "Track your vehicles, book services, request parts, and monitor AI predictions"
  },
  catalog: {
    title: "Browse Parts Catalog",
    subtitle: "Search, filter, and view details of our live spare parts inventory"
  },
  profile: {
    title: "Profile & Vehicles",
    subtitle: "Manage account information and registered fleet specifications"
  },
  book: {
    title: "Book Service Appointments",
    subtitle: "Reserve a priority slot in our premium vehicle service bays"
  },
  parts: {
    title: "Part Sourcing & Requests",
    subtitle: "Request unavailable components to be procured specifically for you"
  },
  history: {
    title: "Service & Purchase Ledger",
    subtitle: "Comprehensive audit history of past checkups and transactions"
  },
  reviews: {
    title: "Submit Workshop Review",
    subtitle: "Help us improve by leaving feedback about your experience"
  },
  ai: {
    title: "AI Vehicle Condition Prognostics",
    subtitle: "Artificial intelligence telemetry analyzing vehicle degradation risks in real-time"
  }
};

export default function CustomerDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // Profile / Vehicles state
  const [profile, setProfile] = useState<{
    customerId: number;
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", address: "" });

  // Separate Vehicle add state
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [showBookServiceModal, setShowBookServiceModal] = useState(false);
  const [showPartRequestModal, setShowPartRequestModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: "",
    brand: "",
    model: "",
    year: "",
    odometer: "",
    primaryDrivingEnvironment: "Mixed",
    engineType: "Petrol",
    vehicleType: "Car"
  });
  const [vehicleError, setVehicleError] = useState("");

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookingForm, setBookingForm] = useState({
    vehicleId: "",
    appointmentDate: "",
    appointmentTime: "09:00",
    description: ""
  });
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingError, setBookingError] = useState("");

  // Part Requests state
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [partForm, setPartForm] = useState({ partName: "", description: "" });
  const [partSuccess, setPartSuccess] = useState("");
  const [partError, setPartError] = useState("");

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");

  // Unified History state
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>([]);

  // AI predictions state
  const [aiPredictions, setAiPredictions] = useState<AiPrediction[]>([]);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Parts Catalog state
  const [partsCatalog, setPartsCatalog] = useState<any[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsSearch, setPartsSearch] = useState("");
  const [partsFilter, setPartsFilter] = useState("all");

  // Compute monthly expenses over the last 6 months
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const expensesByMonth: Record<string, number> = {};
  
  purchaseHistory.forEach(p => {
    if (p.paymentStatus !== "Failed" && p.date) {
      const d = new Date(p.date);
      const m = monthsList[d.getMonth()];
      expensesByMonth[m] = (expensesByMonth[m] || 0) + p.finalAmount;
    }
  });

  const last6Months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    last6Months.push(monthsList[d.getMonth()]);
  }

  const chartData = last6Months.map(m => ({
    month: m,
    amount: expensesByMonth[m] || 0
  }));

  const maxAmount = Math.max(...chartData.map(c => c.amount), 0) || 1000;

  // Compute Service Activity Mix
  let partsCount = 0;
  let serviceCount = 0;
  purchaseHistory.forEach(p => {
    if (p.type === "Service" || p.items.length === 0) {
      serviceCount++;
    } else {
      partsCount += p.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  });
  const totalMix = partsCount + serviceCount || 1;
  const partsPct = Math.round((partsCount / totalMix) * 105) > 100 ? 100 : Math.round((partsCount / totalMix) * 100);
  const servicePct = 100 - partsPct;

  // Fetch initial profile and vehicles
  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await axiosInstance.get("/customer/profile");
      setProfile({
        customerId: res.data.customerId,
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
        address: res.data.address
      });
      setVehicles(res.data.vehicles);
      setProfileForm({
        name: res.data.name,
        phone: res.data.phone,
        address: res.data.address
      });
    } catch (err) {
      console.error("Error loading customer profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get("/customer/appointments");
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPartRequests = async () => {
    try {
      const res = await axiosInstance.get("/customer/part-requests");
      setPartRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get("/customer/reviews");
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get("/customer/history");
      setPurchaseHistory(res.data.purchases || []);
      setServiceHistory(res.data.services || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAiPredictions = async () => {
    try {
      setAiLoading(true);
      const res = await axiosInstance.get("/customer/ai-predictions");
      setAiPredictions(res.data.predictions || []);
      setAiMessage(res.data.alertMessage || "");
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/customer/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Error fetching customer notifications:", err);
    }
  };

  const dismissNotification = async (id: number) => {
    try {
      await axiosInstance.delete(`/customer/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Error dismissing customer notification:", err);
    }
  };

  const fetchPartsCatalog = async () => {
    try {
      setPartsLoading(true);
      const res = await axiosInstance.get("/part");
      setPartsCatalog(res.data || []);
    } catch (err) {
      console.error("Error loading parts catalog:", err);
    } finally {
      setPartsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAppointments();
    fetchPartRequests();
    fetchReviews();
    fetchHistory();
    fetchAiPredictions();
    fetchNotifications();
    fetchPartsCatalog();
  }, []);

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.put("/customer/profile", {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address
      });
      setProfile(prev => prev ? { ...prev, name: profileForm.name, phone: profileForm.phone, address: profileForm.address } : null);
      setEditingProfile(false);
      // Fetch updated history and bookings since details changed
      fetchProfile();
    } catch (err) {
      console.error("Profile update failed:", err);
    }
  };

  // Add vehicle (Separate form action)
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError("");
    if (!newVehicle.vehicleNumber.trim()) {
      setVehicleError("Vehicle plate number is required.");
      return;
    }

    try {
      await axiosInstance.post("/customer/vehicles", {
        vehicleNumber: newVehicle.vehicleNumber,
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year ? parseInt(newVehicle.year) : null,
        odometer: newVehicle.odometer ? parseInt(newVehicle.odometer) : null,
        primaryDrivingEnvironment: newVehicle.primaryDrivingEnvironment,
        engineType: newVehicle.engineType,
        vehicleType: newVehicle.vehicleType
      });

      setNewVehicle({
        vehicleNumber: "",
        brand: "",
        model: "",
        year: "",
        odometer: "",
        primaryDrivingEnvironment: "Mixed",
        engineType: "Petrol",
        vehicleType: "Car"
      });
      setShowAddVehicleForm(false);
      fetchProfile(); // Reload
      fetchAiPredictions(); // Regenerate predictions with the new vehicle
    } catch (err: any) {
      setVehicleError(err.response?.data || "Failed to add vehicle.");
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await axiosInstance.delete(`/customer/vehicles/${id}`);
      fetchProfile();
      fetchAiPredictions();
    } catch (err: any) {
      alert(err.response?.data || "Cannot delete vehicle. Check if it has appointment history.");
    }
  };

  // Book appointment
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess("");

    if (!bookingForm.vehicleId) {
      setBookingError("Please select a registered vehicle.");
      return;
    }
    if (!bookingForm.appointmentDate) {
      setBookingError("Please select a date.");
      return;
    }

    const fullDateTime = `${bookingForm.appointmentDate}T${bookingForm.appointmentTime}:00`;

    try {
      await axiosInstance.post("/customer/appointments", {
        vehicleId: parseInt(bookingForm.vehicleId),
        appointmentDate: new Date(fullDateTime).toISOString(),
        description: bookingForm.description
      });

      setBookingSuccess("Your service appointment has been booked successfully!");
      setBookingForm({ vehicleId: "", appointmentDate: "", appointmentTime: "09:00", description: "" });
      setShowBookServiceModal(false);
      fetchAppointments();
      fetchHistory();
      fetchAiPredictions();
    } catch (err: any) {
      setBookingError(err.response?.data || "Failed to book appointment.");
    }
  };

  // Submit Part Request
  const handlePartRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartError("");
    setPartSuccess("");

    if (!partForm.partName.trim()) {
      setPartError("Part name is required.");
      return;
    }

    try {
      await axiosInstance.post("/customer/part-requests", {
        partName: partForm.partName,
        description: partForm.description
      });

      setPartSuccess("Request submitted! We will source this part and notify you.");
      setPartForm({ partName: "", description: "" });
      setShowPartRequestModal(false);
      fetchPartRequests();
    } catch (err: any) {
      setPartError(err.response?.data || "Failed to submit request.");
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    try {
      await axiosInstance.post("/customer/reviews", {
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });

      setReviewSuccess("Thank you for your review!");
      setReviewForm({ rating: 5, comment: "" });
      fetchReviews();
    } catch (err: any) {
      setReviewError(err.response?.data || "Failed to submit review.");
    }
  };

  const handleLogout = () => {
    signOut();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const customerLinks = [
    { key: "dashboard", label: "Dashboard", Icon: HomeIcon },
    { key: "catalog", label: "Parts Catalog", Icon: TagIcon },
    { key: "profile", label: "Profile & Vehicles", Icon: Cog6ToothIcon },
    { key: "book", label: "Book a Service", Icon: CalendarDaysIcon },
    { key: "parts", label: "Part Requests", Icon: InboxIcon },
    { key: "history", label: "My History", Icon: ClockIcon },
    { key: "reviews", label: "Submit a Review", Icon: StarIcon },
    { key: "ai", label: "AI Diagnostics", Icon: SparklesIcon }
  ];

  if (loadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f0e8]">
        <div className="text-center">
          <ArrowPathIcon className="mx-auto h-12 w-12 animate-spin text-[#047857]" />
          <p className="mt-4 font-semibold text-[#27302b]">Loading your Customer workspace...</p>
        </div>
      </div>
    );
  }

  // Get upcoming appointment
  const upcomingAppointment = appointments.find(a => a.status === "Pending" || a.status === "Confirmed");
  const pendingRequests = partRequests.filter(pr => pr.status === "Pending");

  const initials = profile?.name
    ? profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "CU";

  const activeMeta = tabMeta[activeTab] || { title: "Customer Portal", subtitle: "Manage your vehicle telemetry and workshop priority scheduling" };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-850">
      {/* COLLAPSIBLE SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.015)] transition-[width] duration-300 ease-out ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <div className="flex min-h-[72px] items-center border-b border-slate-100 px-5 py-4">
          {!collapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src="/logo.png"
                alt="GadiParts"
                className="h-10 max-w-[120px] shrink-0 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <img
                src="/logo.png"
                alt="GadiParts"
                className="h-8 w-8 shrink-0 object-contain"
              />
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          {customerLinks.map(({ key, label, Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                onClick={() => setActiveTab(key)}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 py-3 px-3.5 font-bold text-sm text-left transition-all border-l-4 rounded-r-xl ${
                  collapsed ? "justify-center px-0 border-l-0 rounded-xl" : ""
                } ${
                  isActive
                    ? "border-emerald-600 bg-slate-100/90 text-slate-800"
                    : "border-transparent text-slate-500 hover:border-emerald-600/60 hover:bg-slate-50 hover:text-slate-800"
                }`}
                key={key}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* LOGGED IN USER CAPSULE / SIGN OUT */}
        <div className="border-t border-[#dedbd2]/40 p-3 mt-auto flex flex-col gap-2">
          {!collapsed && (
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-[#686f66] uppercase tracking-wider">Logged in as</p>
              <p className="text-xs font-black truncate text-[#27302b]">{profile?.name}</p>
            </div>
          )}
          
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-505 hover:text-slate-700 rounded-xl font-bold transition-all text-xs border border-slate-150 shadow-sm shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronDoubleRightIcon className="h-4.5 w-4.5 text-slate-500" />
            ) : (
              <>
                <ChevronDoubleLeftIcon className="h-4.5 w-4.5 text-slate-500" />
                <span>Collapse Panel</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main
        className={`min-h-screen transition-[margin-left] duration-300 ease-out flex flex-col ${
          collapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        {/* CUSTOMER TOP NAVBAR */}
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-[#dedbd2]/50 bg-white/85 px-8 backdrop-blur-md shrink-0">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-800">{activeMeta.title}</h2>
            <p className="hidden md:block text-[11px] font-bold text-slate-400 mt-0.5">{activeMeta.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl border transition-all shadow-sm ${
                  showNotifications 
                    ? "bg-slate-100 border-slate-350 text-slate-850" 
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
                title="Notifications"
              >
                <BellIcon className="h-4.5 w-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop to close click */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  
                  {/* Dropdown list */}
                  <div className="absolute right-0 mt-2 z-50 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-3 duration-250">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-xs font-black text-slate-850 uppercase tracking-wider">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {notifications.length} Alerts
                        </span>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 py-1 pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 font-medium">
                          No notifications found.
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isWarning = n.type === "Warning" || n.type === "Error";
                          return (
                            <div
                              key={n.id}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs transition-all ${
                                isWarning 
                                  ? "bg-amber-50/50 border-amber-100 text-amber-900" 
                                  : "bg-emerald-50/40 border-emerald-100 text-emerald-950"
                              }`}
                            >
                              <div className="flex-1 space-y-1">
                                <p className="font-medium leading-relaxed">{n.message}</p>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">
                                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <button
                                onClick={() => dismissNotification(n.id)}
                                className="text-slate-400 hover:text-slate-700 font-black p-0.5"
                                title="Dismiss"
                              >
                                &times;
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick stats capsule */}
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-xs font-bold text-white uppercase shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-black leading-tight text-slate-800">{profile?.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 py-2 px-3 border border-red-250 hover:bg-red-50 text-red-650 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Sign Out"
            >
              <ArrowRightStartOnRectangleIcon className="h-4.5 w-4.5" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE MAIN BODY */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
        
        {/* TABS IMPLEMENTATION */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* HERO GREETING PANEL */}
            <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md">
              {/* Absolute subtle glowing overlays */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="relative space-y-2 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-widest border border-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Client Workspace Active
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
                  Welcome back, {profile?.name}!
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Monitor your registered fleet, priority service bookings, and custom AI diagnostics insights in one unified premium dashboard workspace.
                </p>
              </div>
              
              <div className="relative shrink-0 flex gap-3">
                <button
                  onClick={() => setActiveTab("book")}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <CalendarDaysIcon className="h-4.5 w-4.5 text-white" />
                  Schedule Service
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-all hover:-translate-y-0.5 border border-slate-200/60"
                >
                  Manage Fleet ({vehicles.length})
                </button>
              </div>
            </div>

            {/* AI DIAGNOSTICS & TELEMETRY PANELS */}
            {(() => {
              const highRisksCount = aiPredictions.filter(p => p.severity === "High").length;
              const hasCriticalAlerts = highRisksCount > 0;
              
              return (
                <div className="saas-card flex flex-col gap-6 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${hasCriticalAlerts ? "bg-red-500" : "bg-emerald-500"}`} />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasCriticalAlerts ? "bg-red-400" : "bg-emerald-400"}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${hasCriticalAlerts ? "bg-red-500" : "bg-emerald-500"}`}></span>
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">AI Predictive Failure Prognostics</h3>
                        <p className="text-xs text-slate-500">Continuous real-time background vehicle telemetry diagnostics</p>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider border ${
                      hasCriticalAlerts 
                        ? "bg-red-50 border-red-150 text-red-800" 
                        : "bg-emerald-50 border-emerald-150 text-emerald-800"
                    }`}>
                      {hasCriticalAlerts ? `${highRisksCount} Critical Alerts Pending` : "All Systems Nominal"}
                    </span>
                  </div>

                  <div className="bg-[#fffdf8]/85 p-5 rounded-2xl border border-[#dedbd2]/50 text-sm">
                    <div className="flex items-start gap-3">
                      <SparklesIcon className="h-5 w-5 text-[#047857] shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <strong className="text-slate-800 font-bold block text-sm">AI Diagnostics Justification:</strong>
                        <p className="text-slate-600 text-xs leading-relaxed">{aiMessage || "Initializing diagnostics..."}</p>
                      </div>
                    </div>
                    
                    {aiPredictions.length > 0 ? (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-1">
                        {aiPredictions.map((p, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setActiveTab("ai")}
                            className={`group cursor-pointer p-4 rounded-xl border transition-all hover:shadow-md flex items-center justify-between ${
                              p.severity === "High" 
                                ? "bg-red-50/50 border-red-100 hover:border-red-300 text-red-950" 
                                : p.severity === "Medium"
                                ? "bg-amber-50/30 border-amber-100 hover:border-amber-250 text-amber-955"
                                : "bg-slate-50/50 border-slate-100 hover:border-slate-300 text-slate-900"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-white/80 border border-slate-100 px-1.5 py-0.5 rounded">
                                  {p.vehicleName}
                                </span>
                              </div>
                              <strong className="text-xs block text-slate-800 font-black truncate max-w-[180px]">{p.component}</strong>
                              <span className="text-[10px] text-slate-505 block">RUL: {p.remainingLife}</span>
                            </div>
                            
                            <div className="text-right flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                p.severity === "High" ? "bg-red-100 text-red-800" :
                                p.severity === "Medium" ? "bg-amber-100 text-amber-805" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {p.severity} ({p.probability}%)
                              </span>
                              <span className="text-[9px] text-[#047857] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                Analyze &rarr;
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        Please ensure you have added a vehicle spec in the Profile & Vehicles page to generate diagnostics.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button onClick={() => setActiveTab("ai")} className="text-xs font-black text-[#047857] hover:text-[#065f46] hover:underline flex items-center gap-1">
                      Open Full AI Telemetry Prognostics Console <span className="text-sm">→</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* PRE-VERIFIED LOYALTY SAVINGS BANNER */}
            <div className="relative overflow-hidden bg-white border border-amber-250/70 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-amber-300">
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600 border border-amber-100 shrink-0">
                  <StarIcon className="h-6 w-6 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h3 className="font-extrabold text-slate-800 text-sm">Counter Loyalty Benefits</h3>
                    <span className="bg-amber-55 bg-amber-50 text-amber-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-100">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal max-w-xl font-medium">
                    Get an instant <strong className="text-amber-700 font-bold">10% discount</strong> automatically on single counter purchases exceeding Rs 5,000.
                  </p>
                </div>
              </div>
              
              <span className="shrink-0 px-3.5 py-1.5 bg-amber-500 text-white rounded-lg font-bold text-[11px] shadow-sm">
                10% Counter Savings
              </span>
            </div>

            {/* DYNAMIC MONTHLY SERVICE EXPENSES CHART & ACTIVITY MIX GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SVG BAR CHART */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-5 transition-all hover:border-emerald-600/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Monthly Service Spendings</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Overview of your expenses on vehicle services & parts sourcing</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50/80 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-extrabold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Rs. {chartData.reduce((sum, c) => sum + c.amount, 0).toLocaleString()} Total (Last 6 Months)
                  </div>
                </div>

                {/* SVG Chart Container */}
                <div className="relative h-44 w-full border-b border-slate-100 flex items-end justify-around pb-6 pt-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 pb-6 pointer-events-none flex flex-col justify-between">
                    <div className="border-t border-slate-100 border-dashed w-full h-0" />
                    <div className="border-t border-slate-100 border-dashed w-full h-0" />
                    <div className="border-t border-slate-100 border-dashed w-full h-0" />
                  </div>

                  {chartData.map((c, i) => {
                    const heightPct = maxAmount > 0 ? (c.amount / maxAmount) * 100 : 0;
                    return (
                      <div key={i} className="group relative flex flex-col items-center justify-end w-10 sm:w-12 h-full z-10">
                        {/* Tooltip */}
                        <div className="absolute bottom-[calc(100%-8px)] bg-slate-905 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:bottom-full transition-all duration-200 whitespace-nowrap z-20">
                          Rs. {c.amount.toLocaleString()}
                        </div>

                        {/* Bar fill */}
                        <div
                          style={{ height: `${Math.max(heightPct, 4)}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            c.amount > 0 
                              ? "bg-gradient-to-t from-emerald-600 to-emerald-500 group-hover:from-emerald-500 group-hover:to-emerald-400" 
                              : "bg-slate-100"
                          }`}
                        />

                        {/* Month Label */}
                        <span className="absolute -bottom-5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                          {c.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SERVICE ACTIVITY MIX */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all hover:border-emerald-600/30">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800">Service Activity Mix</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Breakdown of custom parts sourced vs service visits</p>
                </div>

                <div className="space-y-4 my-auto py-4">
                  {/* Sourced Parts Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Sourced Parts / Components</span>
                      <span className="text-slate-800">{partsPct}% ({partsCount} items)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div style={{ width: `${partsPct}%` }} className="bg-slate-700 h-full rounded-full transition-all duration-500" />
                    </div>
                  </div>

                  {/* Service Bookings Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Workshop Service Visits</span>
                      <span className="text-slate-800">{servicePct}% ({serviceCount} visits)</span>
                    </div>
                    <div className="w-full bg-slate-150 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${servicePct}%` }} className="bg-emerald-600 h-full rounded-full transition-all duration-500" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-medium italic">
                  * Dynamic ratio updated relative to your customer ledger history.
                </div>
              </div>
            </div>

            {/* HIGH-ELEVATION QUICK ACTION PANELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* RESERVATIONS BAY CARD */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-emerald-600/30 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest text-[#047857] uppercase block">Workshop Reservs</span>
                    <h4 className="text-base font-extrabold text-slate-800">Priority Workshop Bay Reservation</h4>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 border border-slate-100">
                    <CalendarDaysIcon className="h-5 w-5" />
                  </div>
                </div>

                {upcomingAppointment ? (
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-sm text-slate-800 font-extrabold block">
                        {new Date(upcomingAppointment.appointmentDate).toLocaleDateString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </strong>
                      <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[9px] font-black uppercase">
                        Pending Queue
                      </span>
                    </div>
                    <p className="text-xs text-slate-505">
                      Vehicle: <span className="font-bold text-slate-700">{upcomingAppointment.vehicle.brand} {upcomingAppointment.vehicle.model}</span> ({upcomingAppointment.vehicle.vehicleNumber})
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/40 text-slate-400 text-xs">
                    No priority service reservations scheduled.
                  </div>
                )}                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => setActiveTab("book")} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                    Bay Queue Records &rarr;
                  </button>
                  <button 
                    onClick={() => setActiveTab("book")}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-lg transition-all shadow-sm"
                  >
                    Reserve Service Bay
                  </button>
                </div>
              </div>

              {/* SOURCING LOG CARD */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-emerald-600/30 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest text-[#047857] uppercase block">Procurement Log</span>
                    <h4 className="text-base font-extrabold text-slate-800">Unavailable Custom Parts Requests</h4>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl text-slate-505 border border-slate-100">
                    <InboxIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <strong className="text-base text-slate-800 font-extrabold block">
                      {pendingRequests.length} Active Sourcing
                    </strong>
                    <p className="text-xs text-slate-505">Premium component orders procured on demand</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    pendingRequests.length > 0 ? "bg-indigo-50 border border-indigo-100 text-indigo-850 animate-pulse" : "bg-slate-100 text-slate-655"
                  }`}>
                    {pendingRequests.length > 0 ? "In Sourcing" : "No Active Orders"}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => setActiveTab("parts")} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                    Sourcing Ledger &rarr;
                  </button>
                  <button 
                    onClick={() => setActiveTab("parts")}
                    className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-extrabold rounded-lg transition-all shadow-sm"
                  >
                    Request Custom Part
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS: PROFILE & VEHICLES */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold tracking-widest text-emerald-600 uppercase">My Profile</span>
                <h1 className="text-3xl font-black text-slate-800 mt-1">Profile & Vehicles</h1>
                <p className="text-sm text-slate-500">Manage account information details and registered fleet specs.</p>
              </div>
            </div>

            {/* EDIT PROFILE FORM */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.02)] p-8 transition-all">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">Account Information</h2>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {editingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email (Immutable)</label>
                      <input
                        type="email"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                        value={profile?.email}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={profileForm.phone}
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="e.g. +977-980000000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={profileForm.address}
                        onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-4">
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-all hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Contact Name</span>
                    <p className="text-base font-extrabold text-slate-800">{profile?.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Email Address</span>
                    <p className="text-base font-extrabold text-slate-800">{profile?.email}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Phone Number</span>
                    <p className="text-base font-extrabold text-slate-800">{profile?.phone || "Not provided"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Residential Address</span>
                    <p className="text-base font-extrabold text-slate-800">{profile?.address || "Not provided"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* REGISTERED VEHICLES CARD */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.02)] p-8 transition-all">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">My Registered Vehicles</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Specifications of vehicles synced with telemetry logs.</p>
                </div>
                <button
                  onClick={() => {
                    setVehicleError("");
                    setNewVehicle({
                      vehicleNumber: "",
                      brand: "",
                      model: "",
                      year: "",
                      odometer: "",
                      primaryDrivingEnvironment: "Mixed",
                      engineType: "Petrol",
                      vehicleType: "Car"
                    });
                    setShowAddVehicleForm(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Register New Vehicle
                </button>
              </div>

              {/* VEHICLE LISTING */}
              {vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicles.map(v => (
                    <div key={v.id} className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md hover:border-emerald-600/40 transition-all flex items-center justify-between group relative">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100/80 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-50 text-emerald-700 transition-all">
                          <svg className="h-7 w-7 text-emerald-600 fill-current" viewBox="0 0 24 24">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 11.5v8c0 .83.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5V19h10v.5c0 .83.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5v-8l-2.08-5.49zM6.85 7h10.29l1.04 2.75H5.81L6.85 7zM19 17H5v-4h14v4z" />
                            <circle cx="7.5" cy="15" r="1.5" />
                            <circle cx="16.5" cy="15" r="1.5" />
                          </svg>
                        </div>
                        <div>
                          <strong className="text-slate-800 text-base font-extrabold block leading-snug">{v.brand} {v.model}</strong>
                          <span className="text-[11px] text-slate-500 mt-1 block">
                            Plate: <span className="font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-xs font-extrabold text-slate-700">{v.vehicleNumber}</span>
                          </span>
                          {v.year && <span className="text-[10px] text-slate-400 mt-1 block font-semibold">Year: {v.year}</span>}
                          
                          <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-bold">
                            {v.vehicleType && <span className="bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded text-slate-600 uppercase tracking-wider">{v.vehicleType}</span>}
                            {v.engineType && <span className="bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-600">{v.engineType}</span>}
                            {v.primaryDrivingEnvironment && <span className="bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded text-purple-600">{v.primaryDrivingEnvironment}</span>}
                            {v.odometer !== undefined && v.odometer !== null && <span className="bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-emerald-600">{v.odometer.toLocaleString()} km</span>}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete vehicle spec"
                      >
                        <TrashIcon className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-500">No vehicles registered under your account yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Please add a vehicle to unlock priority workshop bookings and AI diagnosis.</p>
                </div>
              )}
            </div>

            {/* NEW VEHICLE DIALOG MODAL POPUP */}
            {showAddVehicleForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setShowAddVehicleForm(false)}
                />
                
                <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 z-10 animate-[slideUp_0.2s_ease-out]">
                  <button
                    onClick={() => setShowAddVehicleForm(false)}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <PlusIcon className="h-5 w-5 rotate-45" />
                  </button>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Register New Vehicle</h3>
                    <p className="text-xs text-slate-500 mt-1">Add vehicle specifications to initialize custom diagnostic health telemetry.</p>
                  </div>

                  {vehicleError && (
                    <div className="mb-4 text-xs text-red-650 bg-red-50 border border-red-100 p-3 rounded-lg font-semibold">
                      {vehicleError}
                    </div>
                  )}

                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Plate / Registration # *</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. BA-1-PA-2023"
                          value={newVehicle.vehicleNumber}
                          onChange={e => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Manufacture Year</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. 2019"
                          value={newVehicle.year}
                          onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Make</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. Honda"
                          value={newVehicle.brand}
                          onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Model Name</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. Civic"
                          value={newVehicle.model}
                          onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Category</label>
                        <select
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={newVehicle.vehicleType}
                          onChange={e => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                        >
                          <option value="Car">Car</option>
                          <option value="Bike">Bike</option>
                          <option value="SUV">SUV</option>
                          <option value="Truck">Truck</option>
                          <option value="Scooter">Scooter</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (km)</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. 45000"
                          value={newVehicle.odometer}
                          onChange={e => setNewVehicle({ ...newVehicle, odometer: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Engine Type</label>
                        <select
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={newVehicle.engineType}
                          onChange={e => setNewVehicle({ ...newVehicle, engineType: e.target.value })}
                        >
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Electric">Electric</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Driving Environment</label>
                        <select
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={newVehicle.primaryDrivingEnvironment}
                          onChange={e => setNewVehicle({ ...newVehicle, primaryDrivingEnvironment: e.target.value })}
                        >
                          <option value="Mixed">Mixed (Standard)</option>
                          <option value="City">City (Stop & Go)</option>
                          <option value="Highway">Highway (Cruising)</option>
                          <option value="Mountainous">Mountainous / Off-Road</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddVehicleForm(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-505 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Register Spec
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TABS: PARTS CATALOG */}
        {activeTab === "catalog" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[11px] font-extrabold tracking-widest text-emerald-600 uppercase">Live Inventory</span>
                <h1 className="text-3xl font-black text-slate-800 mt-1">Browse Parts Catalog</h1>
                <p className="text-sm text-slate-500">Search and filter live spare parts details and availability.</p>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm w-full">
              <div className="flex-1 w-full relative">
                <input
                  type="text"
                  placeholder="Search parts by name or description..."
                  value={partsSearch}
                  onChange={e => setPartsSearch(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
                />
              </div>
              <div className="w-full md:w-48">
                <select
                  value={partsFilter}
                  onChange={e => setPartsFilter(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-bold"
                >
                  <option value="all">All Availability</option>
                  <option value="in">In Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
            </div>

            {partsLoading ? (
              <div className="flex justify-center items-center py-20">
                <ArrowPathIcon className="h-10 w-10 animate-spin text-emerald-600" />
                <span className="ml-3 text-slate-500 font-bold">Loading parts inventory...</span>
              </div>
            ) : (
              (() => {
                const filtered = partsCatalog.filter(p => {
                  const matchQuery = p.name?.toLowerCase().includes(partsSearch.toLowerCase()) ||
                    p.description?.toLowerCase().includes(partsSearch.toLowerCase());
                  
                  let matchStock = true;
                  if (partsFilter === "in") {
                    matchStock = p.stock > 0;
                  } else if (partsFilter === "out") {
                    matchStock = p.stock === 0;
                  }
                  
                  return matchQuery && matchStock;
                });

                return filtered.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(p => (
                      <div key={p.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                        <div>
                          {/* Part Image */}
                          <div className="h-40 bg-slate-50 flex items-center justify-center border-b border-slate-100 relative">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center text-slate-300">
                                <TagIcon className="h-12 w-12" />
                                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">No Image</span>
                              </div>
                            )}
                            <span className="absolute top-3 right-3 text-[10px] font-black tracking-wider uppercase bg-white/95 backdrop-blur-sm border border-slate-200/50 px-2 py-0.5 rounded shadow-sm text-slate-700">
                              Rs. {p.price?.toLocaleString()}
                            </span>
                          </div>

                          {/* Part Details */}
                          <div className="p-5 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-sm font-black text-slate-800 leading-tight">{p.name}</h3>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                                p.stock >= 10 ? "bg-green-50 text-green-700 border border-green-100" :
                                p.stock > 0 ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                                "bg-red-50 text-red-700 border border-red-100"
                              }`}>
                                {p.stock >= 10 ? "In Stock" : p.stock > 0 ? `Low Stock (${p.stock})` : "Out of Stock"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed">
                              {p.description || "No description provided for this component."}
                            </p>
                          </div>
                        </div>

                        {/* Card Action Button */}
                        <div className="p-5 pt-0">
                          {p.stock > 0 ? (
                            <button
                              onClick={() => {
                                setBookingForm(prev => ({
                                  ...prev,
                                  description: `Requesting installation for part: ${p.name}.`
                                }));
                                setActiveTab("book");
                              }}
                              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-100/50 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1"
                            >
                              Request Install in Service
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setPartForm({
                                  partName: p.name,
                                  description: `Procurement request for out-of-stock part from catalog: ${p.name}.`
                                });
                                setPartSuccess("");
                                setPartError("");
                                setShowPartRequestModal(true);
                              }}
                              className="w-full py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-100/50 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1"
                            >
                              Request Custom Sourcing
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
                    <TagIcon className="h-12 w-12 mx-auto text-slate-350" />
                    <h3 className="text-sm font-bold text-slate-700 mt-3">No matching parts found</h3>
                    <p className="text-xs text-slate-400 mt-1">Try modifying your query or filter keywords.</p>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* TABS: BOOK APPOINTMENT */}
        {activeTab === "book" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[11px] font-extrabold tracking-widest text-emerald-600 uppercase">Workshop Scheduling</span>
                <h1 className="text-3xl font-black text-slate-800 mt-1">Book Service Appointments</h1>
                <p className="text-sm text-slate-500">Reserve a priority slot in our premium vehicle service bays.</p>
              </div>
              <button
                onClick={() => {
                  setBookingSuccess("");
                  setBookingError("");
                  setBookingForm({ vehicleId: "", appointmentDate: "", appointmentTime: "09:00", description: "" });
                  setShowBookServiceModal(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <CalendarDaysIcon className="h-4.5 w-4.5" />
                Schedule Priority Service
              </button>
            </div>

            {bookingSuccess && (
              <div className="text-xs text-green-700 bg-green-50 p-4 rounded-xl border border-green-150 font-bold">
                {bookingSuccess}
              </div>
            )}

            {/* BOOKING HISTORY - FULL WIDTH */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.02)] p-8 transition-all">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                Workshop Queue & Scheduled Visits
              </h2>

              {appointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.map(a => (
                    <div key={a.id} className="border border-slate-100 p-5 rounded-2xl flex items-center justify-between bg-white hover:border-emerald-600/30 transition-all shadow-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-400">Bay Reservation</span>
                        <strong className="text-sm block text-slate-800 font-extrabold">
                          {new Date(a.appointmentDate).toLocaleString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </strong>
                        <p className="text-xs text-slate-500 font-medium">
                          Vehicle: <span className="font-bold">{a.vehicle.brand} {a.vehicle.model}</span> ({a.vehicle.vehicleNumber})
                        </p>
                        {a.description && (
                          <p className="text-xs text-slate-500 mt-1 italic font-medium">
                            Notes: "{a.description}"
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                        a.status === "Completed" ? "bg-green-100/80 text-green-800" :
                        a.status === "Cancelled" ? "bg-red-150/80 text-red-800" :
                        a.status === "Confirmed" ? "bg-blue-100/80 text-blue-800" : "bg-yellow-100/80 text-yellow-800"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-505">
                  <p className="text-sm font-semibold">You haven't scheduled any service center appointments yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Book your vehicle for customized predictive diagnostic tune-ups.</p>
                </div>
              )}
            </div>

            {/* SLEEK BOOKING MODAL DIALOG OVERLAY */}
            {showBookServiceModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setShowBookServiceModal(false)}
                />
                
                <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 z-10 animate-[slideUp_0.2s_ease-out]">
                  <button
                    onClick={() => setShowBookServiceModal(false)}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <PlusIcon className="h-5 w-5 rotate-45" />
                  </button>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Book Workshop Service</h3>
                    <p className="text-xs text-slate-500 mt-1">Reserve a physical workshop bay for priority repairs & diagnostics.</p>
                  </div>

                  {bookingError && (
                    <div className="mb-4 text-xs text-red-650 bg-red-50 border border-red-100 p-3 rounded-lg font-semibold">
                      {bookingError}
                    </div>
                  )}

                  <form onSubmit={handleBookAppointment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Select Registered Vehicle</label>
                      <select
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={bookingForm.vehicleId}
                        onChange={e => setBookingForm({ ...bookingForm, vehicleId: e.target.value })}
                        required
                      >
                        <option value="">-- Select Registered Vehicle --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.brand} {v.model} [{v.vehicleNumber}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date</label>
                      <input
                        type="date"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={bookingForm.appointmentDate}
                        onChange={e => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Arrival Time</label>
                      <select
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={bookingForm.appointmentTime}
                        onChange={e => setBookingForm({ ...bookingForm, appointmentTime: e.target.value })}
                        required
                      >
                        <option value="09:00">09:00 AM (Early Slot)</option>
                        <option value="11:00">11:00 AM (Midmorning Slot)</option>
                        <option value="13:00">01:00 PM (Afternoon Slot)</option>
                        <option value="15:00">03:00 PM (Late Slot)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Service Details / Notes</label>
                      <textarea
                        rows={2}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Describe issue (e.g. routine tune-up, squeaking front brakes...)"
                        value={bookingForm.description}
                        onChange={e => setBookingForm({ ...bookingForm, description: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowBookServiceModal(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-505 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Confirm Booking
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TABS: PART REQUESTS */}
        {activeTab === "parts" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[11px] font-extrabold tracking-widest text-emerald-600 uppercase">Sourcing Platform</span>
                <h1 className="text-3xl font-black text-slate-800 mt-1">Request Unavailable Parts</h1>
                <p className="text-sm text-slate-500">Can't find a spare part? Request custom items and our staff will source them for you.</p>
              </div>
              <button
                onClick={() => {
                  setPartSuccess("");
                  setPartError("");
                  setPartForm({ partName: "", description: "" });
                  setShowPartRequestModal(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <PlusIcon className="h-4.5 w-4.5" />
                Request Part
              </button>
            </div>

            {partSuccess && (
              <div className="text-xs text-green-700 bg-green-50 p-4 rounded-xl border border-green-150 font-bold">
                {partSuccess}
              </div>
            )}

            {/* REQUESTS LISTING - FULL WIDTH */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.02)] p-8 transition-all">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                Procurement Status
              </h2>

              {partRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partRequests.map(pr => (
                    <div key={pr.id} className="border border-slate-100 p-5 rounded-2xl flex items-center justify-between bg-white hover:border-emerald-600/30 transition-all shadow-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-400">Sourcing Request #{pr.id}</span>
                        <strong className="text-sm block text-slate-800 font-extrabold">{pr.partName}</strong>
                        {pr.description && <p className="text-xs text-slate-500 font-medium leading-relaxed">{pr.description}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                        pr.status === "Fulfilled" ? "bg-green-100/80 text-green-800" :
                        pr.status === "Approved" ? "bg-blue-100/80 text-blue-800" :
                        pr.status === "Rejected" ? "bg-red-150/80 text-red-800" : "bg-yellow-100/80 text-yellow-800"
                      }`}>
                        {pr.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm font-semibold">You haven't submitted any unavailable parts sourcing orders.</p>
                  <p className="text-xs text-slate-400 mt-1">Submit custom specs to procure hard-to-find components.</p>
                </div>
              )}
            </div>

            {/* SLEEK PART REQUEST MODAL DIALOG OVERLAY */}
            {showPartRequestModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setShowPartRequestModal(false)}
                />
                
                <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 z-10 animate-[slideUp_0.2s_ease-out]">
                  <button
                    onClick={() => setShowPartRequestModal(false)}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <PlusIcon className="h-5 w-5 rotate-45" />
                  </button>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">New Part Sourcing Request</h3>
                    <p className="text-xs text-slate-500 mt-1">Submit custom OEM specs to procure parts on demand.</p>
                  </div>

                  {partError && (
                    <div className="mb-4 text-xs text-red-655 bg-red-50 border border-red-100 p-3 rounded-lg font-semibold">
                      {partError}
                    </div>
                  )}

                  <form onSubmit={handlePartRequest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Part Name / Type *</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="e.g. Brembo Front Brake Rotors"
                        value={partForm.partName}
                        onChange={e => setPartForm({ ...partForm, partName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Description & Custom Specs</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[90px]"
                        placeholder="Include OEM numbers, manufacturing year, chassis/VIN numbers, or special notes."
                        value={partForm.description}
                        onChange={e => setPartForm({ ...partForm, description: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowPartRequestModal(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-505 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Submit Sourcing Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TABS: MY HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-8">
            <div>
              <span className="customer-eyebrow">Ledger Console</span>
              <h1 className="text-3xl font-black text-[#27302b] mt-1">Purchase & Service History</h1>
              <p className="text-sm text-[#686f66]">View your complete service records and purchases, including applied loyalty discounts.</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* PARTS PURCHASES (Requirement 14 & 16) */}
              <div className="border border-[#dedbd2] rounded-xl p-5 bg-[#fffdf8] shadow-sm">
                <h2 className="text-base font-black text-[#27302b] border-b border-[#dedbd2]/50 pb-2 mb-4 uppercase tracking-wide">
                  Parts Purchase Log
                </h2>

                {purchaseHistory.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {purchaseHistory.map(p => (
                      <div key={p.id} className="border border-[#dedbd2] p-4 rounded-xl bg-white space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-[#686f66] block">Invoice #{p.id}</span>
                            <span className="text-xs font-bold text-[#27302b]">
                              {new Date(p.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            p.paymentStatus === "Paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="border-t border-b border-[#dedbd2]/50 py-2 space-y-1">
                          {p.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-[#27302b]">
                              <span>{item.partName} <span className="text-[#686f66]">x{item.quantity}</span></span>
                              <span>Rs {item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1 text-xs text-right">
                          <div className="flex justify-between text-[#686f66]">
                            <span>Subtotal:</span>
                            <span>Rs {p.totalAmount}</span>
                          </div>
                          {p.discount > 0 && (
                            <div className="flex justify-between text-green-600 font-bold">
                              <span>Loyalty Discount (10%):</span>
                              <span>- Rs {p.discount}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-black text-[#27302b] pt-1">
                            <span>Total Due:</span>
                            <span>Rs {p.finalAmount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#686f66]">
                    <p className="text-sm">You haven't made any part purchases yet.</p>
                  </div>
                )}
              </div>

              {/* SERVICES RENDERED */}
              <div className="border border-[#dedbd2] rounded-xl p-5 bg-[#fffdf8] shadow-sm">
                <h2 className="text-base font-black text-[#27302b] border-b border-[#dedbd2]/50 pb-2 mb-4 uppercase tracking-wide">
                  Workshop Services History
                </h2>

                {serviceHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {serviceHistory.map(s => (
                      <div key={s.id} className="border border-[#dedbd2] p-4 rounded-xl bg-white flex justify-between items-center">
                        <div>
                          <strong className="text-sm block text-[#27302b]">{s.vehicle}</strong>
                          <span className="text-xs text-[#686f66] mt-1 block">
                            Visited on: {new Date(s.date).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          s.status === "Completed" ? "bg-green-100 text-green-800" :
                          s.status === "Cancelled" ? "bg-red-100 text-red-800" :
                          s.status === "Confirmed" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#686f66]">
                    <p className="text-sm">No past workshop appointment history records found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TABS: SUBMIT REVIEW */}
        {activeTab === "reviews" && (
          <div className="space-y-8">
            <div>
              <span className="customer-eyebrow">Customer Experience</span>
              <h1 className="text-3xl font-black text-[#27302b] mt-1">Submit workshop review</h1>
              <p className="text-sm text-[#686f66]">Help us improve by leaving feedback about your service center experience.</p>
            </div>

            <div className="grid grid-cols-3 gap-8">
              {/* REVIEW FORM */}
              <div className="col-span-1 border border-[#dedbd2] rounded-xl p-5 bg-[#fffdf8] shadow-sm">
                <h2 className="text-base font-black text-[#27302b] border-b border-[#dedbd2]/50 pb-2 mb-4 uppercase tracking-wide">
                  Rate our service
                </h2>

                {reviewSuccess && <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-200 mb-3">{reviewSuccess}</div>}
                {reviewError && <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded border border-red-200 mb-3">{reviewError}</div>}

                <form onSubmit={handleSubmitReview} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-[#27302b] mb-1">Select Rating (1 to 5 Stars)</label>
                    <div className="flex gap-2 text-[#047857]">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="hover:scale-115 transition-transform"
                        >
                          <StarIcon className={`h-8 w-8 ${reviewForm.rating >= star ? "fill-[#047857]" : "text-[#dedbd2]"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#27302b] mb-1">Share your experience</label>
                    <textarea
                      className="w-full border border-[#dedbd2] rounded p-2 text-xs bg-white min-h-[90px]"
                      placeholder="Was our staff helpful? Were the parts installed successfully? Let us know!"
                      value={reviewForm.comment}
                      onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#047857] hover:bg-[#27302b] text-white rounded text-xs font-bold transition-all mt-4"
                  >
                    Submit Verified Review
                  </button>
                </form>
              </div>

              {/* PAST REVIEWS */}
              <div className="col-span-2 border border-[#dedbd2] rounded-xl p-5 bg-[#fffdf8] shadow-sm">
                <h2 className="text-base font-black text-[#27302b] border-b border-[#dedbd2]/50 pb-2 mb-4 uppercase tracking-wide">
                  My Feedback Ledger
                </h2>

                {reviews.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {reviews.map(r => (
                      <div key={r.id} className="border border-[#dedbd2] p-4 rounded-xl bg-white space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1 text-[#047857]">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <StarIcon key={i} className="h-4 w-4 fill-[#047857]" />
                            ))}
                            {Array.from({ length: 5 - r.rating }).map((_, i) => (
                              <StarIcon key={i} className="h-4 w-4 text-[#dedbd2]" />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#27302b]">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#686f66]">
                    <p className="text-sm">You haven't submitted any service feedback reviews yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TABS: AI VEHICLE CONDITION PROGNOSTICS (User requested: AI analyzes vehicle condition & usage patterns) */}
        {activeTab === "ai" && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#047857] text-[#fffdf8] text-[9px] font-black tracking-widest uppercase">
                  AI Active System
                </span>
                <span className="text-xs text-[#686f66] font-bold">Predictive Failure Telemetry Console</span>
              </div>
              <h1 className="text-3xl font-black text-[#27302b] mt-1">AI Vehicle Condition Prognostics</h1>
              <p className="text-sm text-[#686f66]">
                Our integrated Artificial Intelligence analyzes your vehicle's specifications, purchase log history, and parts wear degradation patterns to predict failures before they happen.
              </p>
            </div>

            {aiLoading ? (
              <div className="text-center py-12 border border-[#dedbd2] rounded-xl bg-[#fffdf8] shadow-sm">
                <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-[#047857]" />
                <p className="mt-2 text-sm text-[#686f66]">Analyzing sensor parameters & parts catalog wear profiles...</p>
              </div>
            ) : aiPredictions.length > 0 ? (
              <div className="space-y-6">
                <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
                  aiPredictions.some(p => p.severity === "High") 
                    ? "bg-red-50 border-red-200 text-red-800" 
                    : "bg-green-50 border-green-200 text-green-800"
                }`}>
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 animate-pulse" />
                    <strong>{aiMessage}</strong>
                  </div>
                  <button 
                    onClick={fetchAiPredictions}
                    className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-md transition-all flex items-center gap-1"
                  >
                    <ArrowPathIcon className="h-3 w-3" /> Re-Analyze
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aiPredictions.map((p, idx) => (
                    <div key={idx} className="border border-[#dedbd2] rounded-xl p-5 bg-[#fffdf8] shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-black tracking-wide uppercase">
                            {p.vehicleName}
                          </span>
                          <h3 className="font-black text-[#27302b] text-lg mt-1">{p.component}</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          p.severity === "High" ? "bg-red-100 text-red-800" :
                          p.severity === "Medium" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                        }`}>
                          {p.severity} Risk ({p.probability}%)
                        </span>
                      </div>

                      {/* Probability Slider Visualizer */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-[#686f66]">
                          <span>Failure Risk Probability</span>
                          <span>{p.probability}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              p.severity === "High" ? "bg-red-500" :
                              p.severity === "Medium" ? "bg-orange-500" : "bg-green-500"
                            }`} 
                            style={{ width: `${p.probability}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                        <div className="bg-[#ecfdf5]/30 p-2.5 rounded-lg border border-emerald-600/20">
                          <span className="text-[#686f66] block font-bold">RUL (Remaining Useful Life)</span>
                          <strong className="text-[#27302b] text-sm mt-0.5 block">{p.remainingLife}</strong>
                        </div>
                        <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                          <span className="text-blue-700 block font-bold">Severity Diagnosis</span>
                          <strong className="text-blue-900 text-sm mt-0.5 block">{p.severity === "High" ? "Critical Care" : "Nominal Attention"}</strong>
                        </div>
                      </div>

                      <div className="text-xs text-[#27302b] bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
                        <strong className="font-bold block uppercase text-[10px] text-gray-500 tracking-wider">AI Diagnostics Justification</strong>
                        <p className="text-[#686f66] leading-relaxed">{p.reason}</p>
                      </div>

                      <div className="text-xs border-l-2 border-[#047857] pl-3 py-1 space-y-0.5">
                        <strong className="font-black text-[#27302b]">Recommended Action Plan:</strong>
                        <p className="text-[#686f66]">{p.recommendedAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-[#dedbd2] rounded-xl bg-[#fffdf8] shadow-sm">
                <p className="text-sm text-[#686f66]">No vehicles registered under your account yet.</p>
                <p className="text-xs text-gray-400 mt-1">Register a vehicle in the <strong>Profile & Vehicles</strong> tab to activate AI Telemetry Diagnostics.</p>
                <button 
                  onClick={() => setActiveTab("profile")}
                  className="mt-4 px-3 py-1.5 bg-[#047857] hover:bg-[#27302b] text-white text-xs font-bold rounded-md transition-all"
                >
                  Go to Profile & Vehicles
                </button>
              </div>
            )}
          </div>
        )}

        </div>
      </main>
    </div>
  );
}
