import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faHouse,
    faUserDoctor,
    faCalendarDays,
    faClipboard,
    faCapsules,
    faCircleUser,
    faFile,
    faCircleLeft
  } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";

function ClientSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

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

          .client-sidebar {
            position: fixed;

            top: 0;
            left: 0;
            bottom: 0;

            width: 240px;

            background: #ffffff;

            border-right: 1px solid #e5e7eb;

            padding: 25px 15px;

            z-index: 1000;

            overflow-y: auto;
          }

          /* ================= LOGO ================= */

          .client-logo-container {
            display: flex;

            align-items: center;

            gap: 12px;

            margin-bottom: 35px;

            padding-left: 5px;
          }

          .client-logo-icon {
            width: 45px;
            height: 45px;

            background: #1976d2;

            color: #ffffff;

            border-radius: 12px;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 28px;

            font-weight: bold;

            box-shadow:
              0 5px 15px rgba(25, 118, 210, 0.15);
          }

          .client-logo-text {
            margin: 0;

            color: #1976d2;

            font-size: 22px;

            font-weight: 700;
          }

          /* ================= SECTION TITLE ================= */

          .client-section-title {
            margin: 0 0 10px 5px;

            color: #9ca3af;

            font-size: 11px;

            font-weight: 700;

            letter-spacing: 0.8px;
          }

          .client-section-title.account-title {
            margin-top: 28px;
          }

          /* ================= MENU ITEM ================= */

          .client-menu-item {
            width: 100%;

            padding: 13px 15px;

            margin-bottom: 7px;

            border-radius: 9px;

            display: flex;

            align-items: center;

            gap: 11px;

            color: #1f2937;

            font-size: 14px;

            font-weight: 500;

            cursor: pointer;

            transition:
              background 0.25s ease,
              color 0.25s ease,
              transform 0.25s ease;
          }

          /* ================= HOVER EFFECT ================= */

          .client-menu-item:hover {
            background: #e3f2fd;

            color: #1976d2;

            transform: translateX(4px);
          }

          .client-menu-item.active {
            background: #bbdefb;

            color: #1976d2;
          }

          /* ================= ICON ================= */

          .client-menu-icon {
            width: 24px;

            min-width: 24px;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 18px;
          }

          .client-menu-text {
            white-space: nowrap;
          }

          /* ================= LOGOUT ================= */

          .client-logout-item {
            width: 100%;

            padding: 13px 15px;

            margin-top: 22px;

            border-radius: 9px;

            display: flex;

            align-items: center;

            gap: 11px;

            color: #dc2626;

            font-size: 14px;

            font-weight: 500;

            cursor: pointer;

            transition:
              background 0.25s ease,
              color 0.25s ease,
              transform 0.25s ease;
          }

          .client-logout-item:hover {
            background: #fee2e2;

            color: #dc2626;

            transform: translateX(4px);
          }

          /* ================= SCROLLBAR ================= */

          .client-sidebar::-webkit-scrollbar {
            width: 5px;
          }

          .client-sidebar::-webkit-scrollbar-thumb {
            background: #dbeafe;

            border-radius: 10px;
          }

          /* ================= TABLET ================= */

          @media (max-width: 750px) {

            .client-sidebar {
              width: 75px;

              padding: 25px 10px;
            }

            .client-logo-container {
              justify-content: center;

              padding-left: 0;
            }

            .client-logo-text {
              display: none;
            }

            .client-section-title {
              display: none;
            }

            .client-menu-item,
            .client-logout-item {
              justify-content: center;

              padding: 13px 8px;
            }

            .client-menu-text {
              display: none;
            }

            .client-menu-icon {
              font-size: 20px;
            }
          }

          /* ================= MOBILE ================= */

          @media (max-width: 480px) {

            .client-sidebar {
              width: 65px;

              padding: 20px 7px;
            }

            .client-logo-icon {
              width: 42px;

              height: 42px;

              font-size: 24px;
            }

            .client-menu-item,
            .client-logout-item {
              padding: 12px 5px;
            }
          }
        `}
      </style>

      {/* ================= SIDEBAR ================= */}

      <aside className="client-sidebar">

        {/* ================= LOGO ================= */}

        <div className="client-logo-container">

          <div className="client-logo-icon">
            +
          </div>

          <h2 className="client-logo-text">
            MedCare
          </h2>

        </div>

        {/* ================= MAIN MENU ================= */}

        <p className="client-section-title">
          MAIN MENU
        </p>

        {/* ================= DASHBOARD ================= */}

        <div
          className={`client-menu-item ${location.pathname === "/client/dashboard" || location.pathname === "/client" ? "active" : ""}`}
          onClick={() => goTo("/client/dashboard")}
        >
          <span className="client-menu-icon">
            <FontAwesomeIcon icon={faHouse}/>
          </span>

          <span className="client-menu-text">
            Dashboard
          </span>
        </div>

        {/* ================= MY APPOINTMENTS ================= */}

        <div
          className={`client-menu-item ${location.pathname === "/myAppointments" ? "active" : ""}`}
          onClick={() => goTo("/myAppointments")}
        >
          <span className="client-menu-icon">
            <FontAwesomeIcon icon={faCalendarDays}/>
          </span>

          <span className="client-menu-text">
            My Appointments
          </span>
        </div>

        {/* ================= HEALTHCARE ================= */}

        <p className="client-section-title account-title">
          HEALTHCARE
        </p>

        {/* ================= DOCTORS ================= */}

        <div
          className={`client-menu-item ${location.pathname === "/clintDoctors" ? "active" : ""}`}
          onClick={() => goTo("/clintDoctors")}
        >
          <span className="client-menu-icon">
            <FontAwesomeIcon icon={faUserDoctor}/>
          </span>

          <span className="client-menu-text">
            Doctors
          </span>
        </div>

        {/* ================= MEDICAL RECORDS ================= */}

      

        {/* ================= PRESCRIPTIONS ================= */}

        <div
          className={`client-menu-item ${location.pathname === "/prescription" ? "active" : ""}`}
          onClick={() => goTo("/prescription")}
        >
          <span className="client-menu-icon">
            <FontAwesomeIcon icon={faCapsules}/>
          </span>

          <span className="client-menu-text">
            Prescriptions
          </span>
        </div>

        {/* ================= MEDICINE REQUESTS ================= */}

        <div
          className={`client-menu-item ${location.pathname === "/medicine-requests" ? "active" : ""}`}
          onClick={() => goTo("/medicine-requests")}
        >
          <span className="client-menu-icon">
            <i className="bi bi-capsule-pill"></i>
          </span>

          <span className="client-menu-text">
            Medicine Requests
          </span>
        </div>

        {/* ================= REPORTS ================= */}

        <div
          className={`client-menu-item ${location.pathname === "/reports/client" ? "active" : ""}`}
          onClick={() => goTo("/reports/client")}
        >
          <span className="client-menu-icon">
            <FontAwesomeIcon icon={faFile}/>
          </span>

          <span className="client-menu-text">
            Reports
          </span>
        </div>

        {/* ================= MY BILLING ================= */}

        <div
          className={`client-menu-item ${location.pathname === "/myBilling" ? "active" : ""}`}
          onClick={() => goTo("/myBilling")}
        >
          <span className="client-menu-icon">
            <FontAwesomeIcon icon={faClipboard}/>
          </span>

          <span className="client-menu-text">
            My Billing
          </span>
        </div>

        {/* ================= ACCOUNT ================= */}

        <p className="client-section-title account-title">
          ACCOUNT
        </p>

        {/* ================= MY PROFILE ================= */}

        <div
          className={`client-menu-item ${location.pathname === "/myProfile" ? "active" : ""}`}
          onClick={() => goTo("/myProfile")}
        >
          <span className="client-menu-icon">
            <FontAwesomeIcon icon={faCircleUser}/>
          </span>

          <span className="client-menu-text">
            My Profile
          </span>
        </div>

        {/* ================= LOGOUT ================= */}

        <div
          className="client-logout-item"
          onClick={handleLogout}
        >
          <span className="client-menu-icon">
            <i class="bi bi-door-open"></i>
          </span>

          <span className="client-menu-text">
            Logout
          </span>
        </div>

      </aside>
    </>
  );
}

export default ClientSidebar;