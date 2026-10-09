import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import notificationService from "../../Services/notificationService";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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
      console.error("Error fetching patient notifications:", err);
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
        navigate("/myAppointments");
      } else if (notif.relatedEntity === "MedicalReport") {
        navigate("/reports/client");
      } else if (notif.relatedEntity === "MedicineRequest") {
        navigate("/medicine-requests");
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  const getInitials = (name) => {
    if (!name) return "PT";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
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

          /* ================= NAVBAR ================= */

          .client-navbar {
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

            padding: 0 30px;

            z-index: 900;
          }

          /* ================= SEARCH ================= */

          .client-navbar-search-wrapper {
            position: relative;
            width: 300px;
          }

          .client-navbar-search-icon {
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

          .client-navbar-search-wrapper:focus-within
          .client-navbar-search-icon {
            color: #1976d2;
          }

          .client-navbar-search {
            width: 100%;

            padding: 11px 15px 11px 38px;

            border: 1px solid #dbe3ea;

            border-radius: 9px;

            outline: none;

            font-size: 14px;

            color: #263238;

            background: #ffffff;

            transition:
              border-color 0.3s ease,
              box-shadow 0.3s ease;
          }

          .client-navbar-search:focus {
            border-color: #1976d2;

            box-shadow:
              0 0 0 3px rgba(25, 118, 210, 0.10);
          }

          .client-navbar-search::placeholder {
            color: #94a3b8;
          }

          /* ================= RIGHT SIDE ================= */

          .client-navbar-right {
            display: flex;
            align-items: center;

            gap: 14px;

            position: relative;
          }

          /* ================= NOTIFICATION ================= */

          .client-notification-wrapper {
            position: relative;
          }

          .client-notification {
            width: 42px;
            height: 42px;

            border: none;

            background: transparent;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            font-size: 20px;

            color: #455a64;

            transition: background 0.3s ease,
                        color 0.3s ease;
          }

          .client-notification:hover {
            background: #e3f2fd;

            color: #1976d2;
          }

          /* ================= NOTIFICATION BADGE ================= */

          .notification-badge {
            position: absolute;

            top: 1px;
            right: 1px;

            min-width: 17px;
            height: 17px;

            padding: 0 4px;

            background: #1976d2;

            color: #ffffff;

            border-radius: 20px;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 10px;

            font-weight: bold;

            border: 2px solid #ffffff;

            animation: badgePulse 2s infinite;
          }

          /* ================= NOTIFICATION BOX ================= */

          .notification-box {
            position: absolute;

            top: 53px;
            right: 0;

            width: 300px;

            background: #ffffff;

            border: 1px solid #e5e7eb;

            border-radius: 10px;

            box-shadow:
              0 8px 25px rgba(15, 23, 42, 0.12);

            overflow: hidden;

            animation: dropdownOpen 0.25s ease;
          }

          .notification-header {
            padding: 15px;

            border-bottom: 1px solid #edf2f7;

            font-size: 15px;

            font-weight: bold;

            color: #263238;
          }

          .notification-item {
            padding: 13px 15px;

            border-bottom: 1px solid #f1f5f9;

            font-size: 13px;

            color: #607d8b;

            cursor: pointer;

            transition:
              background 0.2s ease,
              padding-left 0.2s ease;
          }

          .notification-item:hover {
            background: #f4f8fc;

            padding-left: 19px;
          }

          .notification-item strong {
            display: block;

            color: #263238;

            margin-bottom: 4px;
          }

          .notification-time {
            font-size: 11px;

            color: #94a3b8;

            margin-top: 4px;
          }

          /* ================= PROFILE ================= */

          .client-profile-wrapper {
            position: relative;
          }

          .client-profile {
            display: flex;
            align-items: center;

            gap: 10px;

            padding: 5px 8px;

            border-radius: 10px;

            cursor: pointer;

            transition: background 0.3s ease;
          }

          .client-profile:hover {
            background: #f4f8fc;
          }

          .client-profile-avatar {
            width: 42px;
            height: 42px;

            border-radius: 50%;

            background: #1976d2;

            color: #ffffff;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 13px;

            font-weight: bold;
          }

          .client-profile-info {
            min-width: 105px;
          }

          .client-profile-name {
            font-size: 14px;

            font-weight: bold;

            color: #263238;
          }

          .client-profile-role {
            font-size: 12px;

            color: #94a3b8;

            margin-top: 3px;
          }

          .profile-arrow {
            font-size: 11px;

            color: #78909c;

            transition: transform 0.25s ease;
          }

          /* ================= PROFILE DROPDOWN ================= */

          .profile-dropdown {
            position: absolute;

            top: 57px;
            right: 0;

            width: 190px;

            background: #ffffff;

            border: 1px solid #e5e7eb;

            border-radius: 10px;

            box-shadow:
              0 8px 25px rgba(15, 23, 42, 0.12);

            overflow: hidden;

            animation: dropdownOpen 0.25s ease;
          }

          .profile-dropdown-item {
            padding: 12px 15px;

            display: flex;
            align-items: center;

            gap: 10px;

            font-size: 13px;

            color: #455a64;

            cursor: pointer;

            transition:
              background 0.2s ease,
              color 0.2s ease,
              padding-left 0.2s ease;
          }

          .profile-dropdown-item i {
            width: 18px;

            font-size: 14px;

            text-align: center;
          }

          .profile-dropdown-item:hover {
            background: #e3f2fd;

            color: #1976d2;

            padding-left: 19px;
          }

          .profile-dropdown-item.logout {
            color: #dc2626;

            border-top: 1px solid #f1f5f9;
          }

          .profile-dropdown-item.logout:hover {
            background: #fee2e2;

            color: #dc2626;

            padding-left: 19px;
          }

          /* ================= DROPDOWN ANIMATION ================= */

          @keyframes dropdownOpen {
            from {
              opacity: 0;

              transform: translateY(-8px);
            }

            to {
              opacity: 1;

              transform: translateY(0);
            }
          }

          /* ================= BADGE ANIMATION ================= */

          @keyframes badgePulse {
            0% {
              box-shadow:
                0 0 0 0 rgba(25, 118, 210, 0.35);
            }

            70% {
              box-shadow:
                0 0 0 5px rgba(25, 118, 210, 0);
            }

            100% {
              box-shadow:
                0 0 0 0 rgba(25, 118, 210, 0);
            }
          }

          /* ================= TABLET ================= */

          @media (max-width: 750px) {

            .client-navbar {
              left: 75px;

              padding: 0 20px;
            }

            .client-navbar-search-wrapper {
              width: 220px;
            }

            .client-profile-info {
              display: none;
            }

            .profile-arrow {
              display: none;
            }
          }

          /* ================= MOBILE ================= */

          @media (max-width: 500px) {

            .client-navbar {
              left: 65px;

              height: 65px;

              padding: 0 12px;
            }

            .client-navbar-search-wrapper {
              width: 160px;
            }

            .client-navbar-search {
              padding: 10px 10px 10px 35px;
            }

            .client-navbar-right {
              gap: 5px;
            }

            .client-notification {
              width: 38px;
              height: 38px;
            }

            .client-profile-avatar {
              width: 38px;
              height: 38px;
            }

            .notification-box {
              right: -50px;

              width: 270px;
            }
          }

          /* ================= SMALL MOBILE ================= */

          @media (max-width: 380px) {

            .client-navbar-search-wrapper {
              width: 120px;
            }

            .client-navbar-search {
              font-size: 12px;
            }

            .client-navbar-search-icon {
              left: 10px;
            }
          }
        `}
      </style>

      {/* ================= NAVBAR ================= */}

      <nav className="client-navbar">

        {/* ================= SEARCH ================= */}

        <div className="client-navbar-search-wrapper">

          <i className="bi bi-search client-navbar-search-icon"></i>

          <input
            type="text"
            className="client-navbar-search"
            placeholder="Search here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="client-navbar-right">

          {/* ================= NOTIFICATION ================= */}

          <div className="client-notification-wrapper">

            <button
              type="button"
              className="client-notification"
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* ================= NOTIFICATION DROPDOWN ================= */}
            {showNotifications && (
              <div className="notification-box" style={{ width: "320px", maxHeight: "400px", overflowY: "auto" }}>
                <div className="notification-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Notifications ({unreadCount} new)</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ background: "none", border: "none", color: "#1976d2", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      className="notification-item"
                      onClick={() => handleNotificationClick(n)}
                      style={{ cursor: "pointer", background: n.read ? "#ffffff" : "#f0fdf4" }}
                    >
                      <strong style={{ color: n.read ? "#334155" : "#0f172a" }}>
                        {n.title}
                      </strong>
                      <div style={{ fontSize: "12px", color: "#64748b", margin: "2px 0" }}>
                        {n.message}
                      </div>
                      <div className="notification-time">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* ================= PROFILE ================= */}

          <div className="client-profile-wrapper">

            <div
              className="client-profile"
              onClick={() =>
                setShowProfile(!showProfile)
              }
            >

              <div className="client-profile-avatar">
                {getInitials(user?.name)}
              </div>

              <div className="client-profile-info">

                <div className="client-profile-name">
                  {user?.name || "Patient"}
                </div>

                <div className="client-profile-role">
                  {user?.role ? user.role.toUpperCase() : "PATIENT"}
                </div>

              </div>

              <span className="profile-arrow">
                {showProfile ? "▲" : "▼"}
              </span>

            </div>

            {/* ================= PROFILE DROPDOWN ================= */}

            {showProfile && (

              <div className="profile-dropdown">

                <div
                  className="profile-dropdown-item"
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/myProfile");
                  }}
                >

                  <i className="bi bi-person"></i>

                  <span>
                    My Profile
                  </span>

                </div>

                <div
                  className="profile-dropdown-item"
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/myAppointments");
                  }}
                >

                  <i className="bi bi-calendar-check"></i>

                  <span>
                    My Appointments
                  </span>

                </div>

                <div
                  className="profile-dropdown-item logout"
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                    navigate("/login");
                  }}
                >

                  <i className="bi bi-box-arrow-right"></i>

                  <span>
                    Logout
                  </span>

                </div>

              </div>

            )}

          </div>

        </div>

      </nav>
    </>
  );
}

export default Navbar;