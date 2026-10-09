import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
 faCheck
  } from "@fortawesome/free-solid-svg-icons";
import billingService from "../../Services/billingService";
import patientService from "../../Services/patientService";

/* =========================================================
   COUNTER COMPONENT
   ========================================================= */

function Counter({ value }) {
  const [count, setCount] = useState(0);

  const valueRef = useRef(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    valueRef.current = value;

    if (hasAnimated.current) {
      setCount(value);
      return;
    }

    hasAnimated.current = true;

    let current = 0;
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;

    const timer = setInterval(() => {
      current += increment;

      if (current >= valueRef.current) {
        setCount(valueRef.current);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hasAnimated.current) {
      setCount(value);
    }
  }, [value]);

  return <span>{count}</span>;
}


/* =========================================================
   MANAGE BILLING COMPONENT
   ========================================================= */

function Billing() {

  const [search, setSearch] = useState("");

  const [selectedBill, setSelectedBill] = useState(null);

  const [deleteBill, setDeleteBill] = useState(null);

  const [showAddBill, setShowAddBill] = useState(false);

  const [showEditBill, setShowEditBill] = useState(false);

  const [toast, setToast] = useState(null);

  const [patients, setPatients] = useState([]);


  /* =========================================================
     NEW BILL FORM
     ========================================================= */

  const [newBill, setNewBill] = useState({
    billNumber: "",
    patientName: "",
    patientId: "",
    age: "",
    doctor: "Dr. Rajesh Kumar",
    billDate: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    consultation: "",
    roomCharges: "",
    medicineCharges: "",
    testCharges: "",
    totalAmount: "",
    paymentStatus: "Paid",
  });


  /* =========================================================
     EDIT BILL FORM
     ========================================================= */

  const [editBill, setEditBill] = useState({
    id: "",
    billNumber: "",
    patientName: "",
    patientId: "",
    age: "",
    doctor: "",
    billDate: "",
    consultation: "",
    roomCharges: "",
    medicineCharges: "",
    testCharges: "",
    totalAmount: "",
    paymentStatus: "",
  });


  /* =========================================================
     BILL DATA (FROM API)
     ========================================================= */

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await billingService.getBills();
      if (res && res.data) {
        setBills(res.data.map((b) => ({
          ...b,
          id: b._id || b.id,
        })));
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await patientService.getPatients();
      if (res && res.data) {
        setPatients(res.data);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchPatients();
  }, []);


  /* =========================================================
     STATISTICS
     ========================================================= */

  const totalBills = bills.length;

  const paidBills = bills.filter(
    (bill) => bill.paymentStatus === "Paid"
  ).length;

  const pendingBills = bills.filter(
    (bill) => bill.paymentStatus === "Pending"
  ).length;

  const totalRevenue = bills.reduce(
    (total, bill) =>
      total + Number(bill.totalAmount),
    0
  );


  /* =========================================================
     SEARCH
     ========================================================= */

  const filteredBills = bills.filter((bill) => {

    const searchText =
      search.toLowerCase();

    return (
      bill.billNumber
        .toLowerCase()
        .includes(searchText) ||

      bill.patientName
        .toLowerCase()
        .includes(searchText) ||

      bill.patientId
        .toLowerCase()
        .includes(searchText) ||

      bill.doctor
        .toLowerCase()
        .includes(searchText) ||

      bill.paymentStatus
        .toLowerCase()
        .includes(searchText) ||

      (bill.age && String(bill.age).includes(searchText))
    );
  });


  /* =========================================================
     TOAST
     ========================================================= */

  const showToast = (
    message,
    type = "success"
  ) => {

    setToast({
      type,
      message,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };


  /* =========================================================
     CHARGE & PATIENT HANDLERS
     ========================================================= */

  const handleChargeChange = (field, value) => {
    setNewBill((prev) => {
      const updated = { ...prev, [field]: value };
      const c = Number(field === "consultation" ? value : updated.consultation) || 0;
      const r = Number(field === "roomCharges" ? value : updated.roomCharges) || 0;
      const m = Number(field === "medicineCharges" ? value : updated.medicineCharges) || 0;
      const t = Number(field === "testCharges" ? value : updated.testCharges) || 0;
      updated.totalAmount = c + r + m + t;
      return updated;
    });
  };

  const handlePatientSelect = (e) => {
    const selectedPatId = e.target.value;
    if (!selectedPatId) return;
    const found = patients.find(
      (p) => p.patientId === selectedPatId || p._id === selectedPatId
    );
    if (found) {
      setNewBill((prev) => ({
        ...prev,
        patientName: found.name,
        patientId: found.patientId || found._id,
        age: found.age !== undefined && found.age !== null ? found.age : prev.age,
        doctor: found.doctor || prev.doctor,
        department: found.department || "General Medicine",
      }));
    }
  };

  /* =========================================================
     ADD BILL
     ========================================================= */

  const handleAddBill = async (e) => {
    e.preventDefault();

    if (
      !newBill.patientName ||
      !newBill.patientId
    ) {
      showToast(
        "Please fill all required fields (Patient Name & ID)!",
        "error"
      );
      return;
    }

    try {
      const c = Number(newBill.consultation) || 0;
      const r = Number(newBill.roomCharges) || 0;
      const m = Number(newBill.medicineCharges) || 0;
      const t = Number(newBill.testCharges) || 0;
      const calculatedTotal = Number(newBill.totalAmount) || (c + r + m + t);

      const res = await billingService.createBill({
        billNumber: newBill.billNumber || undefined,
        patientName: newBill.patientName,
        patientId: newBill.patientId,
        age: newBill.age !== "" && newBill.age !== undefined ? Number(newBill.age) : undefined,
        doctor: newBill.doctor,
        department: newBill.department || "General Medicine",
        billDate: newBill.billDate,
        consultation: c,
        roomCharges: r,
        medicineCharges: m,
        testCharges: t,
        totalAmount: calculatedTotal,
        paymentStatus: newBill.paymentStatus || "Paid",
        approvalStatus: "Pending",
        isApproved: false,
      });

      if (res && res.data) {
        const added = {
          ...res.data,
          id: res.data._id || res.data.id,
          approvalStatus: res.data.approvalStatus || "Pending",
          isApproved: false,
        };
        setBills((prevBills) => [added, ...prevBills]);
      } else {
        await fetchBills();
      }

      setShowAddBill(false);

      setNewBill({
        billNumber: "",
        patientName: "",
        patientId: "",
        age: "",
        doctor: "Dr. Rajesh Kumar",
        billDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        consultation: "",
        roomCharges: "",
        medicineCharges: "",
        testCharges: "",
        totalAmount: "",
        paymentStatus: "Paid",
      });

      showToast("Bill created! Click 'Approve' to publish it to client MyBilling.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add bill!", "error");
    }
  };

  /* =========================================================
     APPROVE BILL (PUBLISH TO CLIENT MYBILLING)
     ========================================================= */

  const handleApproveBill = async (bill) => {
    try {
      const billId = bill._id || bill.id;
      const res = await billingService.approveBill(billId);
      const updated = res && res.data
        ? { ...res.data, id: res.data._id || res.data.id }
        : { ...bill, approvalStatus: "Approved", isApproved: true };

      setBills((prevBills) =>
        prevBills.map((b) =>
          b.id === billId || b._id === billId ? updated : b
        )
      );

      const targetPat = bill.patientId ? `patient ID ${bill.patientId}` : (bill.patientName || "client");
      showToast(
        `Bill #${bill.billNumber} approved! Sent to client MyBilling for ${targetPat}.`,
        "success"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve bill!", "error");
    }
  };


  /* =========================================================
     OPEN EDIT BILL
     ========================================================= */

  const openEditBill = (bill) => {
    setEditBill({
      id: bill._id || bill.id,
      billNumber: bill.billNumber,
      patientName: bill.patientName,
      patientId: bill.patientId,
      age: bill.age !== undefined && bill.age !== null ? bill.age : "",
      doctor: bill.doctor,
      billDate: bill.billDate,
      consultation: bill.consultation,
      roomCharges: bill.roomCharges,
      medicineCharges: bill.medicineCharges,
      testCharges: bill.testCharges,
      totalAmount: bill.totalAmount,
      paymentStatus: bill.paymentStatus,
    });

    setShowEditBill(true);
  };


  /* =========================================================
     UPDATE BILL
     ========================================================= */

  const handleEditBill = async (e) => {
    e.preventDefault();

    if (
      !editBill.patientName ||
      !editBill.patientId
    ) {
      showToast(
        "Please fill all required fields!",
        "error"
      );
      return;
    }

    try {
      const billId = editBill.id || editBill._id;
      const res = await billingService.updateBill(billId, {
        billNumber: editBill.billNumber,
        patientName: editBill.patientName,
        patientId: editBill.patientId,
        age: editBill.age !== "" && editBill.age !== undefined ? Number(editBill.age) : undefined,
        doctor: editBill.doctor,
        billDate: editBill.billDate,
        consultation: Number(editBill.consultation) || 0,
        roomCharges: Number(editBill.roomCharges) || 0,
        medicineCharges: Number(editBill.medicineCharges) || 0,
        testCharges: Number(editBill.testCharges) || 0,
        totalAmount: Number(editBill.totalAmount),
        paymentStatus: editBill.paymentStatus,
      });

      const updated = res.data ? { ...res.data, id: res.data._id || res.data.id } : editBill;

      setBills((prevBills) =>
        prevBills.map((bill) =>
          (bill.id === billId || bill._id === billId)
            ? updated
            : bill
        )
      );

      setShowEditBill(false);
      showToast("Bill updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update bill!", "error");
    }
  };


  /* =========================================================
     DELETE BILL
     ========================================================= */

  const confirmDelete = async () => {
    if (!deleteBill) return;

    try {
      const billId = deleteBill._id || deleteBill.id;
      await billingService.deleteBill(billId);

      setBills((prevBills) =>
        prevBills.filter(
          (bill) => bill.id !== billId && bill._id !== billId
        )
      );

      setDeleteBill(null);
      showToast("Bill deleted successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete bill!", "error");
    }
  };


  /* =========================================================
     PAYMENT STATUS CLASS
     ========================================================= */

  const getStatusClass = (status) => {

    return status === "Paid"
      ? "paid"
      : "pending";
  };


  /* =========================================================
     UI
     ========================================================= */

  return (
    <>

      <style>
        {`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;

          background: #f4f8fb;
        }


        /* ================= PAGE ================= */

        .billing-page {

          min-height:
            calc(100vh - 70px);

          margin-top: 70px;

          margin-left: 240px;

          width:
            calc(100% - 240px);

          padding: 30px;

          background: #f4f8fb;

          animation:
            pageFade 0.6s ease;
        }


        @keyframes pageFade {

          from {
            opacity: 0;
            transform:
              translateY(15px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }

        }


        /* ================= HEADER ================= */

        .billing-header {

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-bottom: 28px;

          padding:
            24px 22px;

          background: #eaf5ff;

          border:
            1px solid #cfe7ff;

          border-radius: 17px;

          box-shadow:
            0 5px 16px
            rgba(
              25,
              118,
              210,
              0.05
            );

          min-height: 98px;
        }


        .header-title h1 {

          margin: 0;

          color: #1976d2;

          font-size: 29px;

          font-weight: 700;

          cursor: pointer;

          display: inline-block;

          transition:
            all 0.3s ease;
        }


        .header-title h1:hover {

          color: #1565c0;

          transform:
            translateX(5px)
            scale(0.96);

          text-shadow:
            0 3px 8px
            rgba(
              25,
              118,
              210,
              0.18
            );
        }


        .header-title p {

          margin:
            7px 0 0;

          color: #4779ad;

          font-size: 14px;
        }


        /* ================= ADD BUTTON ================= */

        .add-bill-btn {

          border: none;

          background: #1976d2;

          color: white;

          height: 44px;

          padding:
            0 20px;

          border-radius: 10px;

          font-size: 14px;

          font-weight: 600;

          cursor: pointer;

          display: flex;

          align-items: center;

          gap: 8px;

          box-shadow:
            0 5px 15px
            rgba(
              25,
              118,
              210,
              0.18
            );

          transition:
            all 0.3s ease;
        }


        .add-bill-btn:hover {

          background: #1565c0;

          transform:
            translateY(-2px)
            scale(0.96);

          box-shadow:
            0 8px 20px
            rgba(
              25,
              118,
              210,
              0.24
            );
        }


        .add-bill-btn:active {

          transform:
            scale(0.92);
        }


        .add-icon {

          font-size: 20px;

          line-height: 1;
        }


        /* ================= STATS ================= */

        .stats-grid {

          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 20px;

          margin-bottom: 25px;
        }


        .stat-card {

          background: #ffffff;

          border-radius: 16px;

          padding: 22px;

          display: flex;

          align-items: center;

          gap: 16px;

          border:
            1px solid #e5edf3;

          box-shadow:
            0 7px 22px
            rgba(
              50,
              90,
              110,
              0.07
            );

          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;

          animation:
            cardSlide 0.7s ease both;
        }


        .stat-card:nth-child(1) {
          animation-delay:
            0.1s;
        }

        .stat-card:nth-child(2) {
          animation-delay:
            0.2s;
        }

        .stat-card:nth-child(3) {
          animation-delay:
            0.3s;
        }

        .stat-card:nth-child(4) {
          animation-delay:
            0.4s;
        }


        @keyframes cardSlide {

          from {
            opacity: 0;
            transform:
              translateY(25px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }

        }


        .stat-card:hover {

          transform:
            translateY(-5px)
            scale(0.97);

          box-shadow:
            0 12px 28px
            rgba(
              50,
              90,
              110,
              0.12
            );
        }


        .stat-icon {

          width: 55px;

          height: 55px;

          border-radius: 14px;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 25px;

          transition:
            transform 0.3s ease;
        }


        .stat-card:hover
        .stat-icon {

          transform:
            scale(0.90);
        }


        .blue-icon {

          background: #e3f2fd;

          color: #1976d2;
        }


        .green-icon {

          background: #e8f5e9;

          color: #2e7d32;
        }


        .orange-icon {

          background: #fff3e0;

          color: #ef6c00;
        }


        .purple-icon {

          background: #f3e5f5;

          color: #8e44ad;
        }


        .stat-info p {

          margin:
            0 0 6px;

          color: #78909c;

          font-size: 13px;
        }


        .stat-info h2 {

          margin: 0;

          font-size: 25px;

          color: #263238;
        }


        /* ================= BILL CARD ================= */

        .billing-card {

          background: #ffffff;

          border:
            1px solid #e5edf3;

          border-radius: 18px;

          box-shadow:
            0 7px 22px
            rgba(
              50,
              90,
              110,
              0.06
            );

          overflow: hidden;

          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease;

          animation:
            contentAppear 0.8s ease;
        }


        .billing-card:hover {

          transform:
            scale(0.995);

          box-shadow:
            0 15px 35px
            rgba(
              50,
              90,
              110,
              0.10
            );
        }


        @keyframes contentAppear {

          from {
            opacity: 0;
            transform:
              translateY(20px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }

        }


        /* ================= TOOLBAR ================= */

        .billing-toolbar {

          padding: 20px;

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 15px;

          border-bottom:
            1px solid #edf2f5;
        }


        .search-box {

          width: 330px;

          position: relative;
        }


        .search-box span {

          position: absolute;

          left: 14px;

          top: 50%;

          transform:
            translateY(-50%);

          font-size: 17px;

          color: #90a4ae;
        }


        .search-box input {

          width: 100%;

          height: 43px;

          padding:
            0 15px 0 42px;

          border:
            1px solid #dce6ec;

          border-radius: 10px;

          outline: none;

          font-size: 14px;

          color: #37474f;

          transition: 0.3s;

          background: #fbfdff;
        }


        .search-box input:focus {

          border-color: #64b5f6;

          box-shadow:
            0 0 0 3px
            rgba(
              33,
              150,
              243,
              0.08
            );

          transform:
            scale(0.99);
        }


        /* ================= TABLE ================= */

        .table-container {

          width: 100%;

          overflow-x: auto;
        }


        table {

          width: 100%;

          border-collapse:
            collapse;

          min-width: 1050px;
        }


        thead {

          background: #f7fafc;
        }


        th {

          padding:
            16px 18px;

          text-align: left;

          font-size: 12px;

          color: #78909c;

          text-transform:
            uppercase;

          letter-spacing:
            0.4px;

          font-weight: 700;
        }


        td {

          padding:
            17px 18px;

          border-top:
            1px solid #edf2f5;

          font-size: 13px;

          color: #455a64;
        }


        tbody tr {

          transition:
            background 0.25s ease,
            transform 0.25s ease;

          animation:
            rowAppear 0.5s ease both;
        }


        tbody tr:hover {

          background: #f8fcff;

          transform:
            scale(0.995);
        }


        @keyframes rowAppear {

          from {
            opacity: 0;
            transform:
              translateX(-10px);
          }

          to {
            opacity: 1;
            transform:
              translateX(0);
          }

        }


        /* ================= BILL INFO ================= */

        .bill-info {

          display: flex;

          align-items: center;

          gap: 11px;
        }


        .bill-avatar {

          width: 40px;

          height: 40px;

          border-radius: 50%;

          background: #e3f2fd;

          color: #1976d2;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 18px;

          transition:
            transform 0.3s ease;
        }


        tr:hover
        .bill-avatar {

          transform:
            scale(0.88);
        }


        .bill-name {

          color: #263238;

          font-weight: 600;
        }


        .bill-id {

          color: #90a4ae;

          font-size: 11px;

          margin-top: 3px;
        }


        /* ================= PATIENT ================= */

        .patient-name {

          color: #263238;

          font-weight: 600;

          margin-bottom: 3px;
        }


        .patient-id {

          color: #90a4ae;

          font-size: 11px;
        }


        /* ================= AMOUNT ================= */

        .amount {

          color: #1976d2;

          font-weight: 700;

          font-size: 14px;
        }


        /* ================= STATUS ================= */

        .status {

          padding:
            6px 11px;

          border-radius: 20px;

          font-size: 11px;

          font-weight: 600;

          display: inline-block;

          transition:
            transform 0.25s ease;
        }


        tr:hover .status {

          transform:
            scale(0.94);
        }


        .status.paid {

          background: #e8f5e9;

          color: #2e7d32;
        }


        .status.pending {

          background: #fff3e0;

          color: #ef6c00;
        }


        /* ================= ACTIONS ================= */

        .actions {

          display: flex;

          gap: 7px;

          align-items: center;
        }


        .action-btn {

          height: 34px;

          padding:
            0 12px;

          border: none;

          border-radius: 8px;

          cursor: pointer;

          font-size: 12px;

          font-weight: 600;

          transition:
            all 0.25s ease;
        }


        .view-btn {

          background: #e3f2fd;

          color: #1976d2;
        }


        .edit-btn {

          background: #fff3e0;

          color: #ef6c00;
        }


        .delete-btn {

          width: 34px;

          padding: 0;

          background: #ffebee;

          color: #e53935;

          font-size: 14px;
        }


        .action-btn:hover {

          transform:
            translateY(-2px)
            scale(0.90);
        }


        .view-btn:hover {

          background: #bbdefb;
        }


        .edit-btn:hover {

          background: #ffe0b2;
        }


        .delete-btn:hover {

          background: #ffcdd2;
        }

        .action-btn.approve-btn {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #a5d6a7;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 0 12px;
          height: 34px;
        }

        .action-btn.approve-btn:hover {
          background: #2e7d32;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.28);
          transform: translateY(-2px) scale(0.96);
        }

        .action-btn.approved-btn {
          background: #f1f8e9;
          color: #558b2f;
          border: 1px dashed #c5e1a5;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0 10px;
          height: 34px;
          cursor: default;
          opacity: 0.9;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-badge.approved {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }

        .status-badge.pending-approval {
          background: #fff8e1;
          color: #f57c00;
          border: 1px solid #ffe082;
        }


        /* ================= EMPTY ================= */

        .empty-state {

          text-align: center;

          padding: 50px;

          color: #90a4ae;
        }


        .empty-state div {

          font-size: 40px;

          margin-bottom: 10px;
        }


        .empty-state strong {

          color: #607d8b;
        }


        /* ================= MODAL ================= */

        .modal-overlay {

          position: fixed;

          inset: 0;

          background:
            rgba(
              30,
              50,
              65,
              0.35
            );

          display: flex;

          justify-content: center;

          align-items: center;

          padding: 20px;

          z-index: 1000;

          animation:
            overlayFade 0.25s ease;
        }


        @keyframes overlayFade {

          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }

        }


        .modal {
          width: 620px;
          max-width: 95%;
          max-height: 88vh;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.22);
          animation: modalZoom 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .modal::-webkit-scrollbar {
          width: 6px;
        }

        .modal::-webkit-scrollbar-thumb {
          background: #cfd8dc;
          border-radius: 4px;
        }

        @keyframes modalZoom {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(15px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f7fbfe;
          border-bottom: 1px solid #e8f0f5;
          position: sticky;
          top: 0;
          z-index: 10;
        }


        .modal-header h2 {

          margin: 0;

          color: #183b56;

          font-size: 20px;
        }


        .close-btn {

          width: 34px;

          height: 34px;

          border: none;

          border-radius: 8px;

          background: #ffffff;

          color: #607d8b;

          cursor: pointer;

          font-size: 18px;

          transition: 0.25s;
        }


        .close-btn:hover {

          background: #ffebee;

          color: #e53935;

          transform:
            scale(0.88);
        }


        /* ================= FORM ================= */

        .add-form {

          padding: 24px;
        }


        .form-grid {

          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 15px;
        }


        .form-group {

          display: flex;

          flex-direction: column;

          gap: 7px;
        }


        .form-group.full {

          grid-column:
            span 2;
        }


        .form-group label {

          color: #546e7a;

          font-size: 12px;

          font-weight: 600;
        }


        .form-group input,
        .form-group select {

          width: 100%;

          height: 42px;

          border:
            1px solid #dce6ec;

          border-radius: 9px;

          padding:
            0 12px;

          outline: none;

          font-size: 13px;

          color: #37474f;

          background: #fbfdff;

          transition:
            0.25s ease;
        }


        .form-group input:focus,
        .form-group select:focus {

          border-color:
            #64b5f6;

          box-shadow:
            0 0 0 3px
            rgba(
              33,
              150,
              243,
              0.08
            );
        }


        .form-buttons {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
          padding: 16px 20px;
          border-top: 1px solid #edf2f7;
          position: sticky;
          bottom: 0;
          background: #ffffff;
          z-index: 10;
          box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.03);
        }

        .form-cancel-btn,
        .form-save-btn {
          height: 42px;
          padding: 0 24px;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .form-cancel-btn {
          background: #f1f5f7;
          color: #546e7a;
        }

        .form-save-btn {
          background: #1976d2;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25);
        }

        .form-cancel-btn:hover {
          background: #e3ebef;
          transform: translateY(-2px);
        }

        .form-save-btn:hover {
          background: #1565c0;
          box-shadow: 0 6px 18px rgba(25, 118, 210, 0.35);
          transform: translateY(-2px);
        }


        /* ================= VIEW MODAL ================= */

        .modal-body {

          padding: 25px;
        }


        .profile-section {

          text-align: center;

          margin-bottom: 25px;
        }


        .large-avatar {

          width: 75px;

          height: 75px;

          border-radius: 50%;

          margin: auto;

          background: #e3f2fd;

          color: #1976d2;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 27px;

          animation:
            avatarPulse 2s infinite;
        }


        @keyframes avatarPulse {

          0%,
          100% {

            box-shadow:
              0 0 0 0
              rgba(
                25,
                118,
                210,
                0.12
              );
          }

          50% {

            box-shadow:
              0 0 0 10px
              rgba(
                25,
                118,
                210,
                0.04
              );
          }

        }


        .profile-section h3 {

          margin:
            12px 0 4px;

          color: #263238;
        }


        .profile-section p {

          margin: 0;

          color: #90a4ae;

          font-size: 13px;
        }


        .details-grid {

          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 14px;
        }


        .detail-item {

          background: #f8fbfd;

          border:
            1px solid #edf2f5;

          padding: 13px;

          border-radius: 10px;

          transition:
            all 0.25s ease;
        }


        .detail-item:hover {

          transform:
            scale(0.97);

          background: #f3f9fd;
        }


        .detail-item span {

          display: block;

          color: #90a4ae;

          font-size: 11px;

          margin-bottom: 5px;
        }


        .detail-item strong {

          color: #37474f;

          font-size: 13px;
        }


        /* ================= DELETE MODAL ================= */

        .delete-modal {

          width: 410px;

          max-width: 100%;

          background: #ffffff;

          border-radius: 18px;

          padding: 30px;

          text-align: center;

          animation:
            modalZoom 0.3s ease;

          box-shadow:
            0 20px 60px
            rgba(
              0,
              0,
              0,
              0.15
            );
        }


        .delete-icon {

          width: 62px;

          height: 62px;

          margin: auto;

          border-radius: 50%;

          background: #ffebee;

          color: #e53935;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 27px;

          transition:
            transform 0.3s ease;
        }


        .delete-icon:hover {

          transform:
            scale(0.88);
        }


        .delete-modal h3 {

          color: #263238;

          margin:
            17px 0 8px;
        }


        .delete-modal p {

          color: #78909c;

          font-size: 13px;

          line-height: 1.5;

          margin-bottom: 23px;
        }


        .delete-actions {

          display: flex;

          justify-content: center;

          gap: 10px;
        }


        .cancel-btn,
        .confirm-delete-btn {

          padding:
            11px 22px;

          border-radius: 9px;

          border: none;

          cursor: pointer;

          font-weight: 600;

          transition:
            0.25s;
        }


        .cancel-btn {

          background: #f1f5f7;

          color: #546e7a;
        }


        .confirm-delete-btn {

          background: #e53935;

          color: white;
        }


        .cancel-btn:hover,
        .confirm-delete-btn:hover {

          transform:
            translateY(-2px)
            scale(0.94);
        }


        /* ================= TOAST ================= */

        .toast {

          position: fixed;

          top: 25px;

          right: 25px;

          min-width: 280px;

          padding:
            15px 18px;

          border-radius: 11px;

          background: #ffffff;

          box-shadow:
            0 10px 30px
            rgba(
              0,
              0,
              0,
              0.13
            );

          display: flex;

          align-items: center;

          gap: 10px;

          z-index: 2000;

          animation:
            toastTopRight 0.45s ease;

          border-left:
            4px solid #2e7d32;

          color: #455a64;

          font-size: 13px;
        }


        .toast.error {

          border-left-color:
            #e53935;
        }


        @keyframes toastTopRight {

          from {

            opacity: 0;

            transform:
              translateX(50px)
              translateY(-10px)
              scale(0.95);
          }

          to {

            opacity: 1;

            transform:
              translateX(0)
              translateY(0)
              scale(1);
          }

        }


        .toast-icon {

          width: 24px;

          height: 24px;

          border-radius: 50%;

          background: #e8f5e9;

          color: #2e7d32;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 15px;

          font-weight: bold;
        }


        .toast.error
        .toast-icon {

          background: #ffebee;

          color: #e53935;
        }


        /* ================= RESPONSIVE ================= */

        @media (max-width: 1200px) {

          .billing-page {

            padding-left: 220px;
          }

          .stats-grid {

            grid-template-columns:
              repeat(2, 1fr);
          }

        }


        @media (max-width: 900px) {

          .billing-page {

            margin-left: 0;

            width: 100%;

            padding:
              20px 18px 18px;
          }

        }


        @media (max-width: 700px) {

          .billing-page {

            padding:
              70px 18px 18px 18px;
          }


          .billing-header {

            flex-direction:
              column;

            align-items: stretch;

            gap: 15px;

            padding: 20px;
          }


          .add-bill-btn {

            width: 100%;

            justify-content: center;
          }


          .stats-grid {

            grid-template-columns:
              1fr;
          }


          .billing-toolbar {

            flex-direction:
              column;

            align-items: stretch;
          }


          .search-box {

            width: 100%;
          }


          .details-grid {

            grid-template-columns:
              1fr;
          }


          .form-grid {

            grid-template-columns:
              1fr;
          }


          .form-group.full {

            grid-column:
              span 1;
          }


          .toast {

            top: 15px;

            right: 15px;

            left: 15px;

            min-width: auto;
          }

        }

        `}
      </style>


      {/* =====================================================
          MAIN PAGE
          ===================================================== */}

      <div className="billing-page">


        {/* ================= HEADER ================= */}

        <div className="billing-header">

          <div className="header-title">

            <h1>
              Manage Billing
            </h1>

            <p>
              Manage and monitor all patient bills
            </p>

          </div>


          <button
            className="add-bill-btn"
            onClick={() =>
              setShowAddBill(true)
            }
          >

            <span className="add-icon">
              +
            </span>

            Add Bill

          </button>

        </div>


        {/* =================================================
            STAT CARDS
            ================================================= */}

        <div className="stats-grid">


          <div className="stat-card">

            <div className="stat-icon blue-icon">
              <i class="bi bi-receipt"></i>
            </div>

            <div className="stat-info">

              <p>
                Total Bills
              </p>

              <h2>

                <Counter
                  value={totalBills}
                />

              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon green-icon">
              <FontAwesomeIcon icon={faCheck}/>
            </div>

            <div className="stat-info">

              <p>
                Paid Bills
              </p>

              <h2>

                <Counter
                  value={paidBills}
                />

              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon orange-icon">
              <i class="bi bi-hourglass-split"></i>
            </div>

            <div className="stat-info">

              <p>
                Pending Bills
              </p>

              <h2>

                <Counter
                  value={pendingBills}
                />

              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon purple-icon">
              <i class="bi bi-currency-rupee"></i>
            </div>

            <div className="stat-info">

              <p>
                Total Revenue
              </p>

              <h2>
                ₹
                <Counter
                  value={totalRevenue}
                />
              </h2>

            </div>

          </div>


        </div>


        {/* ================= BILL TABLE ================= */}

        <div className="billing-card">


          <div className="billing-toolbar">


            <div className="search-box">

              <span>
                <i class="bi bi-search"></i>
              </span>

              <input
                type="text"
                placeholder="Search bills..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>


          </div>


          <div className="table-container">


            {filteredBills.length === 0 ? (

              <div className="empty-state">

                <div>
                  🔍
                </div>

                <strong>
                  No bills found
                </strong>

                <p>
                  Try changing your search.
                </p>

              </div>

            ) : (

              <table>

                <thead>

                  <tr>

                    <th>
                      Bill
                    </th>

                    <th>
                      Patient
                    </th>

                    <th>
                      Age
                    </th>

                    <th>
                      Doctor
                    </th>

                    <th>
                      Bill Date
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Payment Status
                    </th>

                    <th>
                      Approval
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredBills.map(
                    (bill) => (

                      <tr key={bill.id}>


                        <td>

                          <div className="bill-info">

                            <div className="bill-avatar">
                              <i class="bi bi-receipt"></i>
                            </div>

                            <div>

                              <div className="bill-name">

                                {bill.billNumber}

                              </div>

                              <div className="bill-id">

                                BILL-{bill.id
                                  .toString()
                                  .padStart(4, "0")}

                              </div>

                            </div>

                          </div>

                        </td>


                        <td>

                          <div className="patient-name">

                            {bill.patientName}

                          </div>

                          <div className="patient-id">

                            {bill.patientId}

                          </div>

                        </td>


                        <td>

                          <span style={{ fontWeight: "600", color: "#334155" }}>
                            {bill.age !== undefined && bill.age !== null && bill.age !== "" ? `${bill.age} yrs` : "—"}
                          </span>

                        </td>


                        <td>

                          {bill.doctor}

                        </td>


                        <td>

                          {bill.billDate}

                        </td>


                        <td>

                          <span className="amount">

                            ₹
                            {bill.totalAmount}

                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              `status ${
                                getStatusClass(
                                  bill.paymentStatus
                                )
                              }`
                            }
                          >

                            {bill.paymentStatus}

                          </span>

                        </td>


                        <td>

                          {bill.approvalStatus === "Approved" || bill.isApproved ? (
                            <span className="status-badge approved">
                              <i className="bi bi-check-circle-fill"></i> Approved
                            </span>
                          ) : (
                            <span className="status-badge pending-approval">
                              <i className="bi bi-clock-history"></i> Pending
                            </span>
                          )}

                        </td>


                        <td>

                          <div className="actions">

                            {bill.approvalStatus !== "Approved" && !bill.isApproved ? (
                              <button
                                className="action-btn approve-btn"
                                onClick={() => handleApproveBill(bill)}
                                title={`Approve and send bill specifically to ${bill.patientName} (${bill.patientId})`}
                              >
                                <i className="bi bi-check2-circle"></i> Approve & Send
                              </button>
                            ) : (
                              <button
                                className="action-btn approved-btn"
                                disabled
                                title={`Approved and sent specifically to ${bill.patientName} (${bill.patientId}) in MyBilling`}
                              >
                                <i className="bi bi-check2-all"></i> Sent to {bill.patientId}
                              </button>
                            )}

                            <button
                              className="action-btn view-btn"
                              onClick={() =>
                                setSelectedBill(
                                  bill
                                )
                              }
                            >
                              View
                            </button>


                            <button
                              className="action-btn edit-btn"
                              onClick={() =>
                                openEditBill(
                                  bill
                                )
                              }
                            >
                              Edit
                            </button>


                            <button
                              className="action-btn delete-btn"
                              onClick={() =>
                                setDeleteBill(
                                  bill
                                )
                              }
                            >
                              🗑
                            </button>


                          </div>

                        </td>


                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          ADD BILL MODAL
          ===================================================== */}

      {showAddBill && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddBill(false)
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
                Add New Bill
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setShowAddBill(false)
                }
              >
                ✕
              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleAddBill}
            >

              <div className="form-grid">

                <div className="form-group full">
                  <label>Select Registered Patient (Auto-fill)</label>
                  <select onChange={handlePatientSelect} defaultValue="">
                    <option value="">-- Choose Existing Patient (or enter details manually) --</option>
                    {patients.map((pat) => (
                      <option key={pat.patientId || pat._id} value={pat.patientId || pat._id}>
                        {pat.patientId} — {pat.name} ({pat.phone || pat.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">

                  <label>
                    Bill Number (Optional - Auto generated if empty)
                  </label>

                  <input
                    type="text"
                    placeholder="Auto-generated e.g. BILL-1005"
                    value={newBill.billNumber}
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        billNumber:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Patient Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter patient name"
                    value={newBill.patientName}
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        patientName:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Patient ID *
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. PAT-1002"
                    value={newBill.patientId}
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        patientId:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Patient Age
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="130"
                    placeholder="Enter age (e.g. 35)"
                    value={newBill.age || ""}
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        age:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Doctor
                  </label>

                  <select
                    value={newBill.doctor}
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        doctor:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Dr. Rajesh Kumar
                    </option>

                    <option>
                      Dr. Meena Sharma
                    </option>

                    <option>
                      Dr. Suresh Kumar
                    </option>

                    <option>
                      Dr. Anitha
                    </option>

                    <option>
                      Dr. Karthik
                    </option>

                    <option>
                      Dr. Priya
                    </option>

                    <option>
                      Dr. Lakshmi
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Bill Date
                  </label>

                  <input
                    type="text"
                    value={newBill.billDate}
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        billDate:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Consultation (₹)
                  </label>

                  <input
                    type="number"
                    placeholder="0"
                    value={newBill.consultation}
                    onChange={(e) =>
                      handleChargeChange("consultation", e.target.value)
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Room Charges (₹)
                  </label>

                  <input
                    type="number"
                    placeholder="0"
                    value={newBill.roomCharges}
                    onChange={(e) =>
                      handleChargeChange("roomCharges", e.target.value)
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Medicine Charges (₹)
                  </label>

                  <input
                    type="number"
                    placeholder="0"
                    value={newBill.medicineCharges}
                    onChange={(e) =>
                      handleChargeChange("medicineCharges", e.target.value)
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Test Charges (₹)
                  </label>

                  <input
                    type="number"
                    placeholder="0"
                    value={newBill.testCharges}
                    onChange={(e) =>
                      handleChargeChange("testCharges", e.target.value)
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Total Amount (₹) *
                  </label>

                  <input
                    type="number"
                    placeholder="Calculated automatically"
                    value={newBill.totalAmount}
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        totalAmount:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Payment Status
                  </label>

                  <select
                    value={
                      newBill.paymentStatus
                    }
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        paymentStatus:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Paid
                    </option>

                    <option>
                      Pending
                    </option>

                  </select>

                </div>


              </div>


              <div className="form-buttons">

                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setShowAddBill(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="form-save-btn"
                  id="submit-add-bill-btn"
                >
                  <i className="bi bi-plus-circle-fill"></i> Add Bill
                </button>

              </div>


            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT BILL MODAL
          ===================================================== */}

      {showEditBill && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowEditBill(false)
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
                Edit Bill
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setShowEditBill(false)
                }
              >
                ✕
              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleEditBill}
            >

              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Bill Number *
                  </label>

                  <input
                    type="text"
                    value={
                      editBill.billNumber
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        billNumber:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Patient Name *
                  </label>

                  <input
                    type="text"
                    value={
                      editBill.patientName
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        patientName:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Patient ID *
                  </label>

                  <input
                    type="text"
                    value={
                      editBill.patientId
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        patientId:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Patient Age
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="130"
                    placeholder="Enter age (e.g. 35)"
                    value={
                      editBill.age !== undefined && editBill.age !== null ? editBill.age : ""
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        age:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Doctor
                  </label>

                  <select
                    value={
                      editBill.doctor
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        doctor:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Dr. Rajesh Kumar
                    </option>

                    <option>
                      Dr. Meena Sharma
                    </option>

                    <option>
                      Dr. Suresh Kumar
                    </option>

                    <option>
                      Dr. Anitha
                    </option>

                    <option>
                      Dr. Karthik
                    </option>

                    <option>
                      Dr. Priya
                    </option>

                    <option>
                      Dr. Lakshmi
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Bill Date
                  </label>

                  <input
                    type="text"
                    value={
                      editBill.billDate
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        billDate:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Consultation
                  </label>

                  <input
                    type="number"
                    value={
                      editBill.consultation
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        consultation:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Room Charges
                  </label>

                  <input
                    type="number"
                    value={
                      editBill.roomCharges
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        roomCharges:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Medicine Charges
                  </label>

                  <input
                    type="number"
                    value={
                      editBill.medicineCharges
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        medicineCharges:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Test Charges
                  </label>

                  <input
                    type="number"
                    value={
                      editBill.testCharges
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        testCharges:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Total Amount *
                  </label>

                  <input
                    type="number"
                    value={
                      editBill.totalAmount
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        totalAmount:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Payment Status
                  </label>

                  <select
                    value={
                      editBill.paymentStatus
                    }
                    onChange={(e) =>
                      setEditBill({
                        ...editBill,
                        paymentStatus:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Paid
                    </option>

                    <option>
                      Pending
                    </option>

                  </select>

                </div>


              </div>


              <div className="form-buttons">

                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setShowEditBill(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="form-save-btn"
                >
                  Save Changes
                </button>

              </div>


            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          VIEW BILL MODAL
          ===================================================== */}

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
                ✕
              </button>

            </div>


            <div className="modal-body">


              <div className="profile-section">

                <div className="large-avatar">
                  🧾
                </div>

                <h3>
                  {selectedBill.billNumber}
                </h3>

                <p>
                  {selectedBill.patientName} {selectedBill.age ? `• ${selectedBill.age} yrs` : ""}
                </p>

              </div>


              <div className="details-grid">


                <div className="detail-item">

                  <span>
                    Bill Number
                  </span>

                  <strong>
                    {selectedBill.billNumber}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Patient Name
                  </span>

                  <strong>
                    {selectedBill.patientName}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Patient ID
                  </span>

                  <strong>
                    {selectedBill.patientId}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Patient Age
                  </span>

                  <strong>
                    {selectedBill.age !== undefined && selectedBill.age !== null && selectedBill.age !== "" ? `${selectedBill.age} Years` : "N/A"}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Doctor
                  </span>

                  <strong>
                    {selectedBill.doctor}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Bill Date
                  </span>

                  <strong>
                    {selectedBill.billDate}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Consultation
                  </span>

                  <strong>
                    ₹{selectedBill.consultation}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Room Charges
                  </span>

                  <strong>
                    ₹{selectedBill.roomCharges}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Medicine Charges
                  </span>

                  <strong>
                    ₹{selectedBill.medicineCharges}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Test Charges
                  </span>

                  <strong>
                    ₹{selectedBill.testCharges}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Total Amount
                  </span>

                  <strong>
                    ₹{selectedBill.totalAmount}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Payment Status
                  </span>

                  <strong>
                    {selectedBill.paymentStatus}
                  </strong>

                </div>


              </div>


            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          DELETE CONFIRMATION
          ===================================================== */}

      {deleteBill && (

        <div
          className="modal-overlay"
          onClick={() =>
            setDeleteBill(null)
          }
        >

          <div
            className="delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="delete-icon">
              🗑
            </div>


            <h3>
              Delete Bill?
            </h3>


            <p>

              Are you sure you want to delete{" "}

              <strong>
                {deleteBill.billNumber}
              </strong>

              ?

              This action cannot be undone.

            </p>


            <div className="delete-actions">


              <button
                className="cancel-btn"
                onClick={() =>
                  setDeleteBill(null)
                }
              >
                Cancel
              </button>


              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Delete Bill
              </button>


            </div>


          </div>

        </div>

      )}


      {/* =====================================================
          TOAST
          ===================================================== */}

      {toast && (

        <div
          className={
            `toast ${
              toast.type === "error"
                ? "error"
                : ""
            }`
          }
        >

          <span className="toast-icon">

            {toast.type === "error"
              ? "!"
              : "✓"}

          </span>


          <span>
            {toast.message}
          </span>

        </div>

      )}

    </>
  );
}


export default Billing;