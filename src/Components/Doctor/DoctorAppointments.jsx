import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import appointmentService from "../../Services/appointmentService";

function DoctorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const hasAnimatedRef = useRef(false);

  // Animated stats
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    roomAssigned: 0,
    completed: 0,
  });

  const fetchAppointments = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await appointmentService.getAppointments();
      if (res && res.data) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error("Error fetching doctor appointments:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(true);

    // Live continuous background polling every 4s so admin approval/assignment syncs automatically
    const pollInterval = setInterval(() => {
      fetchAppointments(false);
    }, 4000);

    const onFocus = () => {
      fetchAppointments(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Stats counting animation - runs only once on initial load
  useEffect(() => {
    const total = appointments.length;
    const inProgress = appointments.filter((a) => (a.status || "").toLowerCase() === "in_progress").length;
    const roomAssigned = appointments.filter(
      (a) => ["room_assigned", "doctor_assigned"].includes((a.status || "").toLowerCase()) || Boolean(a.roomNumber)
    ).length;
    const completed = appointments.filter(
      (a) => (a.status || "").toLowerCase() === "completed"
    ).length;

    if (hasAnimatedRef.current) {
      setStats({
        total,
        inProgress,
        roomAssigned,
        completed,
      });
      return;
    }

    if (!loading && appointments.length > 0) {
      hasAnimatedRef.current = true;
      let frameId;
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / 800, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        setStats({
          total: Math.round(total * eased),
          inProgress: Math.round(inProgress * eased),
          roomAssigned: Math.round(roomAssigned * eased),
          completed: Math.round(completed * eased),
        });

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        } else {
          setStats({ total, inProgress, roomAssigned, completed });
        }
      };

      frameId = requestAnimationFrame(animate);
      return () => {
        if (frameId) cancelAnimationFrame(frameId);
      };
    } else if (!loading) {
      hasAnimatedRef.current = true;
      setStats({ total: 0, inProgress: 0, roomAssigned: 0, completed: 0 });
    }
  }, [appointments, loading]);

  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage("");
    }, 2800);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      // Optimistically update status in local state so top counters and row actions update immediately
      setAppointments((prev) =>
        prev.map((a) => (a._id === id || a.id === id ? { ...a, status: newStatus } : a))
      );
      if (selectedAppointment && (selectedAppointment._id === id || selectedAppointment.id === id)) {
        setSelectedAppointment((prev) => ({ ...prev, status: newStatus }));
      }

      const updateFn = appointmentService.updateAppointmentStatus || appointmentService.updateStatus;
      await updateFn(id, newStatus);
      const formatted = newStatus.replace("_", " ").toUpperCase();
      showToast(`Consultation marked as ${formatted}!`);
      fetchAppointments(false);
    } catch (err) {
      console.error("Failed to update consultation status:", err);
      fetchAppointments(false);
      showToast(err.response?.data?.message || err.message || "Failed to update consultation status");
    }
  };

  const handleStartConsultation = async (apt) => {
    if (!apt) return;
    const status = (apt.status || "").toLowerCase();
    if (status === "in_progress") {
      showToast("Consultation is already in progress.");
      return;
    }
    if (status === "completed") {
      showToast("Consultation has already been completed.");
      return;
    }
    const aptId = apt._id || apt.id;
    await handleStatusUpdate(aptId, "in_progress");
  };

  const handleDoneConsultation = async (apt) => {
    if (!apt) return;
    const status = (apt.status || "").toLowerCase();
    if (status !== "in_progress") {
      showToast("Please start consultation first before marking as done!");
      return;
    }
    const aptId = apt._id || apt.id;
    await handleStatusUpdate(aptId, "completed");
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (!search.trim()) return true;
    const text = search.toLowerCase();
    return (
      (apt.patientName && apt.patientName.toLowerCase().includes(text)) ||
      (apt.appointmentId && apt.appointmentId.toLowerCase().includes(text)) ||
      (apt.doctorName && apt.doctorName.toLowerCase().includes(text)) ||
      (apt.roomNumber && String(apt.roomNumber).toLowerCase().includes(text)) ||
      (apt.reason && apt.reason.toLowerCase().includes(text)) ||
      (apt.department && apt.department.toLowerCase().includes(text))
    );
  });

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "completed":
        return {
          bg: "#ecfdf5",
          color: "#047857",
          border: "#a7f3d0",
          icon: "bi-check2-all",
          label: "COMPLETED",
        };
      case "approved":
        return {
          bg: "#dcfce7",
          color: "#15803d",
          border: "#86efac",
          icon: "bi-check-circle-fill",
          label: "APPROVED",
        };
      case "in_progress":
        return {
          bg: "#fef3c7",
          color: "#b45309",
          border: "#fcd34d",
          icon: "bi-hourglass-split",
          label: "IN PROGRESS",
        };
      case "room_assigned":
        return {
          bg: "#e0f2fe",
          color: "#0369a1",
          border: "#bae6fd",
          icon: "bi-door-open-fill",
          label: "ROOM ASSIGNED",
        };
      case "doctor_assigned":
        return {
          bg: "#f3e8ff",
          color: "#7e22ce",
          border: "#e9d5ff",
          icon: "bi-person-check-fill",
          label: "DOCTOR ASSIGNED",
        };
      case "cancelled":
      case "rejected":
        return {
          bg: "#fee2e2",
          color: "#dc2626",
          border: "#fca5a5",
          icon: "bi-x-circle-fill",
          label: "CANCELLED",
        };
      default:
        return {
          bg: "#f1f5f9",
          color: "#475569",
          border: "#cbd5e1",
          icon: "bi-clock-fill",
          label: status ? status.replace("_", " ").toUpperCase() : "PENDING",
        };
    }
  };

  return (
    <>
      <style>
        {`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f7fb;
        }

        /* ================= PAGE ================= */

        .doctor-page {
          min-height: calc(100vh - 70px);
          margin-top: 70px;
          margin-left: 240px;
          width: calc(100% - 240px);
          background: #f4f7fb;
          padding: 30px;
          animation: fadeUp 0.7s ease;
        }

        /* ================= TOP BAR ================= */

        .doctor-header-card {
          background: #eaf5ff;
          border: 1px solid #d4ebff;
          border-radius: 16px;
          padding: 20px 22px;
          margin-bottom: 25px;
          box-shadow: 0 8px 22px rgba(25,118,210,0.08);
        }

        .doctor-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          width: 100%;
        }

        .doctor-title-wrap {
          flex: 1;
        }

        .doctor-title {
          margin: 0;
          color: #1976d2;
          font-size: 28px;
          font-weight: 700;
        }

        .doctor-subtitle {
          margin: 8px 0 0;
          color: #4c7dbf;
          font-size: 14px;
        }

        .doctor-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ================= SEARCH & CONTROLS ================= */

        .search-wrapper {
          position: relative;
          width: 280px;
          max-width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 14px;
          pointer-events: none;
          z-index: 2;
          transition: color 0.3s ease;
        }

        .search-wrapper:focus-within .search-icon {
          color: #1976d2;
        }

        .search-box {
          width: 100%;
          padding: 12px 15px 12px 38px;
          border: 1px solid #cfe3ff;
          border-radius: 9px;
          outline: none;
          font-size: 14px;
          background: #ffffff;
          color: #1f2937;
          transition:
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .search-box:focus {
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25,118,210,0.1);
        }

        .search-box::placeholder {
          color: #94a3b8;
        }

        .select-box {
          padding: 11px 16px;
          border: 1px solid #cfe3ff;
          border-radius: 9px;
          outline: none;
          font-size: 14px;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: border-color 0.3s ease;
        }

        .select-box:focus {
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25,118,210,0.1);
        }

        /* ================= STAT CARDS ================= */

        .stat-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 25px;
        }

        .stat-card {
          animation: zoomIn 0.7s ease;
          transition: all 0.3s ease;
          background: #ffffff;
          padding: 22px;
          border-radius: 14px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.06);
        }

        .stat-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 15px 30px rgba(25,118,210,0.15) !important;
        }

        /* ================= ROWS & AVATARS ================= */

        .doctor-row {
          transition: all 0.3s ease;
        }

        .doctor-row:hover {
          background: #f8fbff;
          transform: translateX(3px);
        }

        .doctor-avatar {
          transition: all 0.3s ease;
        }

        .doctor-row:hover .doctor-avatar {
          transform: scale(1.08);
        }

        /* ================= BUTTONS ================= */

        .add-button {
          transition: all 0.3s ease;
          background-color: #1976d2;
          color: #ffffff;
          border: none;
          padding: 12px 20px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .add-button:hover {
          background: #1565c0 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(25,118,210,0.25);
        }

        .outline-button {
          transition: all 0.3s ease;
          background-color: #ffffff;
          color: #1976d2;
          border: 1px solid #1976d2;
          padding: 11px 18px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .outline-button:hover {
          background: #eaf5ff;
          transform: translateY(-2px);
        }

        .view-button {
          transition: all 0.3s ease;
          background-color: #e3f2fd;
          color: #1976d2;
          border: none;
          padding: 8px 13px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
        }

        .view-button:hover {
          background: #1976d2 !important;
          color: white !important;
          transform: scale(1.05);
        }

        .start-button {
          transition: all 0.3s ease;
          background-color: #fef3c7;
          color: #b45309;
          border: none;
          padding: 8px 13px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .start-button:hover {
          background-color: #f59e0b !important;
          color: #ffffff !important;
          transform: scale(1.05);
        }

        .complete-button {
          transition: all 0.3s ease;
          background-color: #dcfce7;
          color: #15803d;
          border: none;
          padding: 8px 13px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .complete-button:hover {
          background-color: #16a34a !important;
          color: #ffffff !important;
          transform: scale(1.05);
        }

        .report-button {
          transition: all 0.3s ease;
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 8px 13px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
        }

        .report-button:hover {
          background-color: #1976d2 !important;
          color: #ffffff !important;
          border-color: #1976d2 !important;
          transform: scale(1.05);
        }

        .start-button:disabled,
        .complete-button:disabled {
          opacity: 0.55 !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .spin-icon {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ================= MODAL ================= */

        .modal-background {
          position: fixed;
          top: 70px;
          left: 240px;
          right: 0;
          bottom: 0;
          z-index: 1500;
          padding: 30px 20px 20px;
          animation: fadeIn 0.3s ease;
          background: rgba(15,23,42,0.45);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .modal-box {
          animation: modalOpen 0.3s ease;
          background: #ffffff;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          max-height: 90vh;
          overflow-y: auto;
        }

        /* ================= SUCCESS MESSAGE ================= */

        .success-message {
          position: fixed;
          top: 20px;
          right: 20px;
          width: min(340px, calc(100vw - 40px));
          background: #ffffff;
          color: #15803d;
          padding: 14px 20px;
          border-radius: 10px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
          border-left: 4px solid #16a34a;
          z-index: 2000;
          font-size: 14px;
          font-weight: 600;
          animation: successSlide 0.4s ease;
        }

        /* ================= ANIMATIONS ================= */

        @keyframes fadeUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes zoomIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalOpen {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes successSlide {
          from {
            transform: translateX(40px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1100px) {
          .stat-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .doctor-page {
            margin-left: 0;
            width: 100%;
            padding: 20px;
          }

          .modal-background {
            left: 0;
            top: 70px;
          }

          .doctor-topbar {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .doctor-toolbar {
            width: 100%;
          }

          .search-wrapper {
            width: 100%;
          }

          .stat-cards {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 500px) {
          .doctor-page {
            padding: 15px;
          }

          .modal-box {
            width: 95% !important;
            padding: 20px !important;
          }
        }
        `}
      </style>

      {/* SUCCESS TOAST */}
      {successMessage && (
        <div className="success-message">
          <i className="bi bi-check-circle-fill" style={{ marginRight: "8px", fontSize: "16px" }}></i>
          {successMessage}
        </div>
      )}

      <div className="doctor-page">
        {/* ================= HEADER CARD ================= */}
        <div className="doctor-header-card">
          <div className="doctor-topbar">
            <div className="doctor-title-wrap">
              <h1 className="doctor-title">
                My Consultations
              </h1>
              <p className="doctor-subtitle">
                Manage assigned patient consultations, room schedules, and clinical workflow
              </p>
            </div>

            <div className="doctor-toolbar">
              <button
                className="outline-button"
                onClick={() => fetchAppointments(false)}
                title="Refresh Schedule"
              >
                <i className={`bi bi-arrow-clockwise ${loading ? "spin-icon" : ""}`}></i>
                Refresh
              </button>

              <button
                className="add-button"
                onClick={() => navigate("/doctor/reports")}
              >
                <i className="bi bi-file-earmark-medical"></i>
                Create Report
              </button>
            </div>
          </div>
        </div>

        {/* ================= STATS SECTION ================= */}
        <div className="stat-cards">
          {/* TOTAL */}
          <div className="stat-card">
            <div style={statFlexStyle}>
              <div>
                <p style={statLabelStyle}>Total Appointments</p>
                <h2 style={statNumberStyle}>{stats.total}</h2>
              </div>
              <span style={{ fontSize: "28px", color: "#1976d2" }}>
                <i className="bi bi-calendar2-check"></i>
              </span>
            </div>
          </div>

          {/* IN PROGRESS */}
          <div className="stat-card">
            <div style={statFlexStyle}>
              <div>
                <p style={statLabelStyle}>In Progress</p>
                <h2 style={{ ...statNumberStyle, color: "#d97706" }}>{stats.inProgress}</h2>
              </div>
              <span style={{ fontSize: "28px", color: "#d97706" }}>
                <i className="bi bi-hourglass-split"></i>
              </span>
            </div>
          </div>

          {/* ROOM ASSIGNED */}
          <div className="stat-card">
            <div style={statFlexStyle}>
              <div>
                <p style={statLabelStyle}>Ready / Assigned</p>
                <h2 style={{ ...statNumberStyle, color: "#0284c7" }}>{stats.roomAssigned}</h2>
              </div>
              <span style={{ fontSize: "28px", color: "#0284c7" }}>
                <i className="bi bi-door-open"></i>
              </span>
            </div>
          </div>

          {/* COMPLETE */}
          <div className="stat-card">
            <div style={statFlexStyle}>
              <div>
                <p style={statLabelStyle}>Complete</p>
                <h2 style={{ ...statNumberStyle, color: "#15803d" }}>{stats.completed}</h2>
              </div>
              <span style={{ fontSize: "28px", color: "#15803d" }}>
                <i className="bi bi-check2-all"></i>
              </span>
            </div>
          </div>
        </div>

        {/* ================= APPOINTMENTS TABLE CARD ================= */}
        <div
          style={{
            backgroundColor: "#ffffff",
            marginTop: "25px",
            padding: "25px",
            borderRadius: "14px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#263238",
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                Consultation Schedule
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  margin: "4px 0 0",
                }}
              >
                Showing {filteredAppointments.length} consultation records
              </p>
            </div>

            {/* SEARCH */}
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                className="search-box"
                type="text"
                placeholder="Search patient, ID, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table
            style={{
              width: "100%",
              minWidth: "1160px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f8fbff",
                  textAlign: "left",
                }}
              >
                <th style={thStyle}>Patient</th>
                <th style={thStyle}>Appointment ID</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Schedule</th>
                <th style={thStyle}>Assigned Doctor</th>
                <th style={thStyle}>Assigned Room</th>
                <th style={thStyle}>Reason / Symptoms</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "50px",
                      color: "#94a3b8",
                    }}
                  >
                    Loading consultations...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "50px",
                      color: "#94a3b8",
                    }}
                  >
                    No consultation appointments match your filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const badge = getStatusBadge(apt.status);
                  const patientName = apt.patientName || "Patient";
                  const initial = patientName.charAt(0).toUpperCase();

                  return (
                    <tr
                      className="doctor-row"
                      key={apt._id}
                      style={{
                        borderBottom: "1px solid #eeeeee",
                      }}
                    >
                      {/* PATIENT */}
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            className="doctor-avatar"
                            style={{
                              width: "45px",
                              height: "45px",
                              borderRadius: "50%",
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                              fontWeight: "700",
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>

                          <div>
                            <b style={{ color: "#263238", fontSize: "14px" }}>
                              {patientName}
                            </b>
                            <div
                              style={{
                                color: "#94a3b8",
                                fontSize: "11px",
                                marginTop: "3px",
                              }}
                            >
                              {apt.patientPhone || "No contact"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* APPOINTMENT ID */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: "600",
                            color: "#1976d2",
                            backgroundColor: "#eaf5ff",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        >
                          {apt.appointmentId || apt._id?.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      {/* DEPARTMENT */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "500",
                          }}
                        >
                          {apt.department || "General"}
                        </span>
                      </td>

                      {/* SCHEDULE */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: "600", color: "#334155" }}>
                          {apt.date || "Scheduled"}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>
                          {apt.time || "N/A"}
                        </div>
                      </td>

                      {/* ASSIGNED DOCTOR */}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#f5f3ff",
                              color: "#7c3aed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "15px",
                              fontWeight: "700",
                              flexShrink: 0,
                            }}
                          >
                            <i className="bi bi-person-badge"></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>
                              {apt.doctorName || apt.assignedDoctor?.name || apt.doctor?.name || "Attending Doctor"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ASSIGNED ROOM */}
                      <td style={tdStyle}>
                        {apt.roomNumber ? (
                          <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                backgroundColor: "#ecfdf5",
                                color: "#047857",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                border: "1px solid #a7f3d0",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <i className="bi bi-door-open-fill" style={{ fontSize: "12px" }}></i>
                              Room {apt.roomNumber}
                            </span>
                            {apt.assignedRoom?.roomType && (
                              <span style={{ fontSize: "10px", color: "#64748b" }}>
                                {apt.assignedRoom.roomType}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              backgroundColor: "#fff7ed",
                              color: "#c2410c",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              border: "1px solid #ffedd5",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <i className="bi bi-hourglass-split" style={{ fontSize: "12px" }}></i>
                            Room Pending
                          </span>
                        )}
                      </td>

                      {/* REASON */}
                      <td style={{ ...tdStyle, maxWidth: "180px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#475569",
                          }}
                        >
                          {apt.reason || apt.notes || "General consultation"}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border || badge.color + "33"}`,
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "0.3px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                          }}
                        >
                          <i className={`bi ${badge.icon}`} style={{ fontSize: "11px" }}></i>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "nowrap" }}>
                          <button
                            className="view-button"
                            onClick={() => setSelectedAppointment(apt)}
                            title="View Consultation Details"
                          >
                            <i className="bi bi-eye"></i> View
                          </button>

                          {(apt.status || "").toLowerCase() === "completed" ? (
                            <span
                              style={{
                                backgroundColor: "#ecfdf5",
                                color: "#047857",
                                border: "1px solid #a7f3d0",
                                padding: "6px 11px",
                                borderRadius: "7px",
                                fontSize: "12px",
                                fontWeight: "700",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <i className="bi bi-check2-all" style={{ fontSize: "13px" }}></i>
                              Finished
                            </span>
                          ) : (
                            <>
                              <button
                                className="start-button"
                                onClick={() => handleStartConsultation(apt)}
                                disabled={(apt.status || "").toLowerCase() === "in_progress"}
                                title={
                                  (apt.status || "").toLowerCase() === "in_progress"
                                    ? "Consultation already in progress"
                                    : "Start Consultation"
                                }
                                style={{
                                  opacity: (apt.status || "").toLowerCase() === "in_progress" ? 0.65 : 1,
                                  cursor: (apt.status || "").toLowerCase() === "in_progress" ? "default" : "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <i className={`bi ${(apt.status || "").toLowerCase() === "in_progress" ? "bi-hourglass-split" : "bi-play-fill"}`}></i>
                                {(apt.status || "").toLowerCase() === "in_progress" ? "In Progress" : "Start"}
                              </button>

                              <button
                                className="complete-button"
                                onClick={(e) => {
                                  if ((apt.status || "").toLowerCase() !== "in_progress") {
                                    e.preventDefault();
                                    handleDoneConsultation(apt);
                                    return;
                                  }
                                  handleDoneConsultation(apt);
                                }}
                                title={
                                  (apt.status || "").toLowerCase() === "in_progress"
                                    ? "Mark Consultation Done"
                                    : "You must start the consultation before clicking Done"
                                }
                                style={{
                                  opacity: (apt.status || "").toLowerCase() === "in_progress" ? 1 : 0.45,
                                  cursor: (apt.status || "").toLowerCase() === "in_progress" ? "pointer" : "not-allowed",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <i className="bi bi-check2-circle"></i>
                                Done
                              </button>
                            </>
                          )}

                          <button
                            className="report-button"
                            onClick={() =>
                              navigate("/doctor/reports", {
                                state: { preselectAppointment: apt },
                              })
                            }
                            title="Write Medical Report"
                          >
                            <i className="bi bi-file-earmark-medical"></i> Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= VIEW APPOINTMENT MODAL ================= */}
        {selectedAppointment && (
          <div
            className="modal-background"
            onClick={() => setSelectedAppointment(null)}
          >
            <div
              className="modal-box"
              style={{ width: "540px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "#e3f2fd",
                      color: "#1976d2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    {selectedAppointment.patientName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>
                      {selectedAppointment.patientName}
                    </h3>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Appointment #{selectedAppointment.appointmentId || selectedAppointment._id?.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAppointment(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "18px",
                    color: "#94a3b8",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Close Modal"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div>
                <DetailRow
                  title="Assigned Doctor"
                  value={selectedAppointment.doctorName || selectedAppointment.assignedDoctor?.name || selectedAppointment.doctor?.name || "Attending Doctor"}
                />
                {selectedAppointment.doctorAssignedAt && (
                  <DetailRow
                    title="Doctor Assigned At"
                    value={new Date(selectedAppointment.doctorAssignedAt).toLocaleString()}
                  />
                )}
                <DetailRow
                  title="Department"
                  value={selectedAppointment.department || "General"}
                />
                <DetailRow
                  title="Contact Phone"
                  value={selectedAppointment.patientPhone || "N/A"}
                />
                <DetailRow
                  title="Scheduled Date"
                  value={selectedAppointment.date || "N/A"}
                />
                <DetailRow
                  title="Scheduled Time"
                  value={selectedAppointment.time || "N/A"}
                />
                <DetailRow
                  title="Assigned Room"
                  value={
                    selectedAppointment.roomNumber
                      ? `Room ${selectedAppointment.roomNumber}${selectedAppointment.assignedRoom?.roomType ? ` (${selectedAppointment.assignedRoom.roomType})` : ""}`
                      : "Pending Room Allocation"
                  }
                />
                <DetailRow
                  title="Administrative Approval"
                  value={
                    selectedAppointment.approval?.approvedByName
                      ? `Approved by ${selectedAppointment.approval.approvedByName}`
                      : ["approved", "doctor_assigned", "room_assigned"].includes((selectedAppointment.status || "").toLowerCase())
                      ? "Approved by Administration"
                      : "Pending Admin Review"
                  }
                />
                {selectedAppointment.issues && selectedAppointment.issues.length > 0 && (
                  <DetailRow
                    title="Patient Issues / Symptoms"
                    value={
                      <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "4px", justifyContent: "flex-end" }}>
                        {selectedAppointment.issues.map((iss, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              padding: "2px 7px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <i className="bi bi-check-circle-fill" style={{ fontSize: "10px", color: "#2563eb" }}></i>
                            {iss}
                          </span>
                        ))}
                      </span>
                    }
                  />
                )}
                <DetailRow
                  title="Notes / Remarks"
                  value={selectedAppointment.notes || selectedAppointment.reason || "Routine Consultation"}
                />
                <DetailRow
                  title="Workflow Status"
                  value={selectedAppointment.status?.replace("_", " ").toUpperCase() || "PENDING"}
                  last
                />
              </div>

              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                {(selectedAppointment.status || "").toLowerCase() === "completed" ? (
                  <span
                    style={{
                      backgroundColor: "#ecfdf5",
                      color: "#047857",
                      border: "1px solid #a7f3d0",
                      padding: "8px 14px",
                      borderRadius: "7px",
                      fontSize: "13px",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <i className="bi bi-check2-all" style={{ fontSize: "16px" }}></i>
                    Consultation Finished
                  </span>
                ) : (
                  <>
                    <button
                      className="start-button"
                      style={{
                        padding: "9px 16px",
                        opacity: (selectedAppointment.status || "").toLowerCase() === "in_progress" ? 0.65 : 1,
                        cursor: (selectedAppointment.status || "").toLowerCase() === "in_progress" ? "default" : "pointer",
                      }}
                      disabled={(selectedAppointment.status || "").toLowerCase() === "in_progress"}
                      onClick={() => handleStartConsultation(selectedAppointment)}
                      title={
                        (selectedAppointment.status || "").toLowerCase() === "in_progress"
                          ? "Consultation already in progress"
                          : "Start Consultation"
                      }
                    >
                      <i className={`bi ${(selectedAppointment.status || "").toLowerCase() === "in_progress" ? "bi-hourglass-split" : "bi-play-fill"}`}></i>
                      {(selectedAppointment.status || "").toLowerCase() === "in_progress" ? "In Progress" : "Start Consultation"}
                    </button>

                    <button
                      className="complete-button"
                      style={{
                        padding: "9px 16px",
                        opacity: (selectedAppointment.status || "").toLowerCase() === "in_progress" ? 1 : 0.45,
                        cursor: (selectedAppointment.status || "").toLowerCase() === "in_progress" ? "pointer" : "not-allowed",
                      }}
                      onClick={(e) => {
                        if ((selectedAppointment.status || "").toLowerCase() !== "in_progress") {
                          e.preventDefault();
                          handleDoneConsultation(selectedAppointment);
                          return;
                        }
                        handleDoneConsultation(selectedAppointment);
                      }}
                      title={
                        (selectedAppointment.status || "").toLowerCase() === "in_progress"
                          ? "Mark consultation as completed"
                          : "Start consultation first before marking as done"
                      }
                    >
                      <i className="bi bi-check2-circle"></i>
                      Done
                    </button>
                  </>
                )}

                <button
                  className="add-button"
                  style={{ padding: "9px 16px", fontSize: "13px" }}
                  onClick={() => {
                    const apt = selectedAppointment;
                    setSelectedAppointment(null);
                    navigate("/doctor/reports", { state: { preselectAppointment: apt } });
                  }}
                >
                  <i className="bi bi-file-earmark-medical"></i>
                  Write Report
                </button>

                <button
                  className="outline-button"
                  style={{ padding: "9px 16px", fontSize: "13px" }}
                  onClick={() => setSelectedAppointment(null)}
                >
                  <i className="bi bi-x-circle"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ================= DETAIL ROW ================= */

function DetailRow({ title, value, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        padding: "11px 0",
        borderBottom: last ? "none" : "1px solid #f1f5f9",
      }}
    >
      <span
        style={{
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        {title}
      </span>

      <b
        style={{
          color: "#263238",
          fontSize: "13px",
          textAlign: "right",
        }}
      >
        {value}
      </b>
    </div>
  );
}

/* ================= TABLE & STAT STYLES ================= */

const thStyle = {
  padding: "15px 12px",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "600",
  borderBottom: "1px solid #eeeeee",
};

const tdStyle = {
  padding: "16px 12px",
  color: "#475569",
  fontSize: "13px",
};

const statFlexStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const statLabelStyle = {
  color: "#94a3b8",
  margin: 0,
  fontSize: "13px",
};

const statNumberStyle = {
  fontSize: "30px",
  margin: "12px 0 0",
  color: "#000000",
  fontWeight: "700",
};

export default DoctorAppointments;
