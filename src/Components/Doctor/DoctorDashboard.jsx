import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import dashboardService from "../../Services/dashboardService";
import appointmentService from "../../Services/appointmentService";

function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Animated stats
  const [animatedStats, setAnimatedStats] = useState({
    totalAssigned: 0,
    active: 0,
  });
  const hasAnimatedRef = useRef(false);

  const loadDashboard = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [statsRes, aptsRes] = await Promise.allSettled([
        dashboardService.getDoctorStats(),
        appointmentService.getAppointments(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStatsData(statsRes.value.data);
      }
      if (aptsRes.status === "fulfilled" && aptsRes.value?.data) {
        setAppointments(aptsRes.value.data);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Error loading doctor dashboard:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(true);

    // Live continuous background polling every 5s so when Admin assigns a doctor in Manage Appointments, it syncs instantly!
    const pollInterval = setInterval(() => {
      loadDashboard(false);
    }, 5000);

    const onFocus = () => {
      loadDashboard(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Animate stat counters only once when the page opens; update directly on subsequent polls
  useEffect(() => {
    if (loading && appointments.length === 0 && !statsData) return;

    const totalAssigned = statsData?.totalAssigned ?? appointments.length;
    const active = appointments.filter(
      (a) => ["room_assigned", "in_progress", "approved", "doctor_assigned", "confirmed"].includes((a.status || "").toLowerCase())
    ).length;

    // If it has already animated once on initial page open, update directly without rerunning counter from 0
    if (hasAnimatedRef.current) {
      setAnimatedStats({
        totalAssigned,
        active,
      });
      return;
    }

    // Run once on page open
    hasAnimatedRef.current = true;
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 900, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        totalAssigned: Math.round(totalAssigned * eased),
        active: Math.round(active * eased),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedStats({ totalAssigned, active });
      }
    };

    requestAnimationFrame(animate);
  }, [statsData, appointments, loading]);

  const filteredAppointments = appointments.filter((apt) => {
    const text = search.toLowerCase();
    return (
      (apt.patientName && apt.patientName.toLowerCase().includes(text)) ||
      (apt.appointmentId && apt.appointmentId.toLowerCase().includes(text)) ||
      (apt.doctorName && apt.doctorName.toLowerCase().includes(text)) ||
      (apt.roomNumber && String(apt.roomNumber).toLowerCase().includes(text)) ||
      (apt.department && apt.department.toLowerCase().includes(text)) ||
      (apt.reason && apt.reason.toLowerCase().includes(text)) ||
      (apt.status && apt.status.toLowerCase().includes(text))
    );
  });

  return (
    <>
      <style>
        {`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f8fb;
        }

        /* ================= PAGE CONTAINER ================= */
        .doctor-page {
          min-height: calc(100vh - 70px);
          margin-top: 70px;
          margin-left: 240px;
          width: calc(100% - 240px);
          padding: 30px;
          background: #f4f8fb;
          animation: pageFade 0.6s ease;
          box-sizing: border-box;
        }

        @keyframes pageFade {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ================= HEADER ================= */
        .doctor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding: 24px 22px;
          background: #eaf5ff;
          border: 1px solid #cfe7ff;
          border-radius: 17px;
          box-shadow: 0 5px 16px rgba(25, 118, 210, 0.05);
          min-height: 98px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .header-title h1 {
          margin: 0;
          color: #1976d2;
          font-size: 29px;
          font-weight: 700;
          cursor: pointer;
          display: inline-block;
          transition: all 0.3s ease;
        }

        .header-title h1:hover {
          color: #1565c0;
          transform: translateX(5px) scale(0.98);
          text-shadow: 0 3px 8px rgba(25, 118, 210, 0.18);
        }

        .header-title p {
          margin: 7px 0 0;
          color: #4779ad;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .header-btn-outline {
          background: #ffffff;
          color: #1976d2;
          border: 1px solid #bfdbfe;
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
        }

        .header-btn-outline:hover {
          background: #eaf5ff;
          border-color: #1976d2;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
        }

        .header-btn-primary {
          background: #1976d2;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25);
        }

        .header-btn-primary:hover {
          background: #1565c0;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(25, 118, 210, 0.35);
        }

        /* ================= STATS GRID ================= */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid #e5edf3;
          box-shadow: 0 7px 22px rgba(50, 90, 110, 0.07);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: cardSlide 0.7s ease both;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }

        .stat-card:hover {
          transform: translateY(-6px) scale(0.98);
          box-shadow: 0 14px 28px rgba(25, 118, 210, 0.12);
        }

        @keyframes cardSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-icon {
          width: 55px;
          height: 55px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .stat-card:hover .stat-icon {
          transform: scale(0.90);
        }

        .blue-icon { background: #e3f2fd; color: #1976d2; }
        .purple-icon { background: #f3e8ff; color: #7c3aed; }
        .green-icon { background: #e8f5e9; color: #2e7d32; }
        .orange-icon { background: #fff3e0; color: #ef6c00; }

        .stat-info p {
          margin: 0 0 6px;
          color: #78909c;
          font-size: 13px;
          font-weight: 500;
        }

        .stat-info h2 {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          color: #263238;
        }

        /* ================= CONSULTATIONS CARD & TOOLBAR ================= */
        .consultations-card {
          background: #ffffff;
          border: 1px solid #e5edf3;
          border-radius: 18px;
          box-shadow: 0 7px 22px rgba(50, 90, 110, 0.06);
          overflow: hidden;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          animation: contentAppear 0.8s ease;
        }

        .consultations-card:hover {
          box-shadow: 0 15px 35px rgba(50, 90, 110, 0.10);
        }

        @keyframes contentAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* TOOLBAR */
        .consultations-toolbar {
          padding: 22px 20px 20px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid #edf2f5;
          flex-wrap: wrap;
        }

        .toolbar-left {
          display: flex;
          flex-direction: column;
        }

        .toolbar-left h2 {
          margin: 0;
          color: #263238;
          font-size: 20px;
          font-weight: 700;
        }

        .toolbar-left p {
          color: #94a3b8;
          font-size: 13px;
          margin: 4px 0 0;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          width: 320px;
          max-width: 100%;
        }

        .search-box span {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 15px;
          color: #90a4ae;
          pointer-events: none;
        }

        .search-box input {
          width: 100%;
          height: 42px;
          padding: 0 15px 0 42px;
          border: 1px solid #dce6ec;
          border-radius: 10px;
          outline: none;
          font-size: 13px;
          color: #37474f;
          transition: all 0.3s;
          background: #fbfdff;
          box-sizing: border-box;
        }

        .search-box input:focus {
          border-color: #64b5f6;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.08);
          background: #ffffff;
        }

        /* ================= TABLE ================= */
        .table-container {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        thead {
          background: #eaf5ff;
        }

        th {
          padding: 16px 18px;
          text-align: left;
          font-size: 13px;
          color: #1565c0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 800;
          border-bottom: 2px solid #bcdbfb;
          white-space: nowrap;
        }

        td {
          padding: 16px 18px;
          border-top: 1px solid #edf2f5;
          font-size: 13px;
          color: #455a64;
          vertical-align: middle;
        }

        tbody tr {
          transition: background 0.25s ease, transform 0.25s ease;
          animation: rowAppear 0.5s ease both;
        }

        tbody tr:hover {
          background: #f8fcff;
          transform: scale(0.998);
        }

        @keyframes rowAppear {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .patient-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .patient-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #e0f2fe;
          color: #0284c7;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        tbody tr:hover .patient-avatar {
          transform: scale(1.08);
        }

        .patient-meta .name {
          font-weight: 600;
          color: #263238;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .patient-meta .sub {
          color: #94a3b8;
          font-size: 12px;
        }

        .id-badge {
          font-family: monospace;
          font-weight: 700;
          color: #1976d2;
          background: #eaf5ff;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 12px;
          display: inline-block;
        }

        .dept-pill {
          background: #f1f5f9;
          color: #475569;
          padding: 5px 11px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .doctor-chip {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .doctor-avatar-small {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f5f3ff;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .admin-assigned-tag {
          font-size: 10px;
          color: #7c3aed;
          font-weight: 700;
          margin-top: 2px;
          display: inline-block;
          background: #f5f3ff;
          padding: 1px 7px;
          border-radius: 4px;
          border: 1px solid #ddd6fe;
        }

        .room-badge {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .room-pending-badge {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #ffedd5;
          padding: 4px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .status-badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          display: inline-block;
        }

        /* ================= ACTIONS ================= */
        .actions-cell {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .action-btn {
          height: 33px;
          padding: 0 13px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.25s ease;
        }

        .view-btn {
          background: #eff6ff;
          color: #1976d2;
          border: 1px solid #bfdbfe;
        }

        .view-btn:hover {
          background: #1976d2;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25);
        }

        .report-btn {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #fed7aa;
        }

        .report-btn:hover {
          background: #ea580c;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
        }

        /* ================= MODAL ================= */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
          border: 1px solid #e2e8f0;
          animation: modalZoom 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalZoom {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .modal-header {
          padding: 22px 24px;
          border-bottom: 1px solid #edf2f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fbff;
          border-radius: 20px 20px 0 0;
        }

        .modal-title h3 {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          color: #1976d2;
        }

        .modal-title p {
          margin: 3px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .close-btn {
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-admin-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          color: #5b21b6;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 600;
        }

        .modal-footer {
          margin-top: 24px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        /* ================= RESPONSIVE ================= */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .doctor-page {
            margin-left: 0;
            width: 100%;
            padding: 15px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .doctor-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
          }

          .search-box {
            width: 100%;
          }

          .consultations-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        `}
      </style>

      <div className="doctor-page">
        {/* ================= HEADER BANNER CARD ================= */}
        <div className="doctor-header">
          <div className="header-title">
            <h1>Overview Dashboard</h1>
            <p>
              Welcome, {user?.name || "Doctor"} &bull; Department of {statsData?.department || user?.specialization || "Clinical Medicine"} &bull; Real-time consultation queue
            </p>
          </div>

          <div className="header-actions">
            <button
              className="header-btn-outline"
              onClick={() => navigate("/doctor/appointments")}
            >
              <i className="bi bi-calendar-check" style={{ fontSize: "15px" }}></i>
              Consultations
            </button>

            <button
              className="header-btn-primary"
              onClick={() => navigate("/doctor/reports")}
            >
              <i className="bi bi-file-earmark-medical" style={{ fontSize: "15px" }}></i>
              Clinical Reports
            </button>
          </div>
        </div>

        {/* ================= STATS SECTION ================= */}
        <div className="stats-grid">
          {/* TOTAL ASSIGNED */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Total Assigned</p>
              <h2>{animatedStats.totalAssigned}</h2>
            </div>
            <div className="stat-icon blue-icon">
              <i className="bi bi-calendar-check" style={{ fontSize: "24px" }}></i>
            </div>
          </div>

          {/* ACTIVE / ROOM ASSIGNED */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Active / In-Room</p>
              <h2 style={{ color: "#2e7d32" }}>{animatedStats.active}</h2>
            </div>
            <div className="stat-icon green-icon">
              <i className="bi bi-activity" style={{ fontSize: "24px" }}></i>
            </div>
          </div>
        </div>

        {/* ================= ASSIGNED CONSULTATIONS CARD ================= */}
        <div className="consultations-card">

          {/* TOOLBAR */}
          <div className="consultations-toolbar">
            <div className="toolbar-left">
              <h2>Assigned Consultations</h2>
              <p>Patient appointments assigned to you from hospital administration</p>
            </div>

            <div className="toolbar-right">
              <div className="search-box">
                <span>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  placeholder="Search patient, ID, or status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th><i className="bi bi-person me-1"></i> Patient</th>
                  <th><i className="bi bi-hash me-1"></i> Consultation ID</th>
                  <th><i className="bi bi-diagram-3 me-1"></i> Department</th>
                  <th><i className="bi bi-person-badge me-1"></i> Assigned Doctor</th>
                  <th><i className="bi bi-calendar3 me-1"></i> Schedule & Assignment</th>
                  <th><i className="bi bi-door-open me-1"></i> Assigned Room</th>
                  <th style={{ textAlign: "center" }}><i className="bi bi-gear me-1"></i> Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
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
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: "50px",
                        color: "#94a3b8",
                      }}
                    >
                      No consultation appointments found.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.slice(0, 10).map((apt) => {
                    const patientName = apt.patientName || "Patient";
                    const initial = patientName.charAt(0).toUpperCase();

                    return (
                      <tr key={apt._id}>
                        {/* PATIENT INFO */}
                        <td>
                          <div className="patient-cell">
                            <div className="patient-avatar">
                              {initial}
                            </div>
                            <div className="patient-meta">
                              <div className="name">{patientName}</div>
                              <div className="sub">{apt.patientPhone || "No contact"}</div>
                            </div>
                          </div>
                        </td>

                        {/* APPOINTMENT ID */}
                        <td>
                          <span className="id-badge">
                            {apt.appointmentId || apt._id?.slice(-6).toUpperCase()}
                          </span>
                        </td>

                        {/* DEPARTMENT */}
                        <td>
                          <span className="dept-pill">
                            {apt.department || "General"}
                          </span>
                        </td>

                        {/* ASSIGNED DOCTOR */}
                        <td>
                          <div className="doctor-chip">
                            <div className="doctor-avatar-small">
                              <i className="bi bi-person-badge" style={{ fontSize: "14px" }}></i>
                            </div>
                            <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>
                              {apt.doctorName || apt.assignedDoctor?.name || user?.name || "Attending Doctor"}
                            </div>
                          </div>
                        </td>

                        {/* SCHEDULE & ASSIGNMENT */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <i className="bi bi-calendar-event" style={{ fontSize: "13px", color: "#1976d2" }}></i>
                              <div>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px", marginRight: "4px" }}>
                                  Schedule:
                                </span>
                                <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>
                                  {apt.time ? `${apt.time}` : "Scheduled"} {apt.date ? `(${apt.date})` : ""}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <i className="bi bi-clock-history" style={{ fontSize: "13px", color: "#7c3aed" }}></i>
                              <div>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px", marginRight: "4px" }}>
                                  Assigned:
                                </span>
                                <span style={{ fontWeight: "600", color: "#7c3aed", fontSize: "12px" }}>
                                  {apt.doctorAssignedAt
                                    ? `${new Date(apt.doctorAssignedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • ${new Date(apt.doctorAssignedAt).toLocaleDateString([], { month: "short", day: "numeric" })}`
                                    : apt.createdAt
                                    ? `${new Date(apt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • ${new Date(apt.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}`
                                    : "Shift Assignment"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ASSIGNED ROOM */}
                        <td>
                          {apt.roomNumber ? (
                            <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
                              <span className="room-badge">
                                <i className="bi bi-door-open-fill" style={{ fontSize: "12px" }}></i> Room {apt.roomNumber}
                              </span>
                              {apt.assignedRoom?.roomType && (
                                <span style={{ fontSize: "10px", color: "#64748b" }}>
                                  {apt.assignedRoom.roomType}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="room-pending-badge">
                              <i className="bi bi-hourglass-split" style={{ fontSize: "12px" }}></i> Room Pending
                            </span>
                          )}
                        </td>

                        {/* ACTION BUTTONS */}
                        <td>
                          <div className="actions-cell">
                            <button
                              className="action-btn view-btn"
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              <i className="bi bi-eye"></i> View
                            </button>

                            <button
                              className="action-btn report-btn"
                              onClick={() =>
                                navigate("/doctor/reports", {
                                  state: { preselectAppointment: apt },
                                })
                              }
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
        </div>

        {/* ================= VIEW APPOINTMENT MODAL ================= */}
        {selectedAppointment && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedAppointment(null)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="patient-avatar">
                    {selectedAppointment.patientName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="modal-title">
                    <h3>{selectedAppointment.patientName}</h3>
                    <p>Appointment Details</p>
                  </div>
                </div>

                <button
                  className="close-btn"
                  onClick={() => setSelectedAppointment(null)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="modal-body">
                {/* ADMIN ASSIGNMENT NOTICE IN MODAL */}
                <div className="modal-admin-badge">
                  <i className="bi bi-shield-check" style={{ fontSize: "20px", color: "#7c3aed" }}></i>
                  <div>
                    <div>Assigned by Hospital Administration in Manage Appointments</div>
                    <div style={{ fontSize: "11px", fontWeight: "normal", color: "#6d28d9", marginTop: "2px" }}>
                      Assigned Doctor: <strong>{selectedAppointment.doctorName || user?.name || "Attending Doctor"}</strong>
                      {selectedAppointment.doctorAssignedAt ? ` &bull; Assigned on ${new Date(selectedAppointment.doctorAssignedAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                </div>

                <div>
                  <DetailRow
                    title="Appointment ID"
                    value={selectedAppointment.appointmentId || selectedAppointment._id?.slice(-6).toUpperCase()}
                  />
                  <DetailRow
                    title="Assigned Doctor"
                    value={selectedAppointment.doctorName || user?.name || "Assigned"}
                  />
                  <DetailRow
                    title="Admin Assignment"
                    value={selectedAppointment.doctorAssignedAt ? new Date(selectedAppointment.doctorAssignedAt).toLocaleString() : "Assigned by Admin"}
                  />
                  <DetailRow
                    title="Department"
                    value={selectedAppointment.department || "General Consultation"}
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
                  <DetailRow
                    title="Reason / Notes"
                    value={selectedAppointment.reason || selectedAppointment.notes || "Routine Consultation"}
                  />
                  <DetailRow
                    title="Current Status"
                    value={selectedAppointment.status?.toUpperCase() || "PENDING"}
                    last
                  />
                </div>

                <div className="modal-footer">
                  <button
                    className="header-btn-outline"
                    onClick={() => setSelectedAppointment(null)}
                  >
                    <i className="bi bi-x-circle me-1"></i> Close
                  </button>
                  <button
                    className="header-btn-primary"
                    onClick={() => {
                      const apt = selectedAppointment;
                      setSelectedAppointment(null);
                      navigate("/doctor/reports", { state: { preselectAppointment: apt } });
                    }}
                  >
                    <i className="bi bi-file-earmark-medical me-1"></i> Write Report
                  </button>
                </div>
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
  let displayValue = value;
  if (typeof value === "object" && value !== null) {
    displayValue = value.name || value.title || value.roomNumber || JSON.stringify(value);
  } else if (value === null || value === undefined) {
    displayValue = "—";
  }

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
        {String(displayValue)}
      </b>
    </div>
  );
}

export default DoctorDashboard;
