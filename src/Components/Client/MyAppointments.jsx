import React, { useState, useEffect } from "react";
import appointmentService from "../../Services/appointmentService";
import doctorService from "../../Services/doctorService";
import { useAuth } from "../../context/AuthContext";

const COMMON_ISSUES = [
  { id: "fever", label: "Fever / Chills", icon: "🌡️" },
  { id: "cough", label: "Cough & Cold", icon: "🤧" },
  { id: "headache", label: "Headache / Migraine", icon: "🤕" },
  { id: "chest_pain", label: "Chest Pain / Heart Issue", icon: "🫀" },
  { id: "breathing", label: "Shortness of Breath", icon: "🫁" },
  { id: "stomach", label: "Stomach Ache / Acidity", icon: "🤢" },
  { id: "body_pain", label: "Body / Joint Pain", icon: "🦴" },
  { id: "skin", label: "Skin Rash / Allergy", icon: "🧴" },
  { id: "bp_sugar", label: "High BP / Diabetes Check", icon: "🩺" },
  { id: "fatigue", label: "Weakness / Fatigue", icon: "⚡" },
  { id: "ent", label: "Eye / ENT Problem", icon: "👁️" },
  { id: "other", label: "Other / General Symptoms", icon: "📋" },
];

function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorsList, setDoctorsList] = useState([]);

  const [showBooking, setShowBooking] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState("All");

  const [bookingData, setBookingData] = useState({
    doctor: "",
    department: "",
    date: "",
    time: "",
    type: "Consultation",
  });

  const [selectedIssues, setSelectedIssues] = useState([]);
  const [issueDescription, setIssueDescription] = useState("");

  const handleIssueToggle = (label) => {
    setSelectedIssues((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const [bookedSlots, setBookedSlots] = useState([]);

  const normalizeTimeSlot = (timeStr) => {
    if (!timeStr) return "";
    const str = String(timeStr).trim().toUpperCase();
    const ampmMatch = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2];
      const meridiem = ampmMatch[3].toUpperCase();
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }
    const militaryMatch = str.match(/^(\d{1,2}):(\d{2})/);
    if (militaryMatch) {
      const hours = String(parseInt(militaryMatch[1], 10)).padStart(2, "0");
      const minutes = militaryMatch[2];
      return `${hours}:${minutes}`;
    }
    return str;
  };

  const fetchDoctors = async () => {
    try {
      const res = await doctorService.getDoctors();
      if (res && res.data) {
        setDoctorsList(res.data);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentService.getAppointments();
      if (res && res.data) {
        setAppointments(res.data.map((apt) => ({
          ...apt,
          id: apt._id || apt.id || apt.appointmentId,
          doctor: apt.doctorName || apt.doctor?.name || "Dr. Rajesh Kumar",
          department: apt.department || apt.doctor?.department || "General",
          issues: apt.issues || [],
          notes: apt.notes || "",
        })));
      }
    } catch (err) {
      console.error("Error fetching my appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAppointments();
    fetchDoctors();

    const handleFocus = () => {
      fetchMyAppointments();
      fetchDoctors();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Fetch booked slots whenever doctor or date changes
  useEffect(() => {
    if (bookingData.doctor && bookingData.date) {
      appointmentService
        .checkAvailability({
          doctorName: bookingData.doctor,
          date: bookingData.date,
        })
        .then((res) => {
          if (res && res.bookedSlots) {
            setBookedSlots(res.bookedSlots);
          } else {
            setBookedSlots([]);
          }
        })
        .catch(() => {
          setBookedSlots([]);
        });
    } else {
      setBookedSlots([]);
    }
  }, [bookingData.doctor, bookingData.date]);

  // ================= MESSAGE =================

  const showMessage = (text, type = "success") => {
    setMessage({
      text,
      type,
    });

    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  // ================= BOOK APPOINTMENT =================

  const handleBooking = async (e) => {
    e.preventDefault();

    if (
      !bookingData.doctor ||
      !bookingData.department ||
      !bookingData.date ||
      !bookingData.time
    ) {
      showMessage("Please fill all required fields.", "error");
      return;
    }

    try {
      // Check if requested time slot is already booked for this doctor
      const requestedSlot = normalizeTimeSlot(bookingData.time);
      const isConflictLocal = bookedSlots.some(
        (slot) => normalizeTimeSlot(slot) === requestedSlot
      );

      if (isConflictLocal) {
        showMessage(
          `Dr. ${bookingData.doctor.replace(/^Dr\.\s*/i, "")} already has an appointment booked on ${bookingData.date} at ${bookingData.time}. Please select another time slot.`,
          "error"
        );
        return;
      }

      // Check real-time availability via API before booking
      const availRes = await appointmentService.checkAvailability({
        doctorName: bookingData.doctor,
        date: bookingData.date,
        time: bookingData.time,
      });

      if (availRes && availRes.available === false) {
        showMessage(
          `Dr. ${bookingData.doctor.replace(/^Dr\.\s*/i, "")} already has an appointment booked on ${bookingData.date} at ${bookingData.time}. Please select another time slot.`,
          "error"
        );
        if (availRes.bookedSlots) setBookedSlots(availRes.bookedSlots);
        return;
      }

      const formattedNotes = issueDescription.trim();

      const res = await appointmentService.createAppointment({
        patientName: user?.name,
        patientPhone: user?.phone,
        doctorName: bookingData.doctor,
        department: bookingData.department,
        date: bookingData.date,
        time: bookingData.time,
        type: bookingData.type || "Consultation",
        status: "pending",
        issues: selectedIssues,
        notes: formattedNotes,
      });

      if (res && res.data) {
        const added = {
          ...res.data,
          id: res.data._id || res.data.id || res.data.appointmentId,
          doctor: res.data.doctorName || bookingData.doctor,
          department: res.data.department || bookingData.department,
          issues: res.data.issues || selectedIssues,
          notes: res.data.notes || formattedNotes,
        };
        setAppointments((prev) => [added, ...prev]);
      } else {
        await fetchMyAppointments();
      }

      setBookingData({
        doctor: "",
        department: "",
        date: "",
        time: "",
        type: "Consultation",
      });
      setSelectedIssues([]);
      setIssueDescription("");
      setBookedSlots([]);

      setShowBooking(false);
      showMessage("Appointment requested successfully! Sent directly to Hospital Administration for approval.");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to book appointment", "error");
    }
  };

  // ================= CANCEL APPOINTMENT =================

  const handleCancel = async () => {
    if (!cancelAppointment) return;

    try {
      const aptId = cancelAppointment._id || cancelAppointment.id;
      await appointmentService.updateAppointmentStatus(aptId, "Cancelled");

      setAppointments((prev) =>
        prev.map((appointment) =>
          (appointment.id === aptId || appointment._id === aptId)
            ? {
                ...appointment,
                status: "Cancelled",
              }
            : appointment
        )
      );

      setCancelAppointment(null);
      showMessage("Appointment cancelled successfully.");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to cancel appointment", "error");
    }
  };

  // ================= FILTER =================

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "All") return true;
    const s = (appointment.status || "").toLowerCase();
    if (filter === "Approved") {
      return (
        s === "approved" ||
        s === "confirmed" ||
        s === "doctor_assigned" ||
        s === "room_assigned" ||
        s === "completed"
      );
    }
    if (filter === "Rejected") {
      return s === "rejected" || s === "cancelled";
    }
    if (filter === "Pending") {
      return s === "pending";
    }
    return appointment.status === filter;
  });

  // ================= MODERN STATUS BADGE RENDERER =================

  const renderStatusBadge = (appointment) => {
    if (!appointment) return null;
    const st = (appointment.status || "pending").toLowerCase();
    const isDocAssigned = st === "doctor_assigned";
    const isRoomAssigned = st === "room_assigned" || Boolean(appointment.roomNumber);
    const isApproved = (st === "approved" || st === "confirmed") && !isRoomAssigned && !isDocAssigned;
    const isRejected = st === "rejected" || st === "cancelled";

    if (isRejected) {
      return (
        <div className="status-cell-wrapper">
          <span className="status-badge rejected">
            <span className="status-dot"></span>
            <span>Rejected</span>
          </span>
          {appointment.rejectionReason && (
            <span className="status-rejection-subtext" title={appointment.rejectionReason}>
              Reason: {appointment.rejectionReason}
            </span>
          )}
        </div>
      );
    }

    if (isRoomAssigned) {
      return (
        <div className="status-cell-wrapper">
          <span className="status-badge room-assigned">
            <span className="status-dot"></span>
            <span>Room Assigned</span>
            {appointment.roomNumber && (
              <span className="status-room-chip">
                Room {appointment.roomNumber}
              </span>
            )}
          </span>
        </div>
      );
    }

    if (isDocAssigned) {
      return (
        <div className="status-cell-wrapper">
          <span className="status-badge doctor-assigned">
            <span className="status-dot"></span>
            <span>Doctor Assigned</span>
          </span>
        </div>
      );
    }

    if (isApproved) {
      return (
        <div className="status-cell-wrapper">
          <span className="status-badge approved">
            <span className="status-dot"></span>
            <span>Approved</span>
          </span>
        </div>
      );
    }

    return (
      <div className="status-cell-wrapper">
        <span className="status-badge pending">
          <span className="status-dot pulsing"></span>
          <span>Pending Approval</span>
        </span>
      </div>
    );
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

          /* ================= FAST START ANIMATION ================= */

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

          /* ================= MAIN CONTENT ================= */

          .appointments-page {
            margin-left: 240px;
            margin-top: 70px;
            min-height: 100vh;
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

            box-shadow:
              0 4px 15px rgba(25, 118, 210, 0.08);

            transition:
              background 0.25s ease,
              box-shadow 0.25s ease;

            animation: headerStart 0.3s ease-out;
          }

          .page-header:hover {
            background: #e3f2fd;

            box-shadow:
              0 6px 18px rgba(25, 118, 210, 0.12);
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

          /* ================= BOOK BUTTON ================= */

          .book-btn {
            border: none;

            background: #1976d2;

            color: white;

            padding: 12px 18px;

            border-radius: 8px;

            font-size: 14px;

            font-weight: 600;

            cursor: pointer;

            transition:
              background 0.2s ease,
              transform 0.1s ease,
              box-shadow 0.2s ease;
          }

          .book-btn:hover {
            background: #1565c0;

            transform: translateY(-2px);

            box-shadow:
              0 6px 15px rgba(25, 118, 210, 0.20);
          }

          .book-btn:active {
            transform: scale(0.96);
          }

          /* ================= STATS ================= */

          .stats-grid {
            display: grid;

            grid-template-columns: repeat(3, 1fr);

            gap: 18px;

            margin-bottom: 25px;
          }

          .stat-card {
            background: #ffffff;

            border: 1px solid #e1e8f0;

            border-radius: 14px;

            padding: 20px;

            box-shadow:
              0 4px 15px rgba(25, 118, 210, 0.06);

            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease,
              border-color 0.25s ease;

            animation: cardStart 0.3s ease-out both;
          }

          .stat-card:nth-child(1) {
            animation-delay: 0.08s;
          }

          .stat-card:nth-child(2) {
            animation-delay: 0.12s;
          }

          .stat-card:nth-child(3) {
            animation-delay: 0.16s;
          }

          .stat-card:nth-child(4) {
            animation-delay: 0.20s;
          }

          .stat-card:hover {
            transform: translateY(-3px);

            box-shadow:
              0 8px 22px rgba(25, 118, 210, 0.10);

            border-color: #bbdefb;
          }

          .stat-card h3 {
            margin: 0 0 8px;

            color: #64748b;

            font-size: 14px;

            font-weight: 500;
          }

          .stat-card strong {
            color: #1976d2;

            font-size: 26px;
          }

          /* ================= FILTER ================= */

          .filter-section {
            width: 100%;

            background: #ffffff;

            padding: 15px;

            border-radius: 12px;

            margin-bottom: 25px;

            border: 1px solid #e1e8f0;

            display: flex;

            align-items: center;

            gap: 12px;

            animation: cardStart 0.3s ease-out 0.22s both;
          }

          .filter-section label {
            color: #64748b;

            font-weight: 600;

            font-size: 14px;
          }

          .filter-select {
            width: 190px;

            height: 40px;

            border: 1px solid #d5dde7;

            border-radius: 8px;

            padding: 0 10px;

            font-size: 13px;

            background: #ffffff;

            color: #334155;

            outline: none;

            cursor: pointer;
          }

          .filter-select:focus {
            border-color: #1976d2;

            box-shadow:
              0 0 0 3px #e3f2fd;
          }

          /* ================= APPOINTMENT CARD ================= */

          .appointments-card {
            background: #ffffff;

            border: 1px solid #e1e8f0;

            border-radius: 14px;

            overflow: hidden;

            box-shadow:
              0 4px 15px rgba(25, 118, 210, 0.07);

            animation: cardStart 0.3s ease-out 0.25s both;
          }

          .card-title {
            padding: 20px 22px;

            border-bottom: 1px solid #eef2f6;

            color: #1976d2;

            font-size: 18px;

            font-weight: 700;
          }

          .table-container {
            overflow-x: auto;
          }

          table {
            width: 100%;

            border-collapse: collapse;
          }

          th {
            background: #e3f2fd;

            color: #1976d2;

            font-size: 13px;

            text-align: left;

            padding: 14px;

            white-space: nowrap;
          }

          td {
            padding: 15px 14px;

            border-bottom: 1px solid #eef2f6;

            color: #334155;

            font-size: 13px;

            white-space: nowrap;
          }

          tbody tr {
            animation: rowStart 0.25s ease-out both;
          }

          tbody tr:nth-child(1) {
            animation-delay: 0.28s;
          }

          tbody tr:nth-child(2) {
            animation-delay: 0.32s;
          }

          tbody tr:nth-child(3) {
            animation-delay: 0.36s;
          }

          tbody tr:nth-child(4) {
            animation-delay: 0.40s;
          }

          tbody tr:nth-child(5) {
            animation-delay: 0.44s;
          }

          tbody tr:hover td {
            background: #f8fbff;
          }

          .doctor-name {
            color: #1976d2;

            font-weight: 700;
          }

          .department {
            color: #64748b;
          }

          /* ================= BEST MODERN STATUS FORMAT ================= */

          .status-cell-wrapper {
            display: inline-flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.3px;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
            transition: all 0.2s ease;
          }

          .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
          }

          @keyframes pulseGlow {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.45;
              transform: scale(1.35);
            }
          }

          .status-dot.pulsing {
            animation: pulseGlow 1.8s infinite ease-in-out;
          }

          .status-badge.approved {
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
          }

          .status-badge.approved .status-dot {
            background: #10b981;
            box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
          }

          .status-badge.room-assigned {
            background: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
          }

          .status-badge.room-assigned .status-dot {
            background: #22c55e;
            box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
          }

          .status-badge.doctor-assigned {
            background: #eff6ff;
            color: #1e40af;
            border: 1px solid #bfdbfe;
          }

          .status-badge.doctor-assigned .status-dot {
            background: #3b82f6;
            box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);
          }

          .status-badge.rejected {
            background: #fff1f2;
            color: #9f1239;
            border: 1px solid #fecdd3;
          }

          .status-badge.rejected .status-dot {
            background: #f43f5e;
            box-shadow: 0 0 6px rgba(244, 63, 94, 0.6);
          }

          .status-badge.pending {
            background: #fffbeb;
            color: #92400e;
            border: 1px solid #fde68a;
          }

          .status-badge.pending .status-dot {
            background: #f59e0b;
            box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
          }

          .status-room-chip {
            display: inline-flex;
            align-items: center;
            background: #15803d;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 10px;
            letter-spacing: 0.2px;
            margin-left: 2px;
          }

          .status-rejection-subtext {
            display: inline-flex;
            align-items: center;
            font-size: 11px;
            font-weight: 500;
            color: #b91c1c;
            background: #fef2f2;
            padding: 3px 8px;
            border-radius: 6px;
            max-width: 220px;
            white-space: normal;
            line-height: 1.3;
          }

          /* ================= ACTION BUTTONS ================= */

          .action-buttons {
            display: flex;

            gap: 7px;
          }

          .view-btn,
          .cancel-btn {
            border: none;

            padding: 7px 11px;

            border-radius: 7px;

            cursor: pointer;

            font-size: 12px;

            font-weight: 600;

            transition:
              background 0.2s ease,
              transform 0.1s ease;
          }

          .view-btn {
            background: #e3f2fd;

            color: #1976d2;
          }

          .view-btn:hover {
            background: #bbdefb;

            transform: translateY(-1px);
          }

          .view-btn:active,
          .cancel-btn:active {
            transform: scale(0.96);
          }

          .cancel-btn {
            background: #ffebee;

            color: #c62828;
          }

          .cancel-btn:hover {
            background: #ffcdd2;

            transform: translateY(-1px);
          }

          /* ================= EMPTY ================= */

          .empty-state {
            background: #ffffff;

            padding: 50px 20px;

            text-align: center;

            animation: cardStart 0.25s ease-out;
          }

          .empty-state h3 {
            margin: 0 0 6px;

            color: #334155;
          }

          .empty-state p {
            margin: 0;

            color: #64748b;

            font-size: 14px;
          }

          /* ================= TOAST ================= */

          .toast {
            position: fixed;

            top: 90px;

            right: 25px;

            min-width: 280px;

            padding: 15px 18px;

            border-radius: 9px;

            color: #ffffff;

            font-size: 14px;

            font-weight: 600;

            z-index: 9999;

            box-shadow:
              0 8px 25px rgba(0, 0, 0, 0.15);

            animation: toastIn 0.2s ease-out;
          }

          .toast.success {
            background: #2e7d32;
          }

          .toast.error {
            background: #d32f2f;
          }

          @keyframes toastIn {
            from {
              opacity: 0;
              transform: translateX(35px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          /* ================= MODAL ================= */

          .modal-overlay {
            position: fixed;

            inset: 0;

            background: rgba(15, 23, 42, 0.45);

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            z-index: 999;

            animation: overlayIn 0.15s ease-out;
          }

          @keyframes overlayIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          .modal {
            width: 100%;

            max-width: 580px;

            max-height: 90vh;

            overflow-y: auto;

            background: #ffffff;

            border-radius: 16px;

            padding: 0;

            position: relative;

            box-shadow:
              0 15px 40px rgba(0, 0, 0, 0.15);

            animation: modalIn 0.25s ease-out;
          }

          @keyframes modalIn {
            from {
              opacity: 0;
              transform: scale(0.96) translateY(8px);
            }

            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .modal-header {
            padding: 20px 22px;

            border-bottom: 1px solid #eef2f6;

            display: flex;

            justify-content: space-between;

            align-items: center;
          }

          .modal-header h2 {
            margin: 0;

            color: #1976d2;

            font-size: 20px;
          }

          .close-btn {
            border: none;

            background: #f1f5f9;

            color: #64748b;

            width: 34px;

            height: 34px;

            border-radius: 50%;

            cursor: pointer;

            font-size: 20px;

            transition:
              background 0.2s ease,
              color 0.2s ease,
              transform 0.2s ease;
          }

          .close-btn:hover {
            background: #e3f2fd;

            color: #1976d2;

            transform: rotate(90deg);
          }

          .modal-body {
            padding: 22px;
          }

          /* ================= FORM ================= */

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;

            margin-bottom: 7px;

            color: #64748b;

            font-size: 13px;

            font-weight: 600;
          }

          .form-group input,
          .form-group select {
            width: 100%;

            height: 40px;

            padding: 0 12px;

            border: 1px solid #d5dde7;

            border-radius: 8px;

            outline: none;

            font-size: 13px;

            background: #ffffff;

            color: #334155;

            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .form-group input:focus,
          .form-group select:focus {
            border-color: #1976d2;

            box-shadow:
              0 0 0 3px #e3f2fd;
          }

          .form-row {
            display: grid;

            grid-template-columns: 1fr 1fr;

            gap: 15px;
          }

          /* ================= PATIENT ISSUES SECTION ================= */

          .issues-section {
            margin-top: 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
          }

          .issues-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .issues-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .issues-badge {
            background: #e0f2fe;
            color: #0284c7;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 12px;
          }

          .clear-issues-btn {
            background: none;
            border: none;
            color: #ef4444;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            padding: 2px 6px;
          }

          .clear-issues-btn:hover {
            text-decoration: underline;
          }

          .issue-checkboxes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 8px;
          }

          .issue-checkbox-card {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 10px;
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
          }

          .issue-checkbox-card:hover {
            border-color: #93c5fd;
            background: #f8fbff;
          }

          .issue-checkbox-card.selected {
            border-color: #1976d2;
            background: #eff6ff;
            box-shadow: 0 1px 3px rgba(25, 118, 210, 0.12);
          }

          .issue-checkbox-card input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #1976d2;
            cursor: pointer;
            margin: 0;
            flex-shrink: 0;
          }

          .issue-checkbox-icon {
            font-size: 14px;
            flex-shrink: 0;
          }

          .issue-checkbox-text {
            font-size: 12px;
            font-weight: 500;
            color: #334155;
            line-height: 1.2;
          }

          .issue-checkbox-card.selected .issue-checkbox-text {
            font-weight: 600;
            color: #1e40af;
          }

          .issue-notes-textarea {
            width: 100%;
            min-height: 55px;
            padding: 8px 12px;
            border: 1px solid #d5dde7;
            border-radius: 8px;
            font-size: 13px;
            color: #334155;
            outline: none;
            resize: vertical;
            font-family: inherit;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          .issue-notes-textarea:focus {
            border-color: #1976d2;
            box-shadow: 0 0 0 3px #e3f2fd;
          }

          .modal-footer {
            padding: 16px 22px;

            border-top: 1px solid #eef2f6;

            display: flex;

            justify-content: flex-end;

            gap: 10px;
          }

          .secondary-btn {
            border: none;

            background: #f1f5f9;

            color: #475569;

            padding: 10px 17px;

            border-radius: 8px;

            cursor: pointer;

            font-weight: 600;

            transition: 0.2s ease;
          }

          .secondary-btn:hover {
            background: #e2e8f0;

            transform: translateY(-1px);
          }

          .primary-btn {
            border: none;

            background: #1976d2;

            color: #ffffff;

            padding: 10px 17px;

            border-radius: 8px;

            cursor: pointer;

            font-weight: 600;

            transition: 0.2s ease;
          }

          .primary-btn:hover {
            background: #1565c0;

            transform: translateY(-1px);
          }

          /* ================= DETAILS ================= */

          .details-grid {
            display: grid;

            grid-template-columns: 1fr 1fr;

            gap: 15px;
          }

          .detail-box {
            background: #f8fbff;

            padding: 13px;

            border-radius: 8px;

            border: 1px solid #e3edf7;

            transition:
              background 0.2s ease,
              border-color 0.2s ease;
          }

          .detail-box:hover {
            background: #f1f8ff;

            border-color: #bbdefb;
          }

          .detail-box small {
            display: block;

            color: #64748b;

            margin-bottom: 5px;

            font-size: 11px;
          }

          .detail-box strong {
            color: #334155;

            font-size: 14px;
          }

          /* ================= CANCEL CONFIRM ================= */

          .cancel-confirm {
            text-align: center;

            padding: 10px;
          }

          .cancel-icon {
            width: 55px;

            height: 55px;

            margin: 0 auto 15px;

            border-radius: 50%;

            background: #ffebee;

            color: #d32f2f;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 25px;

            animation: warningPop 0.2s ease-out;
          }

          @keyframes warningPop {
            from {
              transform: scale(0.7);

              opacity: 0;
            }

            to {
              transform: scale(1);

              opacity: 1;
            }
          }

          .cancel-confirm h3 {
            color: #334155;

            margin: 5px 0 8px;
          }

          .cancel-confirm p {
            color: #64748b;

            font-size: 14px;

            line-height: 1.5;
          }

          .danger-btn {
            border: none;

            background: #d32f2f;

            color: #ffffff;

            padding: 10px 17px;

            border-radius: 8px;

            cursor: pointer;

            font-weight: 600;

            transition: 0.2s ease;
          }

          .danger-btn:hover {
            background: #b71c1c;

            transform: translateY(-1px);
          }

          /* ================= RESPONSIVE ================= */

          @media (max-width: 1100px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 800px) {
            .appointments-page {
              margin-left: 0;

              margin-top: 70px;

              width: 100%;

              padding: 20px;
            }

            .page-header {
              flex-direction: column;

              align-items: flex-start;

              gap: 15px;
            }

            .book-btn {
              width: 100%;
            }

            .filter-section {
              flex-direction: column;

              align-items: stretch;
            }

            .filter-select {
              width: 100%;
            }

            .form-row {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            .stats-grid {
              grid-template-columns: 1fr;
            }

            .page-header {
              padding: 20px;
            }

            .page-title h1 {
              font-size: 24px;
            }

            .appointments-page {
              padding: 15px;
            }

            .details-grid {
              grid-template-columns: 1fr;
            }

            .modal {
              max-width: 100%;
            }
          }

          /* ================= REDUCE MOTION ================= */

          @media (prefers-reduced-motion: reduce) {
            .appointments-page,
            .page-header,
            .stat-card,
            .filter-section,
            .appointments-card,
            tbody tr,
            .modal-overlay,
            .modal,
            .toast,
            .cancel-icon {
              animation: none;
            }
          }
        `}
      </style>

      {/* ================= TOAST ================= */}

      {message && (
        <div className={`toast ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* ================= MAIN PAGE ================= */}

      <div className="appointments-page">

        {/* ================= MANAGE APPOINTMENTS ================= */}

        <div className="page-header">

          <div className="page-title">

            <h1>
              Manage Appointments
            </h1>

            <p>
              Manage and view your appointments
            </p>

          </div>

          <button
            className="book-btn"
            onClick={() => {
              fetchDoctors();
              setShowBooking(true);
            }}
          >
            + Book Appointment
          </button>

        </div>

        {/* ================= STATS ================= */}

        <div className="stats-grid">

          <div className="stat-card">

            <h3>
              Total Appointments
            </h3>

            <strong>
              {appointments.length}
            </strong>

          </div>

          <div className="stat-card">

            <h3>
              Approved Appointments
            </h3>

            <strong style={{ color: "#2e7d32" }}>
              {
                appointments.filter((item) => {
                  const s = (item.status || "").toLowerCase();
                  return (
                    s === "approved" ||
                    s === "confirmed" ||
                    s === "doctor_assigned" ||
                    s === "room_assigned" ||
                    s === "completed"
                  );
                }).length
              }
            </strong>

          </div>

          <div className="stat-card">

            <h3>
              Rejected Appointments
            </h3>

            <strong style={{ color: "#dc2626" }}>
              {
                appointments.filter((item) => {
                  const s = (item.status || "").toLowerCase();
                  return s === "rejected" || s === "cancelled";
                }).length
              }
            </strong>

          </div>

        </div>

        {/* ================= FILTER ================= */}

        <div className="filter-section">

          <label>
            Filter Appointments:
          </label>

          <select
            className="filter-select"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
          >

            <option value="All">
              All
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>

            <option value="Pending">
              Pending
            </option>

          </select>

        </div>

        {/* ================= APPOINTMENT TABLE ================= */}

        <div className="appointments-card">

          <div className="card-title">
            Appointment List
          </div>

          <div className="table-container">

            {filteredAppointments.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No Appointments Found
                </h3>

                <p>
                  There are no appointments matching your filter.
                </p>

              </div>

            ) : (

              <table>

                <thead>

                  <tr>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredAppointments.map(
                    (appointment) => (

                      <tr key={appointment.id}>

                        <td>

                          <div className="doctor-name">
                            {appointment.doctor}
                          </div>

                        </td>

                        <td>

                          <div className="department">
                            {appointment.department}
                          </div>

                        </td>

                        <td>
                          {appointment.date}
                        </td>

                        <td>
                          {appointment.time}
                        </td>

                        <td>
                          {appointment.type}
                        </td>

                        <td>
                          {renderStatusBadge(appointment)}
                        </td>

                        <td>

                          <div className="action-buttons">

                            <button
                              className="view-btn"
                              onClick={() =>
                                setSelectedAppointment(
                                  appointment
                                )
                              }
                            >
                              View
                            </button>

                            {appointment.status ===
                              "Confirmed" && (

                              <button
                                className="cancel-btn"
                                onClick={() =>
                                  setCancelAppointment(
                                    appointment
                                  )
                                }
                              >
                                Cancel
                              </button>

                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>

      {/* ================= BOOK APPOINTMENT MODAL ================= */}

      {showBooking && (

        <div
          className="modal-overlay"
          onClick={() => setShowBooking(false)}
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Book Appointment
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setShowBooking(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={handleBooking}>

              <div className="modal-body">

                <div className="form-group">

                  <label>
                    Doctor *
                  </label>

                  <select
                    value={bookingData.doctor}
                    onChange={(e) => {
                      const selectedDocName = e.target.value;
                      const foundDoc = doctorsList.find(
                        (d) =>
                          d.name === selectedDocName ||
                          `Dr. ${d.name}` === selectedDocName ||
                          d.name === selectedDocName.replace(/^Dr\.\s*/i, "")
                      );
                      setBookingData((prev) => ({
                        ...prev,
                        doctor: selectedDocName,
                        department: foundDoc?.department || foundDoc?.specialization || prev.department,
                      }));
                    }}
                    required
                  >

                    <option value="">
                      Select Doctor
                    </option>

                    {doctorsList.length > 0 ? (
                      doctorsList.map((doc) => {
                        const displayName = doc.name.startsWith("Dr.") ? doc.name : `Dr. ${doc.name}`;
                        const spec = doc.specialization || doc.department;
                        return (
                          <option key={doc._id || doc.id || doc.doctorId || doc.name} value={displayName}>
                            {displayName} {spec ? `(${spec})` : ""}
                          </option>
                        );
                      })
                    ) : (
                      <>
                        <option value="Dr. Rajesh Kumar">
                          Dr. Rajesh Kumar
                        </option>
                        <option value="Dr. Priya Sharma">
                          Dr. Priya Sharma
                        </option>
                        <option value="Dr. Arun Kumar">
                          Dr. Arun Kumar
                        </option>
                        <option value="Dr. Meena Devi">
                          Dr. Meena Devi
                        </option>
                      </>
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Department *
                  </label>

                  <select
                    value={bookingData.department}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        department: e.target.value,
                      })
                    }
                    required
                  >

                    <option value="">
                      Select Department
                    </option>

                    {Array.from(new Set([
                      "Cardiology",
                      "General Physician",
                      "Orthopedics",
                      "Neurology",
                      "Dermatology",
                      "Pediatrics",
                      ...doctorsList.map((d) => d.department || d.specialization).filter(Boolean),
                    ])).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}

                  </select>

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Date *
                    </label>

                    <input
                      type="date"
                      value={bookingData.date}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          date: e.target.value,
                        })
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Time *
                    </label>

                    <input
                      type="time"
                      value={bookingData.time}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          time: e.target.value,
                        })
                      }
                      required
                    />

                    {bookedSlots.length > 0 && (
                      <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px", lineHeight: "1.4" }}>
                        ⚠️ Booked on this date: <strong>{bookedSlots.join(", ")}</strong>
                      </div>
                    )}

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Appointment Type
                  </label>

                  <select
                    value={bookingData.type}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        type: e.target.value,
                      })
                    }
                  >

                    <option value="Consultation">
                      Consultation
                    </option>

                    <option value="Regular Checkup">
                      Regular Checkup
                    </option>

                    <option value="Follow-up">
                      Follow-up
                    </option>

                    <option value="Emergency Consultation">
                      Emergency Consultation
                    </option>

                  </select>

                </div>

                {/* ================= REASON FOR VISIT / SYMPTOMS ================= */}
                <div className="form-group" style={{ marginTop: "14px" }}>
                  <label>
                    Reason for Visit / Symptoms (Optional)
                  </label>
                  <textarea
                    className="issue-notes-textarea"
                    rows="3"
                    placeholder="Describe symptoms, reason for visit, or any relevant details..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                  />
                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setShowBooking(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                >
                  Book Appointment
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================= VIEW DETAILS MODAL ================= */}

      {selectedAppointment && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedAppointment(null)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Appointment Details
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setSelectedAppointment(null)
                }
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              <div className="details-grid">

                <div className="detail-box">

                  <small>
                    Doctor
                  </small>

                  <strong>
                    {selectedAppointment.doctor}
                  </strong>

                </div>

                <div className="detail-box">

                  <small>
                    Department
                  </small>

                  <strong>
                    {selectedAppointment.department}
                  </strong>

                </div>

                <div className="detail-box">

                  <small>
                    Date
                  </small>

                  <strong>
                    {selectedAppointment.date}
                  </strong>

                </div>

                <div className="detail-box">

                  <small>
                    Time
                  </small>

                  <strong>
                    {selectedAppointment.time}
                  </strong>

                </div>

                <div className="detail-box">

                  <small>
                    Appointment Type
                  </small>

                  <strong>
                    {selectedAppointment.type}
                  </strong>

                </div>

                <div className="detail-box">

                  <small>
                    Status
                  </small>

                  <div style={{ marginTop: "4px" }}>
                    {renderStatusBadge(selectedAppointment)}
                  </div>

                </div>



                {((selectedAppointment.issues && selectedAppointment.issues.length > 0) || selectedAppointment.notes) && (
                  <div className="detail-box" style={{ gridColumn: "1 / -1" }}>
                    <small>Patient Issues / Symptoms</small>
                    {selectedAppointment.issues && selectedAppointment.issues.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px", marginBottom: selectedAppointment.notes ? "8px" : "0" }}>
                        {selectedAppointment.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#e0f2fe",
                              color: "#0369a1",
                              border: "1px solid #bae6fd",
                              padding: "3px 9px",
                              borderRadius: "14px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            ✓ {issue}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedAppointment.notes && (
                      <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
                        <strong>Notes:</strong> {selectedAppointment.notes}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="primary-btn"
                onClick={() =>
                  setSelectedAppointment(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ================= CANCEL CONFIRMATION ================= */}

      {cancelAppointment && (

        <div
          className="modal-overlay"
          onClick={() =>
            setCancelAppointment(null)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Cancel Appointment
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setCancelAppointment(null)
                }
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              <div className="cancel-confirm">

                <div className="cancel-icon">
                  !
                </div>

                <h3>
                  Cancel this appointment?
                </h3>

                <p>
                  Are you sure you want to cancel
                  your appointment with{" "}
                  <strong>
                    {cancelAppointment.doctor}
                  </strong>
                  ?
                </p>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="secondary-btn"
                onClick={() =>
                  setCancelAppointment(null)
                }
              >
                Keep Appointment
              </button>

              <button
                className="danger-btn"
                onClick={handleCancel}
              >
                Yes, Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default MyAppointments;