import React, { useState, useEffect, useMemo, useRef } from "react";
import medicalReportService from "../../Services/medicalReportService";

/* =========================================================
   COUNTER COMPONENT (ANIMATED NUMERICAL VALUES)
   ========================================================= */
function Counter({ value }) {
  const [count, setCount] = useState(Number(value) || 0);
  const countRef = useRef(Number(value) || 0);

  useEffect(() => {
    const target = Number(value) || 0;
    const current = countRef.current;
    if (current === target) {
      setCount(target);
      return;
    }

    const diff = target - current;
    const steps = Math.min(Math.max(Math.abs(diff), 1), 20);
    const stepIncrement = diff / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        countRef.current = target;
        setCount(target);
        clearInterval(timer);
      } else {
        const nextVal = Math.round(current + stepIncrement * step);
        countRef.current = nextVal;
        setCount(nextVal);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

/* =========================================================
   INITIALS HELPER FOR AVATARS
   ========================================================= */
function getInitials(name) {
  if (!name) return "PT";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteReport, setDeleteReport] = useState(null);
  const [toast, setToast] = useState(null);

  /* Helper to get persistent deleted IDs from localStorage */
  const getDeletedRepIds = () => {
    try {
      const stored = localStorage.getItem("admin_deleted_rep_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /* Helper accessors */
  const getPatientName = (r) => {
    return (
      r.patientName ||
      r.patient?.name ||
      r.appointment?.patientName ||
      "Patient"
    );
  };

  const getDoctorName = (r) => {
    return (
      r.doctorName ||
      r.doctor?.name ||
      r.appointment?.doctorName ||
      "Dr. Medical Specialist"
    );
  };

  const getDepartment = (r) => {
    return (
      r.department ||
      r.doctor?.department ||
      r.doctor?.specialization ||
      r.appointment?.department ||
      "General Medicine"
    );
  };

  const getReportCode = (r) => {
    const raw = r.reportId || (r._id ? `REP-${r._id.slice(-6).toUpperCase()}` : "REP-1001");
    return raw.startsWith("REP-") ? raw : `REP-${raw}`;
  };

  /* Fetch clinical reports from medicalReportService */
  const fetchReports = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const res = await medicalReportService.getReports();
      if (res && res.data) {
        const deletedIds = getDeletedRepIds();
        const activeList = res.data.filter(
          (r) =>
            !r.deletedFromAdmin &&
            !deletedIds.includes(r._id) &&
            !deletedIds.includes(r.reportId)
        );
        setReports(activeList);
      }
    } catch (err) {
      console.error("Error fetching medical reports for admin:", err);
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  /* Soft delete: removes only from Admin view */
  const confirmDelete = async () => {
    if (!deleteReport) return;

    try {
      const repId = deleteReport._id || deleteReport.id || deleteReport.reportId;
      const repCode = getReportCode(deleteReport);

      // Optimistically remove from admin table
      setReports((prev) =>
        prev.filter(
          (r) =>
            r._id !== repId &&
            r.reportId !== deleteReport.reportId
        )
      );

      // Persist in localStorage to prevent 6s background polling flicker
      try {
        const deletedIds = getDeletedRepIds();
        if (repId && !deletedIds.includes(repId)) deletedIds.push(repId);
        if (
          deleteReport.reportId &&
          !deletedIds.includes(deleteReport.reportId)
        ) {
          deletedIds.push(deleteReport.reportId);
        }
        localStorage.setItem(
          "admin_deleted_rep_ids",
          JSON.stringify(deletedIds)
        );
      } catch (e) {
        console.error("Storage error:", e);
      }

      await medicalReportService.deleteReport(repId);
      setDeleteReport(null);
      showToast(`Clinical report ${repCode} deleted successfully!`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete clinical report!",
        "error"
      );
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => fetchReports(true), 6000);
    const onFocus = () => fetchReports(true);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  /* Statistics calculation */
  const stats = useMemo(() => {
    const total = reports.length;
    const uniquePatients = new Set(
      reports.map((r) => getPatientName(r)).filter(Boolean)
    ).size;
    const uniqueDoctors = new Set(
      reports.map((r) => getDoctorName(r)).filter(Boolean)
    ).size;
    const uniqueDiagnoses = new Set(
      reports.map((r) => r.diagnosis).filter(Boolean)
    ).size;
    return { total, uniquePatients, uniqueDoctors, uniqueDiagnoses };
  }, [reports]);

  /* Departments list for filtering */
  const departmentsList = useMemo(() => {
    const set = new Set();
    reports.forEach((r) => {
      const dept = getDepartment(r);
      if (dept) set.add(dept);
    });
    return Array.from(set);
  }, [reports]);

  /* Filtered reports based on search & department */
  const filteredReports = useMemo(() => {
    const q = search.toLowerCase().trim();
    return reports.filter((r) => {
      const repNo = getReportCode(r).toLowerCase();
      const patient = getPatientName(r).toLowerCase();
      const doctor = getDoctorName(r).toLowerCase();
      const diagnosis = (r.diagnosis || "").toLowerCase();
      const findings = (r.findings || "").toLowerCase();
      const treatment = (r.treatment || "").toLowerCase();
      const dept = getDepartment(r).toLowerCase();

      const matchesSearch =
        !q ||
        repNo.includes(q) ||
        patient.includes(q) ||
        doctor.includes(q) ||
        diagnosis.includes(q) ||
        findings.includes(q) ||
        treatment.includes(q) ||
        dept.includes(q);

      const matchesDept =
        departmentFilter === "All" ||
        dept === departmentFilter.toLowerCase();

      return matchesSearch && matchesDept;
    });
  }, [reports, search, departmentFilter]);

  const handlePrintSlip = (report) => {
    setSelectedReport(report);
    setTimeout(() => {
      window.print();
    }, 300);
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
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f8fb;
        }

        /* ================= PAGE CONTAINER ================= */
        .reports-page {
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
        .reports-header {
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

        .header-pill {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1e40af;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08);
        }

        /* ================= STATS ================= */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }

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
          font-size: 25px;
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .stat-card:hover .stat-icon {
          transform: scale(0.90);
        }

        .blue-icon { background: #e3f2fd; color: #1976d2; }
        .green-icon { background: #e8f5e9; color: #2e7d32; }
        .orange-icon { background: #fff3e0; color: #ef6c00; }
        .purple-icon { background: #f3e5f5; color: #8e44ad; }

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

        /* ================= REPORTS CARD & TOOLBAR ================= */
        .reports-card {
          background: #ffffff;
          border: 1px solid #e5edf3;
          border-radius: 18px;
          box-shadow: 0 7px 22px rgba(50, 90, 110, 0.06);
          overflow: hidden;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          animation: contentAppear 0.8s ease;
        }

        .reports-card:hover {
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

        .reports-toolbar {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid #edf2f5;
          flex-wrap: wrap;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 280px;
        }

        .search-box {
          width: 100%;
          max-width: 460px;
          position: relative;
        }

        .search-box span {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: #90a4ae;
        }

        .search-box input {
          width: 100%;
          height: 43px;
          padding: 0 15px 0 42px;
          border: 1px solid #dce6ec;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
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

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-select {
          height: 43px;
          padding: 0 14px;
          border: 1px solid #dce6ec;
          border-radius: 10px;
          font-size: 13px;
          color: #455a64;
          background: #fbfdff;
          outline: none;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .filter-select:focus {
          border-color: #1976d2;
        }

        .refresh-btn {
          height: 43px;
          padding: 0 18px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: all 0.25s ease;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: translateY(-2px);
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
          background: #f7fafc;
        }

        th {
          padding: 16px 18px;
          text-align: left;
          font-size: 12px;
          color: #78909c;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-weight: 700;
          border-bottom: 1px solid #edf2f5;
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

        .rep-badge {
          font-weight: 700;
          color: #1976d2;
          font-family: monospace;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #e3f2fd;
          padding: 5px 11px;
          border-radius: 8px;
        }

        .patient-cell {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .patient-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #e0f2fe;
          color: #0284c7;
          font-weight: 700;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .patient-meta .name {
          font-weight: 600;
          color: #263238;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .doctor-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #334155;
          font-weight: 500;
        }

        .dept-pill {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .diagnosis-text {
          font-weight: 600;
          color: #1e293b;
          font-size: 13px;
        }

        .findings-snippet {
          color: #64748b;
          font-size: 12px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .status-badge.approved {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.draft {
          background: #fef3c7;
          color: #b45309;
        }

        /* ================= ACTIONS ================= */
        .actions {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
        }

        .action-btn {
          height: 34px;
          padding: 0 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
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

        .print-table-btn {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .print-table-btn:hover {
          background: #475569;
          color: #ffffff;
          transform: translateY(-2px);
        }

        .delete-btn {
          width: 34px;
          height: 34px;
          padding: 0;
          background: #ffebee;
          color: #e53935;
          border: 1px solid #ffcdd2;
          border-radius: 8px;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .delete-btn:hover {
          background: #ffcdd2;
          transform: translateY(-2px) scale(0.92);
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
          max-width: 780px;
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
          padding: 24px;
          border-bottom: 1px solid #edf2f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fbff;
          border-radius: 20px 20px 0 0;
        }

        .modal-title h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #1976d2;
        }

        .modal-title p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 26px;
          color: #94a3b8;
          cursor: pointer;
          line-height: 1;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .close-btn:hover {
          color: #ef4444;
          transform: scale(1.15);
        }

        .modal-body {
          padding: 24px;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }

        .overview-box {
          background: #f8fbfd;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #edf2f7;
        }

        .overview-box .label {
          margin: 0 0 4px;
          font-size: 11px;
          color: #78909c;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .overview-box .val {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #263238;
        }

        .section-heading {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-card-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }

        .detail-card-box .box-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #1976d2;
          margin-bottom: 6px;
        }

        .detail-card-box .box-content {
          margin: 0;
          font-size: 13px;
          color: #334155;
          line-height: 1.5;
        }

        .modal-footer {
          padding: 18px 24px;
          border-top: 1px solid #edf2f5;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #f8fbff;
          border-radius: 0 0 20px 20px;
        }

        .modal-print-btn {
          height: 38px;
          padding: 0 20px;
          background: #1976d2;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
        }

        .modal-print-btn:hover {
          background: #1565c0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25);
        }

        .modal-close-btn {
          height: 38px;
          padding: 0 18px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .modal-close-btn:hover {
          background: #f1f5f9;
          color: #334155;
        }

        /* ================= DELETE CONFIRMATION MODAL ================= */
        .delete-modal {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          padding: 30px 24px;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
          border: 1px solid #fee2e2;
          animation: modalZoom 0.3s ease;
        }

        .delete-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #ffebee;
          color: #e53935;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .delete-modal h3 {
          margin: 0 0 10px;
          color: #263238;
          font-size: 20px;
          font-weight: 800;
        }

        .delete-modal p {
          margin: 0 0 24px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .delete-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .cancel-btn {
          height: 42px;
          padding: 0 20px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .cancel-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .confirm-delete-btn {
          height: 42px;
          padding: 0 22px;
          background: #e53935;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(229, 57, 53, 0.25);
        }

        .confirm-delete-btn:hover {
          background: #d32f2f;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(229, 57, 53, 0.35);
        }

        /* ================= TOAST NOTIFICATION ================= */
        .toast {
          position: fixed;
          top: 85px;
          right: 25px;
          background: #ffffff;
          color: #263238;
          padding: 14px 22px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          border-left: 4px solid #2e7d32;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10000;
          font-size: 14px;
          font-weight: 600;
          animation: toastTopRight 0.4s ease;
        }

        .toast.error {
          border-left: 4px solid #e53935;
        }

        @keyframes toastTopRight {
          from {
            opacity: 0;
            transform: translateX(50px) translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        .toast-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e8f5e9;
          color: #2e7d32;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: bold;
        }

        .toast.error .toast-icon {
          background: #ffebee;
          color: #e53935;
        }

        /* ================= EMPTY STATE ================= */
        .empty-state {
          padding: 45px 20px;
          text-align: center;
          color: #94a3b8;
        }

        .empty-state i {
          font-size: 42px;
          color: #cbd5e1;
          margin-bottom: 12px;
          display: inline-block;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        /* ================= RESPONSIVE ================= */
        @media (max-width: 1200px) {
          .reports-page {
            padding-left: 220px;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .reports-page {
            margin-left: 0;
            width: 100%;
            padding: 20px 18px 18px;
          }
        }

        @media (max-width: 700px) {
          .reports-page {
            padding: 70px 18px 18px 18px;
          }
          .reports-header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
            padding: 20px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .reports-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .toolbar-left, .toolbar-right, .search-box {
            width: 100%;
            max-width: 100%;
          }
          .overview-grid {
            grid-template-columns: 1fr;
          }
        }
        `}
      </style>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="reports-page">
        {/* ================= HEADER ================= */}
        <div className="reports-header">
          <div className="header-title">
            <h1>Manage Clinical Reports</h1>
            <p>Real-time administrative visibility of doctor-issued clinical reports delivered directly to patients</p>
          </div>
          <div className="header-pill">
            <i className="bi bi-info-circle-fill" style={{ color: "#2563eb" }}></i>
            Direct-to-Patient Delivery Active
          </div>
        </div>

        {/* ================= STAT CARDS ================= */}
        <div className="stats-grid">
          {/* TOTAL REPORTS */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Total Clinical Reports</p>
              <h2>
                <Counter value={stats.total} />
              </h2>
            </div>
            <div className="stat-icon blue-icon">
              <i className="bi bi-file-earmark-medical"></i>
            </div>
          </div>

          {/* PATIENTS EVALUATED */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Patients Evaluated</p>
              <h2>
                <Counter value={stats.uniquePatients} />
              </h2>
            </div>
            <div className="stat-icon green-icon">
              <i className="bi bi-people-fill"></i>
            </div>
          </div>

          {/* ATTENDING DOCTORS */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Attending Doctors</p>
              <h2>
                <Counter value={stats.uniqueDoctors} />
              </h2>
            </div>
            <div className="stat-icon orange-icon">
              <i className="bi bi-hospital"></i>
            </div>
          </div>

          {/* CLINICAL DIAGNOSES */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Clinical Diagnoses</p>
              <h2>
                <Counter value={stats.uniqueDiagnoses} />
              </h2>
            </div>
            <div className="stat-icon purple-icon">
              <i className="bi bi-heart-pulse"></i>
            </div>
          </div>
        </div>

        {/* ================= REPORTS CARD ================= */}
        <div className="reports-card">
          {/* TOOLBAR */}
          <div className="reports-toolbar">
            <div className="toolbar-left">
              <div className="search-box">
                <span>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  placeholder="Search by Report ID, patient, doctor, diagnosis, symptoms..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="toolbar-right">
              {departmentsList.length > 0 && (
                <select
                  className="filter-select"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}

              <button
                className="refresh-btn"
                onClick={() => fetchReports(false)}
                title="Refresh report records"
              >
                <i
                  className={`bi bi-arrow-clockwise ${
                    isRefreshing || loading ? "spin-icon" : ""
                  }`}
                ></i>
                Refresh
              </button>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Patient</th>
                  <th>Attending Doctor</th>
                  <th>Department</th>
                  <th>Clinical Diagnosis</th>
                  <th>Findings & Treatment</th>
                  <th>Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && reports.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                      <i className="bi bi-arrow-clockwise spin-icon" style={{ fontSize: "24px", color: "#1976d2" }}></i>
                      <p style={{ margin: "10px 0 0", color: "#64748b" }}>Loading clinical reports...</p>
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <i className="bi bi-file-earmark-x"></i>
                        <p>No clinical reports match your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const repCode = getReportCode(report);
                    const patName = getPatientName(report);
                    const docName = getDoctorName(report);
                    const dept = getDepartment(report);

                    return (
                      <tr key={report._id || report.reportId}>
                        {/* REPORT ID */}
                        <td>
                          <span className="rep-badge">
                            <i className="bi bi-file-earmark-medical"></i>
                            {repCode}
                          </span>
                        </td>

                        {/* PATIENT */}
                        <td>
                          <div className="patient-cell">
                            <div className="patient-avatar">
                              {getInitials(patName)}
                            </div>
                            <div className="patient-meta">
                              <div className="name">{patName}</div>
                            </div>
                          </div>
                        </td>

                        {/* ATTENDING DOCTOR */}
                        <td>
                          <div className="doctor-chip">
                            <i className="bi bi-person-badge" style={{ color: "#1976d2" }}></i>
                            <span>{docName}</span>
                          </div>
                        </td>

                        {/* DEPARTMENT */}
                        <td>
                          <span className="dept-pill">{dept}</span>
                        </td>

                        {/* CLINICAL DIAGNOSIS */}
                        <td>
                          <div className="diagnosis-text">
                            {report.diagnosis || "Clinical Evaluation"}
                          </div>
                        </td>

                        {/* FINDINGS & TREATMENT */}
                        <td>
                          <div className="findings-snippet" title={report.findings || report.treatment || "No findings recorded"}>
                            {report.findings || report.treatment || "Observations recorded"}
                          </div>
                        </td>

                        {/* DATE */}
                        <td style={{ whiteSpace: "nowrap" }}>
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleDateString()
                            : report.visitDate || "Recent"}
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="actions">
                            <button
                              className="action-btn view-btn"
                              onClick={() => setSelectedReport(report)}
                              title="View Full Report Details"
                            >
                              <i className="bi bi-eye"></i> View
                            </button>

                            <button
                              className="action-btn print-table-btn"
                              onClick={() => handlePrintSlip(report)}
                              title="Print Report Slip"
                            >
                              <i className="bi bi-printer"></i>
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() => setDeleteReport(report)}
                              title="Delete Report (Admin view only)"
                            >
                              <i className="bi bi-trash"></i>
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

        {/* =====================================================
            VIEW REPORT DETAILS MODAL
            ===================================================== */}
        {selectedReport && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedReport(null)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div className="modal-header">
                <div className="modal-title">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3>Clinical Medical Report</h3>
                    <span className="rep-badge">
                      {getReportCode(selectedReport)}
                    </span>
                    <span
                      className={`status-badge ${
                        selectedReport.status === "approved" ? "approved" : "draft"
                      }`}
                    >
                      <i className="bi bi-check-circle-fill"></i>
                      {selectedReport.status?.replace("_", " ").toUpperCase() || "ISSUED"}
                    </span>
                  </div>
                  <p>
                    Certified medical evaluation record delivered directly to patient
                  </p>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  &times;
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="modal-body">
                {/* OVERVIEW CARDS */}
                <div className="overview-grid">
                  <div className="overview-box">
                    <p className="label">Patient Name</p>
                    <p className="val">{getPatientName(selectedReport)}</p>
                  </div>
                  <div className="overview-box">
                    <p className="label">Department</p>
                    <p className="val">{getDepartment(selectedReport)}</p>
                  </div>
                  <div className="overview-box">
                    <p className="label">Attending Physician</p>
                    <p className="val">{getDoctorName(selectedReport)}</p>
                  </div>
                  <div className="overview-box">
                    <p className="label">Issue Date</p>
                    <p className="val">
                      {selectedReport.createdAt
                        ? new Date(selectedReport.createdAt).toLocaleDateString()
                        : selectedReport.visitDate || "Recent"}
                    </p>
                  </div>
                </div>

                {/* CLINICAL DIAGNOSIS */}
                <div className="section-heading">
                  <i className="bi bi-heart-pulse" style={{ color: "#1976d2" }}></i>
                  Clinical Assessment & Diagnosis
                </div>
                <div className="detail-card-box" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                  <div className="box-title" style={{ color: "#1e40af" }}>Primary Diagnosis</div>
                  <p className="box-content" style={{ fontWeight: "700", color: "#1e3a8a", fontSize: "14px" }}>
                    {selectedReport.diagnosis || "Under Clinical Evaluation"}
                  </p>
                </div>

                {/* CLINICAL FINDINGS & SYMPTOMS */}
                {(selectedReport.findings || selectedReport.symptoms || selectedReport.chiefComplaint) && (
                  <div className="detail-card-box">
                    <div className="box-title">Examination Findings & Symptoms</div>
                    <p className="box-content">
                      {selectedReport.findings || selectedReport.symptoms || selectedReport.chiefComplaint}
                    </p>
                  </div>
                )}

                {/* PRESCRIBED TREATMENT */}
                {selectedReport.treatment && (
                  <div className="detail-card-box" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                    <div className="box-title" style={{ color: "#15803d" }}>Prescribed Treatment Plan & Advice</div>
                    <p className="box-content" style={{ color: "#166534" }}>
                      {selectedReport.treatment}
                    </p>
                  </div>
                )}

                {/* DOCTOR NOTES / FOLLOW-UP */}
                {(selectedReport.doctorNotes || selectedReport.followUpRecommendation) && (
                  <div className="detail-card-box" style={{ background: "#fefce8", borderColor: "#fef08a" }}>
                    <div className="box-title" style={{ color: "#854d0e" }}>Physician Recommendations & Follow-Up</div>
                    <p className="box-content" style={{ color: "#713f12" }}>
                      {selectedReport.doctorNotes || selectedReport.followUpRecommendation}
                    </p>
                  </div>
                )}

                {/* PHARMACY TABLETS & MEDICINE REQUEST (IF ATTACHED) */}
                {selectedReport.medicineRequest && selectedReport.medicineRequest.medicines?.length > 0 && (
                  <div>
                    <div className="section-heading">
                      <i className="bi bi-capsule" style={{ color: "#2563eb" }}></i>
                      Prescribed Pharmacy Medications
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                      {selectedReport.medicineRequest.medicines.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "10px 14px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "13px" }}>
                              {m.medicineName}
                            </span>
                            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
                              {m.dosage} &bull; {m.frequency} &bull; {m.duration}
                            </div>
                          </div>
                          <span style={{ color: "#2563eb", fontWeight: "700", fontSize: "12px" }}>
                            Qty: {m.quantity} pcs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="modal-footer">
                <button
                  className="modal-print-btn"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer"></i> Print Report Slip
                </button>
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            DELETE CONFIRMATION MODAL (MATCHING BILLING.JSX)
            ===================================================== */}
        {deleteReport && (
          <div
            className="modal-overlay"
            onClick={() => setDeleteReport(null)}
          >
            <div
              className="delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="delete-icon">
                <i className="bi bi-trash"></i>
              </div>

              <h3>Delete Clinical Report?</h3>

              <p>
                Are you sure you want to delete{" "}
                <strong>{getReportCode(deleteReport)}</strong>?
                <br />
                <span style={{ fontSize: "12px", color: "#78909c" }}>
                  This removes it from the Admin page only. Doctor & patient records remain active.
                </span>
              </p>

              <div className="delete-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setDeleteReport(null)}
                >
                  Cancel
                </button>

                <button
                  className="confirm-delete-btn"
                  onClick={confirmDelete}
                >
                  Delete Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            TOAST NOTIFICATION (MATCHING BILLING.JSX)
            ===================================================== */}
        {toast && (
          <div className={`toast ${toast.type === "error" ? "error" : ""}`}>
            <span className="toast-icon">
              {toast.type === "error" ? "!" : "✓"}
            </span>
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </>
  );
}

export default Reports;