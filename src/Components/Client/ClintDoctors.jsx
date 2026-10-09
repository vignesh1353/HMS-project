import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserDoctor,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import doctorService from "../../Services/doctorService";

function ClintDoctors() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getDoctors();
        if (res && res.data) {
          setDoctors(res.data.map((d) => ({
            ...d,
            id: d._id || d.id || d.doctorId,
            experience: d.experience || "5+ Years",
            qualification: d.qualification || "MBBS, MD",
            availability: d.availability || "Mon - Fri",
            timing: d.timing || "10:00 AM - 2:00 PM",
            status: d.status || "Available",
          })));
        }
      } catch (err) {
        console.error("Error fetching doctors for client:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesDepartment =
      department === "All" ||
      doctor.department === department;

    return matchesSearch && matchesDepartment;
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

          @keyframes searchStart {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes doctorStart {
            0% {
              opacity: 0;
              transform: translateY(12px) scale(0.98);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          /* ================= MAIN CONTENT ================= */

          .main-content {
            margin-left: 240px;
            margin-top: 70px;
            min-height: 100vh;
            padding: 30px;

            animation: pageStart 0.35s ease-out;
          }

          /* ================= DOCTORS HEADER ================= */

          .doctors-header {
            display: flex;
            align-items: center;
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

          .doctors-header:hover {
            background: #e3f2fd;

            box-shadow:
              0 6px 18px rgba(25, 118, 210, 0.12);
          }

          .doctors-header h1 {
            margin: 0;
            font-size: 28px;
            color: #1976d2;
            font-weight: 700;
          }

          .doctors-header p {
            margin: 7px 0 0;
            color: #607d8b;
            font-size: 14px;
          }

          /* ================= SEARCH AREA ================= */

          .search-area {
            width: 100%;
            background: #ffffff;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 25px;
            border: 1px solid #e1e8f0;

            display: flex;
            align-items: center;
            justify-content: space-between;

            animation: searchStart 0.3s ease-out 0.05s both;
          }

          /* ================= SEARCH BOX ================= */

          .search-box {
            width: 300px;
            position: relative;
          }

          .search-icon {
            position: absolute;
            left: 13px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
            font-size: 15px;
            pointer-events: none;
            z-index: 2;
            transition: color 0.2s ease;
          }

          .search-box:focus-within .search-icon {
            color: #1976d2;
          }

          .search-box input {
            width: 100%;
            height: 40px;

            border: 1px solid #d5dde7;
            border-radius: 8px;

            padding: 0 12px 0 38px;

            font-size: 13px;

            outline: none;

            color: #334155;

            background: #ffffff;

            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .search-box input:focus {
            border-color: #1976d2;

            box-shadow:
              0 0 0 3px #e3f2fd;
          }

          /* ================= DEPARTMENT ================= */

          .department-select {
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

          .department-select:focus {
            border-color: #1976d2;
          }

          /* ================= DOCTOR GRID ================= */

          .doctors-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }

          /* ================= DOCTOR CARD ================= */

          .doctor-card {
            background: #ffffff;

            border: 1px solid #e1e8f0;

            border-radius: 14px;

            padding: 22px;

            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease,
              border-color 0.25s ease;

            animation:
              doctorStart 0.3s ease-out both;
          }

          /* Fast staggered animation */

          .doctor-card:nth-child(1) {
            animation-delay: 0.08s;
          }

          .doctor-card:nth-child(2) {
            animation-delay: 0.12s;
          }

          .doctor-card:nth-child(3) {
            animation-delay: 0.16s;
          }

          .doctor-card:nth-child(4) {
            animation-delay: 0.20s;
          }

          .doctor-card:nth-child(5) {
            animation-delay: 0.24s;
          }

          .doctor-card:nth-child(6) {
            animation-delay: 0.28s;
          }

          .doctor-card:hover {
            transform: translateY(-3px);

            box-shadow:
              0 8px 22px rgba(25, 118, 210, 0.10);

            border-color: #bbdefb;
          }

          .doctor-top {
            display: flex;
            align-items: center;

            gap: 15px;

            margin-bottom: 18px;
          }

          .doctor-avatar {
            width: 60px;
            height: 60px;

            border-radius: 50%;

            background: #e3f2fd;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 30px;

            flex-shrink: 0;

            color: #1976d2;
          }

          .doctor-name {
            margin: 0;

            font-size: 17px;

            color: #1e293b;
          }

          .doctor-department {
            margin: 5px 0 0;

            font-size: 13px;

            color: #1976d2;

            font-weight: 600;
          }

          .doctor-info {
            border-top: 1px solid #eef2f6;

            padding-top: 15px;
          }

          .info-row {
            display: flex;

            justify-content: space-between;

            gap: 10px;

            margin-bottom: 10px;

            font-size: 13px;
          }

          .info-label {
            color: #64748b;
          }

          .info-value {
            color: #334155;

            font-weight: 600;

            text-align: right;
          }

          /* ================= VIEW BUTTON ================= */

          .view-btn {
            width: 100%;

            margin-top: 8px;

            height: 40px;

            border: none;

            border-radius: 8px;

            background: #1976d2;

            color: white;

            font-size: 14px;

            font-weight: 600;

            cursor: pointer;

            transition:
              background 0.2s ease,
              transform 0.1s ease;
          }

          .view-btn:hover {
            background: #1565c0;
          }

          .view-btn:active {
            transform: scale(0.96);
          }

          /* ================= NO DOCTORS ================= */

          .no-doctors {
            grid-column: 1 / -1;

            background: white;

            border: 1px solid #e1e8f0;

            border-radius: 12px;

            padding: 50px 20px;

            text-align: center;

            animation:
              doctorStart 0.25s ease-out;
          }

          .no-doctors-icon {
            font-size: 42px;

            margin-bottom: 10px;
          }

          .no-doctors h3 {
            margin: 0 0 6px;

            color: #334155;
          }

          .no-doctors p {
            margin: 0;

            color: #64748b;

            font-size: 14px;
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
          }

          .doctor-modal {
            width: 100%;

            max-width: 500px;

            background: white;

            border-radius: 16px;

            padding: 28px;

            position: relative;

            box-shadow:
              0 15px 40px rgba(0, 0, 0, 0.15);

            animation:
              doctorStart 0.25s ease-out;
          }

          .close-btn {
            position: absolute;

            right: 18px;

            top: 15px;

            width: 34px;

            height: 34px;

            border: none;

            border-radius: 50%;

            background: #f1f5f9;

            color: #475569;

            font-size: 20px;

            cursor: pointer;
          }

          .close-btn:hover {
            background: #e3f2fd;

            color: #1976d2;
          }

          .modal-header {
            display: flex;

            align-items: center;

            gap: 16px;

            margin-bottom: 25px;

            padding-right: 35px;
          }

          .modal-avatar {
            width: 70px;

            height: 70px;

            border-radius: 50%;

            background: #e3f2fd;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 35px;

            color: #1976d2;
          }

          .modal-header h2 {
            margin: 0;

            font-size: 21px;

            color: #1e293b;
          }

          .modal-header p {
            margin: 5px 0 0;

            color: #1976d2;

            font-size: 14px;

            font-weight: 600;
          }

          .modal-details {
            background: #f8fbff;

            border-radius: 10px;

            padding: 16px;
          }

          .modal-row {
            display: flex;

            justify-content: space-between;

            padding: 11px 0;

            border-bottom: 1px solid #e4edf5;

            font-size: 14px;
          }

          .modal-row:last-child {
            border-bottom: none;
          }

          .modal-row span:first-child {
            color: #64748b;
          }

          .modal-row span:last-child {
            color: #334155;

            font-weight: 600;

            text-align: right;
          }

          /* ================= RESPONSIVE ================= */

          @media (max-width: 1100px) {

            .doctors-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 800px) {

            .main-content {
              margin-left: 0;

              margin-top: 70px;

              padding: 20px;
            }

            .search-area {
              flex-direction: column;

              align-items: stretch;

              gap: 12px;
            }

            .search-box {
              width: 100%;
            }

            .department-select {
              width: 100%;
            }
          }

          @media (max-width: 600px) {

            .doctors-grid {
              grid-template-columns: 1fr;
            }

            .doctors-header {
              padding: 20px;
            }

            .doctors-header h1 {
              font-size: 24px;
            }

            .main-content {
              padding: 15px;
            }

            .doctor-card {
              padding: 18px;
            }
          }

          /* ================= REDUCE MOTION ================= */

          @media (prefers-reduced-motion: reduce) {

            .main-content,
            .doctors-header,
            .search-area,
            .doctor-card,
            .no-doctors,
            .doctor-modal {
              animation: none;
            }
          }
        `}
      </style>

      {/* ================= MAIN CONTENT ================= */}

      <div className="main-content">

        {/* ================= DOCTORS HEADER ================= */}

        <div className="doctors-header">

          <div>

            <h1>
              Doctors
            </h1>

            <p>
              Find and view doctors available at the hospital
            </p>

          </div>

        </div>

        {/* ================= SEARCH ================= */}

        <div className="search-area">

          <div className="search-box">

            <FontAwesomeIcon
              icon={faSearch}
              className="search-icon"
            />

            <input
              type="text"
              placeholder="Search doctor name..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <select
            className="department-select"
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
          >

            <option value="All">
              All Departments
            </option>

            <option value="Cardiology">
              Cardiology
            </option>

            <option value="General Physician">
              General Physician
            </option>

            <option value="Orthopedics">
              Orthopedics
            </option>

            <option value="Dermatology">
              Dermatology
            </option>

            <option value="Neurology">
              Neurology
            </option>

            <option value="Pediatrics">
              Pediatrics
            </option>

          </select>

        </div>

        {/* ================= DOCTORS ================= */}

        <div className="doctors-grid">

          {filteredDoctors.length > 0 ? (

            filteredDoctors.map((doctor) => (

              <div
                className="doctor-card"
                key={doctor.id}
              >

                <div
                  className="doctor-top"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >

                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>

                    <div className="doctor-avatar">

                      <FontAwesomeIcon
                        icon={faUserDoctor}
                      />

                    </div>

                    <div>

                      <h3 className="doctor-name">
                        {doctor.name}
                      </h3>

                    </div>

                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      backgroundColor:
                        doctor.status === "Available"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        doctor.status === "Available"
                          ? "#15803d"
                          : "#dc2626",
                    }}
                  >
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        backgroundColor:
                          doctor.status === "Available"
                            ? "#16a34a"
                            : "#dc2626",
                      }}
                    />
                    {doctor.status || "Available"}
                  </span>

                </div>

                <div className="doctor-info">

                  <div className="info-row">

                    <span className="info-label">
                      Status
                    </span>

                    <span
                      className="info-value"
                      style={{
                        color:
                          doctor.status === "Available"
                            ? "#15803d"
                            : "#dc2626",
                        fontWeight: "700",
                      }}
                    >
                      ● {doctor.status || "Available"}
                    </span>

                  </div>

                  <div className="info-row">

                    <span className="info-label">
                      Experience
                    </span>

                    <span className="info-value">
                      {doctor.experience}
                    </span>

                  </div>

                  <div className="info-row">

                    <span className="info-label">
                      Qualification
                    </span>

                    <span className="info-value">
                      {doctor.qualification}
                    </span>

                  </div>

                  <div className="info-row">

                    <span className="info-label">
                      Available Days
                    </span>

                    <span className="info-value">
                      {doctor.availability}
                    </span>

                  </div>

                  <div className="info-row">

                    <span className="info-label">
                      Timing
                    </span>

                    <span className="info-value">
                      {doctor.timing}
                    </span>

                  </div>

                  <button
                    className="view-btn"
                    onClick={() =>
                      setSelectedDoctor(doctor)
                    }
                  >
                    View Profile
                  </button>

                </div>

              </div>

            ))

          ) : (

            <div className="no-doctors">

              <div className="no-doctors-icon">
                🔍
              </div>

              <h3>
                No Doctors Found
              </h3>

              <p>
                No doctor matches your search.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* ================= DOCTOR MODAL ================= */}

      {selectedDoctor && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedDoctor(null)
          }
        >

          <div
            className="doctor-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="close-btn"
              onClick={() =>
                setSelectedDoctor(null)
              }
            >
              ×
            </button>

            <div className="modal-header">

              <div className="modal-avatar">

                <FontAwesomeIcon
                  icon={faUserDoctor}
                />

              </div>

              <div>

                <h2>
                  {selectedDoctor.name}
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      backgroundColor:
                        selectedDoctor.status === "Available"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        selectedDoctor.status === "Available"
                          ? "#15803d"
                          : "#dc2626",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor:
                          selectedDoctor.status === "Available"
                            ? "#16a34a"
                            : "#dc2626",
                      }}
                    />
                    {selectedDoctor.status || "Available"}
                  </span>
                </div>

              </div>

            </div>

            <div className="modal-details">

              <div className="modal-row">

                <span>
                  Availability Status
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    backgroundColor:
                      selectedDoctor.status === "Available"
                        ? "#dcfce7"
                        : "#fee2e2",
                    color:
                      selectedDoctor.status === "Available"
                        ? "#15803d"
                        : "#dc2626",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor:
                        selectedDoctor.status === "Available"
                          ? "#16a34a"
                          : "#dc2626",
                    }}
                  />
                  {selectedDoctor.status || "Available"}
                </span>

              </div>

              <div className="modal-row">

                <span>
                  Experience
                </span>

                <span>
                  {selectedDoctor.experience}
                </span>

              </div>

              <div className="modal-row">

                <span>
                  Qualification
                </span>

                <span>
                  {selectedDoctor.qualification}
                </span>

              </div>

              <div className="modal-row">

                <span>
                  Available Days
                </span>

                <span>
                  {selectedDoctor.availability}
                </span>

              </div>

              <div className="modal-row">

                <span>
                  Consultation Time
                </span>

                <span>
                  {selectedDoctor.timing}
                </span>

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default ClintDoctors;