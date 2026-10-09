import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import appointmentService from "../Services/appointmentService";

function Homepage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [showAppointment, setShowAppointment] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    department: "",
    doctor: "",
    date: "",
    time: "",
    issue: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [adminLoginData, setAdminLoginData] = useState({
    email: "",
    password: "",
  });

  const [loginMessage, setLoginMessage] = useState("");
  const [signupMessage, setSignupMessage] = useState("");
  const [adminLoginMessage, setAdminLoginMessage] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");

  // =========================
  // APPOINTMENT
  // =========================

  const openAppointment = () => {
    setShowAppointment(true);
    setShowLogin(false);
    setShowSignup(false);
    setShowAdminLogin(false);
    setAppointmentMessage("");
  };

  const closeAppointment = () => {
    setShowAppointment(false);
    setAppointmentMessage("");
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setAppointmentMessage("");
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.phone ||
      !formData.age ||
      !formData.gender ||
      !formData.department ||
      !formData.doctor ||
      !formData.date ||
      !formData.time ||
      !formData.issue
    ) {
      setAppointmentMessage(
        "Please fill in all appointment details."
      );
      return;
    }

    try {
      await appointmentService.createAppointment({
        patientName: formData.name,
        patientPhone: formData.phone,
        doctorName: formData.doctor,
        department: formData.department,
        date: formData.date,
        time: formData.time,
        type: "Consultation",
        notes: `Age: ${formData.age}, Gender: ${formData.gender}. Issue: ${formData.issue}`,
      });

      setAppointmentMessage(
        "Appointment booked successfully! Request sent to Hospital Administration. Once Admin approves, it will be assigned to the selected doctor."
      );

      setTimeout(() => {
        setFormData({
          name: "",
          phone: "",
          age: "",
          gender: "",
          department: "",
          doctor: "",
          date: "",
          time: "",
          issue: "",
        });

        setShowAppointment(false);
        setAppointmentMessage("");
      }, 1500);
    } catch (err) {
      setAppointmentMessage(
        err.response?.data?.message || "Failed to book appointment. Please try again."
      );
    }
  };

  // =========================
  // LOGIN
  // =========================

  const openLogin = () => {
    setShowLogin(true);
    setShowAppointment(false);
    setShowSignup(false);
    setShowAdminLogin(false);
    setLoginMessage("");
  };

  const closeLogin = () => {
    setShowLogin(false);
    setLoginMessage("");
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;

    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setLoginMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      setLoginMessage(
        "Please enter email and password."
      );
      return;
    }

    try {
      const res = await login({
        email: loginData.email,
        password: loginData.password,
      });

      setLoginMessage("Login successful! Redirecting...");

      setTimeout(() => {
        setShowLogin(false);
        setLoginData({
          email: "",
          password: "",
        });
        setLoginMessage("");

        if (res.user?.role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/client/dashboard");
        }
      }, 800);
    } catch (err) {
      setLoginMessage(
        err.response?.data?.message || "Invalid email or password."
      );
    }
  };

  // =========================
  // ADMIN LOGIN
  // =========================

  const openAdminLogin = () => {
    setShowAdminLogin(true);
    setShowLogin(false);
    setShowSignup(false);
    setShowAppointment(false);
    setAdminLoginMessage("");
  };

  const closeAdminLogin = () => {
    setShowAdminLogin(false);
    setAdminLoginMessage("");
  };

  const handleAdminLoginChange = (e) => {
    const { name, value } = e.target;

    setAdminLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setAdminLoginMessage("");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (
      !adminLoginData.email ||
      !adminLoginData.password
    ) {
      setAdminLoginMessage(
        "Please enter admin email and password."
      );
      return;
    }

    try {
      const res = await login({
        email: adminLoginData.email,
        password: adminLoginData.password,
      });

      if (res.user?.role !== "admin") {
        setAdminLoginMessage(
          "Access denied: This portal is for administrators only."
        );
        return;
      }

      setAdminLoginMessage(
        "Admin login successful!"
      );

      setTimeout(() => {
        setShowAdminLogin(false);

        setAdminLoginData({
          email: "",
          password: "",
        });

        setAdminLoginMessage("");

        navigate("/dashboard");
      }, 700);
    } catch (err) {
      setAdminLoginMessage(
        err.response?.data?.message || "Invalid admin credentials."
      );
    }
  };

  // =========================
  // SIGN UP
  // =========================

  const openSignup = () => {
    setShowSignup(true);
    setShowLogin(false);
    setShowAdminLogin(false);
    setShowAppointment(false);
    setSignupMessage("");
  };

  const closeSignup = () => {
    setShowSignup(false);
    setSignupMessage("");
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;

    setSignupData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSignupMessage("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (
      !signupData.name ||
      !signupData.email ||
      !signupData.phone ||
      !signupData.password ||
      !signupData.confirmPassword
    ) {
      setSignupMessage(
        "Please fill in all registration details."
      );
      return;
    }

    if (
      signupData.password !==
      signupData.confirmPassword
    ) {
      setSignupMessage(
        "Passwords do not match."
      );
      return;
    }

    try {
      await register({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password,
      });

      setSignupMessage(
        "Account created successfully! You can now log in."
      );

      setTimeout(() => {
        setShowSignup(false);

        setSignupData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });

        setSignupMessage("");
        setShowLogin(true);
      }, 1200);
    } catch (err) {
      setSignupMessage(
        err.response?.data?.message || "Registration failed. Email might already exist."
      );
    }
  };

  const switchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
    setLoginMessage("");
  };

  const switchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
    setSignupMessage("");
  };

  // =========================
  // SCROLL
  // =========================

  const scrollToSection = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <>
      <style>{`

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          background: #f5f9fc;
          color: #183b56;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        button {
          outline: none;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .homepage {
          min-height: 100vh;
          background: #f5f9fc;
        }

        /* =====================================================
           NAVBAR
        ===================================================== */

        .navbar {
          height: 76px;
          padding: 0 6%;
          background: rgba(255,255,255,0.97);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid #e7eef4;
          backdrop-filter: blur(10px);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #1268b3;
          font-size: 21px;
          font-weight: 700;
        }

        .logo-icon {
          width: 43px;
          height: 43px;
          border-radius: 12px;
          background: #e8f4fc;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .nav-link {
          border: none;
          background: transparent;
          color: #526777;
          padding: 9px 13px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 7px;
          transition: 0.2s;
        }

        .nav-link:hover {
          color: #1976d2;
          background: #f0f7fc;
        }

        .login-btn {
          border: 1px solid #1976d2;
          background: white;
          color: #1976d2;
          padding: 9px 17px;
          border-radius: 7px;
          font-size: 14px;
          cursor: pointer;
          margin-left: 7px;
          transition: 0.2s;
        }

        .login-btn:hover {
          background: #1976d2;
          color: white;
        }

        .admin-btn {
          border: 1px solid #dbeaf5;
          background: #f5faff;
          color: #39728f;
          padding: 9px 15px;
          border-radius: 7px;
          font-size: 14px;
          cursor: pointer;
          transition: 0.2s;
        }

        .admin-btn:hover {
          background: #e8f4fc;
          border-color: #bcd9ed;
        }

        .signup-nav-btn {
          border: none;
          background: #1976d2;
          color: white;
          padding: 10px 18px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 14px;
          transition: 0.2s;
        }

        .signup-nav-btn:hover {
          background: #1565c0;
          transform: translateY(-1px);
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero {
          min-height: 570px;
          padding: 75px 7%;
          display: flex;
          align-items: center;
          gap: 55px;
          background:
            radial-gradient(
              circle at 15% 30%,
              rgba(25,118,210,0.08),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #edf7fd 0%,
              #f7fbfe 55%,
              #ffffff 100%
            );
        }

        .hero-content {
          width: 52%;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 30px;
          background: #e5f3fc;
          color: #1976d2;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .hero-badge span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #43a047;
        }

        .hero h1 {
          font-size: 54px;
          line-height: 1.12;
          color: #173b57;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .hero h1 span {
          color: #1976d2;
        }

        .hero-description {
          color: #617789;
          font-size: 16px;
          line-height: 1.8;
          max-width: 590px;
          margin-bottom: 30px;
        }

        .hero-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 38px;
        }

        .primary-btn {
          border: none;
          background: #1976d2;
          color: white;
          padding: 13px 22px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .primary-btn:hover {
          background: #1565c0;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(25,118,210,0.18);
        }

        .secondary-btn {
          border: 1px solid #bcd9ed;
          background: white;
          color: #1976d2;
          padding: 13px 22px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .secondary-btn:hover {
          background: #eaf5fc;
        }

        .hero-trust {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #63798a;
          font-size: 12px;
        }

        .trust-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: white;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(25,118,210,0.08);
        }

        /* =====================================================
           HERO IMAGE
        ===================================================== */

        .hero-visual {
          width: 48%;
          display: flex;
          justify-content: center;
          position: relative;
        }

        .hero-image-box {
          width: 500px;
          height: 390px;
          border-radius: 22px;
          overflow: hidden;
          background: white;
          box-shadow:
            0 20px 50px rgba(30,90,130,0.14);
          border: 7px solid rgba(255,255,255,0.8);
        }

        .hero-image-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .floating-card {
          position: absolute;
          background: white;
          border-radius: 12px;
          padding: 14px 17px;
          box-shadow: 0 10px 30px rgba(40,80,110,0.15);
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .floating-card.one {
          left: -10px;
          bottom: 30px;
        }

        .floating-card.two {
          right: -15px;
          top: 30px;
        }

        .floating-icon {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #e7f4fc;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }

        .floating-card strong {
          display: block;
          color: #29485e;
          font-size: 13px;
          margin-bottom: 3px;
        }

        .floating-card small {
          color: #8295a3;
          font-size: 11px;
        }

        /* =====================================================
           STATS
        ===================================================== */

        .stats {
          padding: 0 7%;
          margin-top: -35px;
          position: relative;
          z-index: 2;
        }

        .stats-container {
          background: white;
          border: 1px solid #e4edf3;
          border-radius: 15px;
          padding: 24px 15px;
          display: grid;
          grid-template-columns: repeat(4,1fr);
          box-shadow: 0 10px 35px rgba(50,90,120,0.08);
        }

        .stat-item {
          text-align: center;
          border-right: 1px solid #e7eef3;
        }

        .stat-item:last-child {
          border-right: none;
        }

        .stat-number {
          color: #1976d2;
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #758996;
          font-size: 12px;
        }

        /* =====================================================
           SERVICES
        ===================================================== */

        .services {
          padding: 90px 7%;
          background: white;
        }

        .section-heading {
          text-align: center;
          max-width: 650px;
          margin: 0 auto 45px;
        }

        .section-tag {
          color: #1976d2;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .section-heading h2 {
          color: #193d57;
          font-size: 34px;
          margin-bottom: 12px;
        }

        .section-heading p {
          color: #758996;
          font-size: 14px;
          line-height: 1.7;
        }

        .service-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 20px;
        }

        .service-card {
          background: #f7fafc;
          border: 1px solid #e6eef4;
          border-radius: 15px;
          padding: 28px 22px;
          transition: 0.25s;
        }

        .service-card:hover {
          background: white;
          border-color: #c8e1f2;
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(40,100,140,0.09);
        }

        .service-icon {
          width: 52px;
          height: 52px;
          border-radius: 13px;
          background: #e8f4fc;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          margin-bottom: 20px;
        }

        .service-card h3 {
          color: #24475e;
          font-size: 17px;
          margin-bottom: 10px;
        }

        .service-card p {
          color: #7a8d99;
          font-size: 13px;
          line-height: 1.7;
        }

        .service-link {
          border: none;
          background: transparent;
          color: #1976d2;
          padding: 0;
          margin-top: 17px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        /* =====================================================
           ABOUT
        ===================================================== */

        .about {
          padding: 90px 7%;
          display: flex;
          align-items: center;
          gap: 70px;
          background: #f5f9fc;
        }

        .about-image {
          width: 48%;
          position: relative;
        }

        .about-image img {
          width: 100%;
          height: 370px;
          object-fit: cover;
          border-radius: 18px;
          box-shadow: 0 15px 40px rgba(30,80,110,0.12);
        }

        .about-content {
          width: 52%;
        }

        .about-content h2 {
          color: #193d57;
          font-size: 34px;
          line-height: 1.25;
          margin-bottom: 18px;
        }

        .about-content h2 span {
          color: #1976d2;
        }

        .about-content > p {
          color: #718694;
          line-height: 1.8;
          font-size: 14px;
          margin-bottom: 25px;
        }

        .about-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .about-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #536b7a;
          font-size: 13px;
        }

        .check-icon {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: #e3f3e8;
          color: #3a9b59;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        /* =====================================================
           APPOINTMENT CTA
        ===================================================== */

        .appointment-section {
          padding: 75px 7%;
          background: linear-gradient(
            135deg,
            #e7f4fc,
            #f4faff
          );
          text-align: center;
          border-top: 1px solid #dcecf5;
          border-bottom: 1px solid #dcecf5;
        }

        .appointment-section h2 {
          color: #193d57;
          font-size: 32px;
          margin-bottom: 10px;
        }

        .appointment-section p {
          color: #718694;
          font-size: 14px;
          margin-bottom: 25px;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .footer {
          background: white;
          padding: 35px 7%;
          border-top: 1px solid #e5edf3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .footer-logo {
          color: #1976d2;
          font-size: 18px;
          font-weight: 700;
        }

        .footer p {
          color: #81929d;
          font-size: 12px;
        }

        .footer-links {
          display: flex;
          gap: 18px;
        }

        .footer-links button {
          border: none;
          background: transparent;
          color: #718694;
          font-size: 12px;
          cursor: pointer;
        }

        .footer-links button:hover {
          color: #1976d2;
        }

        /* =====================================================
           MODAL
        ===================================================== */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(16,38,54,0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 720px;
          background: white;
          border-radius: 18px;
          padding: 30px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 25px 70px rgba(0,0,0,0.2);
          animation: modalShow 0.2s ease;
        }

        @keyframes modalShow {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .login-modal,
        .signup-modal {
          max-width: 430px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 17px;
          margin-bottom: 23px;
          border-bottom: 1px solid #e7eef3;
        }

        .modal-title-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #e7f4fc;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .modal-header h2 {
          color: #193d57;
          font-size: 22px;
        }

        .modal-header p {
          color: #8495a0;
          font-size: 11px;
          margin-top: 3px;
        }

        .close-btn {
          border: none;
          background: #f1f6f9;
          color: #607d8b;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          transition: 0.2s;
        }

        .close-btn:hover {
          background: #e5f1f8;
          color: #1976d2;
        }

        /* =====================================================
           FORMS
        ===================================================== */

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        .form-group label {
          color: #526977;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          border: 1px solid #d9e5ec;
          background: #fbfdfe;
          border-radius: 8px;
          padding: 11px 12px;
          outline: none;
          color: #405766;
          font-size: 13px;
          transition: 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #1976d2;
          background: white;
          box-shadow: 0 0 0 3px rgba(25,118,210,0.07);
        }

        .form-group textarea {
          min-height: 90px;
          resize: vertical;
        }

        .submit-btn {
          width: 100%;
          border: none;
          background: #1976d2;
          color: white;
          padding: 13px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
          transition: 0.2s;
        }

        .submit-btn:hover {
          background: #1565c0;
          transform: translateY(-1px);
        }

        /* =====================================================
           LOGIN FORM
        ===================================================== */

        .login-form,
        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .input-label {
          display: block;
          color: #526977;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .input-container {
          position: relative;
        }

        .input-container input {
          width: 100%;
          height: 47px;
          padding: 0 42px;
          border: 1px solid #d9e5ec;
          background: #fbfdfe;
          border-radius: 8px;
          outline: none;
          color: #405766;
          font-size: 13px;
        }

        .input-container input:focus {
          border-color: #1976d2;
          background: white;
          box-shadow: 0 0 0 3px rgba(25,118,210,0.07);
        }

        .input-left-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8aa0ad;
          font-size: 15px;
        }

        .password-button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #8aa0ad;
          cursor: pointer;
          font-size: 16px;
        }

        .password-button:hover {
          color: #1976d2;
        }

        .message {
          padding: 11px 13px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 16px;
          text-align: center;
        }

        .success-message {
          background: #e9f7ed;
          color: #2e7d4a;
          border: 1px solid #c9e8d2;
        }

        .error-message {
          background: #fff0f0;
          color: #c62828;
          border: 1px solid #f3cece;
        }

        .switch-note {
          text-align: center;
          color: #80919c;
          font-size: 12px;
          margin-top: 17px;
        }

        .switch-btn {
          border: none;
          background: transparent;
          color: #1976d2;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
          margin-left: 4px;
        }

        .switch-btn:hover {
          text-decoration: underline;
        }

        .admin-note {
          text-align: center;
          margin-top: 15px;
          padding: 10px;
          border-radius: 8px;
          background: #f5f9fc;
          color: #718694;
          font-size: 11px;
          line-height: 1.6;
        }

        .admin-note strong {
          color: #1976d2;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1050px) {

          .hero {
            padding-left: 5%;
            padding-right: 5%;
          }

          .hero h1 {
            font-size: 45px;
          }

          .hero-image-box {
            width: 430px;
            height: 350px;
          }

          .service-grid {
            grid-template-columns: repeat(2,1fr);
          }

        }

        @media (max-width: 850px) {

          .navbar {
            padding: 0 4%;
          }

          .nav-link {
            display: none;
          }

          .hero {
            flex-direction: column;
            text-align: center;
            padding: 60px 5%;
          }

          .hero-content,
          .hero-visual {
            width: 100%;
          }

          .hero-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .hero-description {
            max-width: 650px;
          }

          .hero-trust {
            justify-content: center;
          }

          .hero-visual {
            margin-top: 15px;
          }

          .about {
            flex-direction: column;
          }

          .about-image,
          .about-content {
            width: 100%;
          }

          .about-image {
            max-width: 650px;
          }

        }

        @media (max-width: 650px) {

          .navbar {
            height: 68px;
          }

          .logo {
            font-size: 18px;
          }

          .logo-icon {
            width: 37px;
            height: 37px;
            font-size: 18px;
          }

          .admin-btn {
            display: none;
          }

          .signup-nav-btn {
            padding: 9px 12px;
            font-size: 12px;
          }

          .login-btn {
            padding: 8px 12px;
            font-size: 12px;
          }

          .hero {
            padding: 50px 5%;
          }

          .hero h1 {
            font-size: 34px;
          }

          .hero-description {
            font-size: 14px;
          }

          .hero-buttons {
            width: 100%;
            flex-direction: column;
          }

          .hero-buttons button {
            width: 100%;
          }

          .hero-trust {
            flex-direction: column;
            gap: 12px;
          }

          .hero-image-box {
            width: 100%;
            height: 270px;
          }

          .floating-card {
            display: none;
          }

          .stats {
            padding: 0 5%;
            margin-top: 0;
          }

          .stats-container {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .stat-item {
            border-right: none;
          }

          .services,
          .about,
          .appointment-section {
            padding: 60px 5%;
          }

          .section-heading h2,
          .about-content h2 {
            font-size: 28px;
          }

          .service-grid {
            grid-template-columns: 1fr;
          }

          .about-image img {
            height: 280px;
          }

          .about-features {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-group.full {
            grid-column: auto;
          }

          .modal {
            padding: 22px;
            border-radius: 14px;
          }

          .footer {
            flex-direction: column;
            text-align: center;
          }

          .footer-links {
            justify-content: center;
            flex-wrap: wrap;
          }

        }

        @media (max-width: 400px) {

          .logo {
            gap: 6px;
          }

          .logo-icon {
            display: none;
          }

          .login-btn {
            margin-left: 0;
          }

          .hero h1 {
            font-size: 30px;
          }

          .stats-container {
            padding: 20px 10px;
          }

          .stat-number {
            font-size: 22px;
          }

        }

      `}</style>

      <div className="homepage">

        {/* =====================================================
            NAVBAR
        ===================================================== */}

        <nav className="navbar">

          <div className="logo">
            <div className="logo-icon">
              <i className="bi bi-hospital"></i>
            </div>

            MediCare
          </div>

          <div className="nav-links">

            <button
              className="nav-link"
              onClick={() => scrollToSection("home")}
            >
              Home
            </button>

            <button
              className="nav-link"
              onClick={() => scrollToSection("services")}
            >
              Services
            </button>

            <button
              className="nav-link"
              onClick={() => scrollToSection("about")}
            >
              About
            </button>

            <button
              className="nav-link"
              onClick={() => scrollToSection("contact")}
            >
              Contact
            </button>

            <button
              className="login-btn"
              onClick={openLogin}
            >
              Login
            </button>

            <button
              className="admin-btn"
              onClick={openAdminLogin}
            >
              Admin
            </button>

            <button
              className="signup-nav-btn"
              onClick={openSignup}
            >
              Sign Up
            </button>

          </div>

        </nav>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="hero" id="home">

          <div className="hero-content">

            <div className="hero-badge">
              <span></span>
              SMART HEALTHCARE MANAGEMENT
            </div>

            <h1>
              Better Healthcare,
              <br />
              <span>Better Management.</span>
            </h1>

            <p className="hero-description">
              A modern hospital management system designed
              to simplify patient care, appointments,
              doctors, pharmacy, billing and medical records
              in one organized platform.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-btn"
                onClick={openAppointment}
              >
                <i className="bi bi-calendar-plus"></i>
                &nbsp; Book Appointment
              </button>

              <button
                className="secondary-btn"
                onClick={() =>
                  scrollToSection("services")
                }
              >
                Explore Services
                &nbsp;
                <i className="bi bi-arrow-right"></i>
              </button>

            </div>

            <div className="hero-trust">

              <div className="trust-item">

                <div className="trust-icon">
                  <i className="bi bi-shield-check"></i>
                </div>

                Secure System

              </div>

              <div className="trust-item">

                <div className="trust-icon">
                  <i className="bi bi-clock"></i>
                </div>

                24/7 Management

              </div>

              <div className="trust-item">

                <div className="trust-icon">
                  <i className="bi bi-people"></i>
                </div>

                Easy to Use

              </div>

            </div>

          </div>

          <div className="hero-visual">

            <div className="hero-image-box">

              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=85"
                alt="Modern Hospital"
              />

            </div>

          </div>

        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="stats">

          <div className="stats-container">

            <div className="stat-item">

              <div className="stat-number">
                1,248+
              </div>

              <div className="stat-label">
                Patients Managed
              </div>

            </div>

            <div className="stat-item">

              <div className="stat-number">
                50+
              </div>

              <div className="stat-label">
                Qualified Doctors
              </div>

            </div>

            <div className="stat-item">

              <div className="stat-number">
                15+
              </div>

              <div className="stat-label">
                Departments
              </div>

            </div>

            <div className="stat-item">

              <div className="stat-number">
                24/7
              </div>

              <div className="stat-label">
                Healthcare Support
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            SERVICES
        ===================================================== */}

        <section className="services" id="services">

          <div className="section-heading">

            <div className="section-tag">
              OUR SERVICES
            </div>

            <h2>
              Everything You Need
              <br />
              In One Platform
            </h2>

            <p>
              Manage your hospital operations with simple
              and organized tools designed for healthcare.
            </p>

          </div>

          <div className="service-grid">

            <div className="service-card">

              <div className="service-icon">
                <i className="bi bi-person-vcard"></i>
              </div>

              <h3>
                Patient Management
              </h3>

              <p>
                Store and manage patient information,
                medical history and records efficiently.
              </p>

              <button
                className="service-link"
                onClick={openLogin}
              >
                Learn More →
              </button>

            </div>

            <div className="service-card">

              <div className="service-icon">
                <i className="bi bi-calendar2-check"></i>
              </div>

              <h3>
                Appointments
              </h3>

              <p>
                Schedule appointments and manage
                doctor availability with ease.
              </p>

              <button
                className="service-link"
                onClick={openAppointment}
              >
                Book Now →
              </button>

            </div>

            <div className="service-card">

              <div className="service-icon">
                <i className="bi bi-capsule"></i>
              </div>

              <h3>
                Pharmacy
              </h3>

              <p>
                Manage medicines, prescriptions,
                stock and pharmacy information.
              </p>

              <button
                className="service-link"
                onClick={openLogin}
              >
                Learn More →
              </button>

            </div>

            <div className="service-card">

              <div className="service-icon">
                <i className="bi bi-receipt"></i>
              </div>

              <h3>
                Billing
              </h3>

              <p>
                Manage patient billing, payments
                and transaction information.
              </p>

              <button
                className="service-link"
                onClick={openLogin}
              >
                Learn More →
              </button>

            </div>

          </div>

        </section>

        {/* =====================================================
            ABOUT
        ===================================================== */}

        <section className="about" id="about">

          <div className="about-image">

            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=85"
              alt="Healthcare Professionals"
            />

          </div>

          <div className="about-content">

            <div className="section-tag">
              ABOUT MEDICARE
            </div>

            <h2>
              Healthcare Management
              <br />
              <span>Made Simple.</span>
            </h2>

            <p>
              MediCare Hospital Management System brings
              important hospital operations together in one
              easy-to-use platform. It helps hospitals manage
              patients, doctors, appointments, pharmacy,
              billing and medical records efficiently.
            </p>

            <div className="about-features">

              <div className="about-feature">
                <div className="check-icon">
                  ✓
                </div>
                Easy Patient Management
              </div>

              <div className="about-feature">
                <div className="check-icon">
                  ✓
                </div>
                Doctor Management
              </div>

              <div className="about-feature">
                <div className="check-icon">
                  ✓
                </div>
                Appointment Scheduling
              </div>

              <div className="about-feature">
                <div className="check-icon">
                  ✓
                </div>
                Medical Records
              </div>

              <div className="about-feature">
                <div className="check-icon">
                  ✓
                </div>
                Pharmacy Management
              </div>

              <div className="about-feature">
                <div className="check-icon">
                  ✓
                </div>
                Billing Management
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            APPOINTMENT CTA
        ===================================================== */}

        <section
          className="appointment-section"
          id="contact"
        >

          <div className="section-tag">
            GET STARTED
          </div>

          <h2>
            Need Medical Assistance?
          </h2>

          <p>
            Book an appointment with our healthcare
            professionals today.
          </p>

          <button
            className="primary-btn"
            onClick={openAppointment}
          >
            <i className="bi bi-calendar-plus"></i>
            &nbsp; Book an Appointment
          </button>

        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="footer">

          <div className="footer-logo">
            <i className="bi bi-hospital"></i>
            &nbsp; MediCare
          </div>

          <p>
            © 2026 MediCare Hospital Management System
          </p>

          <div className="footer-links">

            <button
              onClick={() => scrollToSection("home")}
            >
              Home
            </button>

            <button
              onClick={() => scrollToSection("services")}
            >
              Services
            </button>

            <button
              onClick={() => scrollToSection("about")}
            >
              About
            </button>

            <button
              onClick={() => scrollToSection("contact")}
            >
              Contact
            </button>

          </div>

        </footer>

        {/* =====================================================
            APPOINTMENT MODAL
        ===================================================== */}

        {showAppointment && (

          <div
            className="modal-overlay"
            onClick={closeAppointment}
          >

            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div className="modal-title-area">

                  <div className="modal-title-icon">
                    <i className="bi bi-calendar-plus"></i>
                  </div>

                  <div>

                    <h2>
                      Book Appointment
                    </h2>

                    <p>
                      Enter patient and appointment details
                    </p>

                  </div>

                </div>

                <button
                  className="close-btn"
                  onClick={closeAppointment}
                >
                  ×
                </button>

              </div>

              {appointmentMessage && (
                <div
                  className={
                    appointmentMessage.includes(
                      "successfully"
                    )
                      ? "message success-message"
                      : "message error-message"
                  }
                >
                  {appointmentMessage}
                </div>
              )}

              <form
                onSubmit={
                  handleAppointmentSubmit
                }
              >

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Patient Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={
                        handleAppointmentChange
                      }
                      placeholder="Enter patient name"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={
                        handleAppointmentChange
                      }
                      placeholder="Enter phone number"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Age
                    </label>

                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={
                        handleAppointmentChange
                      }
                      placeholder="Enter age"
                      min="1"
                      max="120"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={
                        handleAppointmentChange
                      }
                    >

                      <option value="">
                        Select Gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Department
                    </label>

                    <select
                      name="department"
                      value={formData.department}
                      onChange={
                        handleAppointmentChange
                      }
                    >

                      <option value="">
                        Select Department
                      </option>

                      <option value="Cardiology">
                        Cardiology
                      </option>

                      <option value="Neurology">
                        Neurology
                      </option>

                      <option value="Orthopedics">
                        Orthopedics
                      </option>

                      <option value="General Medicine">
                        General Medicine
                      </option>

                      <option value="Pediatrics">
                        Pediatrics
                      </option>

                      <option value="Dermatology">
                        Dermatology
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Doctor
                    </label>

                    <select
                      name="doctor"
                      value={formData.doctor}
                      onChange={
                        handleAppointmentChange
                      }
                    >

                      <option value="">
                        Select Doctor
                      </option>

                      <option value="Dr. Rajesh Kumar">
                        Dr. Rajesh Kumar
                      </option>

                      <option value="Dr. Priya Sharma">
                        Dr. Priya Sharma
                      </option>

                      <option value="Dr. Karthik">
                        Dr. Karthik
                      </option>

                      <option value="Dr. Anitha Raj">
                        Dr. Anitha Raj
                      </option>

                      <option value="Dr. Arun Kumar">
                        Dr. Arun Kumar
                      </option>

                      <option value="Dr. Meena Devi">
                        Dr. Meena Devi
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Appointment Date
                    </label>

                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={
                        handleAppointmentChange
                      }
                      min={
                        new Date()
                          .toISOString()
                          .split("T")[0]
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Appointment Time
                    </label>

                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={
                        handleAppointmentChange
                      }
                    />

                  </div>

                  <div className="form-group full">

                    <label>
                      Health Issue
                    </label>

                    <textarea
                      name="issue"
                      value={formData.issue}
                      onChange={
                        handleAppointmentChange
                      }
                      placeholder="Describe the patient's health issue"
                    />

                  </div>

                </div>

                <button
                  type="submit"
                  className="submit-btn"
                >
                  <i className="bi bi-calendar-check"></i>
                  &nbsp; Confirm Appointment
                </button>

              </form>

            </div>

          </div>

        )}

        {/* =====================================================
            LOGIN MODAL
        ===================================================== */}

        {showLogin && (

          <div
            className="modal-overlay"
            onClick={closeLogin}
          >

            <div
              className="modal login-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div className="modal-title-area">

                  <div className="modal-title-icon">
                    <i className="bi bi-person"></i>
                  </div>

                  <div>

                    <h2>
                      Welcome Back
                    </h2>

                    <p>
                      Sign in to your MediCare account
                    </p>

                  </div>

                </div>

                <button
                  className="close-btn"
                  onClick={closeLogin}
                >
                  ×
                </button>

              </div>

              {loginMessage && (
                <div
                  className={
                    loginMessage.includes(
                      "successful"
                    )
                      ? "message success-message"
                      : "message error-message"
                  }
                >
                  {loginMessage}
                </div>
              )}

              <form
                className="login-form"
                onSubmit={handleLogin}
              >

                <div>

                  <label className="input-label">
                    Email Address
                  </label>

                  <div className="input-container">

                    <i className="bi bi-envelope input-left-icon"></i>

                    <input
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={
                        handleLoginChange
                      }
                      placeholder="Enter your email"
                    />

                  </div>

                </div>

                <div>

                  <label className="input-label">
                    Password
                  </label>

                  <div className="input-container">

                    <i className="bi bi-lock input-left-icon"></i>

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={
                        loginData.password
                      }
                      onChange={
                        handleLoginChange
                      }
                      placeholder="Enter your password"
                    />

                    <button
                      type="button"
                      className="password-button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                    >
                      <i
                        className={
                          showPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye"
                        }
                      ></i>
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  className="submit-btn"
                >
                  <i className="bi bi-box-arrow-in-right"></i>
                  &nbsp; Login
                </button>

              </form>

              <p className="switch-note">

                Don't have an account?

                <button
                  className="switch-btn"
                  onClick={switchToSignup}
                >
                  Sign Up
                </button>

              </p>

            </div>

          </div>

        )}

        {/* =====================================================
            ADMIN LOGIN
        ===================================================== */}

        {showAdminLogin && (

          <div
            className="modal-overlay"
            onClick={closeAdminLogin}
          >

            <div
              className="modal login-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div className="modal-title-area">

                  <div className="modal-title-icon">
                    <i className="bi bi-shield-lock"></i>
                  </div>

                  <div>

                    <h2>
                      Admin Login
                    </h2>

                    <p>
                      Access hospital administration
                    </p>

                  </div>

                </div>

                <button
                  className="close-btn"
                  onClick={closeAdminLogin}
                >
                  ×
                </button>

              </div>

              {adminLoginMessage && (
                <div
                  className={
                    adminLoginMessage.includes(
                      "successful"
                    )
                      ? "message success-message"
                      : "message error-message"
                  }
                >
                  {adminLoginMessage}
                </div>
              )}

              <form
                className="login-form"
                onSubmit={
                  handleAdminLogin
                }
              >

                <div>

                  <label className="input-label">
                    Admin Email
                  </label>

                  <div className="input-container">

                    <i className="bi bi-envelope input-left-icon"></i>

                    <input
                      type="email"
                      name="email"
                      value={
                        adminLoginData.email
                      }
                      onChange={
                        handleAdminLoginChange
                      }
                      placeholder="Enter admin email"
                    />

                  </div>

                </div>

                <div>

                  <label className="input-label">
                    Password
                  </label>

                  <div className="input-container">

                    <i className="bi bi-lock input-left-icon"></i>

                    <input
                      type={
                        showAdminPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={
                        adminLoginData.password
                      }
                      onChange={
                        handleAdminLoginChange
                      }
                      placeholder="Enter admin password"
                    />

                    <button
                      type="button"
                      className="password-button"
                      onClick={() =>
                        setShowAdminPassword(
                          !showAdminPassword
                        )
                      }
                    >
                      <i
                        className={
                          showAdminPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye"
                        }
                      ></i>
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  className="submit-btn"
                >
                  <i className="bi bi-shield-check"></i>
                  &nbsp; Login as Admin
                </button>

              </form>

              <div className="admin-note">

                Demo Admin Account
                <br />

                <strong>
                  admin@medicare.com
                </strong>

                <br />

                Password:
                <strong>
                  admin123
                </strong>

              </div>

            </div>

          </div>

        )}

        {/* =====================================================
            SIGN UP
        ===================================================== */}

        {showSignup && (

          <div
            className="modal-overlay"
            onClick={closeSignup}
          >

            <div
              className="modal signup-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div className="modal-title-area">

                  <div className="modal-title-icon">
                    <i className="bi bi-person-plus"></i>
                  </div>

                  <div>

                    <h2>
                      Create Account
                    </h2>

                    <p>
                      Register for MediCare
                    </p>

                  </div>

                </div>

                <button
                  className="close-btn"
                  onClick={closeSignup}
                >
                  ×
                </button>

              </div>

              {signupMessage && (
                <div
                  className={
                    signupMessage.includes(
                      "successfully"
                    )
                      ? "message success-message"
                      : "message error-message"
                  }
                >
                  {signupMessage}
                </div>
              )}

              <form
                className="signup-form"
                onSubmit={handleSignup}
              >

                <div>

                  <label className="input-label">
                    Full Name
                  </label>

                  <div className="input-container">

                    <i className="bi bi-person input-left-icon"></i>

                    <input
                      type="text"
                      name="name"
                      value={signupData.name}
                      onChange={
                        handleSignupChange
                      }
                      placeholder="Enter your full name"
                    />

                  </div>

                </div>

                <div>

                  <label className="input-label">
                    Email Address
                  </label>

                  <div className="input-container">

                    <i className="bi bi-envelope input-left-icon"></i>

                    <input
                      type="email"
                      name="email"
                      value={signupData.email}
                      onChange={
                        handleSignupChange
                      }
                      placeholder="Enter your email"
                    />

                  </div>

                </div>

                <div>

                  <label className="input-label">
                    Phone Number
                  </label>

                  <div className="input-container">

                    <i className="bi bi-telephone input-left-icon"></i>

                    <input
                      type="tel"
                      name="phone"
                      value={signupData.phone}
                      onChange={
                        handleSignupChange
                      }
                      placeholder="Enter phone number"
                    />

                  </div>

                </div>

                <div>

                  <label className="input-label">
                    Password
                  </label>

                  <div className="input-container">

                    <i className="bi bi-lock input-left-icon"></i>

                    <input
                      type={
                        showSignupPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={
                        signupData.password
                      }
                      onChange={
                        handleSignupChange
                      }
                      placeholder="Create password"
                    />

                    <button
                      type="button"
                      className="password-button"
                      onClick={() =>
                        setShowSignupPassword(
                          !showSignupPassword
                        )
                      }
                    >
                      <i
                        className={
                          showSignupPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye"
                        }
                      ></i>
                    </button>

                  </div>

                </div>

                <div>

                  <label className="input-label">
                    Confirm Password
                  </label>

                  <div className="input-container">

                    <i className="bi bi-lock-fill input-left-icon"></i>

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={
                        signupData.confirmPassword
                      }
                      onChange={
                        handleSignupChange
                      }
                      placeholder="Confirm password"
                    />

                    <button
                      type="button"
                      className="password-button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                    >
                      <i
                        className={
                          showConfirmPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye"
                        }
                      ></i>
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  className="submit-btn"
                >
                  <i className="bi bi-person-plus"></i>
                  &nbsp; Create Account
                </button>

              </form>

              <p className="switch-note">

                Already have an account?

                <button
                  className="switch-btn"
                  onClick={switchToLogin}
                >
                  Login
                </button>

              </p>

            </div>

          </div>

        )}

      </div>
    </>
  );
}

export default Homepage;