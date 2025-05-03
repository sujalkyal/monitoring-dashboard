"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

// TypeScript type definitions
type MetricType = "cpu" | "memory" | "network" | "temperature";
type StatusType = "normal" | "warning" | "critical";
type ThresholdType = Record<StatusType, number>;

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  type: MetricType;
  history: { timestamp: number; value: number }[];
}

interface Alert {
  id: string;
  timestamp: number;
  message: string;
  type: StatusType;
  metric: string;
  value: number;
  acknowledged: boolean;
}

interface HistoricalData {
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
  temperature: number;
}

// Dashboard sections
type ActiveSection = "dashboard" | "alerts" | "settings";

const MonitoringDashboard: React.FC = () => {
  // State for active section
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("dashboard");

  // Mock thresholds (can be changed in settings)
  const [thresholds, setThresholds] = useState<
    Record<MetricType, ThresholdType>
  >({
    cpu: { normal: 60, warning: 80, critical: 100 },
    memory: { normal: 50, warning: 75, critical: 100 },
    network: { normal: 60, warning: 80, critical: 100 },
    temperature: { normal: 65, warning: 85, critical: 100 },
  });

  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // Default 5s
  const [selectedInterval, setSelectedInterval] = useState<string>("5"); // For dropdown control

  // Random data generation functions
  const generateRandomValue = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateHistoricalData = (count: number): HistoricalData[] => {
    const data: HistoricalData[] = [];
    const now = Date.now();

    for (let i = count - 1; i >= 0; i--) {
      data.push({
        timestamp: now - i * 60000, // 1 minute intervals
        cpu: generateRandomValue(30, 95),
        memory: generateRandomValue(40, 90),
        network: generateRandomValue(20, 95),
        temperature: generateRandomValue(30, 90),
      });
    }

    return data;
  };

  // States for metrics, alerts and historical data
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      id: "cpu",
      name: "CPU Usage",
      value: generateRandomValue(50, 85),
      unit: "%",
      type: "cpu",
      history: [],
    },
    {
      id: "memory",
      name: "Memory Usage",
      value: generateRandomValue(40, 80),
      unit: "%",
      type: "memory",
      history: [],
    },
    {
      id: "network",
      name: "Network Load",
      value: generateRandomValue(30, 90),
      unit: "%",
      type: "network",
      history: [],
    },
    {
      id: "temperature",
      name: "Server Temperature",
      value: generateRandomValue(35, 80),
      unit: "°C",
      type: "temperature",
      history: [],
    },
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>(
    generateHistoricalData(20)
  );

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempThresholds, setTempThresholds] = useState({ ...thresholds });

  // Function to get status based on value and thresholds
  const getStatus = useCallback(
    (value: number, type: MetricType): StatusType => {
      if (value <= thresholds[type].normal) return "normal";
      if (value <= thresholds[type].warning) return "warning";
      return "critical";
    },
    [thresholds]
  );

  // Function to generate a new alert if needed
  const checkForNewAlerts = (updatedMetrics: Metric[]) => {
    const newAlerts: Alert[] = [];

    updatedMetrics.forEach((metric) => {
      const status = getStatus(metric.value, metric.type);
      if (status === "warning" || status === "critical") {
        // 30% chance to generate an alert
        if (Math.random() < 0.3) {
          newAlerts.push({
            id: `alert-${crypto.randomUUID?.() || metric.id}`,
            timestamp: Date.now(),
            message: `${status === "critical" ? "CRITICAL" : "WARNING"}: ${
              metric.name
            } has reached ${metric.value}${metric.unit}`,
            type: status,
            metric: metric.id,
            value: metric.value,
            acknowledged: false,
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 20));
    }
  };

  // Update metrics every 5 seconds
  useEffect(() => {
    const updateIntervalId = setInterval(() => {
      setMetrics((prevMetrics) => {
        const updatedMetrics = prevMetrics.map((metric) => {
          const newValue = generateRandomValue(30, 95);
          return {
            ...metric,
            value: newValue,
            history: [
              { timestamp: Date.now(), value: newValue },
              ...metric.history,
            ].slice(0, 20),
          };
        });

        checkForNewAlerts(updatedMetrics);

        const newDataPoint = {
          timestamp: Date.now(),
          cpu: updatedMetrics.find((m) => m.id === "cpu")?.value || 0,
          memory: updatedMetrics.find((m) => m.id === "memory")?.value || 0,
          network: updatedMetrics.find((m) => m.id === "network")?.value || 0,
          temperature:
            updatedMetrics.find((m) => m.id === "temperature")?.value || 0,
        };

        setHistoricalData((prev) => [...prev, newDataPoint].slice(-20));
        return updatedMetrics;
      });
    }, refreshInterval);

    return () => clearInterval(updateIntervalId);
  }, [refreshInterval]);

  // Get color for status
  const getStatusColor = (status: StatusType): string => {
    console.log("getStatusColor", status);
    switch (status) {
      case "critical":
        return "text-red-500 bg-red-900/20";
      case "warning":
        return "text-yellow-400 bg-yellow-900/20";
      case "normal":
        return "text-emerald-400 bg-emerald-900/20";
    }
  };

  // Get glow color for status
  const getStatusGlow = (status: StatusType): string => {
    console.log("getStatusGlow", status);
    switch (status) {
      case "critical":
        return "shadow-red-500/50 border-red-500/50 shadow-lg";
      case "warning":
        return "shadow-yellow-400/50 border-yellow-400/50 shadow-lg";
      case "normal":
        return "shadow-emerald-400/50 border-emerald-400/50 shadow-lg";
    }
  };

  // Get status icon
  const StatusIcon: React.FC<{ status: StatusType }> = ({ status }) => {
    return (
      <div
        className={`w-3 h-3 rounded-full ${
          status === "critical"
            ? "bg-red-500"
            : status === "warning"
            ? "bg-yellow-400"
            : "bg-emerald-400"
        }`}
      />
    );
  };

  // Date/Time formatter
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Charts configuration
  const chartConfig = {
    margin: { top: 5, right: 20, left: 0, bottom: 5 },
  };

  // Handle alert acknowledgement
  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  // Save settings
  const saveSettings = () => {
    const sanitizedThresholds: any = { ...tempThresholds };

    Object.keys(sanitizedThresholds).forEach((type) => {
      const t = sanitizedThresholds[type];

      // Force critical upper bound to 100
      t.critical = 100;

      // Ensure warning < critical
      if (t.warning >= 100) {
        t.warning = 99;
      }

      // Ensure normal < warning
      if (t.normal >= t.warning) {
        t.normal = t.warning - 1;
      }
    });

    setThresholds(sanitizedThresholds);
    setShowSettingsModal(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const cardVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.3)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const alertVariants = {
    initial: { x: -50, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 14,
      },
    },
    exit: {
      x: 50,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  if (!hasMounted) return null;

  return (
    <div className="min-h-screen bg-gray-900 font-inter text-gray-100">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <motion.div
                  className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center"
                  initial={false}
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(59, 130, 246, 0.2)",
                      "0 0 0 10px rgba(59, 130, 246, 0)",
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeOut",
                  }}
                >
                  <span className="text-white font-bold">OP</span>
                </motion.div>
              </div>
              <div className="ml-4 font-bold text-xl text-blue-400">
                OptiPulse Monitor
              </div>
            </div>
            <div className="flex">
              <div className="flex space-x-1 sm:space-x-4">
                <NavButton
                  label="Dashboard"
                  isActive={activeSection === "dashboard"}
                  onClick={() => setActiveSection("dashboard")}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 hover:cursor-pointer"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                  }
                />
                <NavButton
                  label="Alerts"
                  isActive={activeSection === "alerts"}
                  onClick={() => setActiveSection("alerts")}
                  badge={
                    alerts.filter((alert) => !alert.acknowledged).length > 0
                      ? alerts.filter((alert) => !alert.acknowledged).length
                      : undefined
                  }
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 hover:cursor-pointer"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
                <NavButton
                  label="Settings"
                  isActive={activeSection === "settings"}
                  onClick={() => setActiveSection("settings")}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 hover:cursor-pointer"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <AnimatePresence mode="wait">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={false}
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              className="py-6"
            >
              {/* Hero / Landing Section */}
              <motion.div
                variants={itemVariants}
                initial={false}
                className="mb-8 px-6 py-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700"
              >
                <h1 className="text-4xl font-bold text-blue-400 mb-2">
                  Real-Time System Monitoring
                </h1>
                <p className="text-gray-300 max-w-3xl">
                  Welcome to OptiPulse Monitor, your comprehensive system
                  monitoring dashboard. Monitor performance metrics in
                  real-time, receive instant alerts, and optimize your
                  infrastructure with precision.
                </p>
              </motion.div>

              {/* Live Stats Cards */}
              <motion.div variants={itemVariants} className="mb-8" initial={false}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-white">
                    Live Metrics
                  </h2>
                  <div className="flex items-center text-gray-400 text-sm">
                    <span>Auto-refreshing every {refreshInterval/1000}s</span>
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 5,
                        ease: "linear",
                      }}
                      className="ml-2"
                      initial={false}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metrics.map((metric) => {
                    console.log(
                      `${metric.name} (${metric.value}${metric.unit})`,
                      "Thresholds:",
                      thresholds[metric.type],
                      "Status:",
                      getStatus(metric.value, metric.type)
                    );
                    const status = getStatus(metric.value, metric.type);
                    return (
                      <motion.div
                        key={`${metric.id}-${status}`}
                        variants={cardVariants}
                        whileHover="hover"
                        initial={false}
                        className={`bg-gray-800 rounded-lg p-4 border ${getStatusGlow(
                          status
                        )} transition-all duration-300`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-gray-300 font-medium">
                            {metric.name}
                          </h3>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(
                              status
                            )}`}
                          >
                            <StatusIcon status={status} />
                            <span>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-end mt-2">
                          <div className="text-3xl font-bold text-white">
                            {metric.value}
                          </div>
                          <div className="text-lg ml-1 text-gray-400">
                            {metric.unit}
                          </div>
                        </div>
                        <div className="mt-3 h-16">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={[...metric.history]
                                .reverse()
                                .map((h, index) => ({
                                  time: formatTime(h.timestamp),
                                  value: h.value,
                                }))}
                              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                            >
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={
                                  status === "critical"
                                    ? "#f56565"
                                    : status === "warning"
                                    ? "#ecc94b"
                                    : "#68d391"
                                }
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Charts Section */}
              <motion.div variants={itemVariants} className="mb-8" initial={false}>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Performance Trends
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Line Chart */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg">
                    <h3 className="text-lg font-medium text-gray-300 mb-4">
                      System Metrics (Last 20 minutes)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={historicalData.map((item, index) => ({
                            name: formatTime(item.timestamp),
                            cpu: item.cpu,
                            memory: item.memory,
                            network: item.network,
                          }))}
                          margin={chartConfig.margin}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#9CA3AF" }}
                            tickFormatter={(value) => value.substring(0, 5)}
                          />
                          <YAxis tick={{ fill: "#9CA3AF" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1F2937",
                              border: "1px solid #374151",
                              borderRadius: "0.375rem",
                              color: "#F9FAFB",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="cpu"
                            name="CPU Usage"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="memory"
                            name="Memory Usage"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="network"
                            name="Network Load"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg">
                    <h3 className="text-lg font-medium text-gray-300 mb-4">
                      Temperature Trends
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={historicalData
                            .filter((_, index) => index % 2 === 0)
                            .map((item, index) => ({
                              name: formatTime(item.timestamp),
                              temperature: item.temperature,
                            }))}
                          margin={chartConfig.margin}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#9CA3AF" }}
                            tickFormatter={(value) => value.substring(0, 5)}
                          />
                          <YAxis tick={{ fill: "#9CA3AF" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1F2937",
                              border: "1px solid #374151",
                              borderRadius: "0.375rem",
                              color: "#F9FAFB",
                            }}
                            formatter={(value) => [`${value}°C`, "Temperature"]}
                          />
                          <defs>
                            <linearGradient
                              id="temperatureGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#F87171"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#F87171"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="temperature"
                            name="Temperature"
                            stroke="#F87171"
                            fill="url(#temperatureGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Alert Notifications Panel */}
              <motion.div variants={itemVariants} initial={false}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-white">
                    Recent Alerts
                  </h2>
                  <button
                    onClick={() => setActiveSection("alerts")}
                    className="text-blue-400 hover:text-blue-300 flex items-center hover:cursor-pointer"
                  >
                    View all
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      No alerts at this time. All systems normal.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      <AnimatePresence>
                        {alerts.slice(0, 5).map((alert) => (
                          <motion.div
                            key={alert.id}
                            variants={alertVariants}
                            initial={false}
                            animate="animate"
                            exit="exit"
                            className={`border-l-4 ${
                              alert.type === "critical"
                                ? "border-red-500 bg-red-900/10"
                                : "border-yellow-400 bg-yellow-900/10"
                            } p-4 flex items-start ${
                              alert.acknowledged ? "opacity-60" : ""
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                alert.type === "critical"
                                  ? "bg-red-900/50 text-red-500"
                                  : "bg-yellow-900/50 text-yellow-400"
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`text-sm font-medium ${
                                    alert.type === "critical"
                                      ? "text-red-400"
                                      : "text-yellow-300"
                                  }`}
                                >
                                  {alert.message}
                                </p>
                                <span className="text-xs text-gray-400">
                                  {formatTime(alert.timestamp)}
                                </span>
                              </div>
                              <div className="mt-1 flex justify-between items-center">
                                <span className="text-xs text-gray-400">
                                  {alert.metric.toUpperCase()} · {alert.value}
                                  {
                                    metrics.find((m) => m.id === alert.metric)
                                      ?.unit
                                  }
                                </span>
                                {!alert.acknowledged && (
                                  <button
                                    onClick={() => acknowledgeAlert(alert.id)}
                                    className="text-xs text-blue-400 hover:text-blue-300 hover:cursor-pointer"
                                  >
                                    Acknowledge
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Alerts Section */}
          {activeSection === "alerts" && (
            <motion.div
              key="alerts"
              initial={false}
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              className="py-6"
            >
              <motion.div variants={itemVariants} className="mb-6" initial={false}>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Alert Management
                </h1>
                <p className="text-gray-400">
                  View and manage all system alerts from one central location
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                initial={false}
                className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden"
              >
                <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                  <div className="flex items-center">
                    <h2 className="text-xl font-semibold text-white">
                      All Alerts
                    </h2>
                    <div className="ml-4 flex">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900/20 text-red-500 flex items-center gap-1 mr-2">
                        <StatusIcon status="critical" />
                        <span>
                          {alerts.filter((a) => a.type === "critical").length}{" "}
                          Critical
                        </span>
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-900/20 text-yellow-400 flex items-center gap-1">
                        <StatusIcon status="warning" />
                        <span>
                          {alerts.filter((a) => a.type === "warning").length}{" "}
                          Warning
                        </span>
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {alerts.length} total alerts
                  </span>
                </div>

                {alerts.length === 0 ? (
                  <div className="p-10 text-center text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto mb-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-medium mb-1">
                      All Systems Normal
                    </h3>
                    <p>
                      No alerts to display. Your systems are running smoothly.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    <AnimatePresence>
                      {alerts.map((alert) => (
                        <motion.div
                          key={alert.id}
                          variants={alertVariants}
                          initial={false}
                          animate="animate"
                          exit="exit"
                          className={`p-4 flex ${
                            alert.acknowledged
                              ? "bg-gray-800/50"
                              : "bg-gray-800"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              alert.type === "critical"
                                ? "bg-red-900/50 text-red-500"
                                : "bg-yellow-900/50 text-yellow-400"
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <p
                                className={`font-medium ${
                                  alert.type === "critical"
                                    ? "text-red-400"
                                    : "text-yellow-300"
                                } ${alert.acknowledged ? "opacity-70" : ""}`}
                              >
                                {alert.message}
                              </p>
                              <span className="text-sm text-gray-400">
                                {formatTime(alert.timestamp)}
                              </span>
                            </div>
                            <div className="mt-1 flex justify-between items-center">
                              <span className="text-sm text-gray-400">
                                {alert.metric.toUpperCase()} · {alert.value}
                                {
                                  metrics.find((m) => m.id === alert.metric)
                                    ?.unit
                                }
                              </span>
                              {!alert.acknowledged && (
                                <button
                                  onClick={() => acknowledgeAlert(alert.id)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors duration-200 hover:cursor-pointer"
                                >
                                  Acknowledge
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <motion.div
              key="settings"
              initial={false}
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              className="py-6"
            >
              <motion.div variants={itemVariants} className="mb-6" initial={false}>
                <h1 className="text-3xl font-bold text-white mb-2">
                  System Settings
                </h1>
                <p className="text-gray-400">
                  Configure thresholds and notification preferences
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                initial={false}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                <div className="lg:col-span-8">
                  <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
                    <div className="p-4 bg-gray-800 border-b border-gray-700">
                      <h2 className="text-xl font-semibold text-white">
                        Alert Thresholds
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Configure when alerts should be triggered for each
                        metric
                      </p>
                    </div>

                    <div className="p-6">
                      {Object.keys(thresholds).map((metricKey) => {
                        const metricType = metricKey as MetricType;
                        const metric = metrics.find(
                          (m) => m.type === metricType
                        );

                        return (
                          <div key={metricKey} className="mb-6 last:mb-0">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-medium text-white">
                                {metric?.name}
                              </h3>
                              <span className="text-sm text-gray-400">
                                Current: {metric?.value}
                                {metric?.unit}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <div className="flex justify-between mb-1">
                                  <span className="text-emerald-400 text-sm font-medium">
                                    Normal
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    0{metric?.unit} -{" "}
                                    {thresholds[metricType].normal}
                                    {metric?.unit}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max={thresholds[metricType].warning - 1}
                                  value={thresholds[metricType].normal}
                                  onChange={(e) => {
                                    const newValue = parseInt(e.target.value);
                                    setThresholds((prev) => ({
                                      ...prev,
                                      [metricType]: {
                                        ...prev[metricType],
                                        normal: newValue,
                                      },
                                    }));
                                  }}
                                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                                />
                              </div>
                              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <div className="flex justify-between mb-1">
                                  <span className="text-yellow-400 text-sm font-medium">
                                    Warning
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    {thresholds[metricType].normal + 1}
                                    {metric?.unit} -{" "}
                                    {thresholds[metricType].warning}
                                    {metric?.unit}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={thresholds[metricType].normal + 1}
                                  max="99"
                                  value={thresholds[metricType].warning}
                                  onChange={(e) => {
                                    const newValue = parseInt(e.target.value);
                                    setThresholds((prev) => ({
                                      ...prev,
                                      [metricType]: {
                                        ...prev[metricType],
                                        warning: newValue,
                                      },
                                    }));
                                  }}
                                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                                />
                              </div>
                              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <div className="flex justify-between mb-1">
                                  <span className="text-red-500 text-sm font-medium">
                                    Critical
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    {thresholds[metricType].warning + 1}
                                    {metric?.unit} - 100{metric?.unit}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={thresholds[metricType].warning + 1}
                                  max="100"
                                  value={100}
                                  readOnly
                                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="mt-8 flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            // Update metrics with new thresholds
                            setMetrics((prev) =>
                              prev.map((metric) => ({
                                ...metric,
                                thresholds: thresholds[metric.type],
                              }))
                            );
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-lg transition-colors duration-200 hover:cursor-pointer"
                        >
                          Save Changes
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
                    <div className="p-4 border-b border-gray-700">
                      <h2 className="text-xl font-semibold text-white">
                        System Info
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Dashboard Version
                        </div>
                        <div className="text-white">OptiPulse v1.2.5</div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Last Updated
                        </div>
                        <div className="text-white">
                          {formatDate(Date.now())}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">Status</div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                          <span className="text-emerald-400">Operational</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
                    <div className="p-4 border-b border-gray-700">
                      <h2 className="text-xl font-semibold text-white">
                        Data Refresh
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Auto-refresh Interval
                        </div>
                        <div className="relative mt-2">
                          <select
                            className="w-full bg-gray-900 border border-gray-700 text-white py-2 px-3 rounded-md appearance-none"
                            value={selectedInterval}
                            onChange={(e) =>
                              setSelectedInterval(e.target.value)
                            }
                          >
                            <option value="1">1 second</option>
                            <option value="5">5 seconds</option>
                            <option value="15">15 seconds</option>
                            <option value="30">30 seconds</option>
                            <option value="60">1 minute</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <button
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-lg transition-colors duration-200 flex items-center justify-center hover:cursor-pointer"
                          onClick={() =>
                            setRefreshInterval(Number(selectedInterval) * 1000)
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">OP</span>
              </div>
              <span className="ml-2 text-gray-300 font-semibold">
                OptiPulse Monitor
              </span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                Documentation
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                Support
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                Privacy
              </a>
            </div>
            <div className="mt-4 md:mt-0 text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} OptiPulse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40"
              onClick={() => setShowSettingsModal(false)}
            />
            <motion.div
              initial={false}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 15 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-auto p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">
                    Adjust Thresholds
                  </h3>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-gray-400 hover:text-white hover:cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  {Object.keys(tempThresholds).map((metricKey) => {
                    const metricType = metricKey as MetricType;
                    const metric = metrics.find((m) => m.type === metricType);

                    return (
                      <div key={metricKey} className="mb-6 last:mb-0">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">
                          {metric?.name}
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-emerald-400 text-sm">
                                Normal threshold
                              </span>
                              <span className="text-white">
                                {tempThresholds[metricType].normal}
                                {metric?.unit}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={tempThresholds[metricType].normal}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setTempThresholds((prev) => ({
                                  ...prev,
                                  [metricType]: {
                                    ...prev[metricType],
                                    normal: newValue,
                                    warning: Math.max(
                                      prev[metricType].warning,
                                      newValue + 1
                                    ),
                                    critical: Math.max(
                                      prev[metricType].critical,
                                      Math.max(
                                        prev[metricType].warning,
                                        newValue + 1
                                      ) + 1
                                    ),
                                  },
                                }));
                              }}
                              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-yellow-400 text-sm">
                                Warning threshold
                              </span>
                              <span className="text-white">
                                {tempThresholds[metricType].warning}
                                {metric?.unit}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={tempThresholds[metricType].normal + 1}
                              max="100"
                              value={tempThresholds[metricType].warning}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setTempThresholds((prev) => ({
                                  ...prev,
                                  [metricType]: {
                                    ...prev[metricType],
                                    warning: newValue,
                                    critical: Math.max(
                                      prev[metricType].critical,
                                      newValue + 1
                                    ),
                                  },
                                }));
                              }}
                              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-red-500 text-sm">
                                Critical threshold
                              </span>
                              <span className="text-white">
                                {tempThresholds[metricType].critical}
                                {metric?.unit}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={tempThresholds[metricType].warning + 1}
                              max="100"
                              value={tempThresholds[metricType].critical}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setTempThresholds((prev) => ({
                                  ...prev,
                                  [metricType]: {
                                    ...prev[metricType],
                                    critical: newValue,
                                  },
                                }));
                              }}
                              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-200 hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSettings}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-lg transition-colors duration-200 hover:cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Navigation Button Component
interface NavButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: number;
}

const NavButton: React.FC<NavButtonProps> = ({
  label,
  isActive,
  onClick,
  icon,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center relative transition-colors duration-200 ${
        isActive
          ? "bg-gray-900 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      } hover:cursor-pointer`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
      {badge !== undefined && (
        <span className="ml-1.5 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
          {badge}
        </span>
      )}
      {isActive && (
        <motion.div
          layoutId="nav-active-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      )}
    </button>
  );
};

export default MonitoringDashboard;
