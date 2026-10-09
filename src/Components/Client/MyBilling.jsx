import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIndianRupeeSign,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import billingService from "../../Services/billingService";

function MyBilling() {
  const [search, setSearch] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const res = await billingService.getBills();
        if (res && res.data) {
          setBills(res.data.map((b) => ({
            ...b,
            id: b._id || b.id,
            billNo: b.billNumber,
            patientId: b.patientId,
            patientName: b.patientName,
            age: b.age,
            date: b.billDate,
            doctor: b.doctor,
            department: b.department || "Consultation",
            consultation: b.consultation || 0,
            laboratory: b.testCharges || 0,
            medicine: b.medicineCharges || 0,
            total: b.totalAmount,
            status: b.paymentStatus,
            paymentMethod: b.paymentMethod || (b.paymentStatus === "Paid" ? "UPI" : "Not Paid"),
          })));
        }
      } catch (err) {
        console.error("Error fetching my bills:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNo.toLowerCase().includes(search.toLowerCase()) ||
      bill.doctor.toLowerCase().includes(search.toLowerCase()) ||
      bill.department.toLowerCase().includes(search.toLowerCase()) ||
      bill.status.toLowerCase().includes(search.toLowerCase())
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

        /* ================= PAGE START ANIMATION ================= */

        .main-content {
          margin-left: 240px;
          margin-top: 70px;
          padding: 30px;
          min-height: calc(100vh - 70px);
          background: #f4f7fb;

          animation: pageStart 0.45s ease-out;
        }

        @keyframes pageStart {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
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

          animation: headerStart 0.35s ease-out;
        }

        @keyframes headerStart {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
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

        /* ================= SEARCH ================= */

        .search-container {
          width: 100%;

          background: #ffffff;

          border: 1px solid #dceaf5;

          border-radius: 12px;

          padding: 15px;

          margin-bottom: 20px;

          box-shadow:
            0 2px 8px rgba(25, 118, 210, 0.04);

          animation:
            searchStart 0.4s ease-out;
        }

        @keyframes searchStart {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ================= SEARCH INPUT ================= */

        .search-wrapper {
          width: 300px;

          max-width: 100%;

          position: relative;
        }

        .search-icon {
          position: absolute;

          left: 13px;

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

        .search-input {
          width: 300px;

          max-width: 100%;

          height: 40px;

          padding: 0 15px 0 38px;

          border: 1px solid #cfe0ef;

          border-radius: 8px;

          outline: none;

          font-size: 13px;

          color: #334155;

          background: #ffffff;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .search-input:focus {
          border-color: #1976d2;

          box-shadow:
            0 0 0 3px rgba(25, 118, 210, 0.10);
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        /* ================= BILLING GRID ================= */

        .billing-grid {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 18px;
        }

        /* ================= BILL CARD ================= */

        .bill-card {
          background: #ffffff;

          border: 1px solid #dceaf5;

          border-radius: 14px;

          padding: 20px;

          transition: 0.25s ease;

          box-shadow:
            0 3px 10px rgba(25, 118, 210, 0.04);

          animation:
            cardStart 0.4s ease-out both;
        }

        .bill-card:nth-child(1) {
          animation-delay: 0.05s;
        }

        .bill-card:nth-child(2) {
          animation-delay: 0.10s;
        }

        .bill-card:nth-child(3) {
          animation-delay: 0.15s;
        }

        .bill-card:nth-child(4) {
          animation-delay: 0.20s;
        }

        @keyframes cardStart {
          from {
            opacity: 0;
            transform: translateY(15px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bill-card:hover {
          transform: translateY(-3px);

          border-color: #bbdefb;

          box-shadow:
            0 10px 25px rgba(25, 118, 210, 0.10);
        }

        /* ================= BILL TOP ================= */

        .bill-top {
          display: flex;

          justify-content: space-between;

          align-items: center;

          gap: 15px;

          margin-bottom: 18px;
        }

        .bill-title {
          display: flex;

          align-items: center;

          gap: 13px;
        }

        /* ================= BILL ICON ================= */

        .bill-icon {
          width: 52px;

          height: 52px;

          border-radius: 12px;

          background: #e3f2fd;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 24px;

          color: #1976d2;

          flex-shrink: 0;
        }

        .bill-title h3 {
          margin: 0;

          color: #1e293b;

          font-size: 15px;
        }

        .bill-title p {
          margin: 5px 0 0;

          color: #64748b;

          font-size: 11px;
        }

        /* ================= STATUS ================= */

        .status {
          padding: 6px 11px;

          border-radius: 20px;

          font-size: 10px;

          font-weight: 600;

          white-space: nowrap;
        }

        .paid {
          background: #e3f2fd;

          color: #1976d2;
        }

        .pending {
          background: #fff8e1;

          color: #f57c00;
        }

        /* ================= DETAILS ================= */

        .bill-details {
          border-top: 1px solid #eef3f8;

          padding-top: 15px;
        }

        .detail-row {
          display: flex;

          justify-content: space-between;

          gap: 15px;

          margin-bottom: 11px;
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

        /* ================= TOTAL ================= */

        .total-section {
          display: flex;

          justify-content: space-between;

          align-items: center;

          margin-top: 15px;

          padding: 13px;

          background: #e3f2fd;

          border-radius: 9px;

          border: 1px solid #d7eafa;
        }

        .total-section span {
          color: #475569;

          font-size: 12px;

          font-weight: 600;
        }

        .total-section strong {
          color: #1976d2;

          font-size: 17px;
        }

        /* ================= VIEW BUTTON ================= */

        .view-btn {
          width: 100%;

          margin-top: 15px;

          padding: 11px;

          border: 1px solid #bbdefb;

          border-radius: 8px;

          background: #e3f2fd;

          color: #1976d2;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;

          transition: 0.2s;
        }

        .view-btn:hover {
          background: #bbdefb;

          color: #1565c0;
        }

        /* ================= EMPTY ================= */

        .empty {
          background: #ffffff;

          border: 1px solid #dceaf5;

          border-radius: 14px;

          padding: 60px 20px;

          text-align: center;

          animation:
            cardStart 0.35s ease-out;
        }

        .empty-icon {
          font-size: 40px;

          color: #1976d2;

          margin-bottom: 10px;
        }

        .empty h3 {
          margin: 0;

          color: #334155;

          font-size: 18px;
        }

        .empty p {
          color: #64748b;

          font-size: 13px;
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

          animation:
            overlayIn 0.2s ease-out;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .modal {
          width: 100%;

          max-width: 500px;

          max-height: 90vh;

          overflow-y: auto;

          background: #ffffff;

          border-radius: 16px;

          padding: 25px;

          box-shadow:
            0 20px 50px rgba(25, 118, 210, 0.18);

          animation:
            modalIn 0.25s ease-out;
        }

        @keyframes modalIn {
          from {
            opacity: 0;

            transform:
              scale(0.95)
              translateY(10px);
          }

          to {
            opacity: 1;

            transform:
              scale(1)
              translateY(0);
          }
        }

        /* ================= MODAL HEADER ================= */

        .modal-header {
          display: flex;

          justify-content: space-between;

          align-items: center;

          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;

          color: #1976d2;

          font-size: 20px;
        }

        .close-btn {
          width: 34px;

          height: 34px;

          border: none;

          border-radius: 8px;

          background: #e3f2fd;

          color: #1976d2;

          font-size: 20px;

          cursor: pointer;

          transition: 0.2s;
        }

        .close-btn:hover {
          background: #bbdefb;

          color: #1565c0;
        }

        /* ================= BILL SUMMARY ================= */

        .bill-summary {
          background: #e3f2fd;

          border: 1px solid #d7eafa;

          padding: 18px;

          border-radius: 12px;

          margin-bottom: 18px;
        }

        .summary-row {
          display: flex;

          justify-content: space-between;

          gap: 15px;

          margin-bottom: 10px;
        }

        .summary-row:last-child {
          margin-bottom: 0;
        }

        .summary-row span {
          color: #64748b;

          font-size: 12px;
        }

        .summary-row strong {
          color: #334155;

          font-size: 12px;

          text-align: right;
        }

        /* ================= BILL ITEMS ================= */

        .items-title {
          margin: 20px 0 10px;

          color: #1e293b;

          font-size: 15px;
        }

        .bill-item {
          display: flex;

          justify-content: space-between;

          padding: 11px 0;

          border-bottom: 1px solid #eef2f6;

          font-size: 12px;
        }

        .bill-item span:first-child {
          color: #64748b;
        }

        .bill-item span:last-child {
          color: #334155;

          font-weight: 600;
        }

        /* ================= MODAL TOTAL ================= */

        .modal-total {
          display: flex;

          justify-content: space-between;

          align-items: center;

          margin-top: 15px;

          padding: 14px;

          background: #e3f2fd;

          border: 1px solid #d7eafa;

          border-radius: 9px;
        }

        .modal-total span {
          color: #334155;

          font-weight: 600;
        }

        .modal-total strong {
          color: #1976d2;

          font-size: 17px;
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

          transition: 0.2s;
        }

        .close-modal:hover {
          background: #1565c0;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1000px) {

          .billing-grid {
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

        @media (max-width: 550px) {

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

          .search-container {
            padding: 12px;
          }

          .search-wrapper,
          .search-input {
            width: 100%;

            max-width: 100%;
          }

          .bill-card {
            padding: 18px;
          }

          .bill-top {
            align-items: flex-start;
          }

          .bill-icon {
            width: 46px;

            height: 46px;

            font-size: 21px;
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
        }

        /* ================= REDUCED MOTION ================= */

        @media (prefers-reduced-motion: reduce) {

          .main-content,
          .page-intro,
          .search-container,
          .bill-card,
          .empty,
          .modal-overlay,
          .modal {
            animation: none;
          }
        }
      `}</style>

      <div className="main-content">

        {/* ================= PAGE INTRO ================= */}

        <div className="page-intro">

          <h1>
            My Billing
          </h1>

          <p>
            View your hospital bills and payment details
          </p>

        </div>

        {/* ================= SEARCH ================= */}

        <div className="search-container">

          <div className="search-wrapper">

            <FontAwesomeIcon
              icon={faSearch}
              className="search-icon"
            />

            <input
              className="search-input"
              type="text"
              placeholder="Search bill number, doctor or department..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

        {/* ================= BILL LIST ================= */}

        {filteredBills.length > 0 ? (

          <div className="billing-grid">

            {filteredBills.map((bill) => (

              <div
                className="bill-card"
                key={bill.id}
              >

                {/* BILL TOP */}

                <div className="bill-top">

                  <div className="bill-title">

                    <div className="bill-icon">

                      <FontAwesomeIcon
                        icon={faIndianRupeeSign}
                      />

                    </div>

                    <div>

                      <h3>
                        {bill.billNo}
                      </h3>

                      <p>
                        {bill.date}
                      </p>

                    </div>

                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span
                      style={{
                        background: "#e8f5e9",
                        color: "#2e7d32",
                        padding: "4px 9px",
                        borderRadius: "15px",
                        fontSize: "10px",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      ✓ Approved
                    </span>

                    <span
                      className={`status ${
                        bill.status === "Paid"
                          ? "paid"
                          : "pending"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>

                </div>

                {/* BILL DETAILS */}

                <div className="bill-details">

                  <div className="detail-row">

                    <span className="detail-label">
                      Patient ID
                    </span>

                    <span className="detail-value" style={{ color: "#1976d2", fontWeight: 700 }}>
                      {bill.patientId || "PAT-1001"}
                    </span>

                  </div>

                  <div className="detail-row">

                    <span className="detail-label">
                      Doctor
                    </span>

                    <span className="detail-value">
                      {bill.doctor}
                    </span>

                  </div>

                  <div className="detail-row">

                    <span className="detail-label">
                      Department
                    </span>

                    <span className="detail-value">
                      {bill.department}
                    </span>

                  </div>

                  <div className="detail-row">

                    <span className="detail-label">
                      Payment
                    </span>

                    <span className="detail-value">
                      {bill.paymentMethod}
                    </span>

                  </div>

                </div>

                {/* TOTAL */}

                <div className="total-section">

                  <span>
                    Total Amount
                  </span>

                  <strong>
                    <FontAwesomeIcon
                      icon={faIndianRupeeSign}
                    />
                    {bill.total}
                  </strong>

                </div>

                {/* VIEW */}

                <button
                  className="view-btn"
                  onClick={() =>
                    setSelectedBill(bill)
                  }
                >
                  View Details
                </button>

              </div>

            ))}

          </div>

        ) : (

          /* ================= EMPTY ================= */

          <div className="empty">

            <div className="empty-icon">

              <FontAwesomeIcon
                icon={faIndianRupeeSign}
              />

            </div>

            <h3>
              No Bills Found
            </h3>

            <p>
              Try searching with a different bill number
              or doctor name.
            </p>

          </div>

        )}

        {/* ================= BILL DETAILS MODAL ================= */}

        {selectedBill && (

          <div
            className="modal-overlay"
            onClick={() =>
              setSelectedBill(null)
            }
          >

            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="modal-header">

                <h2>
                  Bill Details
                </h2>

                <button
                  className="close-btn"
                  onClick={() =>
                    setSelectedBill(null)
                  }
                >
                  ×
                </button>

              </div>

              {/* BILL SUMMARY */}

              <div className="bill-summary">

                <div className="summary-row">

                  <span>
                    Bill Number
                  </span>

                  <strong>
                    {selectedBill.billNo}
                  </strong>

                </div>

                <div className="summary-row">

                  <span>
                    Patient ID
                  </span>

                  <strong style={{ color: "#1976d2" }}>
                    {selectedBill.patientId || "PAT-1001"}
                  </strong>

                </div>

                {selectedBill.age ? (
                  <div className="summary-row">
                    <span>Patient Age</span>
                    <strong>{selectedBill.age} Years</strong>
                  </div>
                ) : null}

                <div className="summary-row">

                  <span>
                    Date
                  </span>

                  <strong>
                    {selectedBill.date}
                  </strong>

                </div>

                <div className="summary-row">

                  <span>
                    Doctor
                  </span>

                  <strong>
                    {selectedBill.doctor}
                  </strong>

                </div>

                <div className="summary-row">

                  <span>
                    Department
                  </span>

                  <strong>
                    {selectedBill.department}
                  </strong>

                </div>

                <div className="summary-row">

                  <span>
                    Payment Status
                  </span>

                  <strong>
                    {selectedBill.status}
                  </strong>

                </div>

                <div className="summary-row">

                  <span>
                    Payment Method
                  </span>

                  <strong>
                    {selectedBill.paymentMethod}
                  </strong>

                </div>

                <div className="summary-row">

                  <span>
                    Approval Status
                  </span>

                  <strong style={{ color: "#2e7d32" }}>
                    ✓ Approved & Verified
                  </strong>

                </div>

              </div>

              {/* BILL ITEMS */}

              <h3 className="items-title">
                Bill Items
              </h3>

              <div className="bill-item">

                <span>
                  Consultation
                </span>

                <span>
                  <FontAwesomeIcon
                    icon={faIndianRupeeSign}
                  />
                  {selectedBill.consultation}
                </span>

              </div>

              <div className="bill-item">

                <span>
                  Laboratory
                </span>

                <span>
                  <FontAwesomeIcon
                    icon={faIndianRupeeSign}
                  />
                  {selectedBill.laboratory}
                </span>

              </div>

              <div className="bill-item">

                <span>
                  Medicine
                </span>

                <span>
                  <FontAwesomeIcon
                    icon={faIndianRupeeSign}
                  />
                  {selectedBill.medicine}
                </span>

              </div>

              {/* TOTAL */}

              <div className="modal-total">

                <span>
                  Total Amount
                </span>

                <strong>

                  <FontAwesomeIcon
                    icon={faIndianRupeeSign}
                  />

                  {selectedBill.total}

                </strong>

              </div>

              {/* CLOSE */}

              <button
                className="close-modal"
                onClick={() =>
                  setSelectedBill(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        )}

      </div>
    </>
  );
}

export default MyBilling;