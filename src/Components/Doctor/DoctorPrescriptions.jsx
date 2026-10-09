import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faUserDoctor,
  faCalendarCheck,
  faClipboardCheck,
  faStethoscope,
  faPlus,
  faTrash,
  faPrint,
  faFileMedical
} from "@fortawesome/free-solid-svg-icons";
import prescriptionService from "../../Services/prescriptionService";
import appointmentService from "../../Services/appointmentService";
import { useAuth } from "../../context/AuthContext";

function DoctorPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Animated stats
  const [stats, setStats] = useState({
    total: 0,
    patients: 0,
    medicinesTotal: 0,
    recent: 0,
  });

  const [formData, setFormData] = useState({
    patientName: "",
    age: 30,
    gender: "Male",
    department: "Cardiology",
    diagnosis: "",
    medications: [
      {
        name: "",
        dosage: "",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "Take after food",
      },
    ],
    notes: "",
  });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [presRes, aptsRes] = await Promise.allSettled([
        prescriptionService.getPrescriptions(),
        appointmentService.getAppointments(),
      ]);

      if (presRes.status === "fulfilled" && presRes.value?.data) {
        setPrescriptions(presRes.value.data);
      }
      if (aptsRes.status === "fulfilled" && aptsRes.value?.data) {
        setAppointments(aptsRes.value.data);
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 4000);

    const onFocus = () => fetchData(true);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Stats counting animation
  useEffect(() => {
    const total = prescriptions.length;
    const patients = new Set(prescriptions.map((p) => p.patientName)).size;
    const medicinesTotal = prescriptions.reduce((acc, p) => acc + (p.medicines?.length || p.medications?.length || 1), 0);
    const recent = prescriptions.filter((p) => {
      if (!p.createdAt && !p.date) return false;
      const d = new Date(p.createdAt || p.date);
      const now = new Date();
      return now - d < 7 * 24 * 60 * 60 * 1000;
    }).length;

    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 900, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setStats({
        total: Math.round(total * eased),
        patients: Math.round(patients * eased),
        medicinesTotal: Math.round(medicinesTotal * eased),
        recent: Math.round((recent || total) * eased),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [prescriptions]);

  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage("");
    }, 2800);
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...formData.medications];
    updated[index][field] = value;
    setFormData({ ...formData, medications: updated });
  };

  const addMedicationRow = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { name: "", dosage: "", frequency: "Once daily", duration: "7 days", instructions: "Take after food" },
      ],
    });
  };

  const removeMedicationRow = (index) => {
    if (formData.medications.length <= 1) return;
    const updated = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: updated });
  };

  const handlePatientSelect = (e) => {
    const aptId = e.target.value;
    const apt = appointments.find((a) => a._id === aptId);
    if (apt) {
      setFormData((prev) => ({
        ...prev,
        patientName: apt.patientName || "",
        department: apt.department || "General",
        diagnosis: apt.reason || prev.diagnosis,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      setModalError("Patient name is required.");
      return;
    }
    if (!formData.diagnosis.trim()) {
      setModalError("Diagnosis is required.");
      return;
    }
    if (!formData.medications[0].name.trim()) {
      setModalError("Please specify at least one medication name.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const payload = {
        ...formData,
        doctor: user?.name || "Dr. Medical Specialist",
        medicines: formData.medications,
      };

      await prescriptionService.createPrescription(payload);
      setShowModal(false);
      showToast("Prescription issued successfully!");
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create prescription");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.patientName && p.patientName.toLowerCase().includes(q)) ||
      (p.prescriptionNo && p.prescriptionNo.toLowerCase().includes(q)) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(q)) ||
      (p.department && p.department.toLowerCase().includes(q))
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
          width: 320px;
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

        /* ================= STAT CARDS ================= */

        .stat-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
          ✓ {successMessage}
        </div>
      )}

      <div className="doctor-page">
        {/* ================= TOP HEADER CARD ================= */}
        <div className="doctor-header-card">
          <div className="doctor-topbar">
            <div className="doctor-title-wrap">
              <h1 className="doctor-title">
                Prescriptions
              </h1>
              <p className="doctor-subtitle">
                Generate and manage medication regimens, dosage schedules, and treatment instructions
              </p>
            </div>

            <div className="doctor-toolbar">
              <button
                className="add-button"
                onClick={() => {
                  setFormData({
                    patientName: appointments[0]?.patientName || "",
                    age: 30,
                    gender: "Male",
                    department: appointments[0]?.department || "Cardiology",
                    diagnosis: appointments[0]?.reason || "",
                    medications: [{ name: "", dosage: "", frequency: "Twice daily", duration: "5 days", instructions: "Take after food" }],
                    notes: "",
                  });
                  setModalError("");
                  setShowModal(true);
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                Issue Prescription
              </button>
            </div>
          </div>
        </div>

        {/* ================= STATS SECTION ================= */}
        <div className="stat-cards">
          {/* TOTAL PRESCRIPTIONS */}
          <div className="stat-card">
            <div style={statFlexStyle}>
              <div>
                <p style={statLabelStyle}>Total Prescriptions</p>
                <h2 style={statNumberStyle}>{stats.total}</h2>
              </div>
              <span style={{ fontSize: "28px", color: "#1976d2" }}>
                <FontAwesomeIcon icon={faCapsules} />
              </span>
            </div>
          </div>

          {/* PATIENTS PRESCRIBED */}
          {/* <div className="stat-card">
            <div style={statFlexStyle}>
              <div>
                <p style={statLabelStyle}>Patients Prescribed</p>
                <h2 style={{ ...statNumberStyle, color: "#0284c7" }}>{stats.patients}</h2>
              </div>
              <span style={{ fontSize: "28px", color: "#0284c7" }}>
                <FontAwesomeIcon icon={faUserDoctor} />
              </span>
            </div>
          </div> */}

          {/* MEDICINES PRESCRIBED */}
          <div className="stat-card">
            <div style={statFlexStyle}>
              <div>
                <p style={statLabelStyle}>Total Medicines</p>
                <h2 style={{ ...statNumberStyle, color: "#d97706" }}>{stats.medicinesTotal}</h2>
              </div>
              <span style={{ fontSize: "28px", color: "#d97706" }}>
                <FontAwesomeIcon icon={faStethoscope} />
              </span>
            </div>
          </div>

        </div>

        {/* ================= PRESCRIPTIONS TABLE CARD ================= */}
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
                Prescription Records
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  margin: "4px 0 0",
                }}
              >
                All issued prescriptions and pharmaceutical orders
              </p>
            </div>

            {/* SEARCH */}
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                className="search-box"
                type="text"
                placeholder="Search patient, Rx#, diagnosis..."
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
                <th style={thStyle}>Rx Number</th>
                <th style={thStyle}>Patient</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Clinical Diagnosis</th>
                <th style={thStyle}>Medications Count</th>
                <th style={thStyle}>Issued Date</th>
                <th style={thStyle}>Action</th>
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
                    Loading prescriptions...
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "50px",
                      color: "#94a3b8",
                    }}
                  >
                    No prescription records found.
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((p) => {
                  const patientName = p.patientName || "Patient";
                  const initial = patientName.charAt(0).toUpperCase();
                  const medsCount = p.medicines?.length || p.medications?.length || 0;
                  const rxNo = p.prescriptionNo || `RX-${p._id?.slice(-6).toUpperCase()}`;

                  return (
                    <tr
                      className="doctor-row"
                      key={p._id}
                      style={{
                        borderBottom: "1px solid #eeeeee",
                      }}
                    >
                      {/* RX NUMBER */}
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
                          {rxNo}
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
                              {p.gender || "Patient"} • {p.age ? `${p.age} yrs` : ""}
                            </div>
                          </div>
                        </div>
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
                          {p.department || "General"}
                        </span>
                      </td>

                      {/* DIAGNOSIS */}
                      <td style={tdStyle}>
                        <b style={{ color: "#334155" }}>
                          {p.diagnosis || "Clinical Review"}
                        </b>
                      </td>

                      {/* MEDICATIONS COUNT */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            backgroundColor: "#dcfce7",
                            color: "#15803d",
                            padding: "5px 11px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {medsCount} {medsCount === 1 ? "Medicine" : "Medicines"}
                        </span>
                      </td>

                      {/* DATE */}
                      <td style={tdStyle}>
                        <div style={{ color: "#475569" }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : p.date || "Recent"}
                        </div>
                      </td>

                      {/* ACTION */}
                      <td style={tdStyle}>
                        <button
                          className="view-button"
                          onClick={() => setSelectedPrescription(p)}
                        >
                          View Rx
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= ISSUE NEW PRESCRIPTION MODAL ================= */}
        {showModal && (
          <div
            className="modal-background"
            onClick={() => setShowModal(false)}
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
                  <h3 style={{ margin: 0, color: "#1e293b", fontSize: "20px", fontWeight: "700" }}>
                    Issue New Prescription
                  </h3>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                    Prescribe medications and dosage schedules
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

              <form onSubmit={handleSubmit}>
                {/* SELECT APPOINTMENT QUICK-FILL */}
                {appointments.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <label style={labelStyle}>Quick Fill from Consultation Patient</label>
                    <select
                      className="input-field"
                      onChange={handlePatientSelect}
                      defaultValue=""
                    >
                      <option value="">-- Choose scheduled patient --</option>
                      {appointments.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.patientName} ({a.department || "Consultation"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelStyle}>Patient Full Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. John Doe"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Age</label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Gender</label>
                    <select
                      className="input-field"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelStyle}>Department</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Cardiology"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Clinical Diagnosis *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Hypertension Stage 1"
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* MEDICINES LIST */}
                <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <label style={{ ...labelStyle, margin: 0 }}>Medications List *</label>
                    <button
                      type="button"
                      onClick={addMedicationRow}
                      style={{
                        background: "#eaf5ff",
                        color: "#1976d2",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      + Add Medicine
                    </button>
                  </div>

                  {formData.medications.map((med, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: "#f8fbff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "14px",
                        marginBottom: "12px",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "8px" }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                          value={med.name}
                          onChange={(e) => handleMedChange(index, "name", e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Dosage (e.g. 1 Tablet)"
                          value={med.dosage}
                          onChange={(e) => handleMedChange(index, "dosage", e.target.value)}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 40px", gap: "8px", alignItems: "center" }}>
                        <select
                          className="input-field"
                          style={{ padding: "8px" }}
                          value={med.frequency}
                          onChange={(e) => handleMedChange(index, "frequency", e.target.value)}
                        >
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Three times daily">Three times daily</option>
                          <option value="As needed (SOS)">As needed (SOS)</option>
                        </select>

                        <input
                          type="text"
                          className="input-field"
                          style={{ padding: "8px" }}
                          placeholder="Duration (e.g. 5 days)"
                          value={med.duration}
                          onChange={(e) => handleMedChange(index, "duration", e.target.value)}
                        />

                        <input
                          type="text"
                          className="input-field"
                          style={{ padding: "8px" }}
                          placeholder="Instructions (e.g. After food)"
                          value={med.instructions}
                          onChange={(e) => handleMedChange(index, "instructions", e.target.value)}
                        />

                        {formData.medications.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeMedicationRow(index)}
                            style={{
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "none",
                              borderRadius: "6px",
                              width: "36px",
                              height: "36px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Remove medication"
                          >
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: "12px" }} />
                          </button>
                        ) : <div />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* DOCTOR NOTES */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>Doctor Advice & Clinical Notes</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Dietary precautions, hydration advice, follow-up schedule..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                {/* MODAL ACTIONS */}
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
                    {submitting ? "Issuing..." : "Issue Prescription"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= VIEW PRESCRIPTION MODAL ================= */}
        {selectedPrescription && (
          <div
            className="modal-background"
            onClick={() => setSelectedPrescription(null)}
          >
            <div
              className="modal-box"
              style={{ width: "620px" }}
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
                    Prescription {selectedPrescription.prescriptionNo || `RX-${selectedPrescription._id?.slice(-6).toUpperCase()}`}
                  </h3>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                    Patient: {selectedPrescription.patientName}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedPrescription(null)}
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
                <DetailRow
                  title="Patient Name"
                  value={selectedPrescription.patientName}
                />
                <DetailRow
                  title="Age / Gender"
                  value={`${selectedPrescription.age ? `${selectedPrescription.age} Yrs` : "Adult"} / ${selectedPrescription.gender || "N/A"}`}
                />
                <DetailRow
                  title="Department"
                  value={selectedPrescription.department || "General"}
                />
                <DetailRow
                  title="Clinical Diagnosis"
                  value={selectedPrescription.diagnosis || "General Consultation"}
                />
                <DetailRow
                  title="Prescribing Doctor"
                  value={selectedPrescription.doctor || user?.name || "Dr. Medical Specialist"}
                />
                <DetailRow
                  title="Issued Date"
                  value={selectedPrescription.createdAt ? new Date(selectedPrescription.createdAt).toLocaleDateString() : selectedPrescription.date || "Today"}
                />
                <DetailRow
                  title="Prescription Status"
                  value={
                    selectedPrescription.status === "rejected" || selectedPrescription.approvalStatus === "Rejected"
                      ? `Cancelled / Rejected ${selectedPrescription.approval?.rejectionReason ? `(Reason: ${selectedPrescription.approval.rejectionReason})` : ""}`
                      : "Direct to Patient (Active & Delivered)"
                  }
                />
              </div>

              {/* MEDICATIONS SCHEDULE TABLE */}
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "15px", color: "#1e293b" }}>
                  Medications & Regimen
                </h4>

                <div
                  style={{
                    backgroundColor: "#f8fbff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#eaf5ff", textAlign: "left", color: "#1976d2" }}>
                        <th style={{ padding: "10px 12px" }}>Medicine</th>
                        <th style={{ padding: "10px 12px" }}>Dosage</th>
                        <th style={{ padding: "10px 12px" }}>Frequency</th>
                        <th style={{ padding: "10px 12px" }}>Duration</th>
                        <th style={{ padding: "10px 12px" }}>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPrescription.medicines || selectedPrescription.medications || []).map((med, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1e293b" }}>{med.name}</td>
                          <td style={{ padding: "10px 12px", color: "#475569" }}>{med.dosage || "-"}</td>
                          <td style={{ padding: "10px 12px", color: "#475569" }}>{med.frequency}</td>
                          <td style={{ padding: "10px 12px", color: "#475569" }}>{med.duration}</td>
                          <td style={{ padding: "10px 12px", color: "#15803d", fontWeight: "500" }}>{med.instructions || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedPrescription.notes && (
                <div style={{ marginTop: "16px", backgroundColor: "#fef9c3", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #ca8a04" }}>
                  <b style={{ color: "#854d0e", fontSize: "13px" }}>Advice / Notes:</b>
                  <p style={{ margin: "4px 0 0", color: "#713f12", fontSize: "13px" }}>{selectedPrescription.notes}</p>
                </div>
              )}

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
                  onClick={() => setSelectedPrescription(null)}
                >
                  Close
                </button>

                <button
                  className="add-button"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <FontAwesomeIcon icon={faPrint} />
                  Print Prescription
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

export default DoctorPrescriptions;
