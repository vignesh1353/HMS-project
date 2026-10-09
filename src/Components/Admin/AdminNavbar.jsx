import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import notificationService from "../../Services/notificationService";

function AdminNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
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
      console.error("Error fetching admin notifications:", err);
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
        navigate("/manageappointments");
      } else if (notif.relatedEntity === "MedicalReport") {
        navigate("/report-approvals");
      } else if (notif.relatedEntity === "MedicineRequest" || notif.relatedEntity === "Prescription") {
        navigate("/prescriptions");
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-navbar {
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

        /* ================= SEARCH ================= */

        .navbar-search {
          position: relative;
          width: 280px;
        }

        .navbar-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);

          color: #94a3b8;
          font-size: 13px;

          pointer-events: none;

          transition: 0.3s ease;
        }

        .navbar-search:focus-within .navbar-search-icon {
          color: #1976d2;

          transform:
            translateY(-50%)
            scale(1.1);
        }

        .navbar-search-input {
          width: 100%;
          height: 38px;

          padding: 0 14px 0 36px;

          border: 1px solid #dbe3ec;
          border-radius: 9px;

          outline: none;

          background: #f8fafc;
          color: #334155;

          font-size: 12px;

          transition: all 0.3s ease;
        }

        .navbar-search-input::placeholder {
          color: #a0aec0;
        }

        .navbar-search-input:hover {
          border-color: #bbdefb;
          background: #ffffff;
        }

        .navbar-search-input:focus {
          border-color: #1976d2;
          background: #ffffff;

          box-shadow:
            0 0 0 3px rgba(25, 118, 210, 0.08);

          transform: translateY(-1px);
        }

        /* ================= RIGHT ================= */

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        /* ================= NOTIFICATION ================= */

        .notification-button {
          position: relative;

          width: 38px;
          height: 38px;

          border: 1px solid #e5e7eb;
          border-radius: 9px;

          background: #ffffff;
          color: #64748b;

          cursor: pointer;

          font-size: 16px;

          display: flex;
          align-items: center;
          justify-content: center;

          transition: all 0.3s ease;
        }

        .notification-button:hover {
          background: #e3f2fd;
          color: #1976d2;
          border-color: #bbdefb;

          transform: translateY(-2px);
        }

        .notification-count {
          position: absolute;

          top: -5px;
          right: -5px;

          min-width: 16px;
          height: 16px;

          padding: 0 4px;

          border-radius: 20px;

          background: #1976d2;
          color: #ffffff;

          font-size: 9px;
          font-weight: bold;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ================= ADMIN PROFILE ================= */

        .admin-profile {
          display: flex;
          align-items: center;
          gap: 10px;

          padding-left: 15px;

          border-left: 1px solid #e5e7eb;

          cursor: pointer;
        }

        .admin-avatar {
          width: 38px;
          height: 38px;

          border-radius: 50%;

          background: #e3f2fd;
          color: #1976d2;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 13px;
          font-weight: bold;

          border: 1px solid #bbdefb;

          transition: all 0.3s ease;
        }

        .admin-profile:hover .admin-avatar {
          background: #bbdefb;
          transform: scale(1.08);
        }

        .admin-info {
          display: flex;
          flex-direction: column;
        }

        .admin-name {
          color: #263238;
          font-size: 12px;
          font-weight: 600;
        }

        .admin-role {
          color: #94a3b8;
          font-size: 10px;
          margin-top: 3px;
        }

        .profile-arrow {
          color: #94a3b8;
          font-size: 10px;
          margin-left: 2px;

          transition: transform 0.3s ease;
        }

        .admin-profile:hover .profile-arrow {
          color: #1976d2;
          transform: rotate(180deg);
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 900px) {
          .admin-navbar {
            left: 0;
          }

          .navbar-search {
            width: 220px;
          }
        }

        @media (max-width: 650px) {
          .admin-navbar {
            padding: 0 15px;
          }

          .navbar-search {
            width: 200px;
          }

          .admin-info,
          .profile-arrow {
            display: none;
          }

          .admin-profile {
            padding-left: 10px;
          }
        }

        @media (max-width: 450px) {
          .navbar-search {
            width: 150px;
          }

          .navbar-right {
            gap: 8px;
          }

          .notification-button {
            width: 34px;
            height: 34px;
          }

          .admin-avatar {
            width: 34px;
            height: 34px;
          }
        }
      `}</style>

      {/* ================= NAVBAR ================= */}

      <nav className="admin-navbar">

        {/* ================= SEARCH BAR ================= */}

        <div className="navbar-search">

          <span className="navbar-search-icon">
            <i class="bi bi-search"></i>
          </span>

          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search patients, doctors..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        {/* ================= RIGHT ================= */}

        <div className="navbar-right">

          {/* NOTIFICATION */}
          <div style={{ position: "relative" }}>
            <button
              className="notification-button"
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <span className="notification-count">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "46px",
                  right: "0",
                  background: "#ffffff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  borderRadius: "12px",
                  width: "340px",
                  maxHeight: "420px",
                  overflowY: "auto",
                  zIndex: 1200,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#f8fafc",
                  }}
                >
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>
                    Notifications ({unreadCount} new)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                    No notifications yet.
                  </div>
                ) : (
                  <div>
                    {notifications.slice(0, 10).map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          background: n.read ? "#ffffff" : "#f0fdf4",
                          transition: "background 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: n.read ? "#475569" : "#0f172a" }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ADMIN PROFILE */}

          <div
            className="admin-profile"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ position: 'relative' }}
          >

            <div className="admin-avatar">
              {getInitials(user?.name)}
            </div>

            <div className="admin-info">

              <span className="admin-name">
                {user?.name || "Admin"}
              </span>

              <span className="admin-role">
                {user?.role ? user.role.toUpperCase() : "ADMINISTRATOR"}
              </span>

            </div>

            <span className="profile-arrow">
              {showDropdown ? "▲" : "▼"}
            </span>

            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  background: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  borderRadius: '10px',
                  padding: '10px 0',
                  minWidth: '150px',
                  zIndex: 1100,
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/dashboard');
                  }}
                >
                  <i className="bi bi-speedometer2"></i> Dashboard
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                    navigate('/login');
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i> Logout
                </div>
              </div>
            )}

          </div>

        </div>

      </nav>
    </>
  );
}

export default AdminNavbar;