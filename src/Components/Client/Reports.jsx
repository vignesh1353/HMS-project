import React, { useEffect, useState, useMemo } from "react";
import medicalReportService from "../../Services/medicalReportService";
import medicineRequestService from "../../Services/medicineRequestService";

function ClientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [medicineModal, setMedicineModal] = useState(null);
  const [medicineItems, setMedicineItems] = useState([
    {
      medicineName: "",
      dosage: "500mg",
      frequency: "Twice daily",
      duration: "5 days",
      quantity: 10,
      instructions: "Take after meals",
    },
  ]);
  const [requestReason, setRequestReason] = useState("");
  const [submittingMedReq, setSubmittingMedReq] = useState(false);
  const [toast, setToast] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchReports = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await medicalReportService.getReports();
      if (res && res.data) {
        // Display doctor-issued clinical reports directly to patient
        const accessibleReports = res.data.filter((r) => r.status !== "draft");
        setReports(accessibleReports);
      }
    } catch (err) {
      console.error("Error fetching client medical reports:", err);
      if (!silent) showToast("Unable to load medical reports.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports(true);
    }, 5000);

    const onFocus = () => fetchReports(true);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleDownloadPdf = async (report) => {
    try {
      showToast("Preparing your certified medical report PDF...", "info");
      await medicalReportService.downloadPdf(
        report._id,
        `Medical-Report-${report.reportId}.pdf`
      );
      showToast("Report PDF downloaded successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to download PDF.", "error");
    }
  };

  const handleOpenMedicineRequest = (report) => {
    setMedicineModal(report);
    setRequestReason(`Medication prescribed under clinical report ${report.reportId}`);
    setMedicineItems([
      {
        medicineName: "",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "5 days",
        quantity: 10,
        instructions: "Take after meals",
      },
    ]);
  };

  const handleAddMedicineItem = () => {
    setMedicineItems([
      ...medicineItems,
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

  const handleRemoveMedicineItem = (idx) => {
    setMedicineItems(medicineItems.filter((_, i) => i !== idx));
  };

  const handleMedicineItemChange = (idx, field, val) => {
    const updated = [...medicineItems];
    updated[idx][field] = val;
    setMedicineItems(updated);
  };

  const handleSubmitMedicineRequest = async (e) => {
    e.preventDefault();
    if (!medicineModal) return;

    for (const item of medicineItems) {
      if (!item.medicineName.trim()) {
        showToast("Please specify name for all requested medicines.", "error");
        return;
      }
      if (!item.quantity || Number(item.quantity) < 1) {
        showToast("Quantity must be at least 1.", "error");
        return;
      }
    }

    try {
      setSubmittingMedReq(true);
      const payload = {
        reportId: medicineModal._id,
        medicines: medicineItems,
        reason: requestReason,
      };

      const res = await medicineRequestService.createRequest(payload);
      if (res && res.success) {
        showToast("Medicine request submitted for administrative review!");
        setMedicineModal(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit medicine request.", "error");
    } finally {
      setSubmittingMedReq(false);
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const s = search.toLowerCase().trim();
      const matchesSearch =
        !s ||
        (report.reportId || "").toLowerCase().includes(s) ||
        (report.diagnosis || "").toLowerCase().includes(s) ||
        (report.doctor?.name || (typeof report.doctor === "string" ? report.doctor : "")).toLowerCase().includes(s) ||
        (report.doctor?.specialization || "").toLowerCase().includes(s) ||
        (report.visitDate || "").toLowerCase().includes(s);

      const dept = report.doctor?.specialization || "General";
      const matchesDept =
        departmentFilter === "All" || dept === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [reports, search, departmentFilter]);

  // Unique departments for filter dropdown
  const departmentOptions = useMemo(() => {
    const depts = new Set();
    reports.forEach((r) => {
      if (r.doctor?.specialization) depts.add(r.doctor.specialization);
    });
    return Array.from(depts);
  }, [reports]);

  // KPI stats
  const stats = useMemo(() => {
    const total = reports.length;
    const certified = reports.filter((r) => r.status === "approved" || r.approval?.isApproved).length;
    const uniqueDoctors = new Set(
      reports.map((r) => r.doctor?.name || (typeof r.doctor === "string" ? r.doctor : "Doctor"))
    ).size;
    const withPrescription = reports.filter((r) => r.treatment && r.treatment.trim().length > 0).length;
    return { total, certified, uniqueDoctors, withPrescription };
  }, [reports]);

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
        .reports-page {
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

        .btn-refresh {
          border: 1px solid #bbdefb;
          background: #ffffff;
          color: #1976d2;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-refresh:hover {
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

        /* ================= SEARCH & FILTER ================= */
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
          width: 340px;
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

        /* ================= REPORTS GRID ================= */
        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .report-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e1e8f0;
          box-shadow: 0 4px 15px rgba(25, 118, 210, 0.05);
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          animation: cardStart 0.3s ease-out both;
        }

        .report-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(25, 118, 210, 0.12);
          border-color: #bbdefb;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .report-id-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          color: #1976d2;
          background: #e3f2fd;
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid #bbdefb;
        }

        .diagnosis-heading {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin: 6px 0 0 0;
          line-height: 1.3;
        }

        .certified-badge {
          background: #dcfce7;
          color: #15803d;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #bbf7d0;
          white-space: nowrap;
        }

        /* Doctor attribution highlight */
        .doctor-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0f7ff;
          border: 1px solid #bbdefb;
          color: #1565c0;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 14px;
          font-size: 13px;
          font-weight: 600;
        }

        .doctor-banner i {
          font-size: 18px;
          color: #1976d2;
          flex-shrink: 0;
        }

        .report-meta-box {
          background: #f8fafc;
          border: 1px solid #eef2f6;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 12px;
          color: #475569;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        .report-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .report-meta-row span {
          color: #64748b;
        }

        .report-meta-row strong {
          color: #1e293b;
        }

        .treatment-snippet {
          font-size: 12px;
          color: #334155;
          margin-bottom: 18px;
          line-height: 1.5;
        }

        .treatment-snippet strong {
          color: #0f172a;
          display: block;
          margin-bottom: 3px;
          font-size: 12px;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
        }

        .btn-view-card {
          flex: 1;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
          text-align: center;
        }

        .btn-view-card:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .btn-pdf-card {
          flex: 1;
          padding: 8px 10px;
          border-radius: 6px;
          border: none;
          background: #0284c7;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: background 0.15s ease;
        }

        .btn-pdf-card:hover {
          background: #0369a1;
        }

        .btn-meds-card {
          flex: 1;
          padding: 8px 10px;
          border-radius: 6px;
          border: none;
          background: #10b981;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: background 0.15s ease;
        }

        .btn-meds-card:hover {
          background: #059669;
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
          width: 700px;
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
          display: flex;
          align-items: center;
          gap: 8px;
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

        .modal-detail-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 13px;
        }

        .detail-item strong {
          color: #64748b;
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .detail-item span {
          color: #1e293b;
          font-weight: 600;
        }

        .clinical-section {
          margin-bottom: 14px;
        }

        .clinical-section-label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 4px;
          display: block;
        }

        .clinical-section-content {
          margin: 0;
          color: #1e293b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
        }

        .diagnosis-highlight {
          background: #dcfce7;
          border-color: #bbf7d0;
          color: #15803d;
          font-weight: 600;
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

        .med-row-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 10px;
        }

        /* Buttons */
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

        .btn-primary-blue {
          padding: 9px 20px;
          border-radius: 8px;
          border: none;
          background: #0284c7;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s ease;
        }

        .btn-primary-blue:hover {
          background: #0369a1;
        }

        .btn-primary-green {
          padding: 9px 20px;
          border-radius: 8px;
          border: none;
          background: #10b981;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s ease;
        }

        .btn-primary-green:hover {
          background: #059669;
        }

        .btn-primary-green:disabled {
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

        .toast-success { background: #16a34a; }
        .toast-error { background: #dc2626; }
        .toast-info { background: #0284c7; }

        .empty-state {
          padding: 80px 20px;
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e1e8f0;
          text-align: center;
          color: #94a3b8;
          box-shadow: 0 4px 15px rgba(25, 118, 210, 0.05);
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
          margin: 0 auto;
          max-width: 460px;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .reports-page {
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

      <div className="reports-page">
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
            <h1>Official Medical Reports</h1>
            <p>
              Access certified doctor consultations, download official hospital PDFs, and request prescribed medications.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={() => fetchReports(false)}
              title="Refresh reports"
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
        </div>

        {/* KPI / Metric Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Medical Reports</h3>
              <strong style={{ color: "#1976d2" }}>{stats.total}</strong>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: "#e3f2fd", color: "#1976d2" }}
            >
              <i className="bi bi-file-earmark-medical"></i>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Certified Consultations</h3>
              <strong style={{ color: "#15803d" }}>{stats.certified}</strong>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
            >
              <i className="bi bi-patch-check"></i>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Prescriptions Included</h3>
              <strong style={{ color: "#6366f1" }}>{stats.withPrescription}</strong>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: "#e0e7ff", color: "#6366f1" }}
            >
              <i className="bi bi-capsule"></i>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Attending Physicians</h3>
              <strong style={{ color: "#0284c7" }}>{stats.uniqueDoctors}</strong>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}
            >
              <i className="bi bi-person-badge"></i>
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
              placeholder="Search report ID, diagnosis, doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Department:</label>
            <select
              className="filter-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departmentOptions.map((dept, i) => (
                <option key={i} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: "12px", fontSize: "14px" }}>
              Loading your medical reports...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-file-earmark-medical"></i>
            </div>
            <h3 className="empty-title">No Medical Reports Found</h3>
            <p className="empty-desc">
              {search || departmentFilter !== "All"
                ? "No medical reports match your current search or department filter."
                : "Reports are generated following your completed consultation and certified by hospital administration before becoming available."}
            </p>
          </div>
        ) : (
          <div className="reports-grid">
            {filteredReports.map((report) => {
              const docName =
                report.doctor?.name ||
                (typeof report.doctor === "string" ? report.doctor : "Dr. Medical Specialist");
              const docDept = report.doctor?.specialization || "Clinical Consultation";

              return (
                <div key={report._id} className="report-card">
                  <div>
                    <div className="card-top">
                      <div>
                        <span className="report-id-chip">
                          <i className="bi bi-file-text"></i> {report.reportId}
                        </span>
                        <h4 className="diagnosis-heading">{report.diagnosis}</h4>
                      </div>
                      <span className="certified-badge">
                        <i className="bi bi-patch-check-fill"></i> Certified
                      </span>
                    </div>

                    {/* Doctor attribution banner */}
                    <div className="doctor-banner">
                      <i className="bi bi-person-badge-fill"></i>
                      <span>This report is from Doctor: {docName}</span>
                    </div>

                    {/* Clinical info meta */}
                    <div className="report-meta-box">
                      <div className="report-meta-row">
                        <span>Attending Doctor:</span>
                        <strong>{docName}</strong>
                      </div>
                      <div className="report-meta-row">
                        <span>Department:</span>
                        <strong>{docDept}</strong>
                      </div>
                      <div className="report-meta-row">
                        <span>Consultation Date:</span>
                        <strong>{report.visitDate}</strong>
                      </div>
                      <div className="report-meta-row">
                        <span>Approval Ref:</span>
                        <strong>{report.approval?.approvalReference || report.reportId}</strong>
                      </div>
                    </div>

                    {/* Treatment snippet */}
                    <div className="treatment-snippet">
                      <strong>Treatment / Prescription:</strong>
                      <span>
                        {report.treatment || "Standard clinical treatment recommendations."}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="card-actions">
                    <button
                      className="btn-view-card"
                      onClick={() => setSelectedReport(report)}
                    >
                      <i className="bi bi-eye"></i> Details
                    </button>
                    <button
                      className="btn-pdf-card"
                      onClick={() => handleDownloadPdf(report)}
                    >
                      <i className="bi bi-file-earmark-pdf"></i> Official PDF
                    </button>
                    <button
                      className="btn-meds-card"
                      onClick={() => handleOpenMedicineRequest(report)}
                    >
                      <i className="bi bi-capsule"></i> Get Meds
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Clinical Details Modal */}
        {selectedReport && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedReport(null)}
          >
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>
                  <i className="bi bi-file-earmark-medical"></i> Certified Clinical Record &mdash; {selectedReport.reportId}
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                {/* Doctor attribution banner inside modal */}
                <div className="doctor-banner" style={{ marginBottom: "16px" }}>
                  <i className="bi bi-person-badge-fill" style={{ fontSize: "22px" }}></i>
                  <div>
                    <div>
                      This report is from Doctor:{" "}
                      <strong>
                        {selectedReport.doctor?.name ||
                          (typeof selectedReport.doctor === "string"
                            ? selectedReport.doctor
                            : "Dr. Medical Specialist")}
                      </strong>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85, fontWeight: "normal", marginTop: "2px" }}>
                      Department: {selectedReport.doctor?.specialization || "Clinical Consultation"} &bull; Official Medical Record
                    </div>
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="modal-detail-box">
                  <div className="detail-item">
                    <strong>Physician</strong>
                    <span>
                      {selectedReport.doctor?.name ||
                        (typeof selectedReport.doctor === "string"
                          ? selectedReport.doctor
                          : "Dr. Medical Specialist")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Consultation Date</strong>
                    <span>{selectedReport.visitDate}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Appointment Reference</strong>
                    <span>
                      {selectedReport.appointment?.appointmentId ||
                        (selectedReport.appointment?._id
                          ? `APT-${selectedReport.appointment._id.slice(-6).toUpperCase()}`
                          : "N/A")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Certification Reference</strong>
                    <span>{selectedReport.approval?.approvalReference || "MC-APP"}</span>
                  </div>
                </div>

                {/* Sections */}
                <div className="clinical-section">
                  <span className="clinical-section-label">Chief Complaint & Symptoms</span>
                  <p className="clinical-section-content">
                    {selectedReport.chiefComplaint || "N/A"}{" "}
                    {selectedReport.symptoms ? `| Symptoms: ${selectedReport.symptoms}` : ""}
                  </p>
                </div>

                <div className="clinical-section">
                  <span className="clinical-section-label" style={{ color: "#166534" }}>
                    Diagnosis
                  </span>
                  <p className="clinical-section-content diagnosis-highlight">
                    {selectedReport.diagnosis}
                  </p>
                </div>

                <div className="clinical-section">
                  <span className="clinical-section-label">Diagnostic Findings</span>
                  <p className="clinical-section-content">
                    {selectedReport.findings ||
                      selectedReport.testInvestigation ||
                      "Routine diagnostic evaluation completed."}
                  </p>
                </div>

                <div className="clinical-section">
                  <span className="clinical-section-label">Prescribed Treatment Plan</span>
                  <p className="clinical-section-content">
                    {selectedReport.treatment || "Standard medical therapy."}
                  </p>
                </div>

                <div className="clinical-section">
                  <span className="clinical-section-label">Doctor Notes & Follow-up</span>
                  <p className="clinical-section-content">
                    {selectedReport.doctorNotes ||
                      selectedReport.followUpRecommendation ||
                      "Review in clinic as required."}
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </button>
                <button
                  className="btn-primary-blue"
                  onClick={() => handleDownloadPdf(selectedReport)}
                >
                  <i className="bi bi-download"></i> Download PDF
                </button>
                <button
                  className="btn-primary-green"
                  onClick={() => {
                    setSelectedReport(null);
                    handleOpenMedicineRequest(selectedReport);
                  }}
                >
                  <i className="bi bi-capsule"></i> Request Medicines
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report-Linked Tablet / Medicine Request Modal */}
        {medicineModal && (
          <div
            className="modal-overlay"
            onClick={() => setMedicineModal(null)}
          >
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>
                  <i className="bi bi-capsule-pill"></i> Request Medication &mdash; {medicineModal.reportId}
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setMedicineModal(null)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "#1e40af",
                  }}
                >
                  <div>
                    <strong>Diagnosis:</strong> {medicineModal.diagnosis}
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <strong>Recommended Plan:</strong>{" "}
                    {medicineModal.treatment || "Standard medication"}
                  </div>
                </div>

                <form onSubmit={handleSubmitMedicineRequest}>
                  <div style={{ marginBottom: "16px" }}>
                    <label className="form-label">
                      Medical Reference / Request Reason
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <label className="form-label" style={{ margin: 0 }}>
                      Prescribed Tablets / Medicines ({medicineItems.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMedicineItem}
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

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {medicineItems.map((item, idx) => (
                      <div key={idx} className="med-row-card">
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr auto",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>
                              Medicine Name *
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Paracetamol 500mg"
                              value={item.medicineName}
                              onChange={(e) =>
                                handleMedicineItemChange(idx, "medicineName", e.target.value)
                              }
                              required
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>
                              Dosage
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="500mg"
                              value={item.dosage}
                              onChange={(e) =>
                                handleMedicineItemChange(idx, "dosage", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              value={item.quantity}
                              onChange={(e) =>
                                handleMedicineItemChange(idx, "quantity", e.target.value)
                              }
                              required
                            />
                          </div>

                          {medicineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicineItem(idx)}
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

                  <div className="modal-footer" style={{ padding: "16px 0 0 0" }}>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setMedicineModal(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingMedReq}
                      className="btn-primary-green"
                    >
                      {submittingMedReq ? "Submitting..." : "Submit Medicine Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ClientReports;