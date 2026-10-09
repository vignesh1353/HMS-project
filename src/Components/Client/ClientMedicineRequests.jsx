import React, { useEffect, useState, useMemo } from "react";
import medicineRequestService from "../../Services/medicineRequestService";
import medicalReportService from "../../Services/medicalReportService";
import patientService from "../../Services/patientService";
import { useAuth } from "../../context/AuthContext";

function ClientMedicineRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [medicinesList, setMedicinesList] = useState([
    {
      medicineName: "",
      dosage: "500mg",
      frequency: "Twice daily",
      duration: "5 days",
      quantity: 10,
      instructions: "Take after meals",
    },
  ]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await medicineRequestService.getRequests();
      if (res && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error("Error fetching medicine requests:", err);
      if (showSpinner) showToast("Unable to load medicine requests.", "error");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const fetchApprovedReports = async () => {
    try {
      const res = await medicalReportService.getReports({ status: "approved" });
      if (res && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const fetchPatientProfile = async () => {
    try {
      const res = await patientService.getMyProfile();
      if (res && res.data) {
        setPatientProfile(res.data);
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
    }
  };

  useEffect(() => {
    fetchRequests(true);
    fetchApprovedReports();
    fetchPatientProfile();

    const interval = setInterval(() => {
      fetchRequests(false);
    }, 5000);

    const onFocus = () => {
      fetchRequests(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleAddMedicine = () => {
    setMedicinesList([
      ...medicinesList,
      {
        medicineName: "",
        dosage: "500mg",
        frequency: "Once daily",
        duration: "5 days",
        quantity: 5,
        instructions: "Take after meals",
      },
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicinesList(medicinesList.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...medicinesList];
    updated[idx][field] = val;
    setMedicinesList(updated);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedReportId) {
      showToast("Please choose an approved clinical report.", "error");
      return;
    }

    for (const item of medicinesList) {
      if (!item.medicineName.trim()) {
        showToast("Please fill all medicine names.", "error");
        return;
      }
      if (!item.quantity || Number(item.quantity) < 1) {
        showToast("Quantity must be at least 1.", "error");
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await medicineRequestService.createRequest({
        reportId: selectedReportId,
        patientId: patientProfile?.patientId,
        patientReferenceNumber: patientProfile?.patientId,
        medicines: medicinesList,
        reason: reason || "Medication prescribed by doctor.",
      });

      if (res && res.success) {
        showToast("Medicine request submitted! Awaiting administrative approval.");
        setShowModal(false);
        setMedicinesList([
          {
            medicineName: "",
            dosage: "500mg",
            frequency: "Twice daily",
            duration: "5 days",
            quantity: 10,
            instructions: "Take after meals",
          },
        ]);
        setReason("");
        fetchRequests(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered requests based on search & status filter
  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase().trim();
    return requests.filter((req) => {
      const matchesStatus =
        statusFilter === "All" || req.status === statusFilter;

      const reqId = (req.requestId || "").toLowerCase();
      const repId = (req.report?.reportId || "").toLowerCase();
      const diag = (req.report?.diagnosis || "").toLowerCase();
      const doc = (req.report?.doctor?.name || "").toLowerCase();
      const medMatch = (req.medicines || []).some((m) =>
        (m.medicineName || "").toLowerCase().includes(q)
      );

      const matchesSearch =
        !q ||
        reqId.includes(q) ||
        repId.includes(q) ||
        diag.includes(q) ||
        doc.includes(q) ||
        medMatch;

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  // Key metrics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending_approval").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const dispensed = requests.filter((r) => r.status === "dispensed").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, dispensed, rejected };
  }, [requests]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="status-badge approved">
            <span className="status-dot"></span>
            <span>Approved</span>
          </span>
        );
      case "dispensed":
        return (
          <span className="status-badge dispensed">
            <span className="status-dot"></span>
            <span>Dispensed</span>
          </span>
        );
      case "rejected":
        return (
          <span className="status-badge rejected">
            <span className="status-dot"></span>
            <span>Rejected</span>
          </span>
        );
      case "pending_approval":
      default:
        return (
          <span className="status-badge pending">
            <span className="status-dot"></span>
            <span>Pending Approval</span>
          </span>
        );
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f7fb;
          color: #1e293b;
        }

        /* ================= ANIMATIONS ================= */
        @keyframes pageStart {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes headerStart {
          0% {
            opacity: 0;
            transform: translateY(-12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardStart {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes rowStart {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulseDot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.85);
          }
        }

        @keyframes modalOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* ================= MAIN CONTENT ================= */
        .medicine-requests-page {
          margin-left: 240px;
          margin-top: 70px;
          min-height: calc(100vh - 70px);
          padding: 30px;
          background: #f4f7fb;
          width: calc(100% - 240px);
          animation: pageStart 0.35s ease-out;
        }

        /* ================= HEADER ================= */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 25px;
          background: #e3f2fd;
          padding: 22px 25px;
          border-radius: 14px;
          border: 1px solid #bbdefb;
          box-shadow: 0 4px 15px rgba(25, 118, 210, 0.08);
          transition: background 0.25s ease, box-shadow 0.25s ease;
          animation: headerStart 0.3s ease-out;
        }

        .page-header:hover {
          background: #e3f2fd;
          box-shadow: 0 6px 18px rgba(25, 118, 210, 0.12);
        }

        .page-title h1 {
          margin: 0;
          color: #1976d2;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .page-title p {
          margin: 7px 0 0;
          color: #607d8b;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-primary-action {
          border: none;
          background: #1976d2;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25);
          transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
        }

        .btn-primary-action:hover {
          background: #1565c0;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(25, 118, 210, 0.35);
        }

        .btn-primary-action:active {
          transform: scale(0.97);
        }

        .btn-secondary-action {
          border: 1px solid #bbdefb;
          background: #ffffff;
          color: #1976d2;
          padding: 11px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-secondary-action:hover {
          background: #f0f7ff;
          border-color: #90caf9;
          transform: translateY(-2px);
        }

        /* ================= STATS GRID ================= */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: #ffffff;
          border: 1px solid #e1e8f0;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(25, 118, 210, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          animation: cardStart 0.3s ease-out both;
        }

        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.10s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.20s; }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 22px rgba(25, 118, 210, 0.12);
          border-color: #bbdefb;
        }

        .stat-info h3 {
          margin: 0 0 6px;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-info strong {
          font-size: 26px;
          font-weight: 800;
          line-height: 1;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        /* ================= FILTER / SEARCH SECTION ================= */
        .filter-section {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 25px;
          border: 1px solid #e1e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 8px rgba(25, 118, 210, 0.04);
          animation: cardStart 0.3s ease-out 0.22s both;
        }

        .search-box {
          width: 320px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 14px;
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .search-box:focus-within .search-icon {
          color: #1976d2;
        }

        .search-input {
          width: 100%;
          height: 40px;
          border: 1px solid #d5dde7;
          border-radius: 8px;
          padding: 0 12px 0 38px;
          font-size: 13px;
          outline: none;
          color: #334155;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-input:focus {
          border-color: #1976d2;
          box-shadow: 0 0 0 3px #e3f2fd;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-group label {
          color: #64748b;
          font-weight: 600;
          font-size: 13px;
        }

        .filter-select {
          height: 40px;
          border: 1px solid #d5dde7;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 13px;
          background: #ffffff;
          color: #334155;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .filter-select:focus {
          border-color: #1976d2;
          box-shadow: 0 0 0 3px #e3f2fd;
        }

        /* ================= TABLE CARD ================= */
        .requests-card {
          background: #ffffff;
          border: 1px solid #e1e8f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(25, 118, 210, 0.07);
          animation: cardStart 0.3s ease-out 0.25s both;
        }

        .card-title-bar {
          padding: 18px 24px;
          border-bottom: 1px solid #eef2f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title-bar h2 {
          margin: 0;
          color: #1976d2;
          font-size: 18px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .count-chip {
          background: #e3f2fd;
          color: #1976d2;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #e3f2fd;
          color: #1976d2;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 15px 18px;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #eef2f6;
          color: #334155;
          font-size: 13px;
          vertical-align: middle;
        }

        .data-table tbody tr {
          transition: background 0.15s ease;
          animation: rowStart 0.25s ease-out both;
        }

        .data-table tbody tr:hover {
          background: #f8fafc;
        }

        /* ================= BADGES & PILLS ================= */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .status-badge.pending {
          background: #fff8e1;
          color: #b45309;
          border: 1px solid #fef3c7;
        }

        .status-badge.pending .status-dot {
          background: #f59e0b;
          animation: pulseDot 1.5s infinite;
        }

        .status-badge.approved {
          background: #e8f5e9;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .status-badge.approved .status-dot {
          background: #16a34a;
        }

        .status-badge.dispensed {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        .status-badge.dispensed .status-dot {
          background: #0284c7;
        }

        .status-badge.rejected {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .status-badge.rejected .status-dot {
          background: #dc2626;
        }

        .report-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #dbeafe;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .medicine-item-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 12px;
          color: #334155;
          margin: 2px 4px 2px 0;
        }

        .view-btn {
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #bbdefb;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          background: #1976d2;
          color: #ffffff;
        }

        /* ================= MODAL ================= */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalOverlayFade 0.2s ease;
        }

        .modal-container {
          background: #ffffff;
          border-radius: 16px;
          width: 680px;
          max-width: 95%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid #e2e8f0;
          animation: modalPop 0.25s ease-out;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1976d2;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .patient-info-box {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .med-card-row {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 12px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-input:focus {
          border-color: #1976d2;
          box-shadow: 0 0 0 3px #e3f2fd;
        }

        .btn-cancel {
          padding: 9px 18px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-cancel:hover {
          background: #f1f5f9;
        }

        .btn-submit {
          padding: 9px 22px;
          border-radius: 8px;
          border: none;
          background: #1976d2;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-submit:hover {
          background: #1565c0;
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Toast styling */
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          padding: 12px 24px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #ffffff;
          animation: headerStart 0.25s ease-out;
        }

        .toast-success {
          background: #16a34a;
        }

        .toast-error {
          background: #dc2626;
        }

        .toast-info {
          background: #0284c7;
        }

        .empty-state {
          padding: 70px 20px;
          text-align: center;
          color: #94a3b8;
        }

        .empty-icon {
          font-size: 54px;
          color: #cbd5e1;
          margin-bottom: 12px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 700;
          color: #334155;
          margin: 0 0 6px 0;
        }

        .empty-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .medicine-requests-page {
            margin-left: 0;
            width: 100%;
            padding: 20px 15px;
          }
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .filter-section {
            flex-direction: column;
            align-items: stretch;
          }
          .search-box {
            width: 100%;
          }
        }
      `}</style>

      <div className="medicine-requests-page">
        {/* Floating Toast Notification */}
        {toast && (
          <div
            className={`toast-container ${
              toast.type === "error"
                ? "toast-error"
                : toast.type === "info"
                ? "toast-info"
                : "toast-success"
            }`}
          >
            <i
              className={`bi ${
                toast.type === "error"
                  ? "bi-exclamation-circle"
                  : toast.type === "info"
                  ? "bi-info-circle"
                  : "bi-check-circle"
              }`}
            ></i>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>Medicine Requests</h1>
            <p>
              Track pharmacy approval status, request prescribed tablets from clinical reports, and view dispensary records.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn-secondary-action"
              onClick={() => fetchRequests(true)}
              title="Refresh requests"
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
            <button
              className="btn-primary-action"
              onClick={() => {
                if (reports.length === 0) {
                  showToast(
                    "You need an approved medical report first to request medicines.",
                    "info"
                  );
                  return;
                }
                setSelectedReportId(reports[0]._id);
                setShowModal(true);
              }}
            >
              <i className="bi bi-plus-lg"></i> + New Medicine Request
            </button>
          </div>
        </div>

        {/* KPI / Metric Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Requests</h3>
              <strong style={{ color: "#1976d2" }}>{stats.total}</strong>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: "#e3f2fd", color: "#1976d2" }}
            >
              <i className="bi bi-capsule"></i>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Approved</h3>
              <strong style={{ color: "#15803d" }}>{stats.approved}</strong>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
            >
              <i className="bi bi-check2-circle"></i>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Pending Approval</h3>
              <strong style={{ color: "#b45309" }}>{stats.pending}</strong>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
            >
              <i className="bi bi-hourglass-split"></i>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Dispensed</h3>
              <strong style={{ color: "#0369a1" }}>{stats.dispensed}</strong>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}
            >
              <i className="bi bi-box2-heart"></i>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="filter-section">
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search request ID, medicine, report..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Status Filter:</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Requests ({requests.length})</option>
              <option value="pending_approval">Pending Approval ({stats.pending})</option>
              <option value="approved">Approved ({stats.approved})</option>
              <option value="dispensed">Dispensed ({stats.dispensed})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
            </select>
          </div>
        </div>

        {/* Requests Table Card */}
        <div className="requests-card">
          <div className="card-title-bar">
            <h2>
              <i className="bi bi-capsule-pill"></i> Medicine Requests List
            </h2>
            <span className="count-chip">
              Showing {filteredRequests.length} of {requests.length} Requests
            </span>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                <div className="spinner-border text-primary" role="status"></div>
                <p style={{ marginTop: "12px", fontSize: "14px" }}>
                  Loading your medicine requests...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="bi bi-capsule"></i>
                </div>
                <h3 className="empty-title">No Medicine Requests Found</h3>
                <p className="empty-desc">
                  {search || statusFilter !== "All"
                    ? "No requests match your current search or status filter."
                    : "You haven't requested any prescription medicines yet."}
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Source Report</th>
                    <th>Medicines Requested</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Admin / Pharmacy Note</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: "700", color: "#1976d2" }}>
                        {req.requestId}
                      </td>

                      <td>
                        <span className="report-badge">
                          <i className="bi bi-file-earmark-medical"></i>
                          {req.report?.reportId || "Approved Report"}
                        </span>
                        {req.report?.diagnosis && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              marginTop: "3px",
                            }}
                          >
                            {req.report.diagnosis}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ maxWidth: "280px" }}>
                          {(req.medicines || []).map((m, idx) => (
                            <span key={idx} className="medicine-item-chip">
                              <strong>{m.medicineName}</strong> ({m.dosage} &times; {m.quantity})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td>{renderStatusBadge(req.status)}</td>

                      <td>
                        {req.status === "approved" && (
                          <div style={{ color: "#15803d", fontSize: "12px" }}>
                            <i className="bi bi-check-circle-fill"></i> Stock Deducted by{" "}
                            {req.approval?.approvedByName || "Admin"}
                          </div>
                        )}
                        {req.status === "dispensed" && (
                          <div style={{ color: "#0369a1", fontSize: "12px" }}>
                            <i className="bi bi-box-seam"></i> Dispensed to Patient
                          </div>
                        )}
                        {req.status === "rejected" && (
                          <div style={{ color: "#dc2626", fontSize: "12px" }}>
                            <i className="bi bi-x-circle-fill"></i>{" "}
                            {req.approval?.rejectionReason || "Verification failed"}
                          </div>
                        )}
                        {req.status === "pending_approval" && (
                          <div style={{ color: "#b45309", fontSize: "12px" }}>
                            <i className="bi bi-clock"></i> Awaiting verification
                          </div>
                        )}
                      </td>

                      <td>
                        <button
                          className="view-btn"
                          onClick={() => setSelectedRequest(req)}
                        >
                          <i className="bi bi-eye"></i> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Details View Modal */}
        {selectedRequest && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedRequest(null)}
          >
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>
                  <i className="bi bi-capsule-pill"></i> Request Details &mdash; {selectedRequest.requestId}
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedRequest(null)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                {/* Status bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                      Current Processing Status
                    </span>
                    <div style={{ marginTop: "4px" }}>
                      {renderStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
                    Requested On:{" "}
                    <strong>
                      {new Date(selectedRequest.createdAt).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                {/* Source Clinical Report info */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "14px",
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#166534", textTransform: "uppercase" }}>
                    Source Clinical Report
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#15803d", marginTop: "4px" }}>
                    {selectedRequest.report?.reportId || "Approved Clinical Report"} &mdash; {selectedRequest.report?.diagnosis || "Consultation"}
                  </div>
                  {selectedRequest.report?.doctor?.name && (
                    <div style={{ fontSize: "12px", color: "#166534", marginTop: "3px" }}>
                      Attending Doctor: <strong>{selectedRequest.report.doctor.name}</strong>
                    </div>
                  )}
                </div>

                {/* Requested Medicines Table */}
                <div style={{ marginBottom: "16px" }}>
                  <label className="form-label">
                    Prescribed Medicines Requested ({selectedRequest.medicines?.length || 0})
                  </label>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "10px 14px", color: "#475569", textAlign: "left" }}>Medicine</th>
                        <th style={{ padding: "10px 14px", color: "#475569", textAlign: "left" }}>Dosage</th>
                        <th style={{ padding: "10px 14px", color: "#475569", textAlign: "left" }}>Frequency</th>
                        <th style={{ padding: "10px 14px", color: "#475569", textAlign: "left" }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRequest.medicines || []).map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: "600", color: "#1e293b" }}>
                            {m.medicineName}
                          </td>
                          <td style={{ padding: "10px 14px", color: "#64748b" }}>{m.dosage}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b" }}>{m.frequency}</td>
                          <td style={{ padding: "10px 14px", fontWeight: "700", color: "#1976d2" }}>
                            {m.quantity} pcs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notes & Admin Approval Section */}
                {selectedRequest.reason && (
                  <div style={{ marginBottom: "14px" }}>
                    <label className="form-label">Patient Request Reason</label>
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#334155",
                      }}
                    >
                      {selectedRequest.reason}
                    </div>
                  </div>
                )}

                {selectedRequest.approval?.approvedByName && (
                  <div style={{ marginBottom: "14px" }}>
                    <label className="form-label">Administrative Approval Info</label>
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#166534",
                      }}
                    >
                      Approved by <strong>{selectedRequest.approval.approvedByName}</strong>
                      {selectedRequest.approval.approvedAt &&
                        ` on ${new Date(selectedRequest.approval.approvedAt).toLocaleString()}`}
                    </div>
                  </div>
                )}

                {selectedRequest.approval?.rejectionReason && (
                  <div style={{ marginBottom: "14px" }}>
                    <label className="form-label">Rejection Reason</label>
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#dc2626",
                      }}
                    >
                      {selectedRequest.approval.rejectionReason}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Request Modal */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>
                  <i className="bi bi-capsule-pill"></i> Submit Medicine Request
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateRequest} style={{ display: "contents" }}>
                <div className="modal-body">
                  {/* Patient Account Reference */}
                  <div className="patient-info-box">
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#1976d2",
                          textTransform: "uppercase",
                        }}
                      >
                        Patient Account Reference
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#0f172a",
                          marginTop: "2px",
                        }}
                      >
                        {patientProfile?.name || user?.name || "Patient"}
                      </div>
                    </div>
                    <div>
                      <span
                        style={{
                          background: "#ffffff",
                          color: "#1976d2",
                          padding: "5px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "1px solid #bbdefb",
                        }}
                      >
                        <i className="bi bi-person-badge"></i>{" "}
                        {patientProfile?.patientId || "Registered Patient"}
                      </span>
                    </div>
                  </div>

                  {/* Choose Clinical Report */}
                  <div style={{ marginBottom: "18px" }}>
                    <label className="form-label">
                      Link to Approved Clinical Report *
                    </label>
                    <select
                      className="form-input"
                      value={selectedReportId}
                      onChange={(e) => setSelectedReportId(e.target.value)}
                      required
                    >
                      {reports.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.reportId} &mdash; {r.diagnosis} (Visit: {r.visitDate})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reason / Notes */}
                  <div style={{ marginBottom: "18px" }}>
                    <label className="form-label">
                      Request Reason / Medical Notes
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Doctor prescribed medication course"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  {/* Medicine Items List */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <label className="form-label" style={{ margin: 0 }}>
                      Tablets / Medicines ({medicinesList.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      style={{
                        background: "#e3f2fd",
                        border: "1px solid #bbdefb",
                        borderRadius: "6px",
                        padding: "5px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                        color: "#1976d2",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <i className="bi bi-plus-circle"></i> Add Tablet
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {medicinesList.map((item, idx) => (
                      <div key={idx} className="med-card-row">
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr auto",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#64748b",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Medicine Name *
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Amoxicillin 500mg"
                              value={item.medicineName}
                              onChange={(e) =>
                                handleItemChange(idx, "medicineName", e.target.value)
                              }
                              required
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#64748b",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Dosage
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              value={item.dosage}
                              onChange={(e) =>
                                handleItemChange(idx, "dosage", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#64748b",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(idx, "quantity", e.target.value)
                              }
                              required
                            />
                          </div>

                          {medicinesList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              style={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                borderRadius: "8px",
                                padding: "9px 12px",
                                cursor: "pointer",
                                marginTop: "18px",
                                transition: "background 0.15s ease",
                              }}
                              title="Remove item"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ClientMedicineRequests;
