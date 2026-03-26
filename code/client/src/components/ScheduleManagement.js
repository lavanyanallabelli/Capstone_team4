import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES } from "../aws/userRoles";
import {
  Clock,
  Mail,
  Save,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import apiService from "../services/api";
import { useNavigate } from "react-router-dom";

const ScheduleManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const userRole = currentUser?.userRole || USER_ROLES.EMPLOYEE;
  const isOwner = userRole === USER_ROLES.OWNER;

  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [scheduleData, setScheduleData] = useState({});
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Normalize to DATEONLY (yyyy-mm-dd) without shifting day
  const toDateOnly = (date) => {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Initialize selected week to current week's Monday
  useEffect(() => {
    const today = new Date();
    setSelectedWeek(toDateOnly(today));

    // Initialize schedule data structure
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const initialSchedule = {};
    days.forEach((day) => {
      initialSchedule[day] = {
        isWorking: false,
        start: "",
        end: "",
      };
    });
    setScheduleData(initialSchedule);
  }, []);

  // Load employees and schedules
  useEffect(() => {
    if (isOwner) {
      loadData();
    }
  }, [isOwner]);

  // When employee changes, auto-select their latest saved week if available
  useEffect(() => {
    const loadLatestForEmployee = async () => {
      if (!selectedEmployee) return;
      try {
        const res = await apiService.getSchedules({
          employeeId: selectedEmployee.id,
        });
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const latest = res.data[0]; // API orders DESC by weekStartDate
          setSelectedWeek(latest.weekStartDate);
          setScheduleData(latest.schedule || {});
          setNotes(latest.notes || "");
          setEditingScheduleId(latest.id);
        } else {
          setEditingScheduleId(null);
        }
      } catch (e) {
        setEditingScheduleId(null);
      }
    };
    loadLatestForEmployee();
  }, [selectedEmployee]);

  // Load schedule when week changes (same employee)
  useEffect(() => {
    if (selectedEmployee && selectedWeek) {
      loadScheduleForWeek();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesResponse, schedulesResponse] = await Promise.all([
        apiService.getEmployees({ isActive: "true" }),
        apiService.getSchedules(),
      ]);

      if (employeesResponse.success) {
        setEmployees(employeesResponse.data || []);
      }

      if (schedulesResponse.success) {
        setSchedules(schedulesResponse.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleForWeek = async () => {
    if (!selectedEmployee || !selectedWeek) return;

    try {
      // Check if schedule exists for this employee and week
      const existingSchedule = schedules.find(
        (s) =>
          s.employeeId === selectedEmployee.id &&
          s.weekStartDate === selectedWeek
      );

      if (existingSchedule) {
        setScheduleData(existingSchedule.schedule || {});
        setNotes(existingSchedule.notes || "");
        setEditingScheduleId(existingSchedule.id);
      } else {
        // Reset to empty schedule
        const days = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];
        const emptySchedule = {};
        days.forEach((day) => {
          emptySchedule[day] = {
            isWorking: false,
            start: "",
            end: "",
          };
        });
        setScheduleData(emptySchedule);
        setNotes("");
        setEditingScheduleId(null);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  };

  const handleDayToggle = (day) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isWorking: !prev[day].isWorking,
        start: !prev[day].isWorking ? "09:00" : "",
        end: !prev[day].isWorking ? "17:00" : "",
      },
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }

    if (!selectedWeek) {
      alert("Please select a week");
      return;
    }

    // Validate schedule
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const hasWorkingDay = days.some((day) => scheduleData[day]?.isWorking);
    if (!hasWorkingDay) {
      alert("Please set at least one working day for the employee");
      return;
    }

    // Validate working days have start and end times
    for (const day of days) {
      if (scheduleData[day]?.isWorking) {
        if (!scheduleData[day].start || !scheduleData[day].end) {
          alert(`Please set start and end times for ${day}`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError(null);

      // Sanitize schedule: ensure non-working days have null times (not empty strings)
      const daysList = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const cleanedSchedule = {};
      daysList.forEach((day) => {
        const entry = scheduleData[day] || {};
        if (entry.isWorking) {
          cleanedSchedule[day] = {
            isWorking: true,
            start: entry.start,
            end: entry.end,
          };
        } else {
          cleanedSchedule[day] = {
            isWorking: false,
            start: null,
            end: null,
          };
        }
      });

      const schedulePayload = {
        employeeId: selectedEmployee.id,
        weekStartDate: selectedWeek,
        schedule: cleanedSchedule,
        notes: notes.trim() || null,
        sendEmail: sendEmail,
      };

      let response;
      if (editingScheduleId) {
        response = await apiService.updateSchedule(
          editingScheduleId,
          schedulePayload
        );
      } else {
        response = await apiService.createSchedule(schedulePayload);
      }

      if (response.success) {
        // Reload schedules
        const schedulesResponse = await apiService.getSchedules();
        if (schedulesResponse.success) {
          setSchedules(schedulesResponse.data || []);
        }

        const baseMsg = `Schedule ${editingScheduleId ? "updated" : "created"
          } successfully!`;
        if (sendEmail) {
          if (response.emailSent) {
            alert(baseMsg + " Email sent to employee.");
          } else {
            alert(
              baseMsg + " Email could not be sent. Please verify SMTP settings."
            );
          }
        } else {
          alert(baseMsg);
        }

        setEditingScheduleId(response.data.id);
        loadData();
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      setError(error.message || "Failed to save schedule. Please try again.");
      alert("Failed to save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    try {
      const response = await apiService.deleteSchedule(scheduleId);
      if (response.success) {
        setSchedules(schedules.filter((s) => s.id !== scheduleId));
        if (editingScheduleId === scheduleId) {
          // Clear form
          setSelectedEmployee(null);
          setEditingScheduleId(null);
          const days = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ];
          const emptySchedule = {};
          days.forEach((day) => {
            emptySchedule[day] = { isWorking: false, start: "", end: "" };
          });
          setScheduleData(emptySchedule);
          setNotes("");
        }
        alert("Schedule deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule. Please try again.");
    }
  };

  const handleSendEmail = async (scheduleId) => {
    try {
      setSaving(true);
      const response = await apiService.sendScheduleEmail(scheduleId);
      if (response.success) {
        alert("✅ Schedule email sent successfully!");
        loadData(); // Reload to update lastSentAt timestamp
      } else {
        alert(`❌ Failed to send email: ${response.message || response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to send email. Please check SMTP configuration.';
      alert(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const formatWeekRange = (weekStartDate) => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only restaurant owners can manage schedules.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Schedule Management
                </h1>
                <p className="text-sm text-gray-600">
                  Set and manage employee weekly schedules
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Schedule Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employee and Week Selection */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Select Employee & Week
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee
                  </label>
                  <select
                    value={selectedEmployee?.id || ""}
                    onChange={(e) => {
                      const emp = employees.find(
                        (em) => em.id === e.target.value
                      );
                      setSelectedEmployee(emp || null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select an employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Week Starting
                  </label>
                  <input
                    type="date"
                    value={selectedWeek}
                    onChange={(e) => {
                      const date = e.target.value;
                      setSelectedWeek(toDateOnly(date));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {selectedWeek && (
                    <p className="mt-2 text-sm text-gray-500">
                      {formatWeekRange(selectedWeek)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Editor */}
            {selectedEmployee && selectedWeek && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Weekly Schedule for {selectedEmployee.firstName}{" "}
                  {selectedEmployee.lastName}
                </h2>

                <div className="space-y-3">
                  {days.map((day, index) => (
                    <div
                      key={day}
                      className={`p-4 rounded-lg border-2 ${scheduleData[day]?.isWorking
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scheduleData[day]?.isWorking || false}
                            onChange={() => handleDayToggle(day)}
                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="font-semibold text-gray-900">
                            {(() => {
                              const base = new Date(selectedWeek);
                              base.setDate(base.getDate() + index);
                              return base.toLocaleDateString("en-US", {
                                weekday: "long",
                              });
                            })()}
                          </span>
                        </label>
                      </div>

                      {scheduleData[day]?.isWorking && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={scheduleData[day].start || ""}
                              onChange={(e) =>
                                handleTimeChange(day, "start", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={scheduleData[day].end || ""}
                              onChange={(e) =>
                                handleTimeChange(day, "end", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes or special instructions for this schedule..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Email Option */}
                <div className="mt-4 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="sendEmail"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    Send schedule via email to employee
                  </label>
                </div>

                {/* Save Button */}
                <div className="mt-6">
                  <button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    <span>
                      {saving
                        ? "Saving..."
                        : editingScheduleId
                          ? "Update Schedule"
                          : "Save Schedule"}
                    </span>
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right Column - Schedule List */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Saved Schedules
              </h2>
              <div className="space-y-3">
                {schedules.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No schedules created yet.
                  </p>
                ) : (
                  schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {schedule.employee?.firstName}{" "}
                            {schedule.employee?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatWeekRange(schedule.weekStartDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <button
                          onClick={() => handleSendEmail(schedule.id)}
                          disabled={saving}
                          className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${saving
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                        >
                          {saving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              <span>Send Email</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScheduleManagement;
