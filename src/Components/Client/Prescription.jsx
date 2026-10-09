import React, { useState, useEffect } from "react";
import prescriptionService from "../../Services/prescriptionService";

function Prescription() {
  const [search, setSearch] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await prescriptionService.getPrescriptions();
        if (res && res.data) {
          // Prescriptions go directly to patient upon doctor issuance (no admin approval required)
          const activeList = res.data.filter(
            (p) => p.status !== "rejected"
          );

          setPrescriptions(
            activeList.map((p) => ({
              ...p,
              id: p._id || p.id || p.prescriptionNo,
              prescriptionNo: p.prescriptionNo,
              date: p.date,
              doctor: p.doctor || p.doctorName || p.doctor?.name || "Dr. Medical Specialist",
              department: p.department || "General",
              diagnosis: p.diagnosis || "Consultation",
              medicines: p.medicines || [],
              instructions: p.instructions || "Follow prescription instructions carefully.",
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    fetchPrescriptions();

    const interval = setInterval(() => {
      fetchPrescriptions(true);
    }, 4000);

    const onFocus = () => fetchPrescriptions(true);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.doctor
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      prescription.department
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      prescription.diagnosis
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      prescription.prescriptionNo
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

        /* =====================================================
           MAIN PAGE ANIMATION
        ===================================================== */

        @keyframes pageEnter {
          0% {
            opacity: 0;
            transform: translateY(25px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes headingEnter {
          0% {
            opacity: 0;
            transform: translateX(-45px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes headingText {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes countEnter {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }

          70% {
            transform: scale(1.08);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes searchEnter {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =====================================================
           CARD ANIMATION
        ===================================================== */

        @keyframes cardEnter {
          0% {
            opacity: 0;
            transform: translateY(45px) scale(0.94);
          }

          60% {
            opacity: 1;
            transform: translateY(-5px) scale(1.01);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cardGlow {
          0% {
            box-shadow: 0 3px 12px rgba(25, 118, 210, 0.04);
          }

          50% {
            box-shadow: 0 12px 30px rgba(25, 118, 210, 0.12);
          }

          100% {
            box-shadow: 0 3px 12px rgba(25, 118, 210, 0.04);
          }
        }

        /* =====================================================
           AVATAR ANIMATION
        ===================================================== */

        @keyframes avatarEnter {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }

          70% {
            transform: scale(1.15) rotate(8deg);
          }

          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }

        /* =====================================================
           MEDICINE ANIMATION
        ===================================================== */

        @keyframes medicineEnter {
          0% {
            opacity: 0;
            transform: translateX(-25px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* =====================================================
           BUTTON ANIMATION
        ===================================================== */

        @keyframes buttonEnter {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes buttonPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.25);
          }

          70% {
            box-shadow: 0 0 0 8px rgba(25, 118, 210, 0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
          }
        }

        /* =====================================================
           MODAL ANIMATION
        ===================================================== */

        @keyframes overlayEnter {
          from {
            opacity: 0;
            backdrop-filter: blur(0);
          }

          to {
            opacity: 1;
            backdrop-filter: blur(5px);
          }
        }

        @keyframes modalEnter {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.88);
          }

          60% {
            opacity: 1;
            transform: translateY(-8px) scale(1.02);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes modalContentEnter {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes closeButtonEnter {
          from {
            opacity: 0;
            transform: rotate(-90deg) scale(0);
          }

          to {
            opacity: 1;
            transform: rotate(0) scale(1);
          }
        }

        @keyframes emptyEnter {
          from {
            opacity: 0;
            transform: scale(0.9);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* =====================================================
           MAIN PAGE
        ===================================================== */

        .prescription-page {
          min-height: calc(100vh - 70px);

          margin-top: 70px;
          margin-left: 240px;

          width: calc(100% - 240px);

          padding: 30px;

          background: #f4f7fb;

          animation: pageEnter 0.7s ease-out;
        }

        /* =====================================================
           HEADING
        ===================================================== */

        .page-heading {
          width: 100%;
          min-height: 101px;

          background: #e3f2fd;

          border: 1px solid #bbdefb;

          border-radius: 14px;

          padding: 20px 25px;

          margin-bottom: 22px;

          display: flex;

          justify-content: space-between;

          align-items: center;

          box-shadow:
            0 3px 12px rgba(25, 118, 210, 0.05);

          animation: headingEnter 0.7s ease-out;
        }

        .heading-left {
          display: flex;
          align-items: center;
        }

        .heading-text {
          animation: headingText 0.8s ease 0.15s both;
        }

        .heading-text h1 {
          margin: 0;

          color: #1976d2;

          font-size: 28px;

          font-weight: 700;

          transition: transform 0.3s ease;
        }

        .heading-text h1:hover {
          transform: translateX(5px);
        }

        .heading-text p {
          margin: 7px 0 0;

          color: #475569;

          font-size: 13px;
        }

        .prescription-count {
          background: #ffffff;

          color: #1976d2;

          padding: 8px 13px;

          border-radius: 20px;

          font-size: 11px;

          font-weight: bold;

          border: 1px solid #bbdefb;

          animation: countEnter 0.8s ease 0.3s both;

          transition: all 0.3s ease;
        }

        .prescription-count:hover {
          transform: scale(1.08);

          box-shadow:
            0 6px 16px rgba(25, 118, 210, 0.12);
        }

        /* =====================================================
           SEARCH
        ===================================================== */

        .search-section {
          margin-bottom: 22px;

          animation: searchEnter 0.6s ease 0.25s both;
        }

        .search-box {
          position: relative;

          width: 260px;
        }

        .search-icon {
          position: absolute;

          left: 12px;

          top: 50%;

          transform: translateY(-50%);

          font-size: 13px;

          color: #94a3b8;

          transition: all 0.3s ease;

          z-index: 2;
        }

        .search-box:focus-within .search-icon {
          color: #1976d2;

          transform:
            translateY(-50%)
            scale(1.2)
            rotate(-10deg);
        }

        .search-input {
          width: 260px;

          height: 38px;

          padding: 0 12px 0 35px;

          border: 1px solid #dbe3ec;

          border-radius: 8px;

          outline: none;

          background: #ffffff;

          color: #334155;

          font-size: 12px;

          transition: all 0.35s ease;
        }

        .search-input:hover {
          border-color: #bbdefb;

          box-shadow:
            0 4px 14px rgba(25, 118, 210, 0.08);

          transform: translateY(-2px);
        }

        .search-input:focus {
          border-color: #1976d2;

          box-shadow:
            0 0 0 4px rgba(25, 118, 210, 0.08);

          transform: translateY(-2px) scale(1.01);
        }

        .search-input::placeholder {
          color: #a0aec0;
        }

        /* =====================================================
           GRID
        ===================================================== */

        .prescription-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 20px;
        }

        /* =====================================================
           CARD
        ===================================================== */

        .prescription-card {
          background: #ffffff;

          border-radius: 15px;

          border: 1px solid #e5e7eb;

          padding: 22px;

          transition:
            transform 0.4s cubic-bezier(.2,.8,.2,1),
            box-shadow 0.4s ease,
            border-color 0.3s ease;

          box-shadow:
            0 3px 12px rgba(25, 118, 210, 0.04);

          animation: cardEnter 0.75s cubic-bezier(.2,.8,.2,1) both;
        }

        .prescription-card:nth-child(1) {
          animation-delay: 0.15s;
        }

        .prescription-card:nth-child(2) {
          animation-delay: 0.28s;
        }

        .prescription-card:nth-child(3) {
          animation-delay: 0.41s;
        }

        .prescription-card:nth-child(4) {
          animation-delay: 0.54s;
        }

        .prescription-card:hover {
          transform: translateY(-8px) scale(1.01);

          border-color: #bbdefb;

          box-shadow:
            0 18px 38px rgba(25, 118, 210, 0.14);
        }

        /* =====================================================
           CARD HEADER
        ===================================================== */

        .card-header {
          display: flex;

          justify-content: space-between;

          align-items: flex-start;

          gap: 15px;

          padding-bottom: 16px;

          border-bottom:
            1px solid #eef2f6;
        }

        .rx-number {
          color: #1976d2;

          font-size: 13px;

          font-weight: bold;

          transition: transform 0.3s ease;
        }

        .prescription-card:hover .rx-number {
          transform: translateX(4px);
        }

        .rx-date {
          color: #94a3b8;

          font-size: 11px;

          margin-top: 5px;
        }

        /* =====================================================
           PRESCRIPTION LABEL
        ===================================================== */

        .rx-icon {
          min-width: 105px;

          height: 42px;

          padding: 0 10px;

          border-radius: 10px;

          background: #e3f2fd;

          color: #1976d2;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 9px;

          font-weight: bold;

          text-align: center;

          letter-spacing: 0.5px;

          transition:
            transform 0.35s ease,
            background 0.35s ease,
            box-shadow 0.35s ease;

          animation: buttonEnter 0.6s ease 0.35s both;
        }

        .prescription-card:hover .rx-icon {
          transform:
            scale(1.08)
            rotate(2deg);

          background: #bbdefb;

          box-shadow:
            0 6px 15px rgba(25, 118, 210, 0.12);
        }

        /* =====================================================
           DOCTOR
        ===================================================== */

        .doctor-section {
          display: flex;

          align-items: center;

          gap: 12px;

          padding: 17px 0;
        }

        .doctor-avatar {
          width: 43px;

          height: 43px;

          border-radius: 50%;

          background: #e3f2fd;

          color: #1976d2;

          display: flex;

          align-items: center;

          justify-content: center;

          font-weight: bold;

          font-size: 14px;

          flex-shrink: 0;

          animation:
            avatarEnter
            0.7s
            cubic-bezier(.2,.8,.2,1)
            both;

          transition:
            transform 0.35s ease,
            background 0.35s ease,
            box-shadow 0.35s ease;
        }

        .prescription-card:hover .doctor-avatar {
          transform:
            rotate(8deg)
            scale(1.12);

          background: #bbdefb;

          box-shadow:
            0 6px 15px rgba(25, 118, 210, 0.14);
        }

        .doctor-name {
          margin: 0;

          color: #263238;

          font-size: 14px;

          transition:
            color 0.3s ease,
            transform 0.3s ease;
        }

        .prescription-card:hover .doctor-name {
          color: #1976d2;

          transform: translateX(3px);
        }

        .doctor-department {
          margin: 5px 0 0;

          color: #94a3b8;

          font-size: 11px;
        }

        /* =====================================================
           DIAGNOSIS
        ===================================================== */

        .diagnosis-box {
          background: #f8fbff;

          border-radius: 9px;

          padding: 12px 14px;

          margin-bottom: 15px;

          border: 1px solid #edf4fa;

          transition:
            transform 0.3s ease,
            background 0.3s ease,
            border-color 0.3s ease;
        }

        .prescription-card:hover .diagnosis-box {
          background: #f1f8ff;

          border-color: #d7ebfa;

          transform: translateX(3px);
        }

        .diagnosis-label {
          color: #94a3b8;

          font-size: 10px;

          display: block;

          margin-bottom: 5px;
        }

        .diagnosis-value {
          color: #334155;

          font-size: 12px;

          font-weight: 600;
        }

        /* =====================================================
           MEDICINES
        ===================================================== */

        .medicine-title {
          color: #263238;

          font-size: 13px;

          margin: 0 0 10px;
        }

        .medicine-item {
          border: 1px solid #eef2f6;

          border-radius: 9px;

          padding: 11px;

          margin-bottom: 8px;

          background: #ffffff;

          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            border-color 0.3s ease;

          animation:
            medicineEnter
            0.5s
            ease
            both;
        }

        .medicine-item:nth-child(1) {
          animation-delay: 0.15s;
        }

        .medicine-item:nth-child(2) {
          animation-delay: 0.25s;
        }

        .medicine-item:hover {
          border-color: #bbdefb;

          background: #fafdff;

          transform: translateX(6px) scale(1.01);

          box-shadow:
            0 5px 15px rgba(25, 118, 210, 0.07);
        }

        .medicine-top {
          display: flex;

          justify-content: space-between;

          align-items: center;

          gap: 10px;
        }

        .medicine-name {
          color: #263238;

          font-size: 12px;

          font-weight: bold;

          transition: color 0.3s ease;
        }

        .medicine-item:hover .medicine-name {
          color: #1976d2;
        }

        .medicine-dosage {
          background: #e3f2fd;

          color: #1976d2;

          padding: 4px 8px;

          border-radius: 12px;

          font-size: 9px;

          font-weight: bold;

          white-space: nowrap;

          transition:
            transform 0.3s ease,
            background 0.3s ease;
        }

        .medicine-item:hover .medicine-dosage {
          background: #bbdefb;

          transform: scale(1.08);
        }

        .medicine-details {
          display: flex;

          gap: 15px;

          margin-top: 7px;

          flex-wrap: wrap;
        }

        .medicine-detail {
          color: #94a3b8;

          font-size: 10px;

          transition:
            color 0.3s ease,
            transform 0.3s ease;
        }

        .medicine-item:hover .medicine-detail {
          color: #64748b;

          transform: translateY(-1px);
        }

        /* =====================================================
           INSTRUCTIONS
        ===================================================== */

        .instruction-box {
          background: #f8fafc;

          padding: 12px;

          border-radius: 9px;

          margin-top: 15px;

          border: 1px solid #eef2f6;

          transition:
            transform 0.3s ease,
            background 0.3s ease,
            border-color 0.3s ease;
        }

        .prescription-card:hover .instruction-box {
          background: #f4f9fd;

          border-color: #dcecf8;

          transform: translateY(-2px);
        }

        .instruction-title {
          color: #263238;

          font-size: 11px;

          font-weight: bold;

          margin-bottom: 5px;
        }

        .instruction-text {
          color: #64748b;

          font-size: 10px;

          line-height: 1.5;

          margin: 0;
        }

        /* =====================================================
           VIEW BUTTON
        ===================================================== */

        .view-prescription {
          width: 100%;

          margin-top: 16px;

          padding: 10px;

          border: none;

          border-radius: 8px;

          background: #1976d2;

          color: #ffffff;

          cursor: pointer;

          font-size: 12px;

          font-weight: 600;

          transition:
            transform 0.3s ease,
            background 0.3s ease,
            box-shadow 0.3s ease;

          animation:
            buttonEnter
            0.5s
            ease
            0.45s
            both;
        }

        .view-prescription:hover {
          background: #1565c0;

          box-shadow:
            0 8px 18px rgba(25, 118, 210, 0.22);

          transform:
            translateY(-3px)
            scale(1.01);
        }

        .view-prescription:active {
          transform:
            translateY(0)
            scale(0.98);
        }

        /* =====================================================
           EMPTY STATE
        ===================================================== */

        .empty-state {
          background: #ffffff;

          border-radius: 14px;

          padding: 60px 20px;

          text-align: center;

          color: #94a3b8;

          grid-column: 1 / -1;

          border: 1px solid #e5e7eb;

          animation: emptyEnter 0.5s ease;
        }

        .empty-icon {
          font-size: 25px;

          margin-bottom: 10px;

          color: #1976d2;

          font-weight: bold;
        }

        .empty-state h3 {
          margin: 0 0 5px;

          color: #475569;
        }

        .empty-state p {
          margin: 0;

          font-size: 12px;
        }

        /* =====================================================
           MODAL OVERLAY
        ===================================================== */

        .modal-overlay {
          position: fixed;

          inset: 0;

          background:
            rgba(15, 23, 42, 0.45);

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 20px;

          z-index: 9999;

          animation:
            overlayEnter
            0.3s
            ease;
        }

        /* =====================================================
           MODAL
        ===================================================== */

        .prescription-modal {
          width: 100%;

          max-width: 700px;

          max-height: 90vh;

          overflow-y: auto;

          background: #ffffff;

          border-radius: 16px;

          padding: 25px;

          box-shadow:
            0 25px 60px rgba(0, 0, 0, 0.20);

          animation:
            modalEnter
            0.45s
            cubic-bezier(.2,.8,.2,1);
        }

        /* =====================================================
           MODAL HEADER
        ===================================================== */

        .modal-header {
          display: flex;

          justify-content: space-between;

          align-items: center;

          padding-bottom: 15px;

          border-bottom: 1px solid #e5e7eb;

          animation:
            modalContentEnter
            0.45s
            ease
            0.1s
            both;
        }

        .modal-header h2 {
          margin: 0;

          color: #1976d2;

          font-size: 20px;
        }

        .close-button {
          width: 34px;

          height: 34px;

          border: none;

          border-radius: 8px;

          background: #f1f5f9;

          color: #64748b;

          font-size: 20px;

          cursor: pointer;

          transition:
            transform 0.3s ease,
            background 0.3s ease,
            color 0.3s ease;
        }

        .close-button:hover {
          background: #e3f2fd;

          color: #1976d2;

          transform:
            rotate(90deg)
            scale(1.08);
        }

        /* =====================================================
           MODAL INFO
        ===================================================== */

        .modal-info {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 12px;

          margin-top: 18px;

          margin-bottom: 18px;

          animation:
            modalContentEnter
            0.5s
            ease
            0.15s
            both;
        }

        .info-box {
          background: #f8fafc;

          padding: 13px;

          border-radius: 9px;

          border: 1px solid #eef2f6;

          transition:
            transform 0.3s ease,
            background 0.3s ease,
            border-color 0.3s ease;
        }

        .info-box:hover {
          background: #f1f8ff;

          border-color: #bbdefb;

          transform: translateY(-3px);

          box-shadow:
            0 5px 12px rgba(25, 118, 210, 0.06);
        }

        .info-box span {
          display: block;

          color: #94a3b8;

          font-size: 10px;

          margin-bottom: 5px;
        }

        .info-box strong {
          color: #334155;

          font-size: 12px;
        }

        /* =====================================================
           MODAL TABLE
        ===================================================== */

        .medicine-table-wrapper {
          width: 100%;

          overflow-x: auto;

          animation:
            modalContentEnter
            0.5s
            ease
            0.2s
            both;
        }

        .modal-medicine-table {
          width: 100%;

          border-collapse: collapse;

          margin-top: 10px;
        }

        .modal-medicine-table th {
          text-align: left;

          background: #e3f2fd;

          color: #1976d2;

          padding: 10px;

          font-size: 10px;

          white-space: nowrap;
        }

        .modal-medicine-table td {
          padding: 11px 10px;

          border-bottom:
            1px solid #eef2f6;

          color: #334155;

          font-size: 11px;

          white-space: nowrap;

          transition:
            background 0.25s ease,
            transform 0.25s ease;
        }

        .modal-medicine-table tbody tr {
          transition:
            transform 0.25s ease;
        }

        .modal-medicine-table tbody tr:hover {
          background: #f8fbff;

          transform: translateX(3px);
        }

        /* =====================================================
           MODAL INSTRUCTIONS
        ===================================================== */

        .modal-instruction {
          margin-top: 18px;

          background: #e3f2fd;

          padding: 14px;

          border-radius: 9px;

          border: 1px solid #bbdefb;

          animation:
            modalContentEnter
            0.5s
            ease
            0.25s
            both;

          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .modal-instruction:hover {
          transform: translateY(-2px);

          box-shadow:
            0 6px 15px rgba(25, 118, 210, 0.08);
        }

        .modal-instruction h4 {
          margin: 0 0 6px;

          color: #1976d2;

          font-size: 11px;
        }

        .modal-instruction p {
          margin: 0;

          color: #475569;

          font-size: 11px;

          line-height: 1.6;
        }

        /* =====================================================
           MODAL FOOTER
        ===================================================== */

        .modal-footer {
          display: flex;

          justify-content: flex-end;

          margin-top: 20px;

          animation:
            modalContentEnter
            0.5s
            ease
            0.3s
            both;
        }

        .modal-close {
          border: none;

          background: #1976d2;

          color: white;

          padding: 10px 20px;

          border-radius: 8px;

          cursor: pointer;

          font-size: 12px;

          font-weight: 600;

          transition:
            transform 0.3s ease,
            background 0.3s ease,
            box-shadow 0.3s ease;
        }

        .modal-close:hover {
          background: #1565c0;

          transform:
            translateY(-3px)
            scale(1.03);

          box-shadow:
            0 7px 16px rgba(25, 118, 210, 0.20);
        }

        .modal-close:active {
          transform: scale(0.97);
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {

          .prescription-grid {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 750px) {

          .prescription-page {
            margin-left: 0;

            width: 100%;

            margin-top: 70px;

            padding: 20px;
          }

          .page-heading {
            align-items: flex-start;

            gap: 15px;

            padding: 18px 20px;
          }

          .prescription-count {
            display: none;
          }

          .search-box,
          .search-input {
            width: 100%;
          }

          .modal-info {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 500px) {

          .prescription-page {
            padding: 15px;
          }

          .heading-text h1 {
            font-size: 22px;
          }

          .heading-text p {
            font-size: 11px;
          }

          .prescription-card {
            padding: 17px;
          }

          .prescription-modal {
            padding: 18px;
          }

          .modal-medicine-table {
            min-width: 550px;
          }

          .rx-icon {
            min-width: 90px;

            font-size: 8px;
          }

          .page-heading {
            min-height: auto;
          }

          .medicine-top {
            align-items: flex-start;
          }

        }

        /* =====================================================
           REDUCE MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          *,
          *::before,
          *::after {

            animation-duration:
              0.01ms !important;

            animation-iteration-count:
              1 !important;

            transition-duration:
              0.01ms !important;

          }

        }

      `}</style>

      {/* =====================================================
          MAIN PAGE
      ===================================================== */}

      <section className="prescription-page">

        {/* PAGE HEADING */}

        <div className="page-heading">

          <div className="heading-left">

            <div className="heading-text">

              <h1>
                My Prescriptions
              </h1>

              <p>
                View your medicines and treatment instructions
              </p>

            </div>

          </div>

          <div className="prescription-count">
            {prescriptions.length} Prescriptions
          </div>

        </div>

        {/* SEARCH */}

        <div className="search-section">

          <div className="search-box">

            <span className="search-icon">
              <i class="bi bi-search"></i>
            </span>

            <input
              type="text"
              className="search-input"
              placeholder="Search prescriptions..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

        {/* PRESCRIPTION GRID */}

        <div className="prescription-grid">

          {filteredPrescriptions.length > 0 ? (

            filteredPrescriptions.map(
              (prescription) => (

                <div
                  className="prescription-card"
                  key={prescription.id}
                >

                  {/* CARD HEADER */}

                  <div className="card-header">

                    <div>

                      <div className="rx-number">
                        {prescription.prescriptionNo}
                      </div>

                      <div className="rx-date">
                        {formatDate(
                          prescription.date
                        )}
                      </div>

                    </div>

                    <div className="rx-icon">
                      PRESCRIPTION
                    </div>

                  </div>

                  {/* DOCTOR */}

                  <div className="doctor-section">

                    <div className="doctor-avatar">

                      {prescription.doctor
                        .replace("Dr. ", "")
                        .charAt(0)}

                    </div>

                    <div>

                      <h3 className="doctor-name">
                        {prescription.doctor}
                      </h3>

                      <p className="doctor-department">
                        {prescription.department}
                      </p>

                    </div>

                  </div>

                  {/* DIAGNOSIS */}

                  <div className="diagnosis-box">

                    <span className="diagnosis-label">
                      DIAGNOSIS
                    </span>

                    <span className="diagnosis-value">
                      {prescription.diagnosis}
                    </span>

                  </div>

                  {/* MEDICINES */}

                  <h3 className="medicine-title">
                    Prescribed Medicines
                  </h3>

                  {prescription.medicines.map(
                    (medicine, index) => (

                      <div
                        className="medicine-item"
                        key={index}
                        style={{
                          animationDelay:
                            `${0.15 + index * 0.12}s`,
                        }}
                      >

                        <div className="medicine-top">

                          <span className="medicine-name">
                            {medicine.name}
                          </span>

                          <span className="medicine-dosage">
                            {medicine.dosage}
                          </span>

                        </div>

                        <div className="medicine-details">

                          <span className="medicine-detail">
                            ⏱ {medicine.frequency}
                          </span>

                          <span className="medicine-detail">
                            📆 {medicine.duration}
                          </span>

                          <span className="medicine-detail">
                            🍽 {medicine.timing}
                          </span>

                        </div>

                      </div>

                    )
                  )}

                  {/* INSTRUCTIONS */}

                  <div className="instruction-box">

                    <div className="instruction-title">
                      Doctor's Instructions
                    </div>

                    <p className="instruction-text">
                      {prescription.instructions}
                    </p>

                  </div>

                  {/* VIEW BUTTON */}

                  <button
                    className="view-prescription"
                    onClick={() =>
                      setSelectedPrescription(
                        prescription
                      )
                    }
                  >
                    View Full Prescription
                  </button>

                </div>

              )

            )

          ) : (

            <div className="empty-state">

              <div className="empty-icon">
                NO RX
              </div>

              <h3>
                No Prescriptions Found
              </h3>

              <p>
                Try searching with another keyword.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {selectedPrescription && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedPrescription(null)
          }
        >

          <div
            className="prescription-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <h2>
                Prescription Details
              </h2>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedPrescription(null)
                }
              >
                ×
              </button>

            </div>

            {/* INFORMATION */}

            <div className="modal-info">

              <div className="info-box">

                <span>
                  PRESCRIPTION NUMBER
                </span>

                <strong>
                  {selectedPrescription.prescriptionNo}
                </strong>

              </div>

              <div className="info-box">

                <span>
                  DATE
                </span>

                <strong>
                  {formatDate(
                    selectedPrescription.date
                  )}
                </strong>

              </div>

              <div className="info-box">

                <span>
                  DOCTOR
                </span>

                <strong>
                  {selectedPrescription.doctor}
                </strong>

              </div>

              <div className="info-box">

                <span>
                  DEPARTMENT
                </span>

                <strong>
                  {selectedPrescription.department}
                </strong>

              </div>

              <div className="info-box">

                <span>
                  DIAGNOSIS
                </span>

                <strong>
                  {selectedPrescription.diagnosis}
                </strong>

              </div>

            </div>

            {/* MEDICINES */}

            <h3 className="medicine-title">
              Prescribed Medicines
            </h3>

            <div className="medicine-table-wrapper">

              <table className="modal-medicine-table">

                <thead>

                  <tr>

                    <th>
                      Medicine
                    </th>

                    <th>
                      Dosage
                    </th>

                    <th>
                      Frequency
                    </th>

                    <th>
                      Duration
                    </th>

                    <th>
                      Timing
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {selectedPrescription.medicines.map(
                    (medicine, index) => (

                      <tr key={index}>

                        <td>
                          <b>
                            {medicine.name}
                          </b>
                        </td>

                        <td>
                          {medicine.dosage}
                        </td>

                        <td>
                          {medicine.frequency}
                        </td>

                        <td>
                          {medicine.duration}
                        </td>

                        <td>
                          {medicine.timing}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* INSTRUCTIONS */}

            <div className="modal-instruction">

              <h4>
                Doctor's Instructions
              </h4>

              <p>
                {selectedPrescription.instructions}
              </p>

            </div>

            {/* FOOTER */}

            <div className="modal-footer">

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedPrescription(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default Prescription;