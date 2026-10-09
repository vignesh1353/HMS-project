import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import dashboardService from "../../Services/dashboardService";
import appointmentService from "../../Services/appointmentService";
import prescriptionService from "../../Services/prescriptionService";
import medicalReportService from "../../Services/medicalReportService";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUserDoctor,
  faCalendarDays,
  faClipboard,
  faCapsules,
  faHeart,
  faCircleUser,
  faFile
  } from "@fortawesome/free-solid-svg-icons";

function ClientDashboard() { 
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    medicalRecords: 0,
    prescriptions: 0,
    reports: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, aptsRes, presRes, reportsRes] = await Promise.allSettled([
        dashboardService.getClientStats(),
        appointmentService.getAppointments(),
        prescriptionService.getPrescriptions(),
        medicalReportService.getReports(),
      ]);

      let directReportsCount = 0;
      if (reportsRes.status === "fulfilled" && Array.isArray(reportsRes.value?.data)) {
        const accessibleReports = reportsRes.value.data.filter((r) => r.status !== "draft");
        setReports(accessibleReports);
        directReportsCount = accessibleReports.length;
      }

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        const d = statsRes.value.data;
        setStats({
          ...d,
          reports: d.reports ?? directReportsCount,
        });
      } else {
        setStats((prev) => ({
          ...prev,
          reports: directReportsCount,
        }));
      }

      if (aptsRes.status === "fulfilled" && aptsRes.value?.data) {
        setAppointments(aptsRes.value.data);
      }
      if (presRes.status === "fulfilled" && presRes.value?.data) {
        setPrescriptions(presRes.value.data);
      }
    } catch (err) {
      console.error("Error loading client dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentStatusStyle = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (
      s === "approved" ||
      s === "confirmed" ||
      s === "doctor_assigned" ||
      s === "room_assigned" ||
      s === "completed"
    ) {
      return {
        background: "#e8f5e9",
        color: "#2e7d32",
        border: "1px solid #c8e6c9",
      };
    }
    if (s === "rejected" || s === "cancelled") {
      return {
        background: "#ffebee",
        color: "#c62828",
        border: "1px solid #ffcdd2",
      };
    }
    return {
      background: "#fff8e1",
      color: "#b45309",
      border: "1px solid #fef3c7",
    };
  };

  const formatStatusDisplay = (status) => {
    const s = String(status || "").trim();
    if (!s) return "Pending";
    if (s.toLowerCase() === "approved") return "Approved";
    if (s.toLowerCase() === "rejected") return "Rejected";
    if (s.toLowerCase() === "doctor_assigned") return "Approved";
    if (s.toLowerCase() === "room_assigned") return "Approved";
    if (s.toLowerCase() === "confirmed") return "Confirmed";
    if (s.toLowerCase() === "cancelled") return "Cancelled";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  useEffect(() => {
    loadData();

    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(loadData, 5000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  const goTo = (path) => {
    navigate(path);
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
            color: #1e293b;
          }

          /* ================= FAST STARTING ANIMATION ================= */

          @keyframes dashboardStart {
            from {
              opacity: 0;
              transform: translateY(15px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes welcomeStart {
            from {
              opacity: 0;
              transform: translateY(-12px) scale(0.99);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes cardStart {
            from {
              opacity: 0;
              transform: translateY(12px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* ================= MAIN CONTENT ================= */

          .main-content {
            margin-left: 240px;
            margin-top: 70px;
            animation: dashboardStart 0.35s ease-out;
          }

          .client-dashboard {
            min-height: 100vh;
            padding: 30px;
            width: 100%;
          }

          /* ================= WELCOME CARD ================= */

          .welcome-health-card {
            background: linear-gradient(135deg, #e3f2fd, #ffffff);
            border: 1px solid #cfe4f7;
            border-radius: 18px;
            padding: 28px 30px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 25px;
            overflow: hidden;
            position: relative;

            animation: welcomeStart 0.35s ease-out;
          }

          .welcome-health-card::after {
            content: "";
            position: absolute;
            width: 180px;
            height: 180px;
            background: #d6ecfb;
            border-radius: 50%;
            right: 80px;
            top: -90px;
            opacity: 0.6;
          }

          .welcome-content {
            position: relative;
            z-index: 2;
            flex: 1;
          }

          .welcome-label {
            display: inline-block;
            background: #ffffff;
            color: #1976d2;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 12px;
          }

          .welcome-content h1 {
            margin: 0;
            font-size: 27px;
            color: #1976d2;
          }

          .welcome-content p {
            margin: 8px 0 0;
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
            max-width: 620px;
          }

          /* ================= HEALTH MESSAGE ================= */

          .health-message {
            min-width: 210px;
            background: #ffffff;
            border: 1px solid #dbeafe;
            border-radius: 15px;
            padding: 18px;
            position: relative;
            z-index: 2;
            box-shadow: 0 5px 15px rgba(25, 118, 210, 0.06);

            animation: cardStart 0.3s ease-out 0.05s both;
          }

          .health-message-icon {
            width: 42px;
            height: 42px;
            background: #e3f2fd;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 21px;
            margin-bottom: 10px;
          }

          .health-message h3 {
            margin: 0;
            font-size: 14px;
            color: #1976d2;
          }

          .health-message p {
            margin: 5px 0 0;
            color: #64748b;
            font-size: 11px;
            line-height: 1.5;
          }

          /* ================= STAT CARDS ================= */

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            margin-bottom: 25px;
          }

          .stat-card {
            background: #ffffff;
            border: 1px solid #e5edf5;
            border-radius: 15px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: 0.3s;

            animation: cardStart 0.3s ease-out both;
          }

          .stat-card:nth-child(1) {
            animation-delay: 0.05s;
          }

          .stat-card:nth-child(2) {
            animation-delay: 0.10s;
          }

          .stat-card:nth-child(3) {
            animation-delay: 0.15s;
          }

          .stat-card:nth-child(4) {
            animation-delay: 0.20s;
          }

          .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(25, 118, 210, 0.08);
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: #e3f2fd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
          }

          .stat-info h3 {
            margin: 0;
            font-size: 24px;
            color: #1976d2;
          }

          .stat-info p {
            margin: 4px 0 0;
            font-size: 12px;
            color: #64748b;
          }

          /* ================= DASHBOARD GRID ================= */

          .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            align-items: start;
            gap: 22px;
          }

          .left-section,
          .right-section {
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          /* ================= COMMON CARD ================= */

          .dashboard-card {
            background: #ffffff;
            border: 1px solid #e5edf5;
            border-radius: 15px;
            padding: 22px;

            animation: cardStart 0.3s ease-out both;
          }

          .left-section .dashboard-card:nth-child(1) {
            animation-delay: 0.25s;
          }

          .left-section .dashboard-card:nth-child(2) {
            animation-delay: 0.30s;
          }

          .right-section .dashboard-card:nth-child(1) {
            animation-delay: 0.35s;
          }

          .right-section .dashboard-card:nth-child(2) {
            animation-delay: 0.40s;
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
          }

          .card-header h2 {
            margin: 0;
            font-size: 17px;
            color: #1976d2;
          }

          .view-all {
            border: 1px solid #1976d2;
            background: #1976d2;
            color: #ffffff;
            padding: 8px 14px;
            border-radius: 7px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease,
              transform 0.1s ease,
              box-shadow 0.1s ease;
          }

          .view-all:hover {
            background: #1565c0;
            color: #ffffff;
          }

          .view-all:active,
          .profile-btn:active {
            transform: scale(0.94);
            box-shadow: 0 2px 5px rgba(21, 101, 192, 0.35);
          }

          /* ================= APPOINTMENTS ================= */

          .appointment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8fbff;
            border: 1px solid #e8f1f8;
            border-radius: 11px;
            margin-bottom: 12px;
          }

          .appointment-item:last-child {
            margin-bottom: 0;
          }

          .doctor-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .doctor-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            background: #e3f2fd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }

          .doctor-info h3 {
            margin: 0;
            font-size: 13px;
            color: #1e293b;
          }

          .doctor-info p {
            margin: 4px 0 0;
            font-size: 11px;
            color: #64748b;
          }

          .appointment-details {
            text-align: right;
          }

          .appointment-date {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
          }

          .appointment-time {
            margin-top: 4px;
            font-size: 11px;
            color: #64748b;
          }

          .status {
            display: inline-block;
            margin-top: 6px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            text-transform: capitalize;
            letter-spacing: 0.3px;
          }

          .status.status-approved {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
          }

          .status.status-rejected {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
          }

          .status.status-pending {
            background: #fff8e1;
            color: #b45309;
            border: 1px solid #fef3c7;
          }

          /* ================= PRESCRIPTIONS ================= */

          .prescription-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 13px 0;
            border-bottom: 1px solid #eef2f6;
          }

          .prescription-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .medicine-info {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .medicine-icon {
            width: 38px;
            height: 38px;
            border-radius: 9px;
            background: #e3f2fd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }

          .medicine-info h3 {
            margin: 0;
            font-size: 12px;
            color: #1e293b;
          }

          .medicine-info p {
            margin: 4px 0 0;
            font-size: 10px;
            color: #64748b;
          }

          .medicine-status {
            font-size: 10px;
            color: #1976d2;
            background: #e3f2fd;
            padding: 5px 8px;
            border-radius: 15px;
          }

          /* ================= HEALTH OVERVIEW ================= */

          .health-item {
            margin-bottom: 18px;
          }

          .health-item:last-child {
            margin-bottom: 0;
          }

          .health-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 7px;
          }

          .health-name {
            font-size: 12px;
            font-weight: 600;
            color: #334155;
          }

          .health-status {
            font-size: 10px;
            color: #2e7d32;
            font-weight: 600;
          }

          .progress-bar {
            height: 7px;
            background: #edf3f8;
            border-radius: 10px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: #1976d2;
            border-radius: 10px;
          }

          /* ================= PROFILE ================= */

          .profile-card {
            background: linear-gradient(135deg, #ffffff, #f8fbff);
          }

          .profile-top {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 18px;
          }

          .profile-avatar {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #e3f2fd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .profile-top h3 {
            margin: 0;
            font-size: 15px;
            color: #1976d2;
          }

          .profile-top p {
            margin: 4px 0 0;
            font-size: 11px;
            color: #64748b;
          }

          .profile-details {
            border-top: 1px solid #e8eef5;
            padding-top: 13px;
          }

          .profile-row {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
          }

          .profile-row span:first-child {
            font-size: 11px;
            color: #64748b;
          }

          .profile-row span:last-child {
            font-size: 11px;
            color: #334155;
            font-weight: 600;
          }

          .profile-btn {
            width: auto;
            display: block;
            margin-top: 8px;
            margin-left: auto;
            margin-right: auto;
            border: 1px solid #1976d2;
            background: #1976d2;
            color: #ffffff;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            transition:
              background 0.2s ease,
              transform 0.1s ease,
              box-shadow 0.1s ease;
          }

          .profile-btn:hover {
            background: #1565c0;
          }

          /* ================= RESPONSIVE ================= */

          @media (max-width: 1100px) {
            .main-content {
              margin-left: 0;
              margin-top: 70px;
            }

            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .dashboard-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .client-dashboard {
              padding: 18px;
            }

            .welcome-health-card {
              flex-direction: column;
              align-items: flex-start;
              padding: 22px;
            }

            .health-message {
              width: 100%;
            }

            .welcome-content h1 {
              font-size: 23px;
            }

            .stats-grid {
              grid-template-columns: 1fr;
            }

            .appointment-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }

            .appointment-details {
              text-align: left;
            }
          }

          @media (max-width: 600px) {
            .main-content {
              margin-left: 0;
              margin-top: 60px;
            }

            .client-dashboard {
              padding: 14px;
            }

            .dashboard-card {
              padding: 17px;
            }

            .card-header h2 {
              font-size: 15px;
            }
          }

          /* ================= REDUCE MOTION ================= */

          @media (prefers-reduced-motion: reduce) {
            .main-content,
            .welcome-health-card,
            .health-message,
            .stat-card,
            .dashboard-card {
              animation: none;
            }
          }
        `}
      </style>

      <main className="main-content">
        <div className="client-dashboard">

          {/* ================= WELCOME ================= */}

          <div className="welcome-health-card">

            <div className="welcome-content">

              <span className="welcome-label">
                <strong><i className="bi bi-hospital"></i> PATIENT DASHBOARD</strong>
              </span>

              <h1>Welcome back, {user?.name || "Patient"}!</h1>

              <p>
                <strong>
                  Manage your appointments, medical records,
                  prescriptions and healthcare information
                  easily from your personal dashboard.
                </strong>
              </p>

            </div>

            <div className="health-message">

              <div className="health-message-icon">
                <FontAwesomeIcon icon={faHeart}/>
              </div>

              <h3>
                <strong>Your Health Matters</strong>
              </h3>

              <p>
                <strong>
                  Stay updated with your appointments,
                  prescriptions and medical records.
                </strong>
              </p>

            </div>

          </div>

          {/* ================= STATISTICS ================= */}

          <div className="stats-grid">

            <div 
              className="stat-card"
              onClick={() => goTo("/myAppointments")}
              style={{ cursor: "pointer" }}
              title="Click to view Appointments"
            >

              <div className="stat-icon">
                  <FontAwesomeIcon icon={faCalendarDays} />
              </div>

              <div className="stat-info">
                <h3>{stats.upcomingAppointments || appointments.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'approved' || a.status === 'pending').length}</h3>
                <p>
                  <strong>Upcoming Appointments</strong>
                </p>
              </div>

            </div>

            <div 
              className="stat-card"
              onClick={() => goTo("/prescription")}
              style={{ cursor: "pointer" }}
              title="Click to view Prescriptions"
            >

              <div className="stat-icon">
                <FontAwesomeIcon icon={faCapsules}/>
              </div>

              <div className="stat-info">
                <h3>{stats.prescriptions || prescriptions.length}</h3>
                <p>
                  <strong>Prescriptions</strong>
                </p>
              </div>

            </div>

            <div 
              className="stat-card"
              onClick={() => goTo("/reports/client")}
              style={{ cursor: "pointer" }}
              title="Click to view Reports"
            >

              <div className="stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                <FontAwesomeIcon icon={faFile}/>
              </div>

              <div className="stat-info">
                <h3 style={{ color: "#0284c7" }}>{stats.reports ?? reports.length ?? 0}</h3>
                <p>
                  <strong>Reports</strong>
                </p>
              </div>

            </div>

          </div>

          {/* ================= MAIN DASHBOARD ================= */}

          <div className="dashboard-grid">

            {/* ================= LEFT SECTION ================= */}

            <div className="left-section">

              {/* UPCOMING APPOINTMENTS */}

              <div className="dashboard-card">

                <div className="card-header">

                  <h2>Upcoming Appointments</h2>

                  <button
                    className="view-all"
                    onClick={() => goTo("/myAppointments")}
                  >
                    View All
                  </button>

                </div>

                {appointments.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                    No appointments scheduled currently.
                  </div>
                ) : (
                  appointments.slice(0, 3).map((apt) => (
                    <div className="appointment-item" key={apt._id || apt.id || apt.appointmentId}>
                      <div className="doctor-info">
                        <div className="doctor-icon">
                          <FontAwesomeIcon icon={faUserDoctor} />
                        </div>
                        <div>
                          <h3>{apt.doctorName || "Doctor"}</h3>
                          <p>
                            <strong>{apt.department || "Consultation"}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="appointment-details">
                        <div className="appointment-date">
                          <strong>{apt.date}</strong>
                        </div>
                        <div className="appointment-time">
                          <strong>{apt.time}</strong>
                        </div>
                        <span 
                          className={`status ${
                            (apt.status || "").toLowerCase().includes("reject") || (apt.status || "").toLowerCase().includes("cancel")
                              ? "status-rejected"
                              : (apt.status || "").toLowerCase().includes("approv") || (apt.status || "").toLowerCase().includes("confirm") || (apt.status || "").toLowerCase().includes("assigned")
                              ? "status-approved"
                              : "status-pending"
                          }`}
                          style={getAppointmentStatusStyle(apt.status)}
                        >
                          <strong>{formatStatusDisplay(apt.status)}</strong>
                        </span>
                      </div>
                    </div>
                  ))
                )}

              </div>

              {/* RECENT PRESCRIPTIONS */}

              <div className="dashboard-card">

                <div className="card-header">

                  <h2>Recent Prescriptions</h2>

                  <button
                    className="view-all"
                    onClick={() => goTo("/prescription")}
                  >
                    View All
                  </button>

                </div>

                {prescriptions.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                    No prescriptions on record.
                  </div>
                ) : (
                  prescriptions.slice(0, 3).map((presc) => (
                    <div className="prescription-item" key={presc._id || presc.id || presc.prescriptionNo}>
                      <div className="medicine-info">
                        <div className="medicine-icon">
                          <FontAwesomeIcon icon={faCapsules}/>
                        </div>
                        <div>
                          <h3>{presc.medicines && presc.medicines[0] ? presc.medicines[0].name : "Prescription"}</h3>
                          <p>
                            <strong>
                              {presc.medicines && presc.medicines[0] ? `${presc.medicines[0].dosage || '1 dose'} • ${presc.medicines[0].frequency || 'Daily'}` : presc.doctorName}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}

              </div>

            </div>

            {/* ================= RIGHT SECTION ================= */}

            <div className="right-section">

              {/* PROFILE */}

              <div className="dashboard-card profile-card">

                <div className="card-header">
                  <h2>My Profile</h2>
                </div>

                <div className="profile-top">

                  <div className="profile-avatar">
                        <FontAwesomeIcon icon={faCircleUser}/>
                  </div>

                  <div>
                    <h3>{user?.name || "Patient"}</h3>

                    <p>
                      <strong>Patient</strong>
                    </p>
                  </div>

                </div>

                <div className="profile-details">

                  <div className="profile-row">

                    <span>
                      <strong>Email</strong>
                    </span>

                    <span>
                      <strong>{user?.email || "patient@medcare.com"}</strong>
                    </span>

                  </div>

                  <div className="profile-row">

                    <span>
                      <strong>Phone</strong>
                    </span>

                    <span>
                      <strong>{user?.phone || "+91 98765 43210"}</strong>
                    </span>

                  </div>

                </div>

                <button
                  className="profile-btn"
                  onClick={() => goTo("/myProfile")}
                >
                  View Profile
                </button>

              </div>

            </div>

          </div>

        </div>
      </main>
    </>
  );
}

export default ClientDashboard;