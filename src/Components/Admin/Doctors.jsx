import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUserDoctor,
  faCheck
  } from "@fortawesome/free-solid-svg-icons";
import doctorService from "../../Services/doctorService";

function Doctors() {
  const [search, setSearch] = useState("");
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    busy: 0,
  });

  // DELETE MODAL
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // SUCCESS MESSAGE
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [doctors, setDoctors] = useState([]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await doctorService.getDoctors();
      if (res.success && Array.isArray(res.data)) {
        setDoctors(
          res.data.map((doc) => ({
            ...doc,
            id: doc._id || doc.doctorId || doc.id,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const [newDoctor, setNewDoctor] = useState({
    name: "",
    experience: "",
    phone: "",
    email: "",
    status: "Available",
  });

  /* ================= SEARCH ================= */

  useEffect(() => {
    const total = doctors.length;

    const available = doctors.filter(
      (d) => d.status === "Available"
    ).length;

    const busy = doctors.filter(
      (d) => d.status === "Not Available" || d.status === "Busy"
    ).length;

    let startTime;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min(
        (timestamp - startTime) / 900,
        1
      );

      const eased = 1 - Math.pow(1 - progress, 3);

      setStats({
        total: Math.round(total * eased),
        available: Math.round(available * eased),
        busy: Math.round(busy * eased),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [doctors]);

  const filteredDoctors = doctors.filter((doctor) => {
    const text = search.toLowerCase();

    return (
      doctor.name?.toLowerCase().includes(text) ||
      doctor.status?.toLowerCase().includes(text)
    );
  });

  /* ================= ADD / EDIT DOCTOR ================= */

  const resetDoctorForm = () => {
    setNewDoctor({
      name: "",
      experience: "",
      phone: "",
      email: "",
      status: "Available",
    });
  };

  const openAddDoctor = () => {
    setEditingDoctor(null);
    resetDoctorForm();
    setShowAddDoctor(true);
  };

  const openEditDoctor = (doctor) => {
    setEditingDoctor(doctor);

    setNewDoctor({
      name: doctor.name.replace("Dr. ", ""),
      experience: String(
        doctor.experience
      ).replace(" Years", ""),
      phone: doctor.phone,
      email: doctor.email,
      status: doctor.status || "Available",
    });

    setShowAddDoctor(true);
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();

    if (
      !newDoctor.name ||
      !newDoctor.experience ||
      !newDoctor.phone ||
      !newDoctor.email
    ) {
      setSuccessMessage("Please fill all fields.");

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);

      return;
    }

    try {
      if (editingDoctor) {
        await doctorService.updateDoctor(editingDoctor._id || editingDoctor.id, {
          name: newDoctor.name,
          specialization: editingDoctor.specialization || "General Medicine",
          department: editingDoctor.department || "General Medicine",
          experience: `${newDoctor.experience} Years`,
          phone: newDoctor.phone,
          email: newDoctor.email,
          status: newDoctor.status || "Available",
        });

        setSuccessMessage("Doctor updated successfully!");
      } else {
        await doctorService.createDoctor({
          name: newDoctor.name,
          specialization: "General Medicine",
          department: "General Medicine",
          experience: `${newDoctor.experience} Years`,
          phone: newDoctor.phone,
          email: newDoctor.email,
          status: newDoctor.status || "Available",
        });

        setSuccessMessage("Doctor added successfully!");
      }

      await fetchDoctors();
      resetDoctorForm();
      setShowAddDoctor(false);
      setEditingDoctor(null);
    } catch (err) {
      setSuccessMessage(err.response?.data?.message || "Operation failed.");
    }

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  /* ================= OPEN DELETE MODAL ================= */

  const handleDeleteDoctor = (doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteModal(true);
  };

  /* ================= CONFIRM DELETE ================= */

  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;

    try {
      await doctorService.deleteDoctor(doctorToDelete._id || doctorToDelete.id);
      setSuccessMessage(`${doctorToDelete.name} deleted successfully!`);

      if (
        selectedDoctor?.id === doctorToDelete.id ||
        selectedDoctor?._id === doctorToDelete._id
      ) {
        setSelectedDoctor(null);
      }

      setShowDeleteModal(false);
      setDoctorToDelete(null);
      await fetchDoctors();
    } catch (err) {
      setSuccessMessage(err.response?.data?.message || "Delete failed.");
    }

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
  };

  /* ================= CANCEL DELETE ================= */

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDoctorToDelete(null);
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
        }

        /* ================= SEARCH ================= */

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
          box-shadow:
            0 0 0 3px rgba(25,118,210,0.1);
        }

        .search-box::placeholder {
          color: #94a3b8;
        }

        /* ================= STAT CARDS ================= */

        .stat-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 25px;
        }

        .stat-card {
          animation: zoomIn 0.7s ease;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-7px);
          box-shadow:
            0 15px 30px
            rgba(25,118,210,0.15) !important;
        }

        /* ================= DOCTOR TABLE ================= */

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
        }

        .add-button:hover {
          background: #1565c0 !important;
          transform: translateY(-2px);
          box-shadow:
            0 8px 20px
            rgba(25,118,210,0.25);
        }

        .view-button {
          transition: all 0.3s ease;
        }

        .view-button:hover {
          background: #1976d2 !important;
          color: white !important;
          transform: scale(1.05);
        }

        /* ================= ORANGE EDIT BUTTON ================= */

        .edit-button {
          transition: all 0.3s ease;
        }

        .edit-button:hover {
          background: #f57c00 !important;
          color: #ffffff !important;
          transform: scale(1.05);
        }

        .delete-button {
          transition: all 0.3s ease;
        }

        .delete-button:hover {
          background: #dc2626 !important;
          color: #ffffff !important;
          transform: scale(1.05);
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
        }

        .modal-box {
          animation: modalOpen 0.3s ease;
        }

        .input-field {
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #1976d2 !important;
          box-shadow:
            0 0 0 3px
            rgba(25,118,210,0.1);
        }

        .modal-button {
          transition: all 0.3s ease;
        }

        .modal-button:hover {
          transform: translateY(-2px);
        }

        /* ================= DELETE MODAL ================= */

        .delete-cancel-button {
          transition: all 0.3s ease;
        }

        .delete-cancel-button:hover {
          background: #f1f5f9 !important;
          transform: translateY(-2px);
        }

        .delete-confirm-button {
          transition: all 0.3s ease;
        }

        .delete-confirm-button:hover {
          background: #b91c1c !important;
          transform: translateY(-2px);
          box-shadow:
            0 8px 20px
            rgba(220,38,38,0.25);
        }

        /* ================= SUCCESS MESSAGE ================= */

        .success-message {
          position: fixed;
          top: 20px;
          right: 20px;
          width: min(320px, calc(100vw - 40px));
          background: #ffffff;
          color: #15803d;
          padding: 14px 20px;
          border-radius: 10px;
          box-shadow:
            0 8px 25px rgba(0,0,0,0.12);
          border-left: 4px solid #16a34a;
          z-index: 1200;
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
            opacity: 1;
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

        @media (max-width: 700px) {
          .doctor-page {
            padding: 20px;
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

          .search-box {
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
            width: 92% !important;
          }

          .success-message {
            left: 15px;
            right: 15px;
            top: 15px;
          }
        }

        `}
      </style>

      {/* ================= SUCCESS MESSAGE ================= */}

      {successMessage && (
        <div className="success-message">
          ✓ {successMessage}
        </div>
      )}

      <div className="doctor-page">

        <div className="doctor-header-card">

          <div className="doctor-topbar">

            <div className="doctor-title-wrap">

              <h1 className="doctor-title">
                Doctors
              </h1>

              <p className="doctor-subtitle">
                Manage hospital doctors and their information
              </p>

            </div>

            <div className="doctor-toolbar">

              <button
                className="add-button"
                onClick={openAddDoctor}
                style={{
                  backgroundColor: "#1976d2",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "9px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                + Add Doctor
              </button>

            </div>

          </div>

        </div>

        {/* ================= DOCTORS CONTENT ================= */}

        <section>

          {/* ================= STATISTICS ================= */}

          <div className="stat-cards">

            {/* TOTAL */}

            <div
              className="stat-card"
              style={statCardStyle}
            >

              <div style={statFlexStyle}>

                <div>

                  <p style={statLabelStyle}>
                    Total Doctors
                  </p>

                  <h2 style={statNumberStyle}>
                    {stats.total}
                  </h2>

                </div>

                <span style={{ fontSize: "28px" }}>
                  <FontAwesomeIcon icon={faUserDoctor}/>
                </span>

              </div>

            </div>

            {/* AVAILABLE */}

            <div
              className="stat-card"
              style={statCardStyle}
            >

              <div style={statFlexStyle}>

                <div>

                  <p style={statLabelStyle}>
                    Available
                  </p>

                  <h2 style={statNumberStyle}>
                    {stats.available}
                  </h2>

                </div>

                <span style={{ fontSize: "28px" }}>
                  <i class="bi bi-person-check"></i>
                </span>

              </div>

            </div>

            {/* BUSY / NOT AVAILABLE */}

            <div
              className="stat-card"
              style={statCardStyle}
            >

              <div style={statFlexStyle}>

                <div>

                  <p style={statLabelStyle}>
                    Not Available
                  </p>

                  <h2 style={statNumberStyle}>
                    {stats.busy}
                  </h2>

                </div>

                <span style={{ fontSize: "28px" }}>
                  <i class="bi bi-hourglass-split"></i>
                </span>

              </div>

            </div>

          </div>

          {/* ================= DOCTOR LIST ================= */}

          <div
            style={{
              backgroundColor: "#ffffff",
              marginTop: "25px",
              padding: "25px",
              borderRadius: "14px",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.06)",
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
                  }}
                >
                  Doctor List
                </h2>

                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    marginBottom: 0,
                  }}
                >
                  All registered doctors
                </p>

              </div>

              {/* ================= SEARCH WITH ICON ================= */}

              <div className="search-wrapper">

                <i
                  className="bi bi-search search-icon"
                ></i>

                <input
                  className="search-box"
                  type="text"
                  placeholder="Search doctor..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

              </div>

            </div>

            <table
              style={{
                width: "100%",
                minWidth: "1100px",
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

                  <th style={thStyle}>
                    Doctor
                  </th>

                  <th style={thStyle}>
                    Experience
                  </th>

                  <th style={thStyle}>
                    Contact
                  </th>

                  <th style={thStyle}>
                    Patients
                  </th>

                  <th style={thStyle}>
                    Status
                  </th>

                  <th style={thStyle}>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredDoctors.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "50px",
                        color: "#94a3b8",
                      }}
                    >
                      No doctors found.
                    </td>

                  </tr>

                ) : (

                  filteredDoctors.map((doctor) => (

                    <tr
                      className="doctor-row"
                      key={doctor.id}
                      style={{
                        borderBottom:
                          "1px solid #eeeeee",
                      }}
                    >

                      {/* DOCTOR */}

                      <td style={tdStyle}>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >

                          {/* FIRST LETTER LOGO */}

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
                            }}
                          >
                            {doctor.name
                              .replace("Dr. ", "")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <b
                              style={{
                                color: "#263238",
                              }}
                            >
                              {doctor.name}
                            </b>

                            <div
                              style={{
                                color: "#94a3b8",
                                fontSize: "11px",
                                marginTop: "4px",
                              }}
                            >
                              DOC-
                              {doctor.id
                                .toString()
                                .padStart(3, "0")}
                            </div>

                          </div>

                        </div>

                      </td>

                      {/* EXPERIENCE */}

                      <td style={tdStyle}>
                        {doctor.experience}
                      </td>

                      {/* CONTACT */}

                      <td style={tdStyle}>

                        <div>
                          {doctor.phone}
                        </div>

                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: "11px",
                            marginTop: "4px",
                          }}
                        >
                          {doctor.email}
                        </div>

                      </td>

                      {/* PATIENTS */}

                      <td style={tdStyle}>
                        <b>
                          {doctor.patients}
                        </b>
                      </td>

                      {/* STATUS */}

                      <td style={tdStyle}>

                        <span
                          style={{
                            backgroundColor:
                              doctor.status ===
                              "Available"
                                ? "#dcfce7"
                                : doctor.status ===
                                  "Busy"
                                ? "#fff3cd"
                                : "#fee2e2",

                            color:
                              doctor.status ===
                              "Available"
                                ? "#15803d"
                                : doctor.status ===
                                  "Busy"
                                ? "#856404"
                                : "#dc2626",

                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "500",
                          }}
                        >
                          {doctor.status}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td style={tdStyle}>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >

                          {/* VIEW */}

                          <button
                            className="view-button"
                            onClick={() =>
                              setSelectedDoctor(doctor)
                            }
                            style={{
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                              border: "none",
                              padding: "8px 13px",
                              borderRadius: "7px",
                              cursor: "pointer",
                              fontWeight: "500",
                            }}
                          >
                            View
                          </button>

                          {/* EDIT - ORANGE */}

                          <button
                            className="edit-button"
                            onClick={() =>
                              openEditDoctor(doctor)
                            }
                            style={{
                              backgroundColor: "#fff3e0",
                              color: "#ef6c00",
                              border: "none",
                              padding: "8px 13px",
                              borderRadius: "7px",
                              cursor: "pointer",
                              fontWeight: "500",
                            }}
                          >
                            Edit
                          </button>

                          {/* DELETE */}

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDeleteDoctor(
                                doctor
                              )
                            }
                            title="Delete Doctor"
                            style={{
                              backgroundColor: "#fee2e2",
                              color: "#dc2626",
                              border: "none",
                              padding: "8px 13px",
                              borderRadius: "7px",
                              cursor: "pointer",
                              fontWeight: "500",
                              fontSize: "18px",
                            }}
                          >
                            🗑
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ================= ADD DOCTOR MODAL ================= */}

        {showAddDoctor && (

          <div
            className="modal-background"
            style={{
              backgroundColor:
                "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            <div
              className="modal-box"
              style={{
                width: "460px",
                maxWidth: "92%",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "20px 22px",
                boxShadow: "0 15px 40px rgba(0,0,0,0.18)",
              }}
            >

              {/* HEADER */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >

                <div>

                  <h2
                    style={{
                      margin: 0,
                      color: "#263238",
                      fontSize: "17px",
                      fontWeight: "700",
                    }}
                  >
                    {editingDoctor
                      ? "Edit Doctor"
                      : "Add New Doctor"}
                  </h2>

                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "12px",
                      margin: "2px 0 0",
                    }}
                  >
                    Enter doctor information
                  </p>

                </div>

                <button
                  onClick={() => {
                    setShowAddDoctor(false);
                    setEditingDoctor(null);
                    resetDoctorForm();
                  }}
                  style={{
                    width: "28px",
                    height: "28px",
                    border: "none",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    cursor: "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                  }}
                >
                  ×
                </button>

              </div>

              {/* FORM */}

              <form onSubmit={handleAddDoctor}>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px 14px",
                  }}
                >

                  <div>
                    <label style={{ display: "block", color: "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                      Doctor Name *
                    </label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="Doctor name"
                      value={newDoctor.name}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          name: e.target.value,
                        })
                      }
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #dbe1e8", borderRadius: "6px", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box", height: "36px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", color: "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                      Experience (Years) *
                    </label>
                    <input
                      className="input-field"
                      type="number"
                      min="0"
                      placeholder="Years of experience"
                      value={newDoctor.experience}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          experience: e.target.value,
                        })
                      }
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #dbe1e8", borderRadius: "6px", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box", height: "36px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", color: "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                      Phone Number *
                    </label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="Phone number"
                      value={newDoctor.phone}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          phone: e.target.value,
                        })
                      }
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #dbe1e8", borderRadius: "6px", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box", height: "36px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", color: "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                      Email *
                    </label>
                    <input
                      className="input-field"
                      type="email"
                      placeholder="Email address"
                      value={newDoctor.email}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          email: e.target.value,
                        })
                      }
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #dbe1e8", borderRadius: "6px", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box", height: "36px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", color: "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                      Availability Status *
                    </label>
                    <select
                      className="input-field"
                      value={newDoctor.status || "Available"}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          status: e.target.value,
                        })
                      }
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #dbe1e8", borderRadius: "6px", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box", height: "36px" }}
                    >
                      <option value="Available">Available</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>

                </div>

                {/* BUTTONS */}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "16px",
                  }}
                >

                  <button
                    type="button"
                    className="modal-button"
                    onClick={() => {
                      setShowAddDoctor(false);
                      setEditingDoctor(null);
                      resetDoctorForm();
                    }}
                    style={{
                      flex: 1,
                      padding: "9px 14px",
                      border: "1px solid #ddd",
                      backgroundColor: "#ffffff",
                      color: "#64748b",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="modal-button"
                    style={{
                      flex: 1,
                      padding: "9px 14px",
                      border: "none",
                      backgroundColor: "#1976d2",
                      color: "#ffffff",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                  >
                    {editingDoctor
                      ? "Save Changes"
                      : "Add Doctor"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* ================= VIEW DOCTOR MODAL ================= */}

        {selectedDoctor && (

          <div
            className="modal-background"
            style={{
              backgroundColor:
                "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            <div
              className="modal-box"
              style={{
                width: "450px",
                maxWidth: "100%",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "30px",
                boxShadow:
                  "0 20px 50px rgba(0,0,0,0.2)",
              }}
            >

              <div style={{ textAlign: "center" }}>

                {/* FIRST LETTER LOGO */}

                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor:
                      "#e3f2fd",
                    color: "#1976d2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "34px",
                    fontWeight: "700",
                    margin:
                      "0 auto 15px",
                  }}
                >
                  {selectedDoctor.name
                    .replace("Dr. ", "")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <h2
                  style={{
                    margin: "0 0 20px",
                    color: "#263238",
                  }}
                >
                  {selectedDoctor.name}
                </h2>

              </div>

              {/* DETAILS */}

              <div
                style={{
                  backgroundColor:
                    "#f8fbff",
                  borderRadius: "10px",
                  padding: "18px",
                }}
              >

                <DetailRow
                  title="Doctor ID"
                  value={
                    "DOC-" +
                    selectedDoctor.id
                      .toString()
                      .padStart(3, "0")
                  }
                />

                <DetailRow
                  title="Experience"
                  value={
                    selectedDoctor.experience
                  }
                />

                <DetailRow
                  title="Phone"
                  value={
                    selectedDoctor.phone
                  }
                />

                <DetailRow
                  title="Email"
                  value={
                    selectedDoctor.email
                  }
                />

                <DetailRow
                  title="Patients"
                  value={
                    selectedDoctor.patients
                  }
                />

                <DetailRow
                  title="Status"
                  value={
                    selectedDoctor.status
                  }
                  last
                />

              </div>

              <button
                onClick={() =>
                  setSelectedDoctor(null)
                }
                style={{
                  width: "100%",
                  marginTop: "20px",
                  padding: "12px",
                  border: "none",
                  backgroundColor:
                    "#1976d2",
                  color: "#ffffff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Close
              </button>

            </div>

          </div>

        )}

        {/* ================= DELETE CONFIRMATION MODAL ================= */}

        {showDeleteModal &&
          doctorToDelete && (

          <div
            className="modal-background"
            style={{
              backgroundColor:
                "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            <div
              className="modal-box"
              style={{
                width: "430px",
                maxWidth: "100%",
                backgroundColor:
                  "#ffffff",
                borderRadius: "16px",
                padding: "30px",
                boxShadow:
                  "0 20px 50px rgba(0,0,0,0.25)",
                textAlign: "center",
              }}
            >

              {/* DELETE ICON */}

              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  backgroundColor:
                    "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin:
                    "0 auto 18px",
                  fontSize: "30px",
                }}
              >
                🗑
              </div>

              {/* TITLE */}

              <h2
                style={{
                  margin: "0 0 10px",
                  color: "#263238",
                  fontSize: "22px",
                }}
              >
                Delete Doctor?
              </h2>

              {/* MESSAGE */}

              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  margin:
                    "0 auto 8px",
                }}
              >
                Are you sure you want to delete
              </p>

              <p
                style={{
                  color: "#263238",
                  fontSize: "16px",
                  fontWeight: "700",
                  margin:
                    "0 0 10px",
                }}
              >
                {doctorToDelete.name}
              </p>

              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  margin:
                    "0 0 25px",
                }}
              >
                This action cannot be undone.
              </p>

              {/* BUTTONS */}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                }}
              >

                <button
                  className="delete-cancel-button"
                  onClick={cancelDelete}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border:
                      "1px solid #dbe1e8",
                    backgroundColor:
                      "#ffffff",
                    color: "#64748b",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>

                <button
                  className="delete-confirm-button"
                  onClick={
                    confirmDeleteDoctor
                  }
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    backgroundColor:
                      "#dc2626",
                    color: "#ffffff",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Delete Doctor
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
        borderBottom: last
          ? "none"
          : "1px solid #e5e7eb",
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

/* ================= TABLE STYLES ================= */

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

/* ================= FORM STYLES ================= */

const labelStyle = {
  display: "block",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "7px",
  marginTop: "15px",
};

const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid #dbe1e8",
  borderRadius: "8px",
  fontSize: "14px",
  backgroundColor: "#ffffff",
};

/* ================= STAT CARD STYLES ================= */

const statCardStyle = {
  backgroundColor: "#ffffff",
  padding: "22px",
  borderRadius: "14px",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.06)",
};

const statFlexStyle = {
  display: "flex",
  justifyContent: "space-between",
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
};

/* ================= EXPORT ================= */

export default Doctors;