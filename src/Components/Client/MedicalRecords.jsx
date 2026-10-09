import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboard,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import medicalRecordService from "../../Services/medicalRecordService";

function MedicalRecords() {
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await medicalRecordService.getMedicalRecords();
        if (res && res.data) {
          setRecords(res.data.map((r) => ({
            ...r,
            id: r._id || r.id || r.recordId,
            date: r.date,
            title: r.title || r.diagnosis || "Medical Record",
            doctor: r.doctorName || r.doctor?.name || "Dr. Rajesh Kumar",
            department: r.department || "General",
            type: r.type || "Medical Report",
            status: r.status || "Available",
            description: r.description || r.diagnosis || "Medical examination and consultation report.",
          })));
        }
      } catch (err) {
        console.error("Error fetching medical records:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(
    (record) =>
      record.title.toLowerCase().includes(search.toLowerCase()) ||
      record.doctor.toLowerCase().includes(search.toLowerCase()) ||
      record.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
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

        @keyframes recordStart {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* ================= MAIN CONTENT ================= */

        .main-content {
          margin-left: 240px;
          margin-top: 70px;
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fb;

          animation: pageStart 0.35s ease-out;
        }

        /* ================= PAGE HEADER ================= */

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 25px;

          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 14px;

          padding: 22px 25px;

          box-shadow:
            0 4px 14px rgba(25, 118, 210, 0.06);

          transition:
            background 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;

          animation: headerStart 0.30s ease-out;
        }

        .page-header:hover {
          background: #e3f2fd;
          border-color: #90caf9;

          box-shadow:
            0 7px 18px rgba(25, 118, 210, 0.10);

          transform: translateY(-2px);
        }

        .page-intro h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #1976d2;
        }

        .page-intro p {
          margin: 7px 0 0;
          font-size: 14px;
          color: #546e7a;
        }

        /* ================= SEARCH ================= */

        .search-box {
          width: 100%;
          background: #ffffff;
          border: 1px solid #e1e8f0;
          border-radius: 12px;

          padding: 15px;
          margin-bottom: 25px;

          box-shadow:
            0 3px 10px rgba(25, 118, 210, 0.04);

          animation: searchStart 0.30s ease-out 0.05s both;
        }

        .search-wrapper {
          position: relative;
          width: 300px;
        }

        .search-input {
          width: 300px;
          height: 40px;

          padding: 0 15px 0 40px;

          border: 1px solid #d5dde7;
          border-radius: 8px;

          outline: none;

          font-size: 13px;
          color: #334155;

          background: #ffffff;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .search-icon {
          position: absolute;

          left: 14px;
          top: 50%;

          transform: translateY(-50%);

          color: #94a3b8;

          font-size: 14px;

          pointer-events: none;

          z-index: 2;

          transition: color 0.2s ease;
        }

        .search-wrapper:focus-within .search-icon {
          color: #1976d2;
        }

        .search-input:focus {
          border-color: #1976d2;

          box-shadow:
            0 0 0 3px #e3f2fd;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        /* ================= RECORD GRID ================= */

        .records-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        /* ================= RECORD CARD ================= */

        .record-card {
          background: #ffffff;

          border: 1px solid #e1e8f0;
          border-radius: 14px;

          padding: 22px;

          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;

          animation: recordStart 0.30s ease-out both;
        }

        /* Fast stagger animation */

        .record-card:nth-child(1) {
          animation-delay: 0.08s;
        }

        .record-card:nth-child(2) {
          animation-delay: 0.12s;
        }

        .record-card:nth-child(3) {
          animation-delay: 0.16s;
        }

        .record-card:nth-child(4) {
          animation-delay: 0.20s;
        }

        .record-card:nth-child(5) {
          animation-delay: 0.24s;
        }

        .record-card:hover {
          transform: translateY(-3px);

          border-color: #bbdefb;

          box-shadow:
            0 8px 22px rgba(25, 118, 210, 0.10);
        }

        /* ================= RECORD TOP ================= */

        .record-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          margin-bottom: 18px;
        }

        .record-title-section {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .record-icon {
          width: 55px;
          height: 55px;

          border-radius: 12px;

          background: #e3f2fd;
          border: 1px solid #bbdefb;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 26px;

          flex-shrink: 0;
        }

        .record-title h3 {
          margin: 0;

          color: #1e293b;

          font-size: 16px;
          font-weight: 700;
        }

        .record-title p {
          margin: 5px 0 0;

          color: #1976d2;

          font-size: 12px;
          font-weight: 600;
        }

        /* ================= STATUS ================= */

        .status {
          background: #e8f5e9;
          color: #2e7d32;

          padding: 6px 10px;

          border-radius: 20px;

          font-size: 10px;
          font-weight: 600;

          white-space: nowrap;
        }

        /* ================= DETAILS ================= */

        .record-details {
          border-top: 1px solid #eef2f6;

          padding-top: 15px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;

          gap: 15px;

          margin-bottom: 11px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          color: #94a3b8;
          font-size: 11px;
        }

        .detail-value {
          color: #334155;

          font-size: 12px;
          font-weight: 600;

          text-align: right;
        }

        /* ================= VIEW DETAILS BUTTON ================= */

        .record-actions {
          margin-top: 18px;
        }

        .view-btn {
          width: 100%;
          height: 40px;

          padding: 10px;

          border: 1px solid #1976d2;
          border-radius: 8px;

          background: #1976d2;

          color: #ffffff;

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.1s ease;
        }

        .view-btn:hover {
          background: #1565c0;
          border-color: #1565c0;

          box-shadow:
            0 4px 10px rgba(25, 118, 210, 0.20);
        }

        .view-btn:active {
          transform: scale(0.97);
        }

        /* ================= EMPTY ================= */

        .empty {
          background: #ffffff;

          border: 1px solid #e1e8f0;
          border-radius: 14px;

          padding: 60px 20px;

          text-align: center;

          animation: recordStart 0.25s ease-out;
        }

        .empty-icon {
          width: 65px;
          height: 65px;

          margin: 0 auto 15px;

          border-radius: 50%;

          background: #e3f2fd;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 30px;

          color: #1976d2;
        }

        .empty h3 {
          margin: 0 0 6px;

          color: #334155;

          font-size: 18px;
        }

        .empty p {
          color: #64748b;

          font-size: 13px;

          margin: 0;
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

          z-index: 9999;
        }

        .modal {
          width: 100%;
          max-width: 500px;

          background: #ffffff;

          border-radius: 16px;

          padding: 25px;

          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.18);

          animation: modalIn 0.25s ease-out;
        }

        /* ================= MODAL HEADER ================= */

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;

          font-size: 20px;

          color: #1976d2;
        }

        .close-btn {
          width: 34px;
          height: 34px;

          border: none;
          border-radius: 8px;

          background: #f1f5f9;

          color: #64748b;

          font-size: 20px;

          cursor: pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .close-btn:hover {
          background: #e3f2fd;
          color: #1976d2;
        }

        /* ================= RECORD PROFILE ================= */

        .record-profile {
          background: #e3f2fd;

          border: 1px solid #bbdefb;

          padding: 18px;

          border-radius: 12px;

          display: flex;
          align-items: center;

          gap: 13px;

          margin-bottom: 20px;
        }

        .profile-icon {
          width: 50px;
          height: 50px;

          background: #ffffff;

          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 25px;

          border: 1px solid #bbdefb;
        }

        .record-profile h3 {
          margin: 0;

          color: #1e293b;

          font-size: 15px;
        }

        .record-profile p {
          margin: 5px 0 0;

          color: #1976d2;

          font-size: 12px;

          font-weight: 600;
        }

        /* ================= MODAL DETAILS ================= */

        .modal-details {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 12px;
        }

        .modal-detail {
          padding: 13px;

          border: 1px solid #e1e8f0;

          border-radius: 9px;

          background: #ffffff;
        }

        .modal-detail span {
          display: block;

          margin-bottom: 6px;

          color: #94a3b8;

          font-size: 11px;
        }

        .modal-detail strong {
          color: #334155;

          font-size: 12px;
        }

        /* ================= DESCRIPTION ================= */

        .description {
          margin-top: 12px;

          padding: 15px;

          border-radius: 9px;

          background: #f8fbff;

          border: 1px solid #e8eef5;

          color: #64748b;

          font-size: 12px;

          line-height: 1.6;
        }

        .description strong {
          color: #1976d2;
        }

        /* ================= CLOSE MODAL ================= */

        .close-modal {
          width: 100%;

          margin-top: 20px;

          padding: 12px;

          border: none;

          border-radius: 9px;

          background: #1976d2;

          color: #ffffff;

          font-size: 13px;

          font-weight: 600;

          cursor: pointer;

          transition:
            background 0.2s ease,
            transform 0.1s ease;
        }

        .close-modal:hover {
          background: #1565c0;
        }

        .close-modal:active {
          transform: scale(0.97);
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1000px) {

          .records-list {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 800px) {

          .main-content {
            margin-left: 0;

            margin-top: 70px;

            padding: 20px;
          }

          .search-wrapper {
            width: 300px;
            max-width: 100%;
          }

          .search-input {
            width: 300px;

            max-width: 100%;
          }

          .page-header {
            padding: 20px;
          }

        }

        @media (max-width: 550px) {

          .main-content {
            padding: 15px;
          }

          .page-intro h1 {
            font-size: 24px;
          }

          .page-intro p {
            font-size: 13px;
          }

          .page-header {
            padding: 18px;
          }

          .search-box {
            padding: 12px;
          }

          .search-wrapper {
            width: 100%;
          }

          .search-input {
            width: 100%;
          }

          .record-card {
            padding: 18px;
          }

          .record-top {
            align-items: flex-start;
          }

          .record-title-section {
            gap: 10px;
          }

          .record-icon {
            width: 46px;
            height: 46px;

            font-size: 22px;
          }

          .status {
            font-size: 9px;

            padding: 5px 8px;
          }

          .detail-value {
            max-width: 60%;
          }

          .modal {
            padding: 20px;
          }

          .modal-details {
            grid-template-columns: 1fr;
          }

        }

        /* ================= REDUCE MOTION ================= */

        @media (prefers-reduced-motion: reduce) {

          .main-content,
          .page-header,
          .search-box,
          .record-card,
          .empty,
          .modal {
            animation: none;
          }

        }
      `}</style>

      {/* ================= MAIN CONTENT ================= */}

      <div className="main-content">

        {/* ================= PAGE HEADER ================= */}

        <div className="page-header">

          <div className="page-intro">

            <h1>
              Medical Records
            </h1>

            <p>
              Your complete health journey, organized in one place
            </p>

          </div>

        </div>

        {/* ================= SEARCH ================= */}

        <div className="search-box">

          <div className="search-wrapper">

            <FontAwesomeIcon
              icon={faSearch}
              className="search-icon"
            />

            <input
              className="search-input"
              type="text"
              placeholder="Search medical records..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

        {/* ================= RECORDS ================= */}

        {filteredRecords.length > 0 ? (

          <div className="records-list">

            {filteredRecords.map((record) => (

              <div
                className="record-card"
                key={record.id}
              >

                <div className="record-top">

                  <div className="record-title-section">

                    <div className="record-icon">

                      <FontAwesomeIcon
                        icon={faClipboard}
                      />

                    </div>

                    <div className="record-title">

                      <h3>
                        {record.title}
                      </h3>

                      <p>
                        {record.type}
                      </p>

                    </div>

                  </div>

                  <span className="status">
                    {record.status}
                  </span>

                </div>

                <div className="record-details">

                  <div className="detail-row">

                    <span className="detail-label">
                      Date
                    </span>

                    <span className="detail-value">
                      {record.date}
                    </span>

                  </div>

                  <div className="detail-row">

                    <span className="detail-label">
                      Doctor
                    </span>

                    <span className="detail-value">
                      {record.doctor}
                    </span>

                  </div>

                  <div className="detail-row">

                    <span className="detail-label">
                      Department
                    </span>

                    <span className="detail-value">
                      {record.department}
                    </span>

                  </div>

                </div>

                <div className="record-actions">

                  <button
                    className="view-btn"
                    onClick={() =>
                      setSelectedRecord(record)
                    }
                  >
                    View Details
                  </button>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="empty">

            <div className="empty-icon">

              <FontAwesomeIcon
                icon={faSearch}
              />

            </div>

            <h3>
              No Medical Records Found
            </h3>

            <p>
              Try searching with a different record name.
            </p>

          </div>

        )}

      </div>

      {/* ================= VIEW DETAILS MODAL ================= */}

      {selectedRecord && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedRecord(null)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Medical Record
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setSelectedRecord(null)
                }
              >
                ×
              </button>

            </div>

            <div className="record-profile">

              <div className="profile-icon">

                <FontAwesomeIcon
                  icon={faClipboard}
                />

              </div>

              <div>

                <h3>
                  {selectedRecord.title}
                </h3>

                <p>
                  {selectedRecord.type}
                </p>

              </div>

            </div>

            <div className="modal-details">

              <div className="modal-detail">

                <span>
                  Date
                </span>

                <strong>
                  {selectedRecord.date}
                </strong>

              </div>

              <div className="modal-detail">

                <span>
                  Status
                </span>

                <strong>
                  {selectedRecord.status}
                </strong>

              </div>

              <div className="modal-detail">

                <span>
                  Doctor
                </span>

                <strong>
                  {selectedRecord.doctor}
                </strong>

              </div>

              <div className="modal-detail">

                <span>
                  Department
                </span>

                <strong>
                  {selectedRecord.department}
                </strong>

              </div>

            </div>

            <div className="description">

              <strong>
                Description
              </strong>

              <br />

              {selectedRecord.description}

            </div>

            <button
              className="close-modal"
              onClick={() =>
                setSelectedRecord(null)
              }
            >
              Close
            </button>

          </div>

        </div>

      )}

    </>
  );
}

export default MedicalRecords;