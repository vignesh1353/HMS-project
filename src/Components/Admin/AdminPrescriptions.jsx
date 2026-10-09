import React, { useState, useEffect, useMemo, useRef } from "react";
import prescriptionService from "../../Services/prescriptionService";

/* =========================================================
   COUNTER COMPONENT
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
   INITIALS HELPER
   ========================================================= */
function getInitials(name) {
  if (!name) return "PT";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [deletePrescription, setDeletePrescription] = useState(null);
  const [toast, setToast] = useState(null);

  const getDeletedRxIds = () => {
    try {
      const stored = localStorage.getItem("admin_deleted_rx_ids");
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

  const fetchPrescriptions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const res = await prescriptionService.getPrescriptions();
      if (res && res.data) {
        const deletedIds = getDeletedRxIds();
        const activeList = res.data.filter(
          (p) =>
            !p.deletedFromAdmin &&
            !deletedIds.includes(p._id) &&
            !deletedIds.includes(p.prescriptionNo)
        );
        setPrescriptions(activeList);
      }
    } catch (err) {
      console.error("Error fetching prescriptions for admin:", err);
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletePrescription) return;

    try {
      const rxId =
        deletePrescription._id ||
        deletePrescription.id ||
        deletePrescription.prescriptionNo;
      const rxNo =
        deletePrescription.prescriptionNo ||
        `RX-${deletePrescription._id?.slice(-6).toUpperCase()}`;

      // Optimistically remove from admin table
      setPrescriptions((prev) =>
        prev.filter(
          (p) =>
            p._id !== rxId &&
            p.prescriptionNo !== deletePrescription.prescriptionNo
        )
      );

      // Persist in localStorage to prevent 6s background polling flicker
      try {
        const deletedIds = getDeletedRxIds();
        if (rxId && !deletedIds.includes(rxId)) deletedIds.push(rxId);
        if (
          deletePrescription.prescriptionNo &&
          !deletedIds.includes(deletePrescription.prescriptionNo)
        ) {
          deletedIds.push(deletePrescription.prescriptionNo);
        }
        localStorage.setItem(
          "admin_deleted_rx_ids",
          JSON.stringify(deletedIds)
        );
      } catch (e) {
        console.error("Storage error:", e);
      }

      await prescriptionService.deletePrescription(rxId);
      setDeletePrescription(null);
      showToast(`Prescription ${rxNo} deleted successfully!`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete prescription!",
        "error"
      );
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    const interval = setInterval(() => fetchPrescriptions(true), 6000);
    const onFocus = () => fetchPrescriptions(true);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const uniquePatients = new Set(
      prescriptions.map((p) => p.patientName || p.patient?.name).filter(Boolean)
    ).size;
    const uniqueDoctors = new Set(
      prescriptions.map((p) => p.doctor || p.doctorName).filter(Boolean)
    ).size;
    const totalMeds = prescriptions.reduce(
      (sum, p) => sum + (p.medicines?.length || p.medications?.length || 0),
      0
    );
    return { total, uniquePatients, uniqueDoctors, totalMeds };
  }, [prescriptions]);

  const departmentsList = useMemo(() => {
    const set = new Set();
    prescriptions.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    return Array.from(set);
  }, [prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return prescriptions.filter((p) => {
      const rxNo = (p.prescriptionNo || "").toLowerCase();
      const patient = (p.patientName || "").toLowerCase();
      const doctor = (p.doctor || "").toLowerCase();
      const diagnosis = (p.diagnosis || "").toLowerCase();
      const dept = (p.department || "").toLowerCase();

      const matchesSearch =
        !q ||
        rxNo.includes(q) ||
        patient.includes(q) ||
        doctor.includes(q) ||
        diagnosis.includes(q) ||
        dept.includes(q);

      const matchesDept =
        departmentFilter === "All" ||
        (p.department || "").toLowerCase() === departmentFilter.toLowerCase();

      return matchesSearch && matchesDept;
    });
  }, [prescriptions, search, departmentFilter]);

  const handlePrintSlip = (prescription) => {
    setSelectedPrescription(prescription);
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
        .prescriptions-page {
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
        .prescriptions-header {
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

        /* ================= PRESCRIPTIONS CARD & TOOLBAR ================= */
        .prescriptions-card {
          background: #ffffff;
          border: 1px solid #e5edf3;
          border-radius: 18px;
          box-shadow: 0 7px 22px rgba(50, 90, 110, 0.06);
          overflow: hidden;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          animation: contentAppear 0.8s ease;
        }

        .prescriptions-card:hover {
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

        .prescriptions-toolbar {
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

        .rx-badge {
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

        .meds-pill {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #dbeafe;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
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

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.cancelled {
          background: #fee2e2;
          color: #991b1b;
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

        .meds-table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .meds-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 500px;
        }

        .meds-table th {
          background: #f8fafc;
          padding: 11px 14px;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
        }

        .meds-table td {
          padding: 11px 14px;
          border-top: 1px solid #f1f5f9;
          color: #334155;
        }

        .instructions-alert {
          background: #fefce8;
          border: 1px solid #fef08a;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .instructions-alert .alert-title {
          margin: 0 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: #854d0e;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .instructions-alert .alert-text {
          margin: 0;
          font-size: 13px;
          color: #713f12;
        }

        .modal-footer {
          padding: 18px 24px;
          border-top: 1px solid #edf2f5;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #f8fafc;
          border-radius: 0 0 20px 20px;
        }

        .modal-print-btn {
          padding: 9px 20px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          color: #334155;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.25s ease;
        }

        .modal-print-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-close-btn {
          padding: 9px 22px;
          background: #1976d2;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .modal-close-btn:hover {
          background: #1565c0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25);
        }

        /* ================= DELETE MODAL (MATCHING BILLING.JSX) ================= */
        .delete-modal {
          width: 410px;
          max-width: 100%;
          background: #ffffff;
          border-radius: 18px;
          padding: 30px;
          text-align: center;
          animation: modalZoom 0.3s ease;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .delete-icon {
          width: 62px;
          height: 62px;
          margin: auto;
          border-radius: 50%;
          background: #ffebee;
          color: #e53935;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          transition: transform 0.3s ease;
        }

        .delete-icon:hover {
          transform: scale(0.88);
        }

        .delete-modal h3 {
          color: #263238;
          margin: 17px 0 8px;
          font-size: 18px;
          font-weight: 700;
        }

        .delete-modal p {
          color: #78909c;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 23px;
        }

        .delete-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .cancel-btn,
        .confirm-delete-btn {
          padding: 11px 22px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: 0.25s;
        }

        .cancel-btn {
          background: #f1f5f7;
          color: #546e7a;
        }

        .cancel-btn:hover {
          background: #e2e8ec;
        }

        .confirm-delete-btn {
          background: #e53935;
          color: #ffffff;
        }

        .confirm-delete-btn:hover {
          background: #c62828;
        }

        /* ================= TOAST (MATCHING BILLING.JSX) ================= */
        .toast {
          position: fixed;
          top: 25px;
          right: 25px;
          min-width: 280px;
          padding: 15px 18px;
          border-radius: 11px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.13);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 20000;
          animation: toastTopRight 0.45s ease;
          border-left: 4px solid #2e7d32;
          color: #455a64;
          font-size: 13px;
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

        /* ================= RESPONSIVE ================= */
        @media (max-width: 1200px) {
          .prescriptions-page {
            padding-left: 220px;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .prescriptions-page {
            margin-left: 0;
            width: 100%;
            padding: 20px 18px 18px;
          }
        }

        @media (max-width: 700px) {
          .prescriptions-page {
            padding: 70px 18px 18px 18px;
          }
          .prescriptions-header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
            padding: 20px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .prescriptions-toolbar {
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
      <div className="prescriptions-page">
        {/* ================= HEADER ================= */}
        <div className="prescriptions-header">
          <div className="header-title">
            <h1>Manage Prescriptions</h1>
            <p>Real-time administrative visibility of doctor-issued prescriptions delivered directly to patients</p>
          </div>
          <div className="header-pill">
            <i className="bi bi-info-circle-fill" style={{ color: "#2563eb" }}></i>
            Direct-to-Patient Delivery Active
          </div>
        </div>

        {/* ================= STAT CARDS ================= */}
        <div className="stats-grid">
          {/* TOTAL */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Total Prescriptions</p>
              <h2>
                <Counter value={stats.total} />
              </h2>
            </div>
            <div className="stat-icon blue-icon">
              <i className="bi bi-file-earmark-medical"></i>
            </div>
          </div>

          {/* PATIENTS TREATED */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Patients Treated</p>
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

          {/* MEDICATIONS */}
          <div className="stat-card">
            <div className="stat-info">
              <p>Medications Prescribed</p>
              <h2>
                <Counter value={stats.totalMeds} />
              </h2>
            </div>
            <div className="stat-icon purple-icon">
              <i className="bi bi-capsule"></i>
            </div>
          </div>
        </div>

        {/* ================= PRESCRIPTIONS CARD ================= */}
        <div className="prescriptions-card">
          {/* TOOLBAR */}
          <div className="prescriptions-toolbar">
            <div className="toolbar-left">
              <div className="search-box">
                <span>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  placeholder="Search by Rx #, patient, doctor, diagnosis..."
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
                onClick={() => fetchPrescriptions(false)}
                title="Refresh prescription records"
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
                  <th>Rx Number</th>
                  <th>Patient</th>
                  <th>Attending Doctor</th>
                  <th>Department</th>
                  <th>Diagnosis</th>
                  <th>Medications</th>
                  <th>Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        padding: "50px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      <div
                        className="spinner-border text-primary"
                        role="status"
                        style={{ width: "2rem", height: "2rem", margin: "auto" }}
                      ></div>
                      <p style={{ marginTop: "12px", marginBottom: 0 }}>
                        Loading hospital prescriptions...
                      </p>
                    </td>
                  </tr>
                ) : filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        padding: "50px",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      <i
                        className="bi bi-file-earmark-x"
                        style={{ fontSize: "40px", color: "#cbd5e1" }}
                      ></i>
                      <p
                        style={{
                          marginTop: "12px",
                          marginBottom: 0,
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        No prescription records found matching your query.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((p) => {
                    const meds = p.medicines || p.medications || [];
                    const pName = p.patientName || p.patient?.name || "Patient";

                    return (
                      <tr key={p._id || p.prescriptionNo}>
                        {/* RX NUMBER */}
                        <td>
                          <span className="rx-badge">
                            <i className="bi bi-file-medical"></i>
                            {p.prescriptionNo ||
                              `RX-${p._id?.slice(-6).toUpperCase()}`}
                          </span>
                        </td>

                        {/* PATIENT */}
                        <td>
                          <div className="patient-cell">
                            <div className="patient-avatar">
                              {getInitials(pName)}
                            </div>
                            <div className="patient-meta">
                              <div className="name">{pName}</div>
                            </div>
                          </div>
                        </td>

                        {/* DOCTOR */}
                        <td>
                          <div className="doctor-chip">
                            <i
                              className="bi bi-person-badge"
                              style={{ color: "#1976d2" }}
                            ></i>
                            <span>{p.doctor || p.doctorName || "Doctor"}</span>
                          </div>
                        </td>

                        {/* DEPARTMENT */}
                        <td>
                          <span className="dept-pill">
                            {p.department || "General Medicine"}
                          </span>
                        </td>

                        {/* DIAGNOSIS */}
                        <td>
                          <div
                            style={{
                              maxWidth: "180px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontWeight: "500",
                              color: "#334155",
                            }}
                            title={p.diagnosis || "General Consultation"}
                          >
                            {p.diagnosis || "General Consultation"}
                          </div>
                        </td>

                        {/* MEDICATIONS */}
                        <td>
                          <span className="meds-pill">
                            <i className="bi bi-capsule"></i>
                            {meds.length}{" "}
                            {meds.length === 1 ? "Medicine" : "Medicines"}
                          </span>
                        </td>

                        {/* DATE */}
                        <td style={{ color: "#64748b", fontSize: "12px" }}>
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString()
                            : p.date || "Recent"}
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="actions">
                            <button
                              className="action-btn view-btn"
                              onClick={() => setSelectedPrescription(p)}
                              title="View full prescription details"
                            >
                              <i className="bi bi-eye"></i> View
                            </button>
                            <button
                              className="action-btn print-table-btn"
                              onClick={() => handlePrintSlip(p)}
                              title="Print prescription slip"
                            >
                              <i className="bi bi-printer"></i>
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => setDeletePrescription(p)}
                              title="Delete prescription"
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

        {/* ================= VIEW DETAIL MODAL ================= */}
        {selectedPrescription && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedPrescription(null)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div className="modal-header">
                <div className="modal-title">
                  <h3>
                    Prescription Slip: {selectedPrescription.prescriptionNo || "RX"}
                  </h3>
                  <p>
                    Issued by {selectedPrescription.doctor || "Attending Physician"} • Delivered directly to patient portal
                  </p>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setSelectedPrescription(null)}
                  title="Close modal"
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
                    <p className="val">
                      {selectedPrescription.patientName || "Patient"}
                    </p>
                  </div>
                  <div className="overview-box">
                    <p className="label">Department</p>
                    <p className="val">
                      {selectedPrescription.department || "General Medicine"}
                    </p>
                  </div>
                  <div className="overview-box">
                    <p className="label">Diagnosis</p>
                    <p className="val">
                      {selectedPrescription.diagnosis || "General Consultation"}
                    </p>
                  </div>
                  <div className="overview-box">
                    <p className="label">Issue Date</p>
                    <p className="val">
                      {selectedPrescription.createdAt
                        ? new Date(
                            selectedPrescription.createdAt
                          ).toLocaleDateString()
                        : selectedPrescription.date || "Recent"}
                    </p>
                  </div>
                </div>

                {/* MEDICATIONS SCHEDULE */}
                <div className="section-heading">
                  <i
                    className="bi bi-capsule-pill"
                    style={{ color: "#1976d2" }}
                  ></i>
                  Prescribed Medications & Regimen
                </div>
                <div className="meds-table-wrap">
                  <table className="meds-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        selectedPrescription.medicines ||
                        selectedPrescription.medications ||
                        []
                      ).map((m, idx) => (
                        <tr key={idx}>
                          <td
                            style={{
                              fontWeight: "700",
                              color: "#1e293b",
                            }}
                          >
                            {m.name || m.medicineName}
                          </td>
                          <td
                            style={{
                              color: "#1976d2",
                              fontWeight: "600",
                            }}
                          >
                            {m.dosage}
                          </td>
                          <td style={{ color: "#334155" }}>{m.frequency}</td>
                          <td style={{ color: "#334155" }}>{m.duration}</td>
                          <td style={{ color: "#64748b" }}>
                            {m.instructions ||
                              m.timing ||
                              "Take as directed"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CLINICAL INSTRUCTIONS */}
                {selectedPrescription.instructions && (
                  <div className="instructions-alert">
                    <div className="alert-title">
                      <i className="bi bi-info-circle"></i>
                      Physician Clinical Instructions
                    </div>
                    <p className="alert-text">
                      {selectedPrescription.instructions}
                    </p>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="modal-footer">
                <button
                  className="modal-print-btn"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer"></i> Print Slip
                </button>
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedPrescription(null)}
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
        {deletePrescription && (
          <div
            className="modal-overlay"
            onClick={() => setDeletePrescription(null)}
          >
            <div
              className="delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="delete-icon">
                <i className="bi bi-trash"></i>
              </div>

              <h3>Delete Prescription?</h3>

              <p>
                Are you sure you want to delete{" "}
                <strong>
                  {deletePrescription.prescriptionNo ||
                    `RX-${deletePrescription._id?.slice(-6).toUpperCase()}`}
                </strong>
                ?
                <br />
                <span style={{ fontSize: "12px", color: "#78909c" }}>
                  This removes it from the Admin page only. Doctor & patient records remain active.
                </span>
              </p>

              <div className="delete-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setDeletePrescription(null)}
                >
                  Cancel
                </button>

                <button
                  className="confirm-delete-btn"
                  onClick={confirmDelete}
                >
                  Delete Prescription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            TOAST (MATCHING BILLING.JSX)
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

export default AdminPrescriptions;
