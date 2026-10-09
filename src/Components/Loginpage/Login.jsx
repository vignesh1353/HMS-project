import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || (isRegister && !name)) {
      setMessage("Please fill in all required fields.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (isRegister) {
        const res = await register({ name, email, phone, password });
        setMessage("Account registered successfully! Redirecting...");
        setMessageType("success");
        setTimeout(() => {
          if (res.user?.role === "admin") {
            navigate("/dashboard");
          } else if (res.user?.role === "doctor") {
            navigate("/doctor/dashboard");
          } else {
            navigate("/client/dashboard");
          }
        }, 1000);
      } else {
        const res = await login({ email, password });
        setMessage("Login successful! Redirecting...");
        setMessageType("success");
        setTimeout(() => {
          if (res.user?.role === "admin") {
            navigate("/dashboard");
          } else if (res.user?.role === "doctor") {
            navigate("/doctor/dashboard");
          } else {
            navigate("/client/dashboard");
          }
        }, 800);
      }
    } catch (err) {
      let errMsg = err.response?.data?.message;
      if (!errMsg) {
        if (!err.response || err.message === 'Network Error') {
          errMsg = "Unable to connect to server. Please check your connection or server status.";
        } else {
          errMsg = "Authentication failed. Please verify your credentials.";
        }
      }
      setMessage(errMsg);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT SIDE */}
      <div className="login-left">

        <div className="hospital-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <div className="logo-icon">
            <i className="bi bi-hospital"></i>
          </div>

          <div>
            <h2>MedCare HMS</h2>
            <p>Hospital Management System</p>
          </div>
        </div>

        <div className="welcome-content">
          <h1>
            {isRegister ? "Join MedCare HMS" : "Welcome Back!"}
          </h1>

          <p>
            Manage healthcare services, appointments, billing, pharmacy, and medical records securely in real time.
          </p>

          <div className="feature-list">

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-person-vcard"></i>
              </div>

              <div>
                <h4>Patient Management</h4>
                <p>Track patient histories, records, and profiles.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-calendar-check"></i>
              </div>

              <div>
                <h4>Appointments</h4>
                <p>Book and manage consultations instantly.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-capsule"></i>
              </div>

              <div>
                <h4>Pharmacy & Billing</h4>
                <p>Live inventory tracking and accurate billing.</p>
              </div>
            </div>

        </div>
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">

        <div className="login-card">

          {/* MOBILE LOGO */}
          <div className="mobile-logo" onClick={() => navigate("/")}>
            <div className="mobile-logo-icon">
              <i className="bi bi-hospital"></i>
            </div>

            <h2>MedCare HMS</h2>
          </div>

          {/* LOGIN HEADING */}
          <div className="login-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2>{isRegister ? "Create Account" : "Login"}</h2>
              <p>{isRegister ? "Sign up to access your health portal" : "Sign in to access your account"}</p>
            </div>
            <Link to="/" style={{ color: "#1976d2", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
              <i className="bi bi-house-door"></i> Home
            </Link>
          </div>

          {/* MESSAGE */}
          {message && (
            <div
              className={
                messageType === "success"
                  ? "message success-message"
                  : "message error-message"
              }
            >
              <i
                className={
                  messageType === "success"
                    ? "bi bi-check-circle"
                    : "bi bi-exclamation-circle"
                }
              ></i>

              <span>{message}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {/* NAME (REGISTER ONLY) */}
            {isRegister && (
              <div className="form-group">
                <label>
                  <i className="bi bi-person"></i>
                  Full Name
                </label>
                <div className="input-wrapper">
                  <i className="bi bi-person input-icon"></i>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* PHONE (REGISTER ONLY) */}
            {isRegister && (
              <div className="form-group">
                <label>
                  <i className="bi bi-telephone"></i>
                  Phone Number
                </label>
                <div className="input-wrapper">
                  <i className="bi bi-telephone input-icon"></i>
                  <input
                    type="text"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div className="form-group">
              <label>
                <i className="bi bi-envelope"></i>
                Email Address
              </label>

              <div className="input-wrapper">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label>
                <i className="bi bi-lock"></i>
                Password
              </label>

              <div className="input-wrapper">
                <i className="bi bi-lock input-icon"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <i className={isRegister ? "bi bi-person-plus" : "bi bi-box-arrow-in-right"}></i>
              {loading ? "Processing..." : isRegister ? "Sign Up" : "Login"}
            </button>

            {/* TOGGLE REGISTER / LOGIN */}
            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setMessage("");
                    }}
                    style={{ background: "none", border: "none", color: "#1976d2", fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setMessage("");
                    }}
                    style={{ background: "none", border: "none", color: "#1976d2", fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Register as Patient
                  </button>
                </>
              )}
            </div>

          </form>

        </div>

      </div>

      <style>{`

        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          background: #f4f8fb;
          font-family: Arial, Helvetica, sans-serif;
        }

        /* =========================
           LEFT SIDE
        ========================= */

        .login-left {
          width: 52%;
          min-height: 100vh;
          background: linear-gradient(
            135deg,
            #e3f2fd,
            #f8fcff
          );
          padding: 55px 65px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: "";
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: rgba(25, 118, 210, 0.06);
          top: -100px;
          left: -100px;
        }

        .login-left::after {
          content: "";
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(25, 118, 210, 0.05);
          bottom: -120px;
          right: -80px;
        }

        .hospital-logo {
          display: flex;
          align-items: center;
          gap: 15px;
          position: relative;
          z-index: 1;
        }

        .logo-icon {
          width: 55px;
          height: 55px;
          background: #1976d2;
          color: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          box-shadow: 0 8px 20px rgba(25, 118, 210, 0.18);
        }

        .hospital-logo h2 {
          margin: 0;
          color: #1565c0;
          font-size: 25px;
          font-weight: 700;
        }

        .hospital-logo p {
          margin: 4px 0 0;
          color: #607d8b;
          font-size: 13px;
        }

        .welcome-content {
          max-width: 600px;
          margin-top: 80px;
          position: relative;
          z-index: 1;
        }

        .welcome-content h1 {
          font-size: 48px;
          color: #173b57;
          margin: 0 0 18px;
          font-weight: 700;
        }

        .welcome-content > p {
          color: #607d8b;
          font-size: 17px;
          line-height: 1.7;
          max-width: 520px;
          margin-bottom: 42px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 12px;
          background: white;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          box-shadow: 0 5px 18px rgba(25, 118, 210, 0.08);
        }

        .feature-item h4 {
          margin: 0 0 4px;
          color: #29485e;
          font-size: 15px;
        }

        .feature-item p {
          margin: 0;
          color: #78909c;
          font-size: 13px;
        }

        /* =========================
           RIGHT SIDE
        ========================= */

        .login-right {
          width: 48%;
          min-height: 100vh;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .login-card {
          width: 100%;
          max-width: 450px;
        }

        .mobile-logo {
          display: none;
        }

        .login-heading {
          margin-bottom: 28px;
        }

        .login-heading h2 {
          margin: 0 0 8px;
          font-size: 32px;
          color: #173b57;
        }

        .login-heading p {
          margin: 0;
          color: #78909c;
          font-size: 14px;
        }

        /* =========================
           MESSAGE
        ========================= */

        .message {
          padding: 12px 15px;
          border-radius: 9px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
        }

        .success-message {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }

        /* =========================
           FORM
        ========================= */

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #455a64;
          font-size: 14px;
          font-weight: 600;
        }

        .form-group label i {
          margin-right: 6px;
          color: #1976d2;
        }

        .input-wrapper {
          position: relative;
          width: 100%;
        }

        .input-wrapper input {
          width: 100%;
          height: 50px;
          border: 1px solid #d8e2e8;
          border-radius: 9px;
          background: #fbfdff;
          outline: none;
          padding: 0 45px;
          color: #37474f;
          font-size: 14px;
          transition: 0.2s;
        }

        .input-wrapper input:focus {
          border-color: #1976d2;
          background: white;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.08);
        }

        .input-wrapper input::placeholder {
          color: #a0adb5;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #90a4ae;
          font-size: 17px;
          pointer-events: none;
          z-index: 2;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #90a4ae;
          cursor: pointer;
          font-size: 17px;
          padding: 3px;
        }

        .password-toggle:hover {
          color: #1976d2;
        }

        /* =========================
           LOGIN BUTTON
        ========================= */

        .login-button {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 9px;
          background: #1976d2;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: 0.2s;
          margin-top: 5px;
        }

        .login-button:hover {
          background: #1565c0;
          transform: translateY(-1px);
          box-shadow: 0 7px 18px rgba(25, 118, 210, 0.2);
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 900px) {

          .login-left {
            width: 45%;
            padding: 40px;
          }

          .login-right {
            width: 55%;
            padding: 30px;
          }

          .welcome-content h1 {
            font-size: 38px;
          }

          .welcome-content {
            margin-top: 60px;
          }

        }

        @media (max-width: 700px) {

          .login-page {
            display: block;
            min-height: 100vh;
          }

          .login-left {
            display: none;
          }

          .login-right {
            width: 100%;
            min-height: 100vh;
            padding: 25px 20px;
          }

          .login-card {
            max-width: 480px;
          }

          .mobile-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 35px;
          }

          .mobile-logo-icon {
            width: 45px;
            height: 45px;
            background: #1976d2;
            color: white;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
          }

          .mobile-logo h2 {
            margin: 0;
            color: #1565c0;
            font-size: 21px;
          }

          .login-heading h2 {
            font-size: 28px;
          }

        }

        @media (max-width: 400px) {

          .login-right {
            padding: 20px 15px;
          }

        }

      `}</style>
    </div>
  );
}

export default Login;