import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
 faCheck
  } from "@fortawesome/free-solid-svg-icons";
import patientService from "../../Services/patientService";

/* =========================================================
   COUNTER COMPONENT
   Animation runs ONLY ONCE when the component is first loaded.
   ========================================================= */

function Counter({ value }) {
  const [count, setCount] = useState(0);

  const valueRef = useRef(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    valueRef.current = value;

    if (hasAnimated.current) {
      setCount(value);
      return;
    }

    hasAnimated.current = true;

    let current = 0;
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;

    const timer = setInterval(() => {
      current += increment;

      if (current >= valueRef.current) {
        setCount(valueRef.current);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hasAnimated.current) {
      setCount(value);
    }
  }, [value]);

  return <span>{count}</span>;
}


/* =========================================================
   PATIENTS COMPONENT
   ========================================================= */

function Patients() {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("All");

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [deletePatient, setDeletePatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [editPatient, setEditPatient] = useState(null);

  const [toast, setToast] = useState(null);


  /* =========================================================
     NEW PATIENT FORM
     ========================================================= */

  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    department: "Cardiology",
    doctor: "Dr. Rajesh Kumar",
    bloodGroup: "B+",
    city: "",
    status: "Active",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    department: "Cardiology",
    doctor: "Dr. Rajesh Kumar",
    bloodGroup: "B+",
    city: "",
    status: "Active",
  });


  /* =========================================================
     PATIENT DATA
     ========================================================= */

  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientService.getPatients();
      if (res.success && Array.isArray(res.data)) {
        setPatients(
          res.data.map((p) => ({
            ...p,
            id: p._id || p.patientId || p.id,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);


  /* =========================================================
     STATISTICS
     ========================================================= */

  const totalPatients = patients.length;

  const activePatients = patients.filter(
    (patient) => patient.status === "Active"
  ).length;

  const malePatients = patients.filter(
    (patient) => patient.gender === "Male"
  ).length;

  const femalePatients = patients.filter(
    (patient) => patient.gender === "Female"
  ).length;


  /* =========================================================
     SEARCH + FILTER
     ========================================================= */

  const filteredPatients = patients.filter((patient) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      patient.name.toLowerCase().includes(searchText) ||
      patient.patientId.toLowerCase().includes(searchText) ||
      patient.phone.includes(searchText) ||
      patient.department.toLowerCase().includes(searchText);

    const matchesGender =
      gender === "All" || patient.gender === gender;

    return matchesSearch && matchesGender;
  });


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
     ADD PATIENT
     ========================================================= */

  const handleAddPatient = async (e) => {
    e.preventDefault();

    if (
      !newPatient.name ||
      !newPatient.age ||
      !newPatient.phone ||
      !newPatient.email ||
      !newPatient.city
    ) {
      showToast("Please fill all required fields!");
      return;
    }

    try {
      await patientService.createPatient({
        name: newPatient.name,
        age: Number(newPatient.age),
        gender: newPatient.gender,
        phone: newPatient.phone,
        email: newPatient.email,
        department: newPatient.department,
        doctor: newPatient.doctor,
        bloodGroup: newPatient.bloodGroup,
        city: newPatient.city,
        status: newPatient.status,
      });

      setShowAddPatient(false);
      setNewPatient({
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        email: "",
        department: "Cardiology",
        doctor: "Dr. Rajesh Kumar",
        bloodGroup: "B+",
        city: "",
        status: "Active",
      });

      await fetchPatients();
      showToast("Patient added successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add patient!");
    }
  };


  /* =========================================================
     DELETE PATIENT
     ========================================================= */

  const confirmDelete = async () => {
    if (!deletePatient) return;

    try {
      await patientService.deletePatient(deletePatient._id || deletePatient.id);
      setDeletePatient(null);
      await fetchPatients();
      showToast("Patient deleted successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete patient!");
    }
  };


  /* =========================================================
     EDIT PATIENT
     ========================================================= */

  const openEditModal = (patient) => {
    setEditForm({
      name: patient.name,
      age: String(patient.age),
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      department: patient.department,
      doctor: patient.doctor,
      bloodGroup: patient.bloodGroup,
      city: patient.city,
      status: patient.status,
    });
    setEditPatient(patient);
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();

    if (
      !editForm.name ||
      !editForm.age ||
      !editForm.phone ||
      !editForm.email ||
      !editForm.city
    ) {
      showToast("Please fill all required fields!");
      return;
    }

    try {
      await patientService.updatePatient(editPatient._id || editPatient.id, {
        name: editForm.name,
        age: Number(editForm.age),
        gender: editForm.gender,
        phone: editForm.phone,
        email: editForm.email,
        department: editForm.department,
        doctor: editForm.doctor,
        bloodGroup: editForm.bloodGroup,
        city: editForm.city,
        status: editForm.status,
      });

      setEditPatient(null);
      setEditForm({
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        email: "",
        department: "Cardiology",
        doctor: "Dr. Rajesh Kumar",
        bloodGroup: "B+",
        city: "",
        status: "Active",
      });

      await fetchPatients();
      showToast("Patient updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update patient!");
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

        .patients-page {
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

        .patients-header {
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

        .add-patient-btn {
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


        .add-patient-btn:hover {
          background: #1565c0;

          transform:
            translateY(-2px)
            scale(0.96);

          box-shadow:
            0 8px 20px
            rgba(25, 118, 210, 0.24);
        }


        .add-patient-btn:active {
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
            repeat(4, 1fr);

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
            transform: translateY(25px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
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

        .patients-card {
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


        .patients-card:hover {
          transform: scale(0.995);

          box-shadow:
            0 15px 35px
            rgba(50, 90, 110, 0.10);
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


        /* ================= TOOLBAR ================= */

        .patients-toolbar {
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


        /* ================= BOOTSTRAP SEARCH ICON ================= */

        .search-box .search-icon {
          position: absolute;

          left: 14px;
          top: 50%;

          transform:
            translateY(-50%);

          font-size: 16px;

          color: #90a4ae;

          pointer-events: none;

          z-index: 2;

          transition:
            color 0.3s ease;
        }


        .search-box:focus-within .search-icon {
          color: #1976d2;
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

          min-width: 1050px;
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
            transform: translateX(-10px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
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


        .patient-id {
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


        .status.active {
          background: #e8f5e9;
          color: #2e7d32;
        }


        .status.inactive {
          background: #f5f5f5;
          color: #757575;
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


        .edit-btn {
          background: #fff3e0;

          color: #ef6c00;
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


        /* ================= ADD FORM ================= */

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
        .form-group select {
          width: 100%;

          height: 42px;

          border:
            1px solid #dce6ec;

          border-radius: 9px;

          padding:
            0 12px;

          outline: none;

          font-size: 13px;

          color: #37474f;

          background: #fbfdff;

          transition:
            0.25s ease;
        }


        .form-group input:focus,
        .form-group select:focus {
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

          .patients-page {
            padding-left: 220px;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }


        @media (max-width: 900px) {

          .patients-page {
            margin-left: 0;
            width: 100%;
            padding: 20px 18px 18px;
          }
        }


        @media (max-width: 700px) {

          .patients-page {
            padding:
              70px 18px 18px 18px;
          }

          .patients-header {
            flex-direction: column;

            align-items: stretch;

            gap: 15px;

            padding: 20px;
          }

          .add-patient-btn {
            width: 100%;

            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .patients-toolbar {
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

      <div className="patients-page">

        {/* ================= HEADER ================= */}

        <div className="patients-header">

          <div className="header-title">

            <h1>
              Patients
            </h1>

            <p>
              Manage and monitor all registered patients
            </p>

          </div>


          <button
            className="add-patient-btn"
            onClick={() =>
              setShowAddPatient(true)
            }
          >
            <span className="add-icon">
              +
            </span>

            Add Patient
          </button>

        </div>


        {/* =================================================
            STAT CARDS
            ================================================= */}

        <div className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon blue-icon">
              <i class="bi bi-person-check"></i>
            </div>

            <div className="stat-info">

              <p>
                Total Patients
              </p>

              <h2>
                <Counter
                  value={totalPatients}
                />
              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon green-icon">
              <FontAwesomeIcon icon={faCheck}/>
            </div>

            <div className="stat-info">

              <p>
                Active Patients
              </p>

              <h2>
                <Counter
                  value={activePatients}
                />
              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon purple-icon">
              <i class="bi bi-gender-male"></i>
            </div>

            <div className="stat-info">

              <p>
                Male Patients
              </p>

              <h2>
                <Counter
                  value={malePatients}
                />
              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon orange-icon">
              <i class="bi bi-gender-female"></i>
            </div>

            <div className="stat-info">

              <p>
                Female Patients
              </p>

              <h2>
                <Counter
                  value={femalePatients}
                />
              </h2>

            </div>

          </div>

        </div>


        {/* ================= PATIENT TABLE ================= */}

        <div className="patients-card">

          <div className="patients-toolbar">

            {/* ================= SEARCH ================= */}

            <div className="search-box">

              <i className="bi bi-search search-icon"></i>

              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>


            {/* ================= FILTER ================= */}

            <div className="filter-area">

              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value)
                }
              >

                <option value="All">
                  All Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

              </select>

            </div>

          </div>


          <div className="table-container">

            {filteredPatients.length === 0 ? (

              <div className="empty-state">

                <div>
                  🔍
                </div>

                <strong>
                  No patients found
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
                      Age / Gender
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Doctor
                    </th>

                    <th>
                      Blood Group
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

                  {filteredPatients.map(
                    (patient) => (

                      <tr key={patient.id}>

                        <td>

                          <div className="patient-info">

                            <div className="patient-avatar">

                              {getAvatar(
                                patient.name
                              )}

                            </div>


                            <div>

                              <div className="patient-name">
                                {patient.name}
                              </div>

                              <div className="patient-id">
                                {patient.patientId}
                              </div>

                            </div>

                          </div>

                        </td>


                        <td>

                          {patient.age} yrs

                          <br />

                          <span
                            style={{
                              color: "#90a4ae",
                              fontSize: "11px",
                            }}
                          >
                            {patient.gender}
                          </span>

                        </td>


                        <td>

                          {patient.phone}

                          <br />

                          <span
                            style={{
                              color: "#90a4ae",
                              fontSize: "11px",
                            }}
                          >
                            {patient.email}
                          </span>

                        </td>


                        <td>

                          <span className="department">

                            {patient.department}

                          </span>

                        </td>


                        <td>
                          {patient.doctor}
                        </td>


                        <td>

                          <strong>
                            {patient.bloodGroup}
                          </strong>

                        </td>


                        <td>

                          <span
                            className={
                              `status ${
                                patient.status.toLowerCase()
                              }`
                            }
                          >
                            {patient.status}
                          </span>

                        </td>


                        <td>

                          <div className="actions">

                            <button
                              className="action-btn view-btn"
                              onClick={() =>
                                setSelectedPatient(
                                  patient
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              className="action-btn edit-btn"
                              onClick={() =>
                                openEditModal(patient)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="action-btn delete-btn"
                              onClick={() =>
                                setDeletePatient(
                                  patient
                                )
                              }
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
          ADD PATIENT MODAL
          ===================================================== */}

      {showAddPatient && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddPatient(false)
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
                Add New Patient
              </h2>


              <button
                className="close-btn"
                onClick={() =>
                  setShowAddPatient(false)
                }
              >
                ✕
              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleAddPatient}
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Patient Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter patient name"
                    value={newPatient.name}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        name: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Age *
                  </label>

                  <input
                    type="number"
                    placeholder="Enter age"
                    value={newPatient.age}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        age: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Gender
                  </label>

                  <select
                    value={newPatient.gender}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        gender: e.target.value,
                      })
                    }
                  >

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Phone *
                  </label>

                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        phone: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Email *
                  </label>

                  <input
                    type="email"
                    placeholder="Enter email"
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        email: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    City *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter city"
                    value={newPatient.city}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        city: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Department
                  </label>

                  <select
                    value={
                      newPatient.department
                    }
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
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
                    Doctor
                  </label>

                  <select
                    value={newPatient.doctor}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        doctor:
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
                    Blood Group
                  </label>

                  <select
                    value={
                      newPatient.bloodGroup
                    }
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        bloodGroup:
                          e.target.value,
                      })
                    }
                  >

                    <option>B+</option>
                    <option>B-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={newPatient.status}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Active
                    </option>

                    <option>
                      Inactive
                    </option>

                  </select>

                </div>

              </div>


              <div className="form-buttons">

                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setShowAddPatient(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="form-save-btn"
                >
                  Add Patient
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT PATIENT MODAL
          ===================================================== */}

      {editPatient && (

        <div
          className="modal-overlay"
          onClick={() => setEditPatient(null)}
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Edit Patient
              </h2>


              <button
                className="close-btn"
                onClick={() => setEditPatient(null)}
              >
                ✕
              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleEditPatient}
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Patient Name *
                  </label>

                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        name: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Age *
                  </label>

                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        age: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Gender
                  </label>

                  <select
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        gender: e.target.value,
                      })
                    }
                  >

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Phone *
                  </label>

                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        phone: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Email *
                  </label>

                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        email: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    City *
                  </label>

                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        city: e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Department
                  </label>

                  <select
                    value={editForm.department}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        department: e.target.value,
                      })
                    }
                  >

                    <option>Cardiology</option>
                    <option>Neurology</option>
                    <option>Orthopedics</option>
                    <option>Dermatology</option>
                    <option>General Medicine</option>
                    <option>Pediatrics</option>
                    <option>Gynecology</option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Doctor
                  </label>

                  <select
                    value={editForm.doctor}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        doctor: e.target.value,
                      })
                    }
                  >

                    <option>Dr. Rajesh Kumar</option>
                    <option>Dr. Meena Sharma</option>
                    <option>Dr. Suresh Kumar</option>
                    <option>Dr. Anitha</option>
                    <option>Dr. Karthik</option>
                    <option>Dr. Priya</option>
                    <option>Dr. Lakshmi</option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Blood Group
                  </label>

                  <select
                    value={editForm.bloodGroup}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        bloodGroup: e.target.value,
                      })
                    }
                  >

                    <option>B+</option>
                    <option>B-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value,
                      })
                    }
                  >

                    <option>Active</option>
                    <option>Inactive</option>

                  </select>

                </div>

              </div>


              <div className="form-buttons">

                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() => setEditPatient(null)}
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
          VIEW PATIENT MODAL
          ===================================================== */}

      {selectedPatient && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedPatient(null)
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
                Patient Details
              </h2>


              <button
                className="close-btn"
                onClick={() =>
                  setSelectedPatient(null)
                }
              >
                ✕
              </button>

            </div>


            <div className="modal-body">

              <div className="profile-section">

                <div className="large-avatar">

                  {getAvatar(
                    selectedPatient.name
                  )}

                </div>


                <h3>
                  {selectedPatient.name}
                </h3>


                <p>
                  {selectedPatient.patientId}
                </p>

              </div>


              <div className="details-grid">

                <div className="detail-item">
                  <span>Age</span>
                  <strong>
                    {selectedPatient.age} Years
                  </strong>
                </div>


                <div className="detail-item">
                  <span>Gender</span>
                  <strong>
                    {selectedPatient.gender}
                  </strong>
                </div>


                <div className="detail-item">
                  <span>Phone</span>
                  <strong>
                    {selectedPatient.phone}
                  </strong>
                </div>


                <div className="detail-item">
                  <span>Email</span>
                  <strong>
                    {selectedPatient.email}
                  </strong>
                </div>


                <div className="detail-item">
                  <span>Department</span>
                  <strong>
                    {selectedPatient.department}
                  </strong>
                </div>


                <div className="detail-item">
                  <span>Doctor</span>
                  <strong>
                    {selectedPatient.doctor}
                  </strong>
                </div>


                <div className="detail-item">
                  <span>Blood Group</span>
                  <strong>
                    {selectedPatient.bloodGroup}
                  </strong>
                </div>


                <div className="detail-item">
                  <span>City</span>
                  <strong>
                    {selectedPatient.city}
                  </strong>
                </div>


                <div className="detail-item">
                  <span>Registration Date</span>
                  <strong>
                    {selectedPatient.date}
                  </strong>
                </div>


                <div className="detail-item">
                  <span>Status</span>
                  <strong>
                    {selectedPatient.status}
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

      {deletePatient && (

        <div
          className="modal-overlay"
          onClick={() =>
            setDeletePatient(null)
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
              Delete Patient?
            </h3>


            <p>

              Are you sure you want to delete{" "}

              <strong>
                {deletePatient.name}
              </strong>

              ?

              This action cannot be undone.

            </p>


            <div className="delete-actions">

              <button
                className="cancel-btn"
                onClick={() =>
                  setDeletePatient(null)
                }
              >
                Cancel
              </button>


              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Delete Patient
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


export default Patients;