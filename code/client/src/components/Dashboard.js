import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES, PERMISSIONS, hasPermission } from "../aws/userRoles";
import apiService from "../services/api";
import {
  Users,
  Menu,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
  FileText,
  DollarSign,
  LogOut,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = currentUser?.userRole || USER_ROLES.EMPLOYEE;
  const isOwner = userRole === USER_ROLES.OWNER;

  console.log("Auth debug - currentUser:", currentUser);
  console.log("Auth debug - userRole:", userRole);
  console.log("Auth debug - isOwner:", isOwner);

  // Check if user is logged in
  if (!currentUser) {
    console.log("❌ User is not logged in!");
  } else {
    console.log("✅ User is logged in");
  }

  // State for real data
  const [dashboardData, setDashboardData] = useState({
    menuItemsCount: 0,
    employeesCount: 0,
    totalSales: 0,
    ordersToday: 0,
    myOrders: 0,
    myPerformance: 0,
  });
  const [subscriptionData, setSubscriptionData] = useState({
    subscriptionPlan: 'Free Trial',
    subscriptionStatus: 'trial',
    trialEndDate: null,
    subscriptionStartDate: null,
    subscriptionEndDate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmployeeManagementOpen, setIsEmployeeManagementOpen] = useState(false);
  const [isMenuManagementOpen, setIsMenuManagementOpen] = useState(false);

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // If user is not logged in, don't fetch data
        if (!currentUser) {
          console.log("User not logged in, skipping data fetch");
          setLoading(false);
          return;
        }

        if (isOwner) {
          // Fetch data for owners
          const [menuResponse, employeesResponse, analyticsResponse, ownerProfileResponse] =
            await Promise.all([
              apiService.getMenuItems(),
              apiService.getEmployees(),
              apiService.getAnalyticsOverview("7d"),
              apiService.getOwnerProfile(),
            ]);

          // Update subscription data from owner profile
          if (ownerProfileResponse.success && ownerProfileResponse.data) {
            const ownerData = ownerProfileResponse.data;

            // Calculate trialEndDate from createdAt if not set (for existing users)
            let trialEndDate = null;
            if (ownerData.trialEndDate) {
              trialEndDate = new Date(ownerData.trialEndDate);
            } else if (ownerData.createdAt) {
              // Set trial end date to 30 days from account creation
              const createdAt = new Date(ownerData.createdAt);
              trialEndDate = new Date(createdAt);
              trialEndDate.setDate(trialEndDate.getDate() + 30);
              console.log('📅 Calculated trialEndDate from createdAt:', {
                createdAt: createdAt.toISOString(),
                trialEndDate: trialEndDate.toISOString()
              });
            }

            setSubscriptionData({
              subscriptionPlan: ownerData.subscriptionPlan || 'Free Trial',
              subscriptionStatus: ownerData.subscriptionStatus || 'trial',
              trialEndDate: trialEndDate,
              subscriptionStartDate: ownerData.subscriptionStartDate ? new Date(ownerData.subscriptionStartDate) : null,
              subscriptionEndDate: ownerData.subscriptionEndDate ? new Date(ownerData.subscriptionEndDate) : null,
              autoPayment: ownerData.autoPayment || false
            });

            console.log('📊 Subscription data updated:', {
              trialEndDate: trialEndDate?.toISOString(),
              subscriptionPlan: ownerData.subscriptionPlan,
              subscriptionStatus: ownerData.subscriptionStatus,
              subscriptionStartDate: ownerData.subscriptionStartDate,
              subscriptionEndDate: ownerData.subscriptionEndDate
            });
          } else {
            console.warn('⚠️ Failed to fetch owner profile:', ownerProfileResponse);
          }

          console.log("Dashboard API Responses:", {
            menu: menuResponse,
            employees: employeesResponse,
            analytics: analyticsResponse,
          });

          const newData = {
            menuItemsCount: menuResponse.success ? menuResponse.data.length : 0,
            employeesCount: employeesResponse.success
              ? employeesResponse.data.length
              : 0,
            totalSales: analyticsResponse.success
              ? analyticsResponse.data.data?.sales?.totalRevenue ||
              analyticsResponse.data.sales?.totalRevenue ||
              0
              : 0,
            ordersToday: analyticsResponse.success
              ? analyticsResponse.data.data?.sales?.totalOrders ||
              analyticsResponse.data.sales?.totalOrders ||
              0
              : 0,
            myOrders: 0, // Not applicable for owners
            myPerformance: 0, // Not applicable for owners
          };

          console.log("Setting dashboard data:", newData);
          setDashboardData(newData);
        } else {
          // Fetch data for employees
          const menuResponse = await apiService.getMenuItems();

          setDashboardData({
            menuItemsCount: menuResponse.success ? menuResponse.data.length : 0,
            employeesCount: 0, // Not applicable for employees
            totalSales: 0, // Not applicable for employees
            ordersToday: 0, // Would need to implement employee-specific orders
            myOrders: 0, // Would need to implement employee-specific orders
            myPerformance: 85, // Placeholder - would need employee performance data
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isOwner, currentUser]);

  const refreshDashboard = () => {
    setError(null);
    setLoading(true);
    // Re-trigger the useEffect
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Debug current dashboard data
  console.log("Current dashboard data state:", dashboardData);
  console.log("Current user:", currentUser);
  console.log("User role:", userRole);
  console.log("Is owner:", isOwner);

  // Role-based stats with real data
  const stats = isOwner
    ? [
      {
        label: "Total Sales",
        value: `$${dashboardData.totalSales.toFixed(2)}`,
        icon: DollarSign,
        color: "from-green-500 to-green-600",
      },
      {
        label: "Orders Today",
        value: dashboardData.ordersToday.toString(),
        icon: ShoppingCart,
        color: "from-blue-500 to-blue-600",
      },
      {
        label: "Menu Items",
        value: dashboardData.menuItemsCount.toString(),
        icon: Menu,
        color: "from-purple-500 to-purple-600",
      },
      {
        label: "Employees",
        value: dashboardData.employeesCount.toString(),
        icon: Users,
        color: "from-orange-500 to-orange-600",
      },
    ]
    : [
      {
        label: "My Orders",
        value: dashboardData.myOrders.toString(),
        icon: ShoppingCart,
        color: "from-blue-500 to-blue-600",
      },
      {
        label: "Orders Today",
        value: dashboardData.ordersToday.toString(),
        icon: FileText,
        color: "from-green-500 to-green-600",
      },
      {
        label: "Menu Items",
        value: dashboardData.menuItemsCount.toString(),
        icon: Menu,
        color: "from-purple-500 to-purple-600",
      },
      {
        label: "My Performance",
        value: `${dashboardData.myPerformance}%`,
        icon: BarChart3,
        color: "from-orange-500 to-orange-600",
      },
    ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Calculate trial days remaining
  const trialEndDate = subscriptionData.trialEndDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day

  let daysRemaining = 0;
  if (trialEndDate && trialEndDate instanceof Date && !isNaN(trialEndDate)) {
    const endDate = new Date(trialEndDate);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate - today;
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to access the dashboard.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshDashboard}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  POS Pro Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {currentUser?.businessName || "User"}!
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${isOwner
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {isOwner ? "👑 Owner" : "👨‍🍳 Employee"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Subscription Status */}
              {subscriptionData.subscriptionStatus === 'active' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <p className="text-sm font-medium text-green-800">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    {subscriptionData.subscriptionPlan} Plan Active
                  </p>
                </div>
              ) : subscriptionData.subscriptionStatus === 'trial' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                  <p className="text-sm font-medium text-yellow-800">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {daysRemaining} days left in trial
                  </p>
                </div>
              ) : null}

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{currentUser?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Welcome Section */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-8"
          >
            <h2 className="text-3xl font-bold mb-4">
              {isOwner
                ? "Welcome to Your Restaurant Management Hub! 👑"
                : "Welcome to Your POS Station! 👨‍🍳"}
            </h2>
            <p className="text-lg text-blue-100 mb-6">
              {isOwner
                ? `You're now managing your restaurant operations. Your ${daysRemaining}-day free trial has started, and you have full control over your POS system.`
                : `You're ready to handle orders and serve customers. Your ${daysRemaining}-day free trial gives you access to all operational features.`}
            </p>
            <div className="flex flex-wrap gap-4">
              {isOwner ? (
                <>
                  <motion.button
                    onClick={() => navigate("/employees")}
                    className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Manage Employees
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/analytics")}
                    className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Analytics
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    onClick={() => navigate("/orders/new")}
                    className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Take New Order
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/menu")}
                    className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Menu
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="card p-6 hover:shadow-lg transition-all duration-300"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-gray-600">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Getting Started Section */}
          <motion.div
            variants={itemVariants}
            className="grid lg:grid-cols-2 gap-8"
          >
            {/* Quick Actions */}
            <div className="card p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Quick Actions
              </h3>
              <div className="space-y-4">
                {isOwner ? (
                  <>
                    {hasPermission(
                      userRole,
                      PERMISSIONS.CAN_CREATE_EMPLOYEE
                    ) && (
                        <>
                          {/* Employee Management Section */}
                          <div className="mb-4">
                            <button
                              onClick={() => setIsEmployeeManagementOpen(!isEmployeeManagementOpen)}
                              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Users className="w-6 h-6 text-primary-600" />
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      Employee Management
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Manage employees and schedules
                                    </p>
                                  </div>
                                </div>
                                {isEmployeeManagementOpen ? (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                            </button>
                            {isEmployeeManagementOpen && (
                              <div className="space-y-3 pl-2 mt-3">
                                <button
                                  onClick={() => navigate("/employees")}
                                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Users className="w-6 h-6 text-primary-600" />
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        Add Employee
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        Create new employee accounts
                                      </p>
                                    </div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => navigate("/schedules")}
                                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Clock className="w-6 h-6 text-primary-600" />
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        Schedule Management
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        Set and manage employee weekly schedules
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    {hasPermission(
                      userRole,
                      PERMISSIONS.CAN_MANAGE_MENU_ITEMS
                    ) && (
                        <>
                          {/* Menu Management Section */}
                          <div className="mb-4">
                            <button
                              onClick={() => setIsMenuManagementOpen(!isMenuManagementOpen)}
                              className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Menu className="w-6 h-6 text-primary-600" />
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      Menu Management
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Manage menu items and availability
                                    </p>
                                  </div>
                                </div>
                                {isMenuManagementOpen ? (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                            </button>
                            {isMenuManagementOpen && (
                              <div className="space-y-3 pl-2 mt-3">
                                <button
                                  onClick={() => navigate("/menu/manage")}
                                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Menu className="w-6 h-6 text-primary-600" />
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        Manage Menu
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        Add or edit menu items and categories
                                      </p>
                                    </div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => navigate("/menu/availability")}
                                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Calendar className="w-6 h-6 text-primary-600" />
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        Schedule Availability
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        Set and manage menu item availability schedules
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    {hasPermission(
                      userRole,
                      PERMISSIONS.CAN_VIEW_SALES_ANALYTICS
                    ) && (
                        <button
                          onClick={() => navigate("/analytics")}
                          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <BarChart3 className="w-6 h-6 text-primary-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                View Analytics
                              </h4>
                              <p className="text-sm text-gray-600">
                                Analyze sales and performance data
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                    {hasPermission(
                      userRole,
                      PERMISSIONS.CAN_MANAGE_RESTAURANT_DETAILS
                    ) && (
                        <button
                          onClick={() => navigate("/settings")}
                          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Settings className="w-6 h-6 text-primary-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Restaurant Settings
                              </h4>
                              <p className="text-sm text-gray-600">
                                Configure restaurant details and preferences
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                  </>
                ) : (
                  <>
                    {hasPermission(
                      userRole,
                      PERMISSIONS.CAN_TAKE_DINE_IN_ORDERS
                    ) && (
                        <button
                          onClick={() => navigate("/pos")}
                          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <ShoppingCart className="w-6 h-6 text-primary-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                POS System
                              </h4>
                              <p className="text-sm text-gray-600">
                                Access the point of sale system
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                    {hasPermission(
                      userRole,
                      PERMISSIONS.CAN_HANDLE_ONLINE_ORDERS
                    ) && (
                        <button
                          onClick={() => navigate("/orders/online")}
                          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-6 h-6 text-primary-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Online Orders
                              </h4>
                              <p className="text-sm text-gray-600">
                                View and process online orders
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                    {hasPermission(
                      userRole,
                      PERMISSIONS.CAN_PROCESS_PAYMENTS
                    ) && (
                        <button
                          onClick={() => navigate("/payments")}
                          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-6 h-6 text-primary-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Process Payment
                              </h4>
                              <p className="text-sm text-gray-600">
                                Handle customer payments
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                    {hasPermission(
                      userRole,
                      PERMISSIONS.CAN_VIEW_MENU_ITEMS
                    ) && (
                        <button
                          onClick={() => navigate("/menu")}
                          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Menu className="w-6 h-6 text-primary-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                View Menu
                              </h4>
                              <p className="text-sm text-gray-600">
                                Browse available menu items
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                  </>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="card p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Account Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Business Name</span>
                  <span className="font-medium">
                    {currentUser?.businessName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{currentUser?.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Role</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${isOwner
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {isOwner ? "👑 Owner" : "👨‍🍳 Employee"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Business Type</span>
                  <span className="font-medium capitalize">
                    {currentUser?.businessType || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Plan</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${subscriptionData.subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {subscriptionData.subscriptionPlan || 'Free Trial'}
                  </span>
                </div>
                {subscriptionData.subscriptionStatus === 'active' ? (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Current Period</span>
                      <span className="font-medium">
                        {subscriptionData.subscriptionStartDate && subscriptionData.subscriptionStartDate instanceof Date && !isNaN(subscriptionData.subscriptionStartDate)
                          ? subscriptionData.subscriptionStartDate.toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Next Billing Date</span>
                      <span className="font-medium">
                        {subscriptionData.subscriptionEndDate && subscriptionData.subscriptionEndDate instanceof Date && !isNaN(subscriptionData.subscriptionEndDate)
                          ? subscriptionData.subscriptionEndDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : 'N/A'}
                      </span>
                    </div>
                    {subscriptionData.autoPayment && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Auto-Payment</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Enabled
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Trial Expires</span>
                    <span className="font-medium">
                      {trialEndDate && trialEndDate instanceof Date && !isNaN(trialEndDate)
                        ? trialEndDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
