import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import notificationService from "../../Services/notificationService";

function DoctorNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching doctor notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await notificationService.markAsRead(notif._id);
        fetchNotifications();
      }
      setShowNotifications(false);
      if (notif.relatedEntity === "Appointment") {
        navigate("/doctor/appointments");
      } else if (notif.relatedEntity === "MedicalReport") {
        navigate("/doctor/reports");
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  return (
    <>
      <style>{`
        .doctor-navbar {
          position: fixed;
          top: 0;
          left: 240px;
          right: 0;
          height: 70px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(25, 118, 210, 0.05);
          animation: navbarSlide 0.5s ease;
        }
        @keyframes navbarSlide {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .doctor-nav-brand {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .doctor-nav-search {
          width: 280px;
          height: 38px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          border: 1px solid #d8e2ef;
          border-radius: 9px;
          background: #f8fafc;
          color: #8ba0ba;
        }
        .doctor-nav-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #334155;
          font-size: 12px;
        }
        .doctor-nav-search input::placeholder {
          color: #8ba0ba;
        }
        .doctor-nav-badge {
          background: #e8f3ff;
          color: #1976d2;
          font-weight: 700;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .doctor-nav-title {
          display: none;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .doctor-nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .notif-btn {
          position: relative;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
          transition: all 0.2s;
        }
        .notif-btn:hover {
          background: #f1f5f9;
          color: #0284c7;
        }
        .notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 10px;
          border: 2px solid #ffffff;
        }
        .notif-panel {
          position: absolute;
          top: 60px;
          right: 80px;
          width: 340px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 1050;
          overflow: hidden;
        }
        .notif-header {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }
        .notif-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.15s;
        }
        .notif-item:hover {
          background: #f8fafc;
        }
        .notif-item.unread {
          background: #f0f9ff;
        }
        .doctor-profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .doctor-profile-btn:hover {
          background: #f8fafc;
        }
        .doctor-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e3f2fd;
          color: #1976d2;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .doctor-info-text {
          text-align: left;
        }
        .doctor-name-label {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.2;
        }
        .doctor-role-label {
          font-size: 11px;
          color: #64748b;
        }
        .profile-menu {
          position: absolute;
          top: 60px;
          right: 20px;
          width: 200px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          z-index: 1050;
          padding: 6px 0;
        }
        .profile-menu-item {
          padding: 9px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #334155;
          cursor: pointer;
          transition: background 0.15s;
        }
        .profile-menu-item:hover {
          background: #f1f5f9;
          color: #1976d2;
        }
        @media (max-width: 800px) {
          .doctor-navbar {
            left: 0;
            padding: 0 12px;
          }
          .doctor-nav-search {
            display: none;
          }
          .doctor-nav-badge {
            display: none;
          }
        }
      `}</style>

      <header className="doctor-navbar">
        <div className="doctor-nav-brand">
          <label className="doctor-nav-search">
            <i className="bi bi-search"></i>
            <input type="search" placeholder="Search patients, doctors..." aria-label="Search" />
          </label>
          {/* <span className="doctor-nav-badge">Physician Station</span> */}
          <h2 className="doctor-nav-title">MedCare Clinical Workspace</h2>
        </div>

        <div className="doctor-nav-actions">
          {/* Notifications Button */}
          <div style={{ position: "relative" }}>
            <button
              className="notif-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notif-panel">
                <div className="notif-header">
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                    Clinical Notifications ({unreadCount} unread)
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0284c7",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                      No new clinical notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n._id}
                        className={`notif-item ${!n.read ? "unread" : ""}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div style={{ fontWeight: 600, fontSize: "12px", color: "#0f172a" }}>{n.title}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{n.message}</div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Doctor Profile */}
          <div style={{ position: "relative" }}>
            <button className="doctor-profile-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="doctor-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : "D"}
              </div>
              <div className="doctor-info-text">
                <div className="doctor-name-label">{user?.name || "Doctor"}</div>
                {/* <div className="doctor-role-label">Consultant Physician</div> */}
              </div>
              <i className="bi bi-chevron-down" style={{ fontSize: "11px", color: "#94a3b8" }}></i>
            </button>

            {showDropdown && (
              <div className="profile-menu">
                <div
                  className="profile-menu-item"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/doctor/appointments");
                  }}
                >
                  <i className="bi bi-calendar-check"></i> My Appointments
                </div>
                <div
                  className="profile-menu-item"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/doctor/reports");
                  }}
                >
                  <i className="bi bi-file-earmark-medical"></i> Patient Reports
                </div>
                <div
                  className="profile-menu-item"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/doctor/prescriptions");
                  }}
                >
                  <i className="bi bi-capsule"></i> Prescriptions
                </div>
                <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }}></div>
                <div
                  className="profile-menu-item"
                  style={{ color: "#ef4444" }}
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i> Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default DoctorNavbar;
