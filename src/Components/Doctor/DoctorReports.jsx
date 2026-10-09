import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFileMedical, 
  faClipboardCheck, 
  faHourglassHalf, 
  faStethoscope, 
  faPlus, 
  faCheck, 
  faPaperPlane,
  faEdit,
  faEye,
  faPrint
} from "@fortawesome/free-solid-svg-icons";
import medicalReportService from "../../Services/medicalReportService";
import appointmentService from "../../Services/appointmentService";
import { useAuth } from "../../context/AuthContext";

function DoctorReports() {
  const location = useLocation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasAnimatedRef = useRef(false);

  // Animated stats
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    drafts: 0,
  });

  // Form State
  const [formData, setFormData] = useState({
    appointment: "",
    patient: "",
    patientName: "",
    diagnosis: "",
    symptoms: "",
    chiefComplaint: "",
    testInvestigation: "",
    findings: "",
    treatment: "",
    doctorNotes: "",
    followUpRecommendation: "",
  });

  const fetchData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const [reportsRes, aptsRes] = await Promise.allSettled([
        medicalReportService.getReports(),
        appointmentService.getAppointments(),
      ]);

      if (reportsRes.status === "fulfilled" && reportsRes.value?.data) {
        setReports(reportsRes.value.data);
      }
      if (aptsRes.status === "fulfilled" && aptsRes.value?.data) {
        setAppointments(aptsRes.value.data);
      }
    } catch (err) {
      console.error("Error fetching doctor reports:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    // Auto-poll every 6 seconds and on window focus so admin medicine approvals/rejections appear live
    const interval = setInterval(() => {
      fetchData(false);
    }, 6000);

    const onFocus = () => {
      fetchData(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Stats counting animation - runs only once on initial load
  useEffect(() => {
    const total = reports.length;
    const approved = reports.filter((r) => r.status === "approved").length;
    const pending = reports.filter((r) => r.status === "pending_approval").length;
    const drafts = reports.filter((r) => r.status === "draft").length;

    if (hasAnimatedRef.current) {
      setStats({
        total,
        approved,
        pending,
        drafts,
      });
      return;
    }

    if (!loading || reports.length > 0) {
      hasAnimatedRef.current = true;
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / 900, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        setStats({
          total: Math.round(total * eased),
          approved: Math.round(approved * eased),
          pending: Math.round(pending * eased),
          drafts: Math.round(drafts * eased),
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [reports, loading]);

  // Handle preselection passed from appointments or dashboard page
  useEffect(() => {
    if (location.state?.preselectAppointment) {
      const apt = location.state.preselectAppointment;
      setEditingReport(null);
      setFormData({
        appointment: apt._id,
        patient: apt.patient?._id || apt.patient || "",
        patientName: apt.patientName || "",
        diagnosis: apt.reason || "",
        symptoms: apt.notes || "",
        chiefComplaint: apt.reason || "",
        testInvestigation: "",
        findings: "",
        treatment: "",
        doctorNotes: "",
        followUpRecommendation: "",
      });
      setModalError("");
      setShowModal(true);
    }
  }, [location.state]);

  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage("");
    }, 2800);
  };

  const handleAppointmentSelect = (e) => {
    const aptId = e.target.value;
    const apt = appointments.find((a) => a._id === aptId);
    if (apt) {
      setFormData((prev) => ({
        ...prev,
        appointment: apt._id,
        patient: apt.patient?._id || apt.patient || "",
        patientName: apt.patientName || "",
        diagnosis: apt.reason || prev.diagnosis,
        chiefComplaint: apt.reason || prev.chiefComplaint,
      }));
    } else {
      setFormData((prev) => ({ ...prev, appointment: "", patient: "", patientName: "" }));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openNewModal = () => {
    setEditingReport(null);
    const firstApt = appointments[0];
    setFormData({
      appointment: firstApt?._id || "",
      patient: firstApt?.patient?._id || firstApt?.patient || "",
      patientName: firstApt?.patientName || firstApt?.patient?.name || "",
      diagnosis: firstApt?.reason || "",
      findings: "",
      treatment: "",
      symptoms: "",
      chiefComplaint: firstApt?.reason || "",
      testInvestigation: "",
      doctorNotes: "",
      followUpRecommendation: "",
    });
    setModalError("");
    setShowModal(true);
  };

  const openEditModal = (report) => {
    setEditingReport(report);
    setFormData({
      appointment: report.appointment?._id || report.appointment || "",
      patient: report.patient?._id || report.patient || "",
      patientName: report.patient?.name || report.patientName || "",
      diagnosis: report.diagnosis || "",
      findings: report.findings || report.symptoms || "",
      treatment: report.treatment || report.followUpRecommendation || "",
      symptoms: report.symptoms || "",
      chiefComplaint: report.chiefComplaint || "",
      testInvestigation: report.testInvestigation || "",
      doctorNotes: report.doctorNotes || "",
      followUpRecommendation: report.followUpRecommendation || "",
    });
    setModalError("");
    setShowModal(true);
  };

  const handleSave = async (submitForApproval = true) => {
    if (!formData.diagnosis.trim()) {
      setModalError("Clinical Diagnosis is required.");
      return;
    }
    if (!formData.appointment) {
      setModalError("Please select a consultation appointment.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const payload = {
        ...formData,
        symptoms: formData.findings || formData.symptoms || "",
        chiefComplaint: formData.diagnosis || formData.chiefComplaint || "",
        doctor: user?.name || "Dr. Medical Specialist",
        doctorName: user?.name || "Dr. Medical Specialist",
        status: "approved",
        directToPatient: true,
        submitForApproval: true,
      };

      if (editingReport) {
        await medicalReportService.updateReport(editingReport._id, payload);
        if (editingReport.status !== "approved") {
          await medicalReportService.submitReport(editingReport._id, { status: "approved" });
        }
        showToast("Clinical report issued and sent directly to patient!");
      } else {
        const createRes = await medicalReportService.createReport(payload);
        const repCode = createRes?.data?.reportId || "Report";
        showToast(`Clinical report ${repCode} issued and sent directly to patient!`);
      }

      setShowModal(false);
      await fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to save clinical report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExistingDraft = async (reportId) => {
    try {
      await medicalReportService.submitReport(reportId, { status: "approved" });
      showToast("Clinical report issued directly to patient!");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to issue report to patient");
    }
  };

  const filteredReports = reports.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const pName = (r.patientName || r.patient?.name || "").toLowerCase();
      const diag = (r.diagnosis || "").toLowerCase();
      const repNo = (r.reportNumber || r.reportId || r._id || "").toLowerCase();
      const medStatus = (r.medicineStatus || "").toLowerCase();
      const medReqId = (r.medicineRequest?.requestId || "").toLowerCase();
      return pName.includes(q) || diag.includes(q) || repNo.includes(q) || medStatus.includes(q) || medReqId.includes(q);
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return {
          bg: "#dcfce7",
          color: "#15803d",
          label: "APPROVED",
        };
      case "pending_approval":
        return {
          bg: "#fff3cd",
          color: "#856404",
          label: "PENDING APPROVAL",
        };
      case "rejected":
        return {
          bg: "#fee2e2",
          color: "#dc2626",
          label: "REJECTED",
        };
      default:
        return {
          bg: "#f1f5f9",
          color: "#475569",
          label: "DRAFT",
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

        /* ================= TABS ================= */

        .tab-button {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #cfe3ff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: #ffffff;
          color: #526b8a;
          transition: all 0.2s ease;
        }

        .tab-button:hover {
          background: #eaf5ff;
          color: #1976d2;
        }

        .tab-button.active {
          background: #1976d2;
          color: #ffffff;
          border-color: #1976d2;
          box-shadow: 0 4px 12px rgba(25,118,210,0.25);
        }

        /* ================= STAT CARDS ================= */

        .stat-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 320px));
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

        .edit-button {
          transition: all 0.3s ease;
          background-color: #fff3e0;
          color: #ef6c00;
          border: none;
          padding: 8px 13px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
        }

        .edit-button:hover {
          background: #f57c00 !important;
          color: #ffffff !important;
          transform: scale(1.05);
        }

        .submit-pill-button {
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

        .submit-pill-button:hover {
          background-color: #16a34a !important;
          color: #ffffff !important;
          transform: scale(1.05);
        }

        .outline-button {
          transition: all 0.3s ease;
          background-color: #ffffff;
          color: #64748b;
          border: 1px solid #dbe1e8;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .outline-button:hover {
          background-color: #f1f5f9;
          transform: translateY(-2px);
        }

        /* ================= INPUT FIELDS ================= */

        .input-field {
          width: 100%;
          padding: 11px 13px;
          border: 1px solid #dbe1e8;
          border-radius: 8px;
          font-size: 14px;
          background-color: #ffffff;
          transition: all 0.3s ease;
          outline: none;
        }

        .input-field:focus {
          border-color: #1976d2 !important;
          box-shadow: 0 0 0 3px rgba(25,118,210,0.1);
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
          }
        }

        @keyframes successSlide {
          from {
            transform: translateX(40px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
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
          ✓ {successMessage}
        </div>
      )}

      <div className="doctor-page">
        {/* ================= TOP HEADER CARD ================= */}
        <div className="doctor-header-card">
          <div className="doctor-topbar">
            <div className="doctor-title-wrap">
              <h1 className="doctor-title">
                Clinical Reports
              </h1>
              <p className="doctor-subtitle">
                Draft, review, and submit clinical medical records for official administrative sign-off
              </p>
            </div>

            <div className="doctor-toolbar">
              <button
                className="add-button"
                onClick={openNewModal}
              >
                <FontAwesomeIcon icon={faPlus} />
                New Medical Report
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
                <p style={statLabelStyle}>Total Reports</p>
                <h2 style={statNumberStyle}>{stats.total}</h2>
              </div>
              <span style={{ fontSize: "28px", color: "#1976d2" }}>
                <FontAwesomeIcon icon={faFileMedical} />
              </span>
            </div>
          </div>
        </div>

        {/* ================= REPORTS TABLE CARD ================= */}
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
          {/* SEARCH BAR (LEFT ALIGNED) */}
          <div
            style={{
              marginBottom: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {/* SEARCH */}
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                className="search-box"
                type="text"
                placeholder="Search patient, diagnosis, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table
            style={{
              width: "100%",
              minWidth: "1000px",
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
                <th style={thStyle}>Report ID</th>
                <th style={thStyle}>Patient</th>
                <th style={thStyle}>Clinical Diagnosis</th>
                <th style={thStyle}>Findings Preview</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "50px",
                      color: "#94a3b8",
                    }}
                  >
                    Loading medical reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "50px",
                      color: "#94a3b8",
                    }}
                  >
                    No medical reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const patientName =
                    typeof report.patient === "object"
                      ? report.patient?.name || report.patientName
                      : report.patientName || report.patient || "Patient";
                  const initial = (patientName || "P").charAt(0).toUpperCase();
                  const rawId = report.reportId || (report._id ? `REP-${report._id.slice(-6).toUpperCase()}` : "REP-1001");
                  const displayId = rawId.startsWith("REP-") ? rawId : `REP-${rawId}`;

                  return (
                    <tr
                      className="doctor-row"
                      key={report._id}
                      style={{
                        borderBottom: "1px solid #eeeeee",
                      }}
                    >
                      {/* REPORT ID */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: "700",
                            color: "#1976d2",
                            backgroundColor: "#eaf5ff",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        >
                          {displayId}
                        </span>
                      </td>

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
                              Consultation Patient
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* DIAGNOSIS */}
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
                          {report.diagnosis || "Under Evaluation"}
                        </span>
                      </td>

                      {/* FINDINGS PREVIEW */}
                      <td style={{ ...tdStyle, maxWidth: "200px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#475569",
                          }}
                        >
                          {report.findings || report.treatment || report.chiefComplaint || "No findings recorded"}
                        </div>
                      </td>

                      {/* DATE */}
                      <td style={tdStyle}>
                        <div style={{ color: "#475569" }}>
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Recent"}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button
                            className="view-button"
                            onClick={() => setSelectedReport(report)}
                            title="View Report"
                          >
                            View
                          </button>

                          {report.status === "draft" && (
                            <button
                              className="submit-pill-button"
                              onClick={() => handleSubmitExistingDraft(report._id)}
                              title="Issue directly to patient"
                            >
                              <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: "11px" }} />
                              Issue
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= REPORT EDITOR MODAL ================= */}
        {showModal && (
          <div
            className="modal-background"
            onClick={() => setShowModal(false)}
          >
            <div
              className="modal-box"
              style={{ width: "620px", maxWidth: "95%" }}
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
                <div>
                  <h3 style={{ margin: 0, color: "#1e293b", fontSize: "20px", fontWeight: "700" }}>
                    {editingReport ? "Edit Medical Report" : "New Clinical Report"}
                  </h3>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                    Enter clinical diagnosis, key findings, and treatment plan
                  </span>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  {modalError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleSave(true); }}>
                {/* APPOINTMENT & PATIENT */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelStyle}>Select Consultation Appointment *</label>
                    <select
                      className="input-field"
                      value={formData.appointment}
                      onChange={handleAppointmentSelect}
                      disabled={!!editingReport}
                      required
                    >
                      <option value="">-- Choose appointment --</option>
                      {appointments.map((a) => {
                        const aptCode = a.appointmentId || `APT-${a._id.slice(-6).toUpperCase()}`;
                        return (
                          <option key={a._id} value={a._id}>
                            [{aptCode}] {a.patientName} &bull; {a.department || "Consultation"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Patient Full Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      placeholder="Patient full name"
                      required
                    />
                  </div>
                </div>

                {/* CLINICAL DIAGNOSIS */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Clinical Diagnosis *</label>
                  <input
                    type="text"
                    className="input-field"
                    name="diagnosis"
                    placeholder="e.g. Acute Bronchitis, Type 2 Diabetes, Hypertension..."
                    value={formData.diagnosis}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* CLINICAL FINDINGS & SYMPTOMS */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Clinical Findings & Symptoms</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    name="findings"
                    placeholder="Key examination findings, symptoms, and clinical observations..."
                    value={formData.findings}
                    onChange={handleFormChange}
                  />
                </div>

                {/* PRESCRIBED TREATMENT & MEDICAL ADVICE */}
                <div style={{ marginBottom: "22px" }}>
                  <label style={labelStyle}>Prescribed Treatment & Medical Advice</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    name="treatment"
                    placeholder="Prescribed treatment plan, medications, and follow-up advice..."
                    value={formData.treatment}
                    onChange={handleFormChange}
                  />
                </div>

                {/* BUTTONS */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="add-button"
                    disabled={submitting}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    {submitting ? "Sending..." : "Send Report to Patient"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= VIEW REPORT DETAILS MODAL ================= */}
        {selectedReport && (() => {
          const rawCode = selectedReport.reportId || (selectedReport._id ? `REP-${selectedReport._id.slice(-6).toUpperCase()}` : "REP-1001");
          const reportCode = rawCode.startsWith("REP-") ? rawCode : `REP-${rawCode}`;
          const patName = typeof selectedReport.patient === "object"
            ? (selectedReport.patient?.name || selectedReport.patientName)
            : (selectedReport.patientName || selectedReport.patient || "Patient");
          const docName = typeof selectedReport.doctor === "object"
            ? (selectedReport.doctor?.name || selectedReport.doctorName)
            : (selectedReport.doctor || selectedReport.doctorName || user?.name || "Dr. Medical Specialist");
          const aptCode = typeof selectedReport.appointment === "object"
            ? (selectedReport.appointment?.appointmentId || selectedReport.appointment?._id?.slice(-6).toUpperCase())
            : (selectedReport.appointment ? String(selectedReport.appointment).slice(-6).toUpperCase() : "N/A");

          return (
            <div
              className="modal-background"
              onClick={() => setSelectedReport(null)}
            >
              <div
                className="modal-box"
                style={{ width: "660px" }}
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
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ margin: 0, color: "#1e293b", fontSize: "20px", fontWeight: "700" }}>
                        Clinical Medical Report {reportCode}
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 9px",
                          borderRadius: "12px",
                          backgroundColor: selectedReport.status === "approved" ? "#dcfce7" : "#fef3c7",
                          color: selectedReport.status === "approved" ? "#15803d" : "#d97706",
                          textTransform: "capitalize",
                        }}
                      >
                        {selectedReport.status?.replace("_", " ") || "Draft"}
                      </span>
                    </div>
                    <span style={{ fontSize: "13px", color: "#94a3b8", marginTop: "3px", display: "inline-block" }}>
                      Patient: {patName} &bull; Consultation: {aptCode}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedReport(null)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "20px",
                      color: "#94a3b8",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <DetailRow title="Report ID" value={reportCode} />
                  <DetailRow title="Patient Name" value={patName} />
                  <DetailRow title="Clinical Diagnosis" value={selectedReport.diagnosis || "Under Evaluation"} />
                  <DetailRow title="Consultation Doctor" value={docName} />
                  <DetailRow
                    title="Report Status"
                    value={selectedReport.status?.replace("_", " ").toUpperCase() || "DRAFT"}
                  />
                  <DetailRow
                    title="Pharmacy / Meds Status"
                    value={
                      selectedReport.medicineStatus === "approved"
                        ? "Approved (Stock Deducted)"
                        : selectedReport.medicineStatus === "rejected"
                        ? "Rejected"
                        : selectedReport.medicineStatus === "pending"
                        ? "Pending Pharmacy Review"
                        : selectedReport.medicineStatus === "dispensed"
                        ? "Dispensed"
                        : "No Request"
                    }
                  />
                  <DetailRow
                    title="Report Date"
                    value={selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleDateString() : (selectedReport.visitDate || "Recent")}
                    last={true}
                  />
                </div>

                {/* CLINICAL CONTENT BLOCKS */}
                <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedReport.chiefComplaint && (
                    <div style={{ backgroundColor: "#f8fbff", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <b style={{ color: "#1976d2", fontSize: "12px", textTransform: "uppercase" }}>Chief Complaint:</b>
                      <p style={{ margin: "4px 0 0", color: "#334155", fontSize: "13px" }}>
                        {typeof selectedReport.chiefComplaint === "object" ? JSON.stringify(selectedReport.chiefComplaint) : selectedReport.chiefComplaint}
                      </p>
                    </div>
                  )}

                  {selectedReport.symptoms && (
                    <div style={{ backgroundColor: "#f8fbff", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <b style={{ color: "#1976d2", fontSize: "12px", textTransform: "uppercase" }}>Symptoms & Observation:</b>
                      <p style={{ margin: "4px 0 0", color: "#334155", fontSize: "13px" }}>
                        {typeof selectedReport.symptoms === "object" ? JSON.stringify(selectedReport.symptoms) : selectedReport.symptoms}
                      </p>
                    </div>
                  )}

                  {selectedReport.findings && (
                    <div style={{ backgroundColor: "#f8fbff", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <b style={{ color: "#1976d2", fontSize: "12px", textTransform: "uppercase" }}>Clinical Findings:</b>
                      <p style={{ margin: "4px 0 0", color: "#334155", fontSize: "13px" }}>
                        {typeof selectedReport.findings === "object" ? JSON.stringify(selectedReport.findings) : selectedReport.findings}
                      </p>
                    </div>
                  )}

                  {selectedReport.treatment && (
                    <div style={{ backgroundColor: "#f0fdf4", padding: "12px 14px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                      <b style={{ color: "#15803d", fontSize: "12px", textTransform: "uppercase" }}>Prescribed Treatment Plan:</b>
                      <p style={{ margin: "4px 0 0", color: "#166534", fontSize: "13px" }}>
                        {typeof selectedReport.treatment === "object" ? JSON.stringify(selectedReport.treatment) : selectedReport.treatment}
                      </p>
                    </div>
                  )}

                  {selectedReport.followUpRecommendation && (
                    <div style={{ backgroundColor: "#fef9c3", padding: "12px 14px", borderRadius: "8px", border: "1px solid #fef08a" }}>
                      <b style={{ color: "#854d0e", fontSize: "12px", textTransform: "uppercase" }}>Follow-up Recommendation:</b>
                      <p style={{ margin: "4px 0 0", color: "#713f12", fontSize: "13px" }}>
                        {typeof selectedReport.followUpRecommendation === "object" ? JSON.stringify(selectedReport.followUpRecommendation) : selectedReport.followUpRecommendation}
                      </p>
                    </div>
                  )}

                  {/* PHARMACY TABLET & MEDICINE REQUEST SECTION */}
                  <div style={{ marginTop: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <b style={{ color: "#1e293b", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <i className="bi bi-capsule" style={{ color: "#2563eb" }}></i>
                        Pharmacy Tablet & Medicine Request Details
                      </b>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background:
                            selectedReport.medicineStatus === "approved"
                              ? "#dcfce7"
                              : selectedReport.medicineStatus === "rejected"
                              ? "#fee2e2"
                              : selectedReport.medicineStatus === "pending"
                              ? "#fef3c7"
                              : selectedReport.medicineStatus === "dispensed"
                              ? "#e0f2fe"
                              : "#f1f5f9",
                          color:
                            selectedReport.medicineStatus === "approved"
                              ? "#15803d"
                              : selectedReport.medicineStatus === "rejected"
                              ? "#dc2626"
                              : selectedReport.medicineStatus === "pending"
                              ? "#b45309"
                              : selectedReport.medicineStatus === "dispensed"
                              ? "#0369a1"
                              : "#64748b",
                        }}
                      >
                        {selectedReport.medicineStatus === "approved"
                          ? "Approved (Stock Deducted)"
                          : selectedReport.medicineStatus === "rejected"
                          ? "Rejected"
                          : selectedReport.medicineStatus === "pending"
                          ? "Pending Review"
                          : selectedReport.medicineStatus === "dispensed"
                          ? "Dispensed"
                          : "No Request"}
                      </span>
                    </div>

                    {selectedReport.medicineRequest ? (
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "10px" }}>
                          <div>
                            <strong>Request ID:</strong>{" "}
                            <span style={{ color: "#1e40af", fontWeight: "700" }}>{selectedReport.medicineRequest.requestId}</span>
                          </div>
                          <div>
                            <strong>Date:</strong>{" "}
                            {selectedReport.medicineRequest.createdAt
                              ? new Date(selectedReport.medicineRequest.createdAt).toLocaleDateString()
                              : "Recent"}
                          </div>
                        </div>

                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                          Requested Tablets & Medication Items:
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                          {(selectedReport.medicineRequest.medicines || []).map((med, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                padding: "8px 12px",
                                fontSize: "12px",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: "700", color: "#1e293b" }}>{med.medicineName}</span>
                                <span style={{ color: "#2563eb", fontWeight: "700" }}>Qty: {med.quantity} pcs</span>
                              </div>
                              <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
                                {med.dosage} &bull; {med.frequency} &bull; {med.duration} &bull; {med.instructions}
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedReport.medicineStatus === "approved" && (
                          <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "8px", padding: "10px 12px", color: "#166534", fontSize: "12px" }}>
                            <strong>✓ Approved by Admin:</strong> Inventory release authorized and pharmacy warehouse stock deducted.
                            {selectedReport.medicineApproval?.approvedByName && ` (Verified by ${selectedReport.medicineApproval.approvedByName})`}
                          </div>
                        )}

                        {selectedReport.medicineStatus === "rejected" && (
                          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 12px", color: "#991b1b", fontSize: "12px" }}>
                            <strong>✕ Admin Rejection Reason:</strong>{" "}
                            {selectedReport.medicineApproval?.rejectionReason ||
                              selectedReport.medicineRequest.approval?.rejectionReason ||
                              "Verification failed or stock unavailable."}
                          </div>
                        )}

                        {selectedReport.medicineStatus === "pending" && (
                          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 12px", color: "#92400e", fontSize: "12px" }}>
                            <strong>⏳ Under Review:</strong> Awaiting administrative authorization and pharmacy inventory release.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                        No pharmacy tablet or medicine request has been submitted against this clinical report yet.
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="outline-button"
                    onClick={() => setSelectedReport(null)}
                  >
                    Close
                  </button>

                  {selectedReport.status === "draft" && (
                    <button
                      className="add-button"
                      onClick={() => {
                        const rep = selectedReport;
                        setSelectedReport(null);
                        handleSubmitExistingDraft(rep._id);
                      }}
                    >
                      <FontAwesomeIcon icon={faPaperPlane} />
                      Submit & Send to Patient
                    </button>
                  )}

                  <button
                    className="add-button"
                    onClick={() => window.print()}
                  >
                    <FontAwesomeIcon icon={faPrint} />
                    Print Report
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}

/* ================= DETAIL ROW ================= */

function DetailRow({ title, value, last }) {
  let displayValue = value;
  if (typeof value === "object" && value !== null) {
    displayValue = value.name || value.title || value.label || value.reportId || JSON.stringify(value);
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

/* ================= TABLE & STAT STYLES ================= */

const labelStyle = {
  display: "block",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "7px",
};

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

export default DoctorReports;
