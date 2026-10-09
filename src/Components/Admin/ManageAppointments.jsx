import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
 faCheck
  } from "@fortawesome/free-solid-svg-icons";
import appointmentService from "../../Services/appointmentService";
import doctorService from "../../Services/doctorService";
import roomService from "../../Services/roomService";

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
   MANAGE APPOINTMENTS COMPONENT
   ========================================================= */

function ManageAppointments() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [deleteAppointment, setDeleteAppointment] =
    useState(null);

  const [showAddAppointment, setShowAddAppointment] =
    useState(false);

  /* ================= EDIT APPOINTMENT ================= */

  const [editAppointment, setEditAppointment] =
    useState(null);

  const [toast, setToast] = useState(null);

  /* ================= APPROVAL & ALLOCATION STATE ================= */
  const [approveAppointmentModal, setApproveAppointmentModal] = useState(null);
  const [approveDoctorId, setApproveDoctorId] = useState("");
  const [approveRoomId, setApproveRoomId] = useState("");
  const [approveComments, setApproveComments] = useState("Approved by medical administration.");
  const [rejectAppointmentModal, setRejectAppointmentModal] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [assignDoctorModal, setAssignDoctorModal] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [assignRoomModal, setAssignRoomModal] = useState(null);
  const [availableRoomsList, setAvailableRoomsList] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);


  /* =========================================================
     NEW APPOINTMENT FORM
     ========================================================= */

  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    patientPhone: "",
    doctorName: "Dr. Rajesh Kumar",
    department: "Cardiology",
    date: "",
    time: "",
    type: "Consultation",
    status: "Confirmed",
    notes: "",
  });


  /* =========================================================
     APPOINTMENT DATA (FROM API)
     ========================================================= */

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorsList, setDoctorsList] = useState([]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentService.getAppointments();
      if (res && res.data) {
        setAppointments(res.data.map((apt) => ({
          ...apt,
          id: apt._id || apt.id || apt.appointmentId,
        })));
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);


  /* =========================================================
     STATISTICS
     ========================================================= */

  const totalAppointments = appointments.length;

  const pendingAppointments = appointments.filter(
    (appointment) => (appointment.status || "").toLowerCase() === "pending"
  ).length;

  const roomAlertAppointments = appointments.filter(
    (appointment) =>
      ((appointment.status || "").toLowerCase() === "approved" ||
        (appointment.status || "").toLowerCase() === "confirmed") &&
      !appointment.roomNumber
  ).length;

  const confirmedAppointments = appointments.filter((appointment) => {
    const s = (appointment.status || "").toLowerCase();
    return (
      s === "confirmed" ||
      s === "approved" ||
      s === "doctor_assigned" ||
      s === "room_assigned" ||
      s === "completed" ||
      s === "scheduled"
    );
  }).length;

  const rejectedAppointments = appointments.filter((appointment) => {
    const s = (appointment.status || "").toLowerCase();
    return s === "rejected" || s === "cancelled";
  }).length;


  /* =========================================================
     SEARCH + FILTER
     ========================================================= */

  const filteredAppointments = appointments.filter(
    (appointment) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (appointment.patientName || "")
          .toLowerCase()
          .includes(searchText) ||
        (appointment.appointmentId || "")
          .toLowerCase()
          .includes(searchText) ||
        (appointment.patientPhone || "").includes(searchText) ||
        (appointment.doctorName || "")
          .toLowerCase()
          .includes(searchText) ||
        (appointment.department || "")
          .toLowerCase()
          .includes(searchText) ||
        (appointment.roomNumber || "")
          .toLowerCase()
          .includes(searchText);

      const st = (appointment.status || "").toLowerCase();
      const matchesStatus =
        status === "All" ||
        (status.toLowerCase() === "confirmed"
          ? ["confirmed", "approved", "doctor_assigned", "room_assigned", "completed", "scheduled"].includes(st)
          : status.toLowerCase() === "rejected"
          ? ["rejected", "cancelled"].includes(st)
          : st === status.toLowerCase());

      return matchesSearch && matchesStatus;
    }
  );


  /* =========================================================
     TOAST
     ========================================================= */

  const showToast = (message) => {
    setToast({
      type: "success",
      message,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };


  /* =========================================================
     ADD APPOINTMENT
     ========================================================= */

  const handleAddAppointment = async (e) => {
    e.preventDefault();

    if (
      !newAppointment.patientName ||
      !newAppointment.patientPhone ||
      !newAppointment.date ||
      !newAppointment.time
    ) {
      showToast("Please fill all required fields!");
      return;
    }

    try {
      const res = await appointmentService.createAppointment({
        patientName: newAppointment.patientName,
        patientPhone: newAppointment.patientPhone,
        doctorName: newAppointment.doctorName,
        department: newAppointment.department,
        date: newAppointment.date,
        time: newAppointment.time,
        type: newAppointment.type || "Consultation",
        status: newAppointment.status || "Scheduled",
        notes: newAppointment.notes || "",
      });

      if (res && res.data) {
        const added = { ...res.data, id: res.data._id || res.data.id || res.data.appointmentId };
        setAppointments((prev) => [added, ...prev]);
      } else {
        await fetchAppointments();
      }

      setShowAddAppointment(false);

      setNewAppointment({
        patientName: "",
        patientPhone: "",
        doctorName: "Dr. Rajesh Kumar",
        department: "Cardiology",
        date: "",
        time: "",
        type: "Consultation",
        status: "Confirmed",
        notes: "",
      });

      showToast("Appointment added successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create appointment!");
    }
  };


  /* =========================================================
     EDIT APPOINTMENT
     ========================================================= */

  const openEditAppointment = (appointment) => {
    setEditAppointment({
      ...appointment,
    });
  };


  const handleEditAppointment = async (e) => {
    e.preventDefault();

    if (
      !editAppointment.patientName ||
      !editAppointment.patientPhone ||
      !editAppointment.date ||
      !editAppointment.time
    ) {
      showToast("Please fill all required fields!");
      return;
    }

    try {
      const aptId = editAppointment._id || editAppointment.id;
      const res = await appointmentService.updateAppointment(aptId, editAppointment);
      const updated = res.data ? { ...res.data, id: res.data._id || res.data.id } : editAppointment;

      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          (appointment._id === aptId || appointment.id === aptId)
            ? updated
            : appointment
        )
      );

      setEditAppointment(null);
      showToast("Appointment updated successfully!");
      await fetchAppointments();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update appointment!");
    }
  };


  /* =========================================================
     DELETE APPOINTMENT
     ========================================================= */

  const confirmDelete = async () => {
    if (!deleteAppointment) return;

    try {
      const aptId = deleteAppointment._id || deleteAppointment.id;
      await appointmentService.deleteAppointment(aptId);

      setAppointments((prevAppointments) =>
        prevAppointments.filter(
          (appointment) =>
            appointment._id !== aptId && appointment.id !== aptId
        )
      );

      setDeleteAppointment(null);
      showToast("Appointment deleted successfully!");
      await fetchAppointments();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete appointment!");
    }
  };

  /* ================= APPROVAL & ASSIGNMENT WORKFLOW HANDLERS ================= */
  const handleOpenApproveModal = async (apt) => {
    setApproveAppointmentModal(apt);
    setApproveComments("Approved by medical administration.");

    // Pre-select doctor if matching
    const cleanDocName = (apt.doctorName || "").replace(/^Dr\.\s*/i, "").trim().toLowerCase();
    const matchingDoc = doctorsList.find(
      (d) =>
        (apt.doctor && (d._id === apt.doctor._id || d._id === apt.doctor)) ||
        (apt.assignedDoctor && (d._id === apt.assignedDoctor._id || d._id === apt.assignedDoctor)) ||
        (cleanDocName && d.name.toLowerCase().includes(cleanDocName))
    );
    setApproveDoctorId(matchingDoc ? matchingDoc._id : "");

    // Pre-load available rooms
    setSelectedRoomId("");
    setApproveRoomId("");
    try {
      const res = await roomService.getRooms({ status: "Available" });
      if (res && res.data) {
        setAvailableRoomsList(res.data.filter((r) => r.status === "Available"));
      }
    } catch (err) {
      console.error("Error fetching available rooms:", err);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveAppointmentModal) return;
    try {
      setActionInProgress(true);
      const aptId = approveAppointmentModal._id || approveAppointmentModal.id;
      const selectedDoc = doctorsList.find((d) => d._id === approveDoctorId);

      const payload = {
        adminComments: approveComments || "Approved by medical administration.",
        doctorId: approveDoctorId || undefined,
        doctorName: selectedDoc ? selectedDoc.name : approveAppointmentModal.doctorName,
        department: selectedDoc ? (selectedDoc.department || selectedDoc.specialization) : approveAppointmentModal.department,
        roomId: approveRoomId || undefined,
      };

      const res = await appointmentService.approveAppointment(aptId, payload);
      if (res && res.success) {
        const roomMsg = res.data?.roomNumber ? ` Assigned Room ${res.data.roomNumber}.` : "";
        const docMsg = res.data?.doctorName ? ` Assigned ${res.data.doctorName}.` : "";
        showToast(`Appointment approved successfully!${docMsg}${roomMsg}`);
        setApproveAppointmentModal(null);

        const newStatus = payload.roomId ? "room_assigned" : (payload.doctorId ? "doctor_assigned" : "approved");
        const updatedApt = res.data
          ? { ...res.data, id: res.data._id || res.data.id || aptId }
          : { ...approveAppointmentModal, status: newStatus };

        setAppointments((prev) =>
          prev.map((a) => (a._id === aptId || a.id === aptId ? updatedApt : a))
        );
        await fetchAppointments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve appointment!");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleQuickApprove = async (apt) => {
    if (!apt) return;
    try {
      setActionInProgress(true);
      const aptId = apt._id || apt.id;
      const res = await appointmentService.approveAppointment(aptId, {
        adminComments: "Quick approved by medical administration.",
      });
      if (res && res.success) {
        showToast("Appointment approved successfully!");
        setApproveAppointmentModal(null);

        const updatedApt = res.data
          ? { ...res.data, id: res.data._id || res.data.id || aptId }
          : { ...apt, status: "approved" };

        setAppointments((prev) =>
          prev.map((a) => (a._id === aptId || a.id === aptId ? updatedApt : a))
        );
        await fetchAppointments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve appointment!");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleApproveAppointment = async (apt) => {
    handleOpenApproveModal(apt);
  };

  const handleConfirmReject = async () => {
    if (!rejectAppointmentModal) return;
    try {
      setActionInProgress(true);
      const aptId = rejectAppointmentModal._id || rejectAppointmentModal.id;
      const res = await appointmentService.rejectAppointment(aptId, {
        rejectionReason: rejectionReasonText || "Slot unavailable. Please reschedule.",
      });
      if (res && res.success) {
        showToast("Appointment rejected successfully.");
        setRejectAppointmentModal(null);
        setRejectionReasonText("");

        const updatedApt = res.data
          ? { ...res.data, id: res.data._id || res.data.id || aptId }
          : { ...rejectAppointmentModal, status: "rejected" };

        setAppointments((prev) =>
          prev.map((a) => (a._id === aptId || a.id === aptId ? updatedApt : a))
        );
        await fetchAppointments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject appointment!");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenAssignRoom = async (apt) => {
    setAssignRoomModal(apt);
    setSelectedRoomId("");
    try {
      const res = await roomService.getRooms({ status: "Available" });
      if (res && res.data) {
        setAvailableRoomsList(res.data.filter((r) => r.status === "Available"));
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const handleConfirmAssignRoom = async () => {
    if (!assignRoomModal || !selectedRoomId) {
      showToast("Please select an available room!");
      return;
    }
    try {
      setActionInProgress(true);
      const aptId = assignRoomModal._id || assignRoomModal.id;
      const res = await appointmentService.assignRoom(aptId, { roomId: selectedRoomId });
      if (res && res.success) {
        showToast("Room assigned successfully!");
        setAssignRoomModal(null);
        setSelectedRoomId("");

        const updatedApt = res.data
          ? { ...res.data, id: res.data._id || res.data.id || aptId }
          : { ...assignRoomModal, status: "room_assigned" };

        setAppointments((prev) =>
          prev.map((a) => (a._id === aptId || a.id === aptId ? updatedApt : a))
        );
        await fetchAppointments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to assign room!");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenAssignDoctor = (apt) => {
    setAssignDoctorModal(apt);
    setSelectedDoctorId(apt.doctor?._id || apt.assignedDoctor?._id || "");
  };

  const handleConfirmAssignDoctor = async () => {
    if (!assignDoctorModal || !selectedDoctorId) {
      showToast("Please select a doctor!");
      return;
    }
    const doc = doctorsList.find(
      (d) => d._id === selectedDoctorId || d.doctorId === selectedDoctorId
    );
    try {
      setActionInProgress(true);
      const aptId = assignDoctorModal._id || assignDoctorModal.id;
      const res = await appointmentService.assignDoctor(aptId, {
        doctorId: selectedDoctorId,
        doctorName: doc ? doc.name : undefined,
      });
      if (res && res.success) {
        showToast("Doctor assigned successfully!");
        setAssignDoctorModal(null);
        setSelectedDoctorId("");

        const updatedApt = res.data
          ? { ...res.data, id: res.data._id || res.data.id || aptId }
          : { ...assignDoctorModal, status: "doctor_assigned", doctorName: doc ? doc.name : undefined };

        setAppointments((prev) =>
          prev.map((a) => (a._id === aptId || a.id === aptId ? updatedApt : a))
        );
        await fetchAppointments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to assign doctor!");
    } finally {
      setActionInProgress(false);
    }
  };


  /* =========================================================
     AVATAR
     ========================================================= */

  const getAvatar = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };


  /* =========================================================
     UI
     ========================================================= */

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


        /* ================= PAGE ================= */

        .appointments-page {
          min-height: calc(100vh - 70px);
          margin-top: 70px;
          margin-left: 240px;
          width: calc(100% - 240px);
          padding: 30px;
          background: #f4f8fb;
          animation: pageFade 0.6s ease;
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

        .appointments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding: 24px 22px;
          background: #eaf5ff;
          border: 1px solid #cfe7ff;
          border-radius: 17px;
          box-shadow:
            0 5px 16px
            rgba(25, 118, 210, 0.05);
          min-height: 98px;
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
          transform:
            translateX(5px)
            scale(0.96);
          text-shadow:
            0 3px 8px
            rgba(25, 118, 210, 0.18);
        }


        .header-title p {
          margin: 7px 0 0;
          color: #4779ad;
          font-size: 14px;
        }


        /* ================= ADD BUTTON ================= */

        .add-appointment-btn {
          border: none;
          background: #1976d2;
          color: white;
          height: 44px;
          padding: 0 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow:
            0 5px 15px
            rgba(25, 118, 210, 0.18);
          transition: all 0.3s ease;
        }


        .add-appointment-btn:hover {
          background: #1565c0;
          transform:
            translateY(-2px)
            scale(0.96);
          box-shadow:
            0 8px 20px
            rgba(25, 118, 210, 0.24);
        }


        .add-appointment-btn:active {
          transform: scale(0.92);
        }


        .add-icon {
          font-size: 20px;
          line-height: 1;
        }


        /* ================= STATS ================= */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 25px;
        }


        .stat-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          border:
            1px solid #e5edf3;
          box-shadow:
            0 7px 22px
            rgba(50, 90, 110, 0.07);
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
          animation:
            cardSlide 0.7s ease both;
        }


        .stat-card:nth-child(1) {
          animation-delay: 0.1s;
        }

        .stat-card:nth-child(2) {
          animation-delay: 0.2s;
        }

        .stat-card:nth-child(3) {
          animation-delay: 0.3s;
        }

        .stat-card:nth-child(4) {
          animation-delay: 0.4s;
        }


        @keyframes cardSlide {
          from {
            opacity: 0;
            transform:
              translateY(25px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }


        .stat-card:hover {
          transform:
            translateY(-5px)
            scale(0.97);
          box-shadow:
            0 12px 28px
            rgba(50, 90, 110, 0.12);
        }


        .stat-icon {
          width: 55px;
          height: 55px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          transition:
            transform 0.3s ease;
        }


        .stat-card:hover .stat-icon {
          transform: scale(0.90);
        }


        .blue-icon {
          background: #e3f2fd;
          color: #1976d2;
        }


        .green-icon {
          background: #e8f5e9;
          color: #2e7d32;
        }


        .purple-icon {
          background: #f3e5f5;
          color: #8e44ad;
        }


        .orange-icon {
          background: #fff3e0;
          color: #ef6c00;
        }


        .red-icon {
          background: #ffebee;
          color: #d32f2f;
        }


        .active-stat {
          border-color: #2563eb !important;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.18) !important;
        }


        .stat-info p {
          margin: 0 0 6px;
          color: #78909c;
          font-size: 13px;
        }


        .stat-info h2 {
          margin: 0;
          font-size: 25px;
          color: #263238;
        }


        /* ================= TABLE CARD ================= */

        .appointments-card {
          background: #ffffff;
          border:
            1px solid #e5edf3;
          border-radius: 18px;
          box-shadow:
            0 7px 22px
            rgba(50, 90, 110, 0.06);
          overflow: hidden;
          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease;
          animation:
            contentAppear 0.8s ease;
        }


        .appointments-card:hover {
          transform: scale(0.995);
          box-shadow:
            0 15px 35px
            rgba(50, 90, 110, 0.10);
        }


        @keyframes contentAppear {
          from {
            opacity: 0;
            transform:
              translateY(20px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }


        /* ================= TOOLBAR ================= */

        .appointments-toolbar {
          padding: 20px;
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 15px;
          border-bottom:
            1px solid #edf2f5;
        }


        .search-box {
          width: 330px;
          position: relative;
        }


        .search-box span {
          position: absolute;
          left: 14px;
          top: 50%;
          transform:
            translateY(-50%);
          font-size: 17px;
          color: #90a4ae;
          pointer-events: none;
        }


        .search-box input {
          width: 100%;
          height: 43px;
          padding:
            0 15px 0 42px;
          border:
            1px solid #dce6ec;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
          color: #37474f;
          transition: 0.3s;
          background: #fbfdff;
        }


        .search-box input:focus {
          border-color: #64b5f6;
          box-shadow:
            0 0 0 3px
            rgba(33, 150, 243, 0.08);
          transform: scale(0.99);
        }


        .search-box:focus-within span {
          color: #1976d2;
        }


        .filter-area {
          display: flex;
          gap: 10px;
        }


        .filter-area select {
          height: 43px;
          padding:
            0 35px 0 13px;
          border:
            1px solid #dce6ec;
          border-radius: 10px;
          background: #ffffff;
          color: #455a64;
          outline: none;
          cursor: pointer;
          transition: 0.3s ease;
        }


        .filter-area select:hover {
          transform: scale(0.97);
          border-color: #90caf9;
        }


        /* ================= TABLE ================= */

        .table-container {
          width: 100%;
          overflow-x: auto;
        }


        table {
          width: 100%;
          border-collapse:
            collapse;
          min-width: 1150px;
        }


        thead {
          background: #f7fafc;
        }


        th {
          padding:
            16px 18px;
          text-align: left;
          font-size: 12px;
          color: #78909c;
          text-transform:
            uppercase;
          letter-spacing:
            0.4px;
          font-weight: 700;
        }


        td {
          padding:
            17px 18px;
          border-top:
            1px solid #edf2f5;
          font-size: 13px;
          color: #455a64;
        }


        tbody tr {
          transition:
            background 0.25s ease,
            transform 0.25s ease;
          animation:
            rowAppear 0.5s ease both;
        }


        tbody tr:hover {
          background: #f8fcff;
          transform: scale(0.995);
        }


        @keyframes rowAppear {
          from {
            opacity: 0;
            transform:
              translateX(-10px);
          }

          to {
            opacity: 1;
            transform:
              translateX(0);
          }
        }


        /* ================= PATIENT ================= */

        .patient-info {
          display: flex;
          align-items: center;
          gap: 11px;
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
          font-size: 12px;
          font-weight: 700;
          transition:
            transform 0.3s ease;
        }


        tr:hover .patient-avatar {
          transform: scale(0.88);
        }


        .patient-name {
          color: #263238;
          font-weight: 600;
        }


        .appointment-id {
          color: #90a4ae;
          font-size: 11px;
          margin-top: 3px;
        }


        /* ================= DEPARTMENT ================= */

        .department {
          background: #eef7fd;
          color: #1976d2;
          padding:
            6px 10px;
          border-radius: 20px;
          font-size: 11px;
          display: inline-block;
          transition:
            transform 0.25s ease;
        }


        tr:hover .department {
          transform: scale(0.94);
        }


        /* ================= TYPE ================= */

        .appointment-type {
          background: #f3f7fa;
          color: #607d8b;
          padding:
            6px 10px;
          border-radius: 20px;
          font-size: 11px;
          display: inline-block;
        }


        /* ================= STATUS ================= */

        .status {
          padding:
            6px 11px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
          transition:
            transform 0.25s ease;
        }


        tr:hover .status {
          transform: scale(0.94);
        }


        .status.scheduled {
          background: #e3f2fd;
          color: #1976d2;
        }


        .status.confirmed {
          background: #e8f5e9;
          color: #2e7d32;
        }


        .status.completed {
          background: #f3e5f5;
          color: #8e44ad;
        }


        .status.cancelled {
          background: #ffebee;
          color: #e53935;
        }


        /* ================= ACTIONS ================= */

        .actions {
          display: flex;
          gap: 7px;
          align-items: center;
        }


        .action-btn {
          height: 34px;
          padding:
            0 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition:
            all 0.25s ease;
        }


        .view-btn {
          background: #e3f2fd;
          color: #1976d2;
        }


        /* ================= EDIT BUTTON ================= */

        .edit-btn {
          background: #fff3e0;
          color: #ef6c00;
        }


        .edit-btn:hover {
          background: #ffe0b2;
          color: #e65100;
        }


        .delete-btn {
          width: 34px;
          padding: 0;
          background: #ffebee;
          color: #e53935;
          font-size: 14px;
        }


        .action-btn:hover {
          transform:
            translateY(-2px)
            scale(0.90);
        }


        .view-btn:hover {
          background: #bbdefb;
        }


        .delete-btn:hover {
          background: #ffcdd2;
        }


        /* ================= EMPTY ================= */

        .empty-state {
          text-align: center;
          padding: 50px;
          color: #90a4ae;
        }


        .empty-state div {
          font-size: 40px;
          margin-bottom: 10px;
        }


        .empty-state strong {
          color: #607d8b;
        }


        /* ================= MODAL ================= */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background:
            rgba(30, 50, 65, 0.35);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          z-index: 1000;
          animation:
            overlayFade 0.25s ease;
        }


        @keyframes overlayFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }


        .modal {
          width: 560px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 18px;
          box-shadow:
            0 20px 60px
            rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation:
            modalZoom 0.3s ease;
        }


        @keyframes modalZoom {
          from {
            opacity: 0;
            transform:
              scale(0.9)
              translateY(15px);
          }

          to {
            opacity: 1;
            transform:
              scale(1)
              translateY(0);
          }
        }


        .modal-header {
          padding:
            20px 22px;
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          background: #f7fbfe;
          border-bottom:
            1px solid #e8f0f5;
        }


        .modal-header h2 {
          margin: 0;
          color: #183b56;
          font-size: 20px;
        }


        .close-btn {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 8px;
          background: #ffffff;
          color: #607d8b;
          cursor: pointer;
          font-size: 18px;
          transition: 0.25s;
        }


        .close-btn:hover {
          background: #ffebee;
          color: #e53935;
          transform: scale(0.88);
        }


        /* ================= ADD / EDIT FORM ================= */

        .add-form {
          padding: 24px;
        }


        .form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 15px;
        }


        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }


        .form-group.full {
          grid-column:
            span 2;
        }


        .form-group label {
          color: #546e7a;
          font-size: 12px;
          font-weight: 600;
        }


        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          border:
            1px solid #dce6ec;
          border-radius: 9px;
          padding:
            10px 12px;
          outline: none;
          font-size: 13px;
          color: #37474f;
          background: #fbfdff;
          transition:
            0.25s ease;
        }


        .form-group input,
        .form-group select {
          height: 42px;
        }


        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }


        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color:
            #64b5f6;
          box-shadow:
            0 0 0 3px
            rgba(33, 150, 243, 0.08);
        }


        .form-buttons {
          display: flex;
          justify-content:
            flex-end;
          gap: 10px;
          margin-top: 22px;
        }


        .form-cancel-btn,
        .form-save-btn {
          height: 40px;
          padding:
            0 20px;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition:
            0.25s ease;
        }


        .form-cancel-btn {
          background: #f1f5f7;
          color: #546e7a;
        }


        .form-save-btn {
          background: #1976d2;
          color: #ffffff;
        }


        .form-cancel-btn:hover,
        .form-save-btn:hover {
          transform:
            translateY(-2px)
            scale(0.96);
        }


        .form-save-btn:hover {
          background: #1565c0;
        }


        .form-cancel-btn:hover {
          background: #e3ebef;
        }


        /* ================= VIEW MODAL ================= */

        .modal-body {
          padding: 25px;
        }


        .profile-section {
          text-align: center;
          margin-bottom: 25px;
        }


        .large-avatar {
          width: 75px;
          height: 75px;
          border-radius: 50%;
          margin: auto;
          background: #e3f2fd;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          font-weight: bold;
          animation:
            avatarPulse 2s infinite;
        }


        @keyframes avatarPulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0
              rgba(25, 118, 210, 0.12);
          }

          50% {
            box-shadow:
              0 0 0 10px
              rgba(25, 118, 210, 0.04);
          }
        }


        .profile-section h3 {
          margin:
            12px 0 4px;
          color: #263238;
        }


        .profile-section p {
          margin: 0;
          color: #90a4ae;
          font-size: 13px;
        }


        .details-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 14px;
        }


        .detail-item {
          background: #f8fbfd;
          border:
            1px solid #edf2f5;
          padding: 13px;
          border-radius: 10px;
          transition:
            all 0.25s ease;
        }


        .detail-item:hover {
          transform: scale(0.97);
          background: #f3f9fd;
        }


        .detail-item span {
          display: block;
          color: #90a4ae;
          font-size: 11px;
          margin-bottom: 5px;
        }


        .detail-item strong {
          color: #37474f;
          font-size: 13px;
        }


        /* ================= DELETE MODAL ================= */

        .delete-modal {
          width: 410px;
          max-width: 100%;
          background: #ffffff;
          border-radius: 18px;
          padding: 30px;
          text-align: center;
          animation:
            modalZoom 0.3s ease;
          box-shadow:
            0 20px 60px
            rgba(0, 0, 0, 0.15);
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
          transition:
            transform 0.3s ease;
        }


        .delete-icon:hover {
          transform: scale(0.88);
        }


        .delete-modal h3 {
          color: #263238;
          margin:
            17px 0 8px;
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
          padding:
            11px 22px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition:
            0.25s;
        }


        .cancel-btn {
          background: #f1f5f7;
          color: #546e7a;
        }


        .confirm-delete-btn {
          background: #e53935;
          color: white;
        }


        .cancel-btn:hover,
        .confirm-delete-btn:hover {
          transform:
            translateY(-2px)
            scale(0.94);
        }


        /* ================= TOAST ================= */

        .toast {
          position: fixed;
          top: 25px;
          right: 25px;
          min-width: 280px;
          padding:
            15px 18px;
          border-radius: 11px;
          background: #ffffff;
          box-shadow:
            0 10px 30px
            rgba(0, 0, 0, 0.13);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 2000;
          animation:
            toastTopRight 0.45s ease;
          border-left:
            4px solid #2e7d32;
          color: #455a64;
          font-size: 13px;
        }


        @keyframes toastTopRight {
          from {
            opacity: 0;
            transform:
              translateX(50px)
              translateY(-10px)
              scale(0.95);
          }

          to {
            opacity: 1;
            transform:
              translateX(0)
              translateY(0)
              scale(1);
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


        /* ================= RESPONSIVE ================= */

        @media (max-width: 1200px) {

          .appointments-page {
            padding-left: 220px;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }


        @media (max-width: 900px) {

          .appointments-page {
            margin-left: 0;
            width: 100%;
            padding:
              20px 18px 18px;
          }
        }


        @media (max-width: 700px) {

          .appointments-page {
            padding:
              70px 18px 18px 18px;
          }

          .appointments-header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
            padding: 20px;
          }

          .add-appointment-btn {
            width: 100%;
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .appointments-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            width: 100%;
          }

          .filter-area {
            width: 100%;
          }

          .filter-area select {
            width: 100%;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-group.full {
            grid-column: span 1;
          }

          .toast {
            top: 15px;
            right: 15px;
            left: 15px;
            min-width: auto;
          }
        }

        `}
      </style>


      {/* =====================================================
          MAIN PAGE
          ===================================================== */}

      <div className="appointments-page">


        {/* ================= HEADER ================= */}

        <div className="appointments-header">

          <div className="header-title">

            <h1>
              Manage Appointments
            </h1>

            <p>
              Manage and monitor all patient appointments
            </p>

          </div>


          <button
            className="add-appointment-btn"
            onClick={() =>
              setShowAddAppointment(true)
            }
          >

            <span className="add-icon">
              +
            </span>

            Add Appointment

          </button>

        </div>


        {/* =================================================
            STAT CARDS
            ================================================= */}

        <div className="stats-grid">


          <div
            className={`stat-card ${status === "All" ? "active-stat" : ""}`}
            onClick={() => setStatus("All")}
            style={{ cursor: "pointer" }}
            title="Show all appointments"
          >

            <div className="stat-icon blue-icon">
              <i className="bi bi-receipt-cutoff"></i>
            </div>

            <div className="stat-info">

              <p>
                Total Appointments
              </p>

              <h2>

                <Counter
                  value={totalAppointments}
                />

              </h2>

            </div>

          </div>


          <div
            className={`stat-card ${status === "confirmed" ? "active-stat" : ""}`}
            onClick={() => setStatus(status === "confirmed" ? "All" : "confirmed")}
            style={{ cursor: "pointer" }}
            title="Filter confirmed appointments"
          >

            <div className="stat-icon green-icon">
              <FontAwesomeIcon icon={faCheck}/>
            </div>

            <div className="stat-info">

              <p>
                Confirmed Appointments
              </p>

              <h2>

                <Counter
                  value={confirmedAppointments}
                />

              </h2>

            </div>

          </div>


          <div
            className={`stat-card ${status === "rejected" ? "active-stat" : ""}`}
            onClick={() => setStatus(status === "rejected" ? "All" : "rejected")}
            style={{ cursor: "pointer" }}
            title="Filter rejected appointments"
          >

            <div className="stat-icon red-icon">
              <i className="bi bi-x-circle" style={{ fontSize: "24px" }}></i>
            </div>

            <div className="stat-info">

              <p>
                Rejected Appointments
              </p>

              <h2>

                <Counter
                  value={rejectedAppointments}
                />

              </h2>

            </div>

          </div>


        </div>


        {/* ================= APPOINTMENT TABLE ================= */}

        <div className="appointments-card">


          <div className="appointments-toolbar">


            <div className="search-box">

              <span>
                <i className="bi bi-search"></i>
              </span>

              <input
                type="text"
                placeholder="Search appointments..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>


            <div className="filter-area">

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >

                <option value="All">All Statuses ({totalAppointments})</option>
                <option value="confirmed">✅ Confirmed Appointments ({confirmedAppointments})</option>
                <option value="rejected">❌ Rejected Appointments ({rejectedAppointments})</option>
                <option value="pending">⏳ Pending Approval ({pendingAppointments})</option>
                <option value="approved">🔔 Room Alert / Approved ({roomAlertAppointments})</option>
                <option value="doctor_assigned">👨‍⚕️ Doctor Assigned</option>
                <option value="room_assigned">🏥 Room Assigned</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>

              </select>

            </div>


          </div>


          <div className="table-container">


            {filteredAppointments.length === 0 ? (

              <div className="empty-state">

                <div>
                  🔍
                </div>

                <strong>
                  No appointments found
                </strong>

                <p>
                  Try changing your search or filter.
                </p>

              </div>

            ) : (

              <table>

                <thead>

                  <tr>

                    <th>
                      Patient
                    </th>

                    <th>
                      Date / Time
                    </th>

                    <th>
                      Doctor
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredAppointments.map(
                    (appointment) => (

                      <tr
                        key={appointment.id}
                      >


                        <td>

                          <div className="patient-info">

                            <div className="patient-avatar">

                              {getAvatar(
                                appointment.patientName
                              )}

                            </div>


                            <div>

                              <div className="patient-name">

                                {appointment.patientName}

                              </div>

                              <div className="appointment-id">

                                {appointment.appointmentId}

                              </div>

                            </div>

                          </div>

                        </td>


                        <td>

                          <strong>
                            {appointment.date}
                          </strong>

                          <br />

                          <span
                            style={{
                              color: "#90a4ae",
                              fontSize: "11px",
                            }}
                          >
                            {appointment.time}
                          </span>

                        </td>


                        <td>

                          {appointment.doctorName}

                        </td>


                        <td>

                          <span className="department">

                            {appointment.department}

                          </span>

                        </td>


                        <td>

                          <span className="appointment-type">

                            {appointment.type}

                          </span>

                        </td>


                        <td>
                          {(() => {
                            const st = (appointment.status || "pending").toLowerCase();
                            const isPending = st === "pending";
                            const isApproved = st === "approved" || st === "confirmed";
                            const isRoomPending = isApproved && !appointment.roomNumber;
                            const isDocAssigned = st === "doctor_assigned";
                            const isRoomAssigned = st === "room_assigned" || Boolean(appointment.roomNumber);
                            const isCompleted = st === "completed";
                            const isRejected = st === "rejected";

                            return (
                              <div>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 10px",
                                    borderRadius: "20px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    textTransform: "capitalize",
                                    background: isPending
                                      ? "#fef3c7"
                                      : isApproved
                                      ? "#dbeafe"
                                      : isDocAssigned
                                      ? "#e0e7ff"
                                      : isRoomAssigned
                                      ? "#d1fae5"
                                      : isCompleted
                                      ? "#ecfdf5"
                                      : isRejected
                                      ? "#fee2e2"
                                      : "#f1f5f9",
                                    color: isPending
                                      ? "#92400e"
                                      : isApproved
                                      ? "#1e40af"
                                      : isDocAssigned
                                      ? "#4338ca"
                                      : isRoomAssigned
                                      ? "#065f46"
                                      : isCompleted
                                      ? "#047857"
                                      : isRejected
                                      ? "#991b1b"
                                      : "#475569",
                                  }}
                                >
                                  {isPending
                                    ? "Pending Approval"
                                    : isDocAssigned
                                    ? "Doctor Assigned"
                                    : isRoomAssigned
                                    ? `Room: ${appointment.roomNumber || "Allocated"}`
                                    : appointment.status}
                                </span>

                                {isRoomPending && (
                                  <div style={{ marginTop: "4px" }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        background: "#ffedd5",
                                        color: "#c2410c",
                                        padding: "2px 7px",
                                        borderRadius: "4px",
                                        fontSize: "10px",
                                        fontWeight: "700",
                                      }}
                                    >
                                      🔔 Room Alert: Pending
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* =================================================
                            ACTION BUTTONS
                            ================================================= */}
                        <td>
                          <div className="actions" style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                            {/* APPROVE / REJECT FOR PENDING */}
                            {(appointment.status || "").toLowerCase() === "pending" && (
                              <>
                                <button
                                  disabled={actionInProgress}
                                  className="action-btn"
                                  onClick={() => handleApproveAppointment(appointment)}
                                  title="Approve Appointment"
                                  style={{
                                    background: "#10b981",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "5px 10px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                  }}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  disabled={actionInProgress}
                                  className="action-btn"
                                  onClick={() => {
                                    setRejectAppointmentModal(appointment);
                                    setRejectionReasonText("");
                                  }}
                                  title="Reject Appointment"
                                  style={{
                                    background: "#ef4444",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "5px 10px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                  }}
                                >
                                  ✕ Reject
                                </button>
                              </>
                            )}

                            {/* RE-APPROVE FOR REJECTED */}
                            {(appointment.status || "").toLowerCase() === "rejected" && (
                              <button
                                disabled={actionInProgress}
                                className="action-btn"
                                onClick={() => handleApproveAppointment(appointment)}
                                title="Re-approve Appointment"
                                style={{
                                  background: "#ecfdf5",
                                  color: "#059669",
                                  border: "1px solid #a7f3d0",
                                  borderRadius: "6px",
                                  padding: "5px 10px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  fontWeight: "600",
                                }}
                              >
                                ✓ Re-Approve
                              </button>
                            )}

                            {/* REJECT FOR ACTIVE NON-PENDING */}
                            {["approved", "confirmed", "scheduled", "doctor_assigned", "room_assigned"].includes((appointment.status || "").toLowerCase()) && (
                              <button
                                disabled={actionInProgress}
                                className="action-btn"
                                onClick={() => {
                                  setRejectAppointmentModal(appointment);
                                  setRejectionReasonText("");
                                }}
                                title="Reject Appointment"
                                style={{
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "6px",
                                  padding: "5px 10px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  fontWeight: "600",
                                }}
                              >
                                ✕ Reject
                              </button>
                            )}

                            {/* ASSIGN ROOM BUTTON */}
                            {((appointment.status || "").toLowerCase() === "approved" ||
                              (appointment.status || "").toLowerCase() === "doctor_assigned" ||
                              (appointment.status || "").toLowerCase() === "room_assigned") && (
                              <button
                                disabled={actionInProgress}
                                className="action-btn"
                                onClick={() => handleOpenAssignRoom(appointment)}
                                title={appointment.roomNumber ? "Change Room" : "Assign Available Room"}
                                style={{
                                  background: appointment.roomNumber ? "#f1f5f9" : "#f97316",
                                  color: appointment.roomNumber ? "#334155" : "#fff",
                                  border: appointment.roomNumber ? "1px solid #cbd5e1" : "none",
                                  borderRadius: "6px",
                                  padding: "5px 9px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  fontWeight: "600",
                                }}
                              >
                                🏥 {appointment.roomNumber ? `Room ${appointment.roomNumber}` : "Assign Room"}
                              </button>
                            )}

                            {/* ASSIGN / CHANGE DOCTOR BUTTON */}
                            {["pending", "approved", "doctor_assigned", "room_assigned"].includes((appointment.status || "").toLowerCase()) && (
                              <button
                                disabled={actionInProgress}
                                className="action-btn"
                                onClick={() => handleOpenAssignDoctor(appointment)}
                                title="Assign or Change Doctor"
                                style={{
                                  background: "#f8fafc",
                                  color: "#2563eb",
                                  border: "1px solid #bfdbfe",
                                  borderRadius: "6px",
                                  padding: "5px 9px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  fontWeight: "500",
                                }}
                              >
                                👨‍⚕️ Assign Dr
                              </button>
                            )}

                            {/* VIEW */}
                            <button
                              className="action-btn view-btn"
                              onClick={() => setSelectedAppointment(appointment)}
                              title="View Appointment"
                            >
                              View
                            </button>

                            {/* EDIT */}
                            <button
                              className="action-btn edit-btn"
                              onClick={() => openEditAppointment(appointment)}
                              title="Edit Appointment"
                            >
                              Edit
                            </button>

                            {/* DELETE */}
                            <button
                              className="action-btn delete-btn"
                              onClick={() => setDeleteAppointment(appointment)}
                              title="Delete Appointment"
                            >
                              🗑
                            </button>
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


      {/* =====================================================
          ADD APPOINTMENT MODAL
          ===================================================== */}

      {showAddAppointment && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddAppointment(false)
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
                Add New Appointment
              </h2>


              <button
                className="close-btn"
                onClick={() =>
                  setShowAddAppointment(false)
                }
              >

                ✕

              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleAddAppointment}
            >


              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Patient Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter patient name"
                    value={
                      newAppointment.patientName
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        patientName:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Patient Phone *
                  </label>

                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={
                      newAppointment.patientPhone
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        patientPhone:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Doctor
                  </label>

                  <select
                    value={
                      newAppointment.doctorName
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        doctorName:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Dr. Rajesh Kumar
                    </option>

                    <option>
                      Dr. Meena Sharma
                    </option>

                    <option>
                      Dr. Suresh Kumar
                    </option>

                    <option>
                      Dr. Anitha
                    </option>

                    <option>
                      Dr. Karthik
                    </option>

                    <option>
                      Dr. Priya
                    </option>

                    <option>
                      Dr. Lakshmi
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Department
                  </label>

                  <select
                    value={
                      newAppointment.department
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        department:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Cardiology
                    </option>

                    <option>
                      Neurology
                    </option>

                    <option>
                      Orthopedics
                    </option>

                    <option>
                      Dermatology
                    </option>

                    <option>
                      General Medicine
                    </option>

                    <option>
                      Pediatrics
                    </option>

                    <option>
                      Gynecology
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Appointment Date *
                  </label>

                  <input
                    type="date"
                    value={
                      newAppointment.date
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        date:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Appointment Time *
                  </label>

                  <input
                    type="time"
                    value={
                      newAppointment.time
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        time:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Appointment Type
                  </label>

                  <select
                    value={
                      newAppointment.type
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        type:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Consultation
                    </option>

                    <option>
                      Follow-up
                    </option>

                    <option>
                      Emergency
                    </option>

                    <option>
                      Health Checkup
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      newAppointment.status
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Confirmed">
                      Confirmed
                    </option>

                    <option value="Scheduled">
                      Scheduled
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                    <option value="rejected">
                      Rejected
                    </option>

                  </select>

                </div>


                <div className="form-group full">

                  <label>
                    Notes
                  </label>

                  <textarea
                    placeholder="Enter appointment notes"
                    value={
                      newAppointment.notes
                    }
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        notes:
                          e.target.value,
                      })
                    }
                  />

                </div>


              </div>


              <div className="form-buttons">

                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setShowAddAppointment(false)
                  }
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="form-save-btn"
                >

                  Add Appointment

                </button>

              </div>


            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT APPOINTMENT MODAL
          ===================================================== */}

      {editAppointment && (

        <div
          className="modal-overlay"
          onClick={() =>
            setEditAppointment(null)
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
                Edit Appointment
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setEditAppointment(null)
                }
              >

                ✕

              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleEditAppointment}
            >

              <div className="form-grid">


                {/* PATIENT NAME */}

                <div className="form-group">

                  <label>
                    Patient Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter patient name"
                    value={
                      editAppointment.patientName
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        patientName:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* PATIENT PHONE */}

                <div className="form-group">

                  <label>
                    Patient Phone *
                  </label>

                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={
                      editAppointment.patientPhone
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        patientPhone:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* DOCTOR */}

                <div className="form-group">

                  <label>
                    Doctor
                  </label>

                  <select
                    value={
                      editAppointment.doctorName
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        doctorName:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Dr. Rajesh Kumar
                    </option>

                    <option>
                      Dr. Meena Sharma
                    </option>

                    <option>
                      Dr. Suresh Kumar
                    </option>

                    <option>
                      Dr. Anitha
                    </option>

                    <option>
                      Dr. Karthik
                    </option>

                    <option>
                      Dr. Priya
                    </option>

                    <option>
                      Dr. Lakshmi
                    </option>

                  </select>

                </div>


                {/* DEPARTMENT */}

                <div className="form-group">

                  <label>
                    Department
                  </label>

                  <select
                    value={
                      editAppointment.department
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        department:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Cardiology
                    </option>

                    <option>
                      Neurology
                    </option>

                    <option>
                      Orthopedics
                    </option>

                    <option>
                      Dermatology
                    </option>

                    <option>
                      General Medicine
                    </option>

                    <option>
                      Pediatrics
                    </option>

                    <option>
                      Gynecology
                    </option>

                  </select>

                </div>


                {/* DATE */}

                <div className="form-group">

                  <label>
                    Appointment Date *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter appointment date"
                    value={
                      editAppointment.date
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        date:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* TIME */}

                <div className="form-group">

                  <label>
                    Appointment Time *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter appointment time"
                    value={
                      editAppointment.time
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        time:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* TYPE */}

                <div className="form-group">

                  <label>
                    Appointment Type
                  </label>

                  <select
                    value={
                      editAppointment.type
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        type:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Consultation
                    </option>

                    <option>
                      Follow-up
                    </option>

                    <option>
                      Emergency
                    </option>

                    <option>
                      Health Checkup
                    </option>

                  </select>

                </div>


                {/* STATUS */}

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      editAppointment.status
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Confirmed">
                      Confirmed
                    </option>

                    <option value="Scheduled">
                      Scheduled
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                    <option value="rejected">
                      Rejected
                    </option>

                  </select>

                </div>


                {/* NOTES */}

                <div className="form-group full">

                  <label>
                    Notes
                  </label>

                  <textarea
                    placeholder="Enter appointment notes"
                    value={
                      editAppointment.notes
                    }
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        notes:
                          e.target.value,
                      })
                    }
                  />

                </div>


              </div>


              <div className="form-buttons">

                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setEditAppointment(null)
                  }
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="form-save-btn"
                >

                  Save Changes

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          VIEW APPOINTMENT MODAL
          ===================================================== */}

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

                ✕

              </button>

            </div>


            <div className="modal-body">

              <div className="profile-section">

                <div className="large-avatar">

                  {getAvatar(
                    selectedAppointment.patientName
                  )}

                </div>


                <h3>

                  {selectedAppointment.patientName}

                </h3>


                <p>

                  {selectedAppointment.appointmentId}

                </p>

              </div>


              <div className="details-grid">


                <div className="detail-item">

                  <span>
                    Patient Phone
                  </span>

                  <strong>
                    {selectedAppointment.patientPhone}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Doctor
                  </span>

                  <strong>
                    {selectedAppointment.doctorName}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Department
                  </span>

                  <strong>
                    {selectedAppointment.department}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Appointment Date
                  </span>

                  <strong>
                    {selectedAppointment.date}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Appointment Time
                  </span>

                  <strong>
                    {selectedAppointment.time}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Appointment Type
                  </span>

                  <strong>
                    {selectedAppointment.type}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Status
                  </span>

                  <strong>
                    {selectedAppointment.status}
                  </strong>

                </div>


                {selectedAppointment.issues && selectedAppointment.issues.length > 0 && (
                  <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                    <span>Patient Issues / Symptoms</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                      {selectedAppointment.issues.map((iss, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#dbeafe",
                            color: "#1e40af",
                            border: "1px solid #bfdbfe",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          ✓ {iss}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-item">

                  <span>
                    Notes
                  </span>

                  <strong>
                    {selectedAppointment.notes ||
                      "No notes available"}
                  </strong>

                </div>


              </div>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          DELETE CONFIRMATION
          ===================================================== */}

      {deleteAppointment && (

        <div
          className="modal-overlay"
          onClick={() =>
            setDeleteAppointment(null)
          }
        >

          <div
            className="delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="delete-icon">
              🗑
            </div>


            <h3>
              Delete Appointment?
            </h3>


            <p>

              Are you sure you want to delete{" "}

              <strong>
                {deleteAppointment.patientName}
              </strong>

              's appointment?

              This action cannot be undone.

            </p>


            <div className="delete-actions">


              <button
                className="cancel-btn"
                onClick={() =>
                  setDeleteAppointment(null)
                }
              >

                Cancel

              </button>


              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >

                Delete Appointment

              </button>


            </div>

          </div>

        </div>

      )}


      {/* ================= APPROVE & ASSIGN APPOINTMENT MODAL ================= */}
      {approveAppointmentModal && (
        <div
          className="modal-overlay"
          onClick={() => setApproveAppointmentModal(null)}
        >
          <div
            className="modal"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 style={{ color: "#15803d", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✓</span> Approve & Assign Appointment
              </h2>
              <button
                className="close-btn"
                onClick={() => setApproveAppointmentModal(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "12px 0" }}>
              {/* PATIENT INFO BANNER */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#166534",
                }}
              >
                <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>
                  Patient: {approveAppointmentModal.patientName} ({approveAppointmentModal.patientPhone || "No phone"})
                </div>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", fontSize: "12px", color: "#15803d" }}>
                  <span><strong>ID:</strong> {approveAppointmentModal.appointmentId}</span>
                  <span><strong>Schedule:</strong> {approveAppointmentModal.date} at {approveAppointmentModal.time}</span>
                  <span><strong>Department:</strong> {approveAppointmentModal.department || "General"}</span>
                </div>
                {approveAppointmentModal.issues && approveAppointmentModal.issues.length > 0 && (
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#15803d" }}>
                    <strong>Symptoms/Issues:</strong> {approveAppointmentModal.issues.join(", ")}
                  </div>
                )}
              </div>

              {/* ASSIGN DOCTOR FIELD */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  👨‍⚕️ Assigned Attending Doctor *
                </label>
                <select
                  value={approveDoctorId}
                  onChange={(e) => setApproveDoctorId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  <option value="">-- Choose Assigned Doctor --</option>
                  {doctorsList.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} &mdash; {doc.specialization || doc.department} ({doc.status || "Active"})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  Patient requested: <strong>{approveAppointmentModal.doctorName || "General Consultation"}</strong>
                </div>
              </div>

              {/* ASSIGN ROOM FIELD */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  🏥 Assign Hospital Room (Optional / Can assign later)
                </label>
                <select
                  value={approveRoomId}
                  onChange={(e) => setApproveRoomId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  <option value="">-- Pending Room Allocation (Assign Later) --</option>
                  {availableRoomsList.map((room) => (
                    <option key={room._id} value={room._id}>
                      Room {room.roomNumber} &mdash; {room.roomType} (Floor {room.floor}, Beds: {room.availableBeds}/{room.bedCount})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  {availableRoomsList.length} available rooms ready for allocation
                </div>
              </div>

              {/* ADMIN COMMENTS */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Admin Notes / Approval Remarks
                </label>
                <input
                  type="text"
                  value={approveComments}
                  onChange={(e) => setApproveComments(e.target.value)}
                  placeholder="e.g. Approved by medical administration."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
              <button
                className="action-btn"
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "9px 16px", borderRadius: "6px" }}
                onClick={() => setApproveAppointmentModal(null)}
              >
                Cancel
              </button>

              <button
                disabled={actionInProgress}
                className="action-btn"
                style={{ background: "#0284c7", color: "#ffffff", border: "none", padding: "9px 16px", borderRadius: "6px", fontWeight: "600" }}
                onClick={() => handleQuickApprove(approveAppointmentModal)}
                title="Approve immediately without changing doctor or allocating room"
              >
                Quick Approve
              </button>

              <button
                disabled={actionInProgress}
                className="action-btn"
                style={{ background: "#16a34a", color: "#ffffff", border: "none", padding: "9px 20px", borderRadius: "6px", fontWeight: "700" }}
                onClick={handleConfirmApprove}
              >
                ✓ Approve & Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REJECTION MODAL ================= */}
      {rejectAppointmentModal && (
        <div
          className="modal-overlay"
          onClick={() => setRejectAppointmentModal(null)}
        >
          <div
            className="modal"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 style={{ color: "#dc2626" }}>Reject Appointment</h2>
              <button
                className="close-btn"
                onClick={() => setRejectAppointmentModal(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "10px 0" }}>
              <p style={{ fontSize: "14px", color: "#64748b" }}>
                Reject appointment <strong>{rejectAppointmentModal.appointmentId}</strong> for patient <strong>{rejectAppointmentModal.patientName}</strong>.
              </p>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Doctor is unavailable at requested time. Please pick another slot."
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                className="action-btn"
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "6px" }}
                onClick={() => setRejectAppointmentModal(null)}
              >
                Cancel
              </button>
              <button
                disabled={actionInProgress}
                className="action-btn"
                style={{ background: "#ef4444", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "6px", fontWeight: "600" }}
                onClick={handleConfirmReject}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ASSIGN DOCTOR MODAL ================= */}
      {assignDoctorModal && (
        <div
          className="modal-overlay"
          onClick={() => setAssignDoctorModal(null)}
        >
          <div
            className="modal"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Assign Doctor</h2>
              <button
                className="close-btn"
                onClick={() => setAssignDoctorModal(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "10px 0" }}>
              <p style={{ fontSize: "14px", color: "#64748b" }}>
                Select a doctor for <strong>{assignDoctorModal.patientName}</strong> ({assignDoctorModal.department}):
              </p>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Choose Attending Doctor *
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="">-- Select Doctor --</option>
                {doctorsList.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.name} &mdash; {doc.specialization} ({doc.status})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                className="action-btn"
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "6px" }}
                onClick={() => setAssignDoctorModal(null)}
              >
                Cancel
              </button>
              <button
                disabled={actionInProgress}
                className="action-btn"
                style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "6px", fontWeight: "600" }}
                onClick={handleConfirmAssignDoctor}
              >
                Assign Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ASSIGN ROOM MODAL (ROOM ALERT ALLOCATION) ================= */}
      {assignRoomModal && (
        <div
          className="modal-overlay"
          onClick={() => setAssignRoomModal(null)}
        >
          <div
            className="modal"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Hospital Room Allocation</h2>
              <button
                className="close-btn"
                onClick={() => setAssignRoomModal(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "10px 0" }}>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", color: "#1e40af" }}>
                <strong>Patient:</strong> {assignRoomModal.patientName} &bull; <strong>Appt:</strong> {assignRoomModal.appointmentId} &bull; <strong>Doctor:</strong> {assignRoomModal.doctorName}
              </div>

              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Select Available Room *
              </label>

              {availableRoomsList.length === 0 ? (
                <div style={{ padding: "20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "13px" }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  No available rooms found currently. Please check Room Management or release occupied beds.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
                  {availableRoomsList.map((room) => (
                    <div
                      key={room._id}
                      onClick={() => setSelectedRoomId(room._id)}
                      style={{
                        padding: "10px 14px",
                        border: selectedRoomId === room._id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        borderRadius: "8px",
                        background: selectedRoomId === room._id ? "#f0fdf4" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>
                          Room {room.roomNumber} &mdash; {room.roomType}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Floor: {room.floor} | Available Beds: {room.availableBeds} / {room.bedCount}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>
                        Available
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                className="action-btn"
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "6px" }}
                onClick={() => setAssignRoomModal(null)}
              >
                Cancel
              </button>
              <button
                disabled={actionInProgress || !selectedRoomId}
                className="action-btn"
                style={{
                  background: selectedRoomId ? "#16a34a" : "#cbd5e1",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  fontWeight: "600",
                }}
                onClick={handleConfirmAssignRoom}
              >
                Confirm Room Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TOAST
          ===================================================== */}

      {toast && (

        <div className="toast">

          <span className="toast-icon">
            ✓
          </span>

          <span>
            {toast.message}
          </span>

        </div>

      )}

    </>
  );
}


export default ManageAppointments;