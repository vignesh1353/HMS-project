import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function DoctorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <style>{`
        .doctor-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 240px;
          background-color: #ffffff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          z-index: 1001;
          animation: slideIn 0.8s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .doctor-sidebar-header {
          min-height: 86px;
          padding: 18px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .doctor-sidebar-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #1976d2;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .doctor-sidebar-nav {
          flex: 1;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .doctor-sidebar-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #94a3b8;
          padding: 8px 6px 10px;
        }

        .doctor-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 9px;
          color: #526b8a;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .doctor-nav-link:hover {
          background-color: #f0f7ff;
          color: #1976d2;
        }

        .doctor-nav-link.active {
          background-color: #e1f1ff;
          color: #0d6efd;
          font-weight: 600;
        }

        .doctor-nav-link i {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .doctor-sidebar-footer {
          padding: 16px 14px;
          border-top: 1px solid #f1f5f9;
        }

        .doctor-logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          color: #ef4444;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .doctor-logout-btn:hover {
          background-color: #fef2f2;
        }
      `}</style>

      <aside className="doctor-sidebar">
        <div className="doctor-sidebar-header">
          <div className="doctor-sidebar-logo">
            <i className="bi bi-hospital"></i>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "20px", color: "#1976d2" }}>MedCare</div>
            <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: 600 }}>Doctor Workspace</div>
          </div>
        </div>

        <div className="doctor-sidebar-nav">
          <div className="doctor-sidebar-label">Clinical Menu</div>

          <button
            className={`doctor-nav-link ${isActive("/doctor/dashboard") ? "active" : ""}`}
            onClick={() => navigate("/doctor/dashboard")}
          >
            <i className="bi bi-grid-1x2"></i>
            <span>Overview Dashboard</span>
          </button>

          <button
            className={`doctor-nav-link ${isActive("/doctor/appointments") ? "active" : ""}`}
            onClick={() => navigate("/doctor/appointments")}
          >
            <i className="bi bi-calendar2-check"></i>
            <span>My Consultations</span>
          </button>

          <button
            className={`doctor-nav-link ${isActive("/doctor/reports") ? "active" : ""}`}
            onClick={() => navigate("/doctor/reports")}
          >
            <i className="bi bi-file-earmark-medical"></i>
            <span>Clinical Reports</span>
          </button>

          <button
            className={`doctor-nav-link ${isActive("/doctor/prescriptions") ? "active" : ""}`}
            onClick={() => navigate("/doctor/prescriptions")}
          >
            <i className="bi bi-capsule"></i>
            <span>Prescriptions</span>
          </button>
        </div>

        <div className="doctor-sidebar-footer">
          <button className="doctor-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default DoctorSidebar;
