import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserDoctor
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }

    return location.pathname === path;
  };

  // ================= NAVIGATION =================

  const goTo = (path) => {
    navigate(path);
  };

  // ================= LOGOUT =================

  const handleLogout = () => {
    logout();
    navigate("/login");
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

          /* ================= SIDEBAR ================= */

          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;

            width: 240px;

            background-color: #f4f7fb;
            border-right: 1px solid #d4ebff;

            padding: 25px 15px;

            z-index: 1000;

            overflow-y: auto;

            animation: slideIn 0.8s ease;
          }

          /* ================= LOGO ================= */

          .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;

            margin-bottom: 35px;
          }

          .logo-icon {
            width: 45px;
            height: 45px;

            background-color: #1976d2;
            color: white;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 27px;
            font-weight: bold;

            animation: pulse 2s infinite;
          }

          .logo-text {
            color: #1976d2;
            margin: 0;

            font-size: 22px;
          }

          /* ================= SECTION TITLE ================= */

          .section-title {
            color: #8da4c4;

            font-size: 12px;
            font-weight: bold;

            margin: 0 0 10px 5px;
          }

          .management-title {
            margin-top: 30px;
          }

          /* ================= MENU ITEM ================= */

          .menu-item {
            padding: 13px 15px;

            color: #526b8a;

            border-radius: 9px;

            margin-bottom: 8px;

            cursor: pointer;

            font-size: 14px;

            display: flex;
            align-items: center;

            gap: 10px;

            transition: all 0.3s ease;
          }

          .menu-item:hover {
            background-color: #eaf5ff;

            color: #1976d2;

            transform: translateX(6px);
          }

          /* ================= ACTIVE MENU ================= */

          .active-menu {
            background-color: #1976d2;

            color: #ffffff;

            font-weight: 600;

            box-shadow: 0 4px 14px rgba(25, 118, 210, 0.25);
          }

          .active-menu:hover {
            background-color: #1565c0 !important;

            color: #ffffff !important;
          }

          /* ================= ICON ================= */

          .menu-icon {
            width: 24px;

            text-align: center;

            font-size: 18px;
          }

          /* ================= LOGOUT ================= */

          .logout-item {
            padding: 13px 15px;

            color: #dc2626;

            border-radius: 9px;

            margin-top: 10px;

            cursor: pointer;

            font-size: 14px;
            font-weight: 500;

            display: flex;
            align-items: center;

            gap: 10px;

            transition: all 0.3s ease;
          }

          .logout-item:hover {
            background-color: #fee2e2;

            color: #dc2626;

            transform: translateX(6px);
          }

          /* ================= ANIMATIONS ================= */

          @keyframes slideIn {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }

            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes pulse {
            0% {
              transform: scale(1);
            }

            50% {
              transform: scale(1.08);
            }

            100% {
              transform: scale(1);
            }
          }

          /* ================= TABLET ================= */

          @media (max-width: 750px) {
            .sidebar {
              width: 75px;

              padding: 25px 10px;
            }

            .logo-container {
              justify-content: center;
            }

            .logo-text {
              display: none;
            }

            .section-title {
              display: none;
            }

            .menu-item,
            .logout-item {
              justify-content: center;

              padding: 13px 8px;
            }

            .menu-text {
              display: none;
            }

            .menu-icon {
              font-size: 20px;
            }
          }
        `}
      </style>

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        {/* ================= LOGO ================= */}

        <div className="logo-container">
          <div className="logo-icon">
            +
          </div>

          <h2 className="logo-text">
            MedCare
          </h2>
        </div>

        {/* ================= MAIN MENU ================= */}

        <p className="section-title">
          MAIN MENU
        </p>

        {/* DASHBOARD */}

        <div
          className={`menu-item ${isActive("/dashboard") ? "active-menu" : ""}`}
          onClick={() => goTo("/dashboard")}
        >
          <span className="menu-icon">
            <i class="bi bi-house"></i>
          </span>

          <span className="menu-text">
            Dashboard
          </span>
        </div>

        {/* ================= MANAGEMENT ================= */}

        <p className="section-title management-title">
          MANAGEMENT
        </p>

        {/* MANAGE DOCTORS */}

        <div
          className={`menu-item ${isActive("/doctors") ? "active-menu" : ""}`}
          onClick={() => goTo("/doctors")}
        >
          <span className="menu-icon">
            <FontAwesomeIcon icon={faUserDoctor} />
          </span>

          <span className="menu-text">
            Manage Doctors
          </span>
        </div>

        {/* MANAGE PATIENTS */}

        <div
          className={`menu-item ${isActive("/patients") ? "active-menu" : ""}`}
          onClick={() => goTo("/patients")}
        >
          <span className="menu-icon">
            <i class="bi bi-person-fill"></i>
          </span>

          <span className="menu-text">
            Manage Patients
          </span>
        </div>

        {/* MANAGE APPOINTMENTS */}

        <div
          className={`menu-item ${isActive("/manageappointments") ? "active-menu" : ""}`}
          onClick={() => goTo("/manageappointments")}
        >
          <span className="menu-icon">
            <i class="bi bi-clipboard2"></i>
          </span>

          <span className="menu-text">
            Manage Appointments
          </span>
        </div>

        {/* MANAGE ROOMS */}

        <div
          className={`menu-item ${isActive("/rooms") ? "active-menu" : ""}`}
          onClick={() => goTo("/rooms")}
        >
          <span className="menu-icon">
            <i className="bi bi-hospital"></i>
          </span>

          <span className="menu-text">
            Manage Rooms
          </span>
        </div>

        {/* MANAGE BILLING */}

        <div
          className={`menu-item ${isActive("/billing") ? "active-menu" : ""}`}
          onClick={() => goTo("/billing")}
        >
          <span className="menu-icon">
            <i class="bi bi-receipt-cutoff"></i>
          </span>

          <span className="menu-text">
            Manage Billing
          </span>
        </div>

        {/* MANAGE PHARMACY */}

        <div
          className={`menu-item ${isActive("/pharmacy") ? "active-menu" : ""}`}
          onClick={() => goTo("/pharmacy")}
        >
          <span className="menu-icon">
            <i class="bi bi-capsule"></i>
          </span>

          <span className="menu-text">
            Manage Pharmacy
          </span>
        </div>

        {/* MANAGE CLINICAL REPORTS */}

        <div
          className={`menu-item ${isActive("/reports") ? "active-menu" : ""}`}
          onClick={() => goTo("/reports")}
        >
          <span className="menu-icon">
            <i className="bi bi-book"></i>
          </span>

          <span className="menu-text">
            Manage Clinical Reports
          </span>
        </div>

        {/* PRESCRIPTIONS DIRECTORY */}

        <div
          className={`menu-item ${isActive("/prescriptions") ? "active-menu" : ""}`}
          onClick={() => goTo("/prescriptions")}
        >
          <span className="menu-icon">
            <i className="bi bi-file-earmark-medical"></i>
          </span>

          <span className="menu-text">
            Manage Prescriptions
          </span>
        </div>

        {/* MANAGE MEDICINE REQUESTS */}

        <div
          className={`menu-item ${isActive("/medicine-approvals") || isActive("/admin/medicine-requests") ? "active-menu" : ""}`}
          onClick={() => goTo("/medicine-approvals")}
        >
          <span className="menu-icon">
            <i className="bi bi-capsule-pill"></i>
          </span>

          <span className="menu-text">
            Manage Medicine Requests
          </span>
        </div>


        {/* ================= LOGOUT ================= */}

        <div
          className="logout-item"
          onClick={handleLogout}
        >
          <span className="menu-icon">
            <i class="bi bi-door-open"></i>
          </span>

          <span className="menu-text">
            Logout
          </span>
        </div>

      </aside>
    </>
  );
}

export default Sidebar;