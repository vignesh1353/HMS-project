import React, { useState, useEffect } from "react";
import patientService from "../../Services/patientService";
import { useAuth } from "../../context/AuthContext";

function MyProfile() {
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: user?.name || "Patient",
    patientId: "PAT-1001",
    email: user?.email || "patient@medcare.com",
    phone: user?.phone || "+91 98765 43210",
    gender: "Male",
    age: "21",
    dob: "15 August 2003",
    bloodGroup: "B+",
    address: "Coimbatore, Tamil Nadu",
    emergencyName: "Emergency Contact",
    emergencyPhone: "+91 98765 12345",
  });

  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await patientService.getMyProfile();
        if (res && res.data) {
          const p = res.data;
          const loaded = {
            name: p.user?.name || p.name || user?.name || "Patient",
            patientId: p.patientId || "PAT-1001",
            email: p.user?.email || p.email || user?.email || "",
            phone: p.user?.phone || p.phone || user?.phone || "",
            gender: p.gender || "Male",
            age: p.age !== undefined && p.age !== null && p.age !== "" ? String(p.age) : "21",
            dob: p.dob || "15 August 2003",
            bloodGroup: p.bloodGroup || "B+",
            address: p.address || "Coimbatore, Tamil Nadu",
            emergencyName: p.emergencyContact?.name || p.emergencyName || "Emergency Contact",
            emergencyPhone: p.emergencyContact?.phone || p.emergencyPhone || "+91 98765 12345",
          };
          setProfile(loaded);
          setFormData(loaded);
        }
      } catch (err) {
        console.error("Error fetching patient profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      await patientService.updateMyProfile({
        name: formData.name,
        phone: formData.phone,
        age: formData.age !== "" && formData.age !== undefined ? Number(formData.age) : undefined,
        gender: formData.gender,
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
        },
      });
      setProfile(formData);
      setShowEdit(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setProfile(formData);
      setShowEdit(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f7fb;
          color: #1e293b;
        }

        /* ================= PAGE ANIMATIONS ================= */

        @keyframes pageStart {
          from {
            opacity: 0;
            transform: translateY(15px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes introStart {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.99);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes profileStart {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardStart {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes avatarStart {
          from {
            opacity: 0;
            transform: scale(0.75);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes modalOverlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes formFieldIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ================= MAIN CONTENT ================= */

        .main-content {
          margin-left: 240px;
          margin-top: 70px;
          padding: 30px;
          min-height: calc(100vh - 70px);
          background: #f4f7fb;

          animation: pageStart 0.35s ease-out;
        }

        /* ================= PAGE INTRO ================= */

        .page-intro {
          width: 100%;
          min-height: 102px;
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 15px;
          padding: 21px 25px;
          margin-bottom: 25px;

          transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;

          animation: introStart 0.35s ease-out;
        }

        .page-intro:hover {
          border-color: #90caf9;
          box-shadow: 0 5px 15px rgba(25, 118, 210, 0.08);
          transform: translateY(-2px);
        }

        .page-intro h1 {
          margin: 0;
          color: #1976d2;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .page-intro p {
          margin: 7px 0 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.4;
        }

        /* ================= PROFILE TOP CARD ================= */

        .profile-top-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border: 1px solid #dceaf5;
          margin-bottom: 22px;

          box-shadow: 0 4px 15px rgba(25, 118, 210, 0.05);

          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;

          animation: profileStart 0.35s ease-out 0.08s both;
        }

        .profile-top-card:hover {
          transform: translateY(-3px);
          border-color: #bbdefb;
          box-shadow: 0 8px 22px rgba(25, 118, 210, 0.09);
        }

        .profile-main {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        /* ================= PROFILE AVATAR ================= */

        .profile-avatar {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: #e3f2fd;
          border: 1px solid #bbdefb;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #1976d2;
          font-size: 28px;
          font-weight: 700;
          flex-shrink: 0;

          animation: avatarStart 0.45s ease-out 0.18s both;

          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            background 0.3s ease;
        }

        .profile-avatar:hover {
          transform: scale(1.05);
          background: #d6ecfb;
          box-shadow: 0 6px 15px rgba(25, 118, 210, 0.12);
        }

        .profile-name {
          animation: profileStart 0.35s ease-out 0.18s both;
        }

        .profile-name h2 {
          margin: 0;
          color: #1e293b;
          font-size: 22px;
        }

        .profile-name p {
          margin: 6px 0 10px;
          color: #64748b;
          font-size: 13px;
        }

        .active-badge {
          display: inline-block;
          background: #e8f5e9;
          color: #2e7d32;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .active-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(46, 125, 50, 0.12);
        }

        /* ================= EDIT BUTTON ================= */

        .edit-profile-btn {
          border: 1px solid #1976d2;
          background: #1976d2;
          color: #ffffff;

          padding: 11px 20px;
          border-radius: 8px;

          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.15s ease,
            box-shadow 0.2s ease;
        }

        .edit-profile-btn:hover {
          background: #1565c0;
          border-color: #1565c0;
          box-shadow: 0 4px 10px rgba(25, 118, 210, 0.18);
          transform: translateY(-2px);
        }

        .edit-profile-btn:active {
          transform: scale(0.94);
          box-shadow: 0 2px 5px rgba(21, 101, 192, 0.35);
        }

        /* ================= INFORMATION GRID ================= */

        .information-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        /* ================= INFO CARD ================= */

        .info-card {
          background: #ffffff;
          border: 1px solid #dceaf5;
          border-radius: 14px;
          padding: 22px;

          box-shadow: 0 4px 15px rgba(25, 118, 210, 0.04);

          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;

          animation: cardStart 0.35s ease-out both;
        }

        .info-card:nth-child(1) {
          animation-delay: 0.20s;
        }

        .info-card:nth-child(2) {
          animation-delay: 0.25s;
        }

        .info-card:nth-child(3) {
          animation-delay: 0.30s;
        }

        .info-card:nth-child(4) {
          animation-delay: 0.35s;
        }

        .info-card:hover {
          transform: translateY(-4px);
          border-color: #bbdefb;
          box-shadow: 0 8px 20px rgba(25, 118, 210, 0.08);
        }

        .info-card h3 {
          margin: 0 0 18px;
          color: #1976d2;
          font-size: 16px;
          font-weight: 700;
        }

        /* ================= INFO ROW ================= */

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;

          padding: 12px 0;

          border-bottom: 1px solid #eef2f6;

          transition:
            background 0.2s ease,
            padding-left 0.2s ease,
            padding-right 0.2s ease;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row:hover {
          background: #f8fbff;
          padding-left: 6px;
          padding-right: 6px;
          border-radius: 6px;
        }

        .info-label {
          color: #94a3b8;
          font-size: 12px;
        }

        .info-value {
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          text-align: right;
          max-width: 60%;
        }

        /* ================= MODAL OVERLAY ================= */

        .modal-overlay {
          position: fixed;
          inset: 0;

          background: rgba(15, 23, 42, 0.45);

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          z-index: 9999;

          animation: modalOverlayIn 0.2s ease-out;
        }

        /* ================= MODAL ================= */

        .modal {
          width: 100%;
          max-width: 600px;

          max-height: 90vh;
          overflow-y: auto;

          background: #ffffff;
          border-radius: 16px;
          padding: 25px;

          box-shadow: 0 20px 50px rgba(25, 118, 210, 0.18);

          animation: modalIn 0.28s ease-out;
        }

        /* ================= MODAL HEADER ================= */

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .modal-header h2 {
          margin: 0;
          color: #1976d2;
          font-size: 20px;
          font-weight: 700;
        }

        /* ================= CLOSE BUTTON ================= */

        .close-btn {
          width: 34px;
          height: 34px;

          border: none;
          border-radius: 8px;

          background: #e3f2fd;
          color: #1976d2;

          font-size: 20px;
          cursor: pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .close-btn:hover {
          background: #bbdefb;
          color: #1565c0;
          transform: rotate(90deg);
        }

        .close-btn:active {
          transform: scale(0.9) rotate(90deg);
        }

        /* ================= FORM ================= */

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
        }

        .form-full {
          grid-column: 1 / -1;
        }

        .input-group {
          width: 100%;
          animation: formFieldIn 0.3s ease-out both;
        }

        .input-group:nth-child(1) {
          animation-delay: 0.05s;
        }

        .input-group:nth-child(2) {
          animation-delay: 0.08s;
        }

        .input-group:nth-child(3) {
          animation-delay: 0.11s;
        }

        .input-group:nth-child(4) {
          animation-delay: 0.14s;
        }

        .input-group:nth-child(5) {
          animation-delay: 0.17s;
        }

        .input-group:nth-child(6) {
          animation-delay: 0.20s;
        }

        .input-group:nth-child(7) {
          animation-delay: 0.23s;
        }

        .input-group:nth-child(8) {
          animation-delay: 0.26s;
        }

        .input-group:nth-child(9) {
          animation-delay: 0.29s;
        }

        .input-group label {
          display: block;
          margin-bottom: 7px;
          color: #546e7a;
          font-size: 12px;
          font-weight: 600;
        }

        .input-group input {
          width: 100%;
          height: 40px;

          padding: 0 12px;

          border: 1px solid #dbe3ec;
          border-radius: 8px;

          outline: none;

          font-size: 13px;
          color: #334155;
          background: #ffffff;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .input-group input:hover {
          border-color: #bbdefb;
        }

        .input-group input:focus {
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.10);
          transform: translateY(-1px);
        }

        /* ================= MODAL BUTTONS ================= */

        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;

          animation: formFieldIn 0.3s ease-out 0.32s both;
        }

        .cancel-btn {
          padding: 10px 19px;

          border: 1px solid #dbe3ec;
          background: #ffffff;
          color: #64748b;

          border-radius: 8px;

          cursor: pointer;

          font-size: 13px;
          font-weight: 600;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.15s ease;
        }

        .cancel-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }

        .cancel-btn:active {
          transform: scale(0.94);
        }

        .save-btn {
          padding: 10px 20px;

          border: 1px solid #1976d2;
          background: #1976d2;
          color: #ffffff;

          border-radius: 8px;

          cursor: pointer;

          font-size: 13px;
          font-weight: 600;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.15s ease,
            box-shadow 0.2s ease;
        }

        .save-btn:hover {
          background: #1565c0;
          border-color: #1565c0;
          box-shadow: 0 4px 10px rgba(25, 118, 210, 0.18);
          transform: translateY(-2px);
        }

        .save-btn:active {
          transform: scale(0.94);
          box-shadow: 0 2px 5px rgba(21, 101, 192, 0.35);
        }

        /* ================= SCROLLBAR ================= */

        .modal::-webkit-scrollbar {
          width: 6px;
        }

        .modal::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }

        .modal::-webkit-scrollbar-thumb {
          background: #bbdefb;
          border-radius: 10px;
        }

        .modal::-webkit-scrollbar-thumb:hover {
          background: #90caf9;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1000px) {
          .information-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 800px) {
          .main-content {
            margin-left: 0;
            margin-top: 70px;
            padding: 20px;
          }
        }

        @media (max-width: 600px) {
          .main-content {
            padding: 15px;
          }

          .page-intro {
            min-height: 95px;
            padding: 18px 20px;
            border-radius: 14px;
          }

          .page-intro h1 {
            font-size: 24px;
          }

          .page-intro p {
            font-size: 13px;
          }

          .profile-top-card {
            padding: 20px;
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-main {
            width: 100%;
          }

          .edit-profile-btn {
            width: 100%;
          }

          .profile-avatar {
            width: 70px;
            height: 70px;
            font-size: 24px;
          }

          .profile-name h2 {
            font-size: 19px;
          }

          .information-grid {
            gap: 15px;
          }

          .info-card {
            padding: 18px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-full {
            grid-column: auto;
          }

          .modal {
            padding: 20px;
          }

          .modal-buttons {
            flex-direction: column-reverse;
          }

          .cancel-btn,
          .save-btn {
            width: 100%;
          }
        }

        /* ================= REDUCE MOTION ================= */

        @media (prefers-reduced-motion: reduce) {
          .main-content,
          .page-intro,
          .profile-top-card,
          .profile-avatar,
          .profile-name,
          .info-card,
          .input-group,
          .modal-overlay,
          .modal,
          .modal-buttons {
            animation: none !important;
          }

          .page-intro,
          .profile-top-card,
          .info-card,
          .profile-avatar,
          .edit-profile-btn,
          .close-btn,
          .cancel-btn,
          .save-btn,
          .input-group input {
            transition: none !important;
          }
        }
      `}</style>

      {/* ================= MAIN CONTENT ================= */}

      <div className="main-content">

        {/* ================= PAGE INTRO ================= */}

        <div className="page-intro">
          <h1>
            My Profile
          </h1>

          <p>
            Manage your personal and contact information
          </p>
        </div>

        {/* ================= PROFILE TOP CARD ================= */}

        <div className="profile-top-card">

          <div className="profile-main">

            <div className="profile-avatar">
              AK
            </div>

            <div className="profile-name">

              <h2>
                {profile.name}
              </h2>

              <p>
                Patient ID: {profile.patientId}
              </p>

              <span className="active-badge">
                Active Patient
              </span>

            </div>

          </div>

          <button
            className="edit-profile-btn"
            onClick={() => {
              setFormData(profile);
              setShowEdit(true);
            }}
          >
            Edit Profile
          </button>

        </div>

        {/* ================= INFORMATION GRID ================= */}

        <div className="information-grid">

          {/* PERSONAL INFORMATION */}

          <div className="info-card">

            <h3>
              Personal Information
            </h3>

            <InfoRow
              label="Full Name"
              value={profile.name}
            />

            <InfoRow
              label="Patient ID"
              value={profile.patientId}
            />

            <InfoRow
              label="Age"
              value={profile.age ? `${profile.age} Years` : "—"}
            />

            <InfoRow
              label="Gender"
              value={profile.gender}
            />

            <InfoRow
              label="Date of Birth"
              value={profile.dob}
            />

            <InfoRow
              label="Blood Group"
              value={profile.bloodGroup}
            />

          </div>

          {/* CONTACT INFORMATION */}

          <div className="info-card">

            <h3>
              Contact Information
            </h3>

            <InfoRow
              label="Email"
              value={profile.email}
            />

            <InfoRow
              label="Phone Number"
              value={profile.phone}
            />

            <InfoRow
              label="Address"
              value={profile.address}
            />

          </div>

          {/* EMERGENCY CONTACT */}

          <div className="info-card">

            <h3>
              Emergency Contact
            </h3>

            <InfoRow
              label="Contact Person"
              value={profile.emergencyName}
            />

            <InfoRow
              label="Phone Number"
              value={profile.emergencyPhone}
            />

          </div>

          {/* ACCOUNT INFORMATION */}

          <div className="info-card">

            <h3>
              Account Information
            </h3>

            <InfoRow
              label="Account Status"
              value="Active"
            />

            <InfoRow
              label="Patient ID"
              value={profile.patientId}
            />

            <InfoRow
              label="Email Verified"
              value="Verified"
            />

          </div>

        </div>

        {/* ================= EDIT PROFILE MODAL ================= */}

        {showEdit && (

          <div
            className="modal-overlay"
            onClick={() => setShowEdit(false)}
          >

            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >

              {/* MODAL HEADER */}

              <div className="modal-header">

                <h2>
                  Edit Profile
                </h2>

                <button
                  className="close-btn"
                  onClick={() => setShowEdit(false)}
                >
                  ×
                </button>

              </div>

              {/* FORM */}

              <div className="form-grid">

                <InputField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />

                <InputField
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />

                <InputField
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />

                <InputField
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                />

                <InputField
                  label="Age"
                  name="age"
                  value={formData.age !== undefined ? formData.age : ""}
                  onChange={handleChange}
                />

                <InputField
                  label="Date of Birth"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />

                <InputField
                  label="Blood Group"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                />

                <div className="form-full">

                  <InputField
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />

                </div>

                <InputField
                  label="Emergency Contact"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                />

                <InputField
                  label="Emergency Phone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                />

              </div>

              {/* MODAL BUTTONS */}

              <div className="modal-buttons">

                <button
                  className="cancel-btn"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>

                <button
                  className="save-btn"
                  onClick={handleSave}
                >
                  Save Changes
                </button>

              </div>

            </div>

          </div>

        )}

      </div>
    </>
  );
}

/* ================= INFO ROW ================= */

function InfoRow({ label, value }) {
  return (
    <div className="info-row">

      <span className="info-label">
        {label}
      </span>

      <span className="info-value">
        {value}
      </span>

    </div>
  );
}

/* ================= INPUT FIELD ================= */

function InputField({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div className="input-group">

      <label>
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
      />

    </div>
  );
}

export default MyProfile;