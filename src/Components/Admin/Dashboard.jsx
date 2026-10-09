import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserDoctor } from "@fortawesome/free-solid-svg-icons";
import dashboardService from "../../Services/dashboardService";
import patientService from "../../Services/patientService";
import appointmentService from "../../Services/appointmentService";

function Dashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState(0);
  const [doctors, setDoctors] = useState(0);
  const [appointments, setAppointments] = useState(0);
  const [beds, setBeds] = useState(0);
  const [recentPatients, setRecentPatients] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const hasAnimated = useRef(false);

  // ================= FETCH REAL STATS & CONTINUOUS LIVE UPDATES =================

  useEffect(() => {
    let isMounted = true;

    const loadData = async (isInitial = false) => {
      try {
        const res = await dashboardService.getAdminStats();
        if (!isMounted) return;

        if (res && res.data) {
          const stats = res.data;
          const targetP = stats.totalPatients ?? 0;
          const targetD = stats.totalDoctors ?? 0;
          const targetA = stats.totalAppointments ?? 0;
          const totalBeds = stats.totalBeds ?? 0;
          const availBeds = stats.availableBeds ?? 0;
          const targetB =
            totalBeds > 0
              ? Math.round(((totalBeds - availBeds) / totalBeds) * 100)
              : 0;

          if (isInitial && !hasAnimated.current) {
            hasAnimated.current = true;
            let p = 0;
            let d = 0;
            let a = 0;
            let b = 0;

            const steps = 30;
            const incP = Math.max(1, Math.ceil(targetP / steps));
            const incD = Math.max(1, Math.ceil(targetD / steps));
            const incA = Math.max(1, Math.ceil(targetA / steps));
            const incB = Math.max(1, Math.ceil(targetB / steps));

            const timer = setInterval(() => {
              if (p < targetP) p += incP;
              if (d < targetD) d += incD;
              if (a < targetA) a += incA;
              if (b < targetB) b += incB;

              setPatients(Math.min(p, targetP));
              setDoctors(Math.min(d, targetD));
              setAppointments(Math.min(a, targetA));
              setBeds(Math.min(b, targetB));

              if (p >= targetP && d >= targetD && a >= targetA && b >= targetB) {
                clearInterval(timer);
              }
            }, 30);
          } else {
            setPatients(targetP);
            setDoctors(targetD);
            setAppointments(targetA);
            setBeds(targetB);
          }

          // Real Recent Patients
          if (Array.isArray(stats.recentPatients) && stats.recentPatients.length > 0) {
            setRecentPatients(stats.recentPatients);
          } else {
            try {
              const pRes = await patientService.getPatients();
              if (pRes && Array.isArray(pRes.data)) {
                setRecentPatients(pRes.data.slice(0, 5));
              }
            } catch (pErr) {
              console.error("Patient fallback fetch error:", pErr);
            }
          }

          // Real Today's Appointments (Ensure 3 appointments are shown)
          let appointmentsList = [];
          if (Array.isArray(stats.todayAppointments) && stats.todayAppointments.length > 0) {
            appointmentsList = stats.todayAppointments;
          }
          if (appointmentsList.length < 3) {
            try {
              const aRes = await appointmentService.getAppointments();
              if (aRes && Array.isArray(aRes.data)) {
                const existingIds = new Set(appointmentsList.map((a) => a._id || a.id));
                const extra = aRes.data.filter((a) => !existingIds.has(a._id || a.id));
                appointmentsList = [...appointmentsList, ...extra];
              }
            } catch (aErr) {
              console.error("Appointment fallback fetch error:", aErr);
            }
          }
          setTodayAppointments(appointmentsList.slice(0, 3));

          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData(true);

    // Live auto-refresh polling every 5 seconds so when any patient is added, it updates live!
    const pollInterval = setInterval(() => {
      loadData(false);
    }, 5000);

    // Refetch immediately when tab or window regains focus
    const onFocus = () => {
      loadData(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

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
          }

          /* ================= DASHBOARD PAGE ================= */

          .dashboard-page {
            min-height: calc(100vh - 70px);

            margin-top: 70px;
            margin-left: 240px;

            width: calc(100% - 240px);

            padding: 30px;

            background: #ffffff;

            animation: fadeUp 0.8s ease;
          }

          /* ================= WELCOME ================= */

          .welcome {
            background: #eaf5ff;
            border: 1px solid #cfe8ff;
            border-radius: 16px;

            padding: 20px 24px;

            min-height: 98px;

            display: flex;
            justify-content: space-between;
            align-items: center;

            box-shadow: 0 3px 12px rgba(25, 118, 210, 0.05);

            animation: fadeUp 0.7s ease;
          }

          .welcome-title {
            margin: 0;
            color: #1976d2;
            font-size: 26px;
            font-weight: 700;
            line-height: 1.2;
          }

          .welcome-text {
            color: #4f83c2;
            margin: 6px 0 0;
            font-size: 14px;
          }

          .live-badge {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: #ffffff;
            border: 1px solid #bbf7d0;
            color: #15803d;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: 20px;
            box-shadow: 0 2px 6px rgba(22, 163, 74, 0.08);
          }

          .pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #16a34a;
            animation: pulse 1.6s infinite ease-in-out;
          }

          /* ================= STAT CARDS ================= */

          .cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 25px;
          }

          .stat-card {
            background: #ffffff;
            padding: 22px;
            border: 1px solid #d8efff;
            border-radius: 14px;
            box-shadow: 0 3px 12px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            animation: zoomIn 0.8s ease;
            cursor: pointer;
          }

          .stat-card:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 15px 30px rgba(25,118,210,0.15);
            border-color: #90caf9;
          }

          .card-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .percentage {
            color: #16a34a;
            font-size: 13px;
            font-weight: bold;
          }

          .card-icon {
            font-size: 25px;
            color: #1976d2;
          }

          .card-number {
            font-size: 30px;
            margin: 15px 0 5px;
            color: #263238;
          }

          .card-label {
            color: #94a3b8;
            margin: 0;
            font-size: 13px;
          }

          /* ================= LOWER GRID ================= */

          .bottom-grid {
            display: grid;
            grid-template-columns: 1.3fr 1fr;
            gap: 20px;
            margin-top: 25px;
          }

          .panel {
            background: #ffffff;
            padding: 24px;
            border: 1px solid #d8efff;
            border-radius: 14px;
            box-shadow: 0 3px 12px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            animation: fadeUp 1s ease;
          }

          .panel:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          }

          .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 14px;
            border-bottom: 1px solid #f1f5f9;
            margin-bottom: 8px;
          }

          .panel-title {
            margin: 0;
            color: #263238;
            font-size: 18px;
            font-weight: 700;
          }

          /* ================= VIEW BUTTON ================= */

          .view-button {
            background: #e3f2fd;
            color: #1976d2;
            border: none;
            padding: 7px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s ease;
          }

          .view-button:hover {
            background: #1976d2;
            color: white;
            transform: scale(1.03);
          }

          /* ================= PATIENT ROW ================= */

          .patient-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 6px;
            border-bottom: 1px solid #f1f5f9;
            transition: all 0.2s ease;
          }

          .patient-row:hover {
            background: #f8fbff;
            transform: translateX(4px);
            border-radius: 6px;
          }

          .patient-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #e3f2fd;
            color: #1976d2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 700;
            flex-shrink: 0;
          }

          .patient-name {
            color: #1e293b;
            font-size: 14px;
          }

          .department {
            color: #64748b;
            margin: 3px 0 0;
            font-size: 12px;
          }

          /* ================= STATUS PILLS ================= */

          .status-badge-active {
            background: #dcfce7;
            color: #15803d;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
          }

          .status-badge-pending {
            background: #fef3c7;
            color: #d97706;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
          }

          .status-badge-inactive {
            background: #fee2e2;
            color: #dc2626;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
          }

          /* ================= APPOINTMENTS ================= */

          .appointment {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 13px 8px;
            border-bottom: 1px solid #f1f5f9;
            transition: all 0.2s ease;
          }

          .appointment:hover {
            background: #f8fbff;
            transform: translateX(3px);
            border-radius: 8px;
          }

          .appointment-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 15px;
            flex-shrink: 0;
          }

          .appointment-person-name {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }

          .appointment-doctor-info {
            font-size: 12px;
            color: #64748b;
            margin-top: 2px;
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
          }

          .appointment-time {
            color: #1976d2;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: flex-end;
          }

          .appointment-department {
            color: #64748b;
            font-size: 12px;
          }

          /* ================= ANIMATIONS ================= */

          @keyframes pulse {
            0% {
              opacity: 0.4;
              transform: scale(0.9);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
            100% {
              opacity: 0.4;
              transform: scale(0.9);
            }
          }

          @keyframes fadeUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes zoomIn {
            from {
              transform: scale(0.9);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          /* ================= RESPONSIVE ================= */

          @media (max-width: 1100px) {
            .cards {
              grid-template-columns: repeat(2, 1fr);
            }

            .bottom-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 750px) {
            .dashboard-page {
              margin-left: 0;
              margin-top: 70px;
              width: 100%;
              padding: 20px;
            }

            .cards {
              grid-template-columns: 1fr;
            }

            .welcome {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }

            .welcome-title {
              font-size: 22px;
            }
          }

          @media (max-width: 500px) {
            .dashboard-page {
              padding: 15px;
            }

            .panel {
              padding: 16px;
            }

            .patient-row {
              gap: 8px;
            }
          }
        `}
      </style>

      {/* ================= DASHBOARD ================= */}

      <section className="dashboard-page">

        {/* ================= WELCOME ================= */}

        <div className="welcome">
          <div>
            <h1 className="welcome-title">
              Good Morning <i className="bi bi-person-raised-hand"></i>
            </h1>

            <p className="welcome-text">
              Welcome to MedCare Hospital Management System
            </p>
          </div>

          <div className="live-badge" title={`Last synced at ${lastUpdated.toLocaleTimeString()}`}>
            <span className="pulse-dot"></span>
            <span>Live System Active</span>
          </div>
        </div>

        {/* ================= STATISTICS ================= */}

        <div className="cards">

          {/* PATIENTS */}

          <div
            className="stat-card"
            onClick={() => navigate("/patients")}
            title="Click to view all patients"
          >
            <div className="card-top">
              <span className="percentage">
                Live Total
              </span>

              <span className="card-icon">
                <i className="bi bi-people-fill"></i>
              </span>
            </div>

            <h2 className="card-number">
              {patients.toLocaleString()}
            </h2>

            <p className="card-label">
              Total Patients
            </p>
          </div>

          {/* DOCTORS */}

          <div
            className="stat-card"
            onClick={() => navigate("/doctors")}
            title="Click to view doctors"
          >
            <div className="card-top">
              <span className="percentage">
                Verified
              </span>

              <span className="card-icon">
                <FontAwesomeIcon icon={faUserDoctor}/>
              </span>
            </div>

            <h2 className="card-number">
              {doctors}
            </h2>

            <p className="card-label">
              Total Doctors
            </p>
          </div>

          {/* APPOINTMENTS */}

          {/* <div
            className="stat-card"
            onClick={() => navigate("/manageappointments")}
            title="Click to view appointments"
          >
            <div className="card-top">
              <span className="percentage">
                Scheduled
              </span>

              <span className="card-icon">
                <i className="bi bi-receipt-cutoff"></i>
              </span>
            </div>

            <h2 className="card-number">
              {appointments}
            </h2>

            <p className="card-label">
              Appointments
            </p>
          </div> */}

          {/* BEDS */}

          <div
            className="stat-card"
            onClick={() => navigate("/rooms")}
            title="Click to view rooms & beds"
          >
            <div className="card-top">
              <span className="percentage">
                Capacity
              </span>

              <span className="card-icon">
                <i className="bi bi-hospital"></i>
              </span>
            </div>

            <h2 className="card-number">
              {beds}%
            </h2>

            <p className="card-label">
              Bed Occupancy
            </p>
          </div>

        </div>

        {/* ================= LOWER CONTENT ================= */}

        <div className="bottom-grid">

          {/* ================= RECENT PATIENTS ================= */}

          <div className="panel">

            <div className="panel-header">

              <div>
                <h2 className="panel-title">
                  Recent Patients
                </h2>
                <p style={{ margin: "3px 0 0", color: "#94a3b8", fontSize: "12px" }}>
                  Active patient records & latest admissions
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="view-button"
                  onClick={() => navigate("/patients")}
                >
                  View All ({patients})
                </button>
              </div>

            </div>

            {loading ? (
              <div style={{ padding: "35px", textAlign: "center", color: "#94a3b8" }}>
                Loading patients...
              </div>
            ) : recentPatients.length > 0 ? (
              recentPatients.slice(0, 5).map((patient, index) => {
                const statusStr = (patient.status || "Active").toLowerCase();
                const badgeClass =
                  statusStr === "active" || statusStr === "confirmed"
                    ? "status-badge-active"
                    : statusStr === "inactive" || statusStr === "discharged"
                    ? "status-badge-inactive"
                    : "status-badge-pending";

                return (
                  <div
                    key={patient._id || patient.id || index}
                    className="patient-row"
                    style={
                      index === Math.min(recentPatients.length, 5) - 1
                        ? { borderBottom: "none" }
                        : {}
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="patient-avatar">
                        {(patient.name || "P").charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <b className="patient-name">
                          {patient.name}
                        </b>

                        <p className="department">
                          <span>{patient.department || "General Medicine"}</span>
                          {patient.doctor && (
                            <span style={{ color: "#64748b" }}> • {patient.doctor}</span>
                          )}
                          {patient.age ? ` • ${patient.age} yrs` : ""}
                          {patient.gender ? ` • ${patient.gender}` : ""}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span className={badgeClass}>
                        {patient.status || "Active"}
                      </span>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                        {patient.date ||
                          (patient.createdAt
                            ? new Date(patient.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "2-digit",
                              })
                            : "Recent")}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 10px",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                <i
                  className="bi bi-people"
                  style={{ fontSize: "32px", display: "block", marginBottom: "8px", color: "#cbd5e1" }}
                ></i>
                No patients registered yet.
                <div style={{ marginTop: "12px" }}>
                  <button
                    className="view-button"
                    onClick={() => navigate("/patients")}
                  >
                    + Register Patient
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ================= TODAY'S APPOINTMENTS ================= */}

          <div className="panel">

            <div className="panel-header">

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 className="panel-title">
                    Today's Appointments
                  </h2>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      padding: "2px 9px",
                      borderRadius: "12px",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    3 Scheduled
                  </span>
                </div>
                <p style={{ margin: "3px 0 0", color: "#94a3b8", fontSize: "12px" }}>
                  Today's consultations person list (3 appointments)
                </p>
              </div>

              <button
                className="view-button"
                onClick={() => navigate("/manageappointments")}
              >
                View All ({appointments})
              </button>

            </div>

            {loading ? (
              <div style={{ padding: "35px", textAlign: "center", color: "#94a3b8" }}>
                Loading appointments...
              </div>
            ) : todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 3).map((apt, index) => {
                const status = (apt.status || "pending").toLowerCase();
                const isApproved =
                  status === "approved" ||
                  status === "confirmed" ||
                  status === "completed" ||
                  status === "doctor_assigned" ||
                  status === "room_assigned";
                const isCancelled =
                  status === "rejected" || status === "cancelled";

                const badgeBg = isApproved
                  ? "#dcfce7"
                  : isCancelled
                  ? "#fee2e2"
                  : "#fef3c7";
                const badgeColor = isApproved
                  ? "#15803d"
                  : isCancelled
                  ? "#dc2626"
                  : "#d97706";

                const personName = apt.patientName || "Patient";
                const personInitial = personName.charAt(0).toUpperCase();

                return (
                  <div
                    key={apt._id || apt.id || index}
                    className="appointment"
                    style={
                      index === Math.min(todayAppointments.length, 3) - 1
                        ? { borderBottom: "none" }
                        : {}
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                      <div className="appointment-avatar">
                        {personInitial}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div className="appointment-person-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {personName}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "1px 6px",
                              borderRadius: "6px",
                              background: "#f1f5f9",
                              color: "#64748b",
                              fontWeight: 600,
                            }}
                          >
                            Person #{index + 1}
                          </span>
                        </div>

                        <div className="appointment-doctor-info">
                          <span>
                            <i className="bi bi-person-badge" style={{ marginRight: "4px", color: "#1976d2" }}></i>
                            {apt.doctorName || "Assigned Doctor"}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <span className="appointment-department">
                            {apt.department || "General Consultation"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "10px" }}>
                      <b className="appointment-time">
                        <i className="bi bi-clock" style={{ marginRight: "3px" }}></i>
                        {apt.time || "10:00 AM"}
                      </b>

                      <div style={{ marginTop: "4px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 9px",
                            borderRadius: "12px",
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            textTransform: "capitalize",
                            display: "inline-block",
                          }}
                        >
                          {apt.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 10px",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                <i
                  className="bi bi-calendar2-check"
                  style={{ fontSize: "32px", display: "block", marginBottom: "8px", color: "#cbd5e1" }}
                ></i>
                No appointments scheduled today.
                <div style={{ marginTop: "12px" }}>
                  <button
                    className="view-button"
                    onClick={() => navigate("/manageappointments")}
                  >
                    Manage Appointments
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </section>
    </>
  );
}

export default Dashboard;