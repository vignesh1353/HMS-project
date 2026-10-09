import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
 faCheck
  } from "@fortawesome/free-solid-svg-icons";
import pharmacyService from "../../Services/pharmacyService";

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
   PHARMACY COMPONENT
   ========================================================= */

function Pharmacy() {

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  const [selectedMedicine, setSelectedMedicine] =
    useState(null);

  const [deleteMedicine, setDeleteMedicine] =
    useState(null);

  const [editMedicine, setEditMedicine] =
    useState(null);

  const [showAddMedicine, setShowAddMedicine] =
    useState(false);

  const [toast, setToast] = useState(null);


  /* =========================================================
     NEW MEDICINE FORM
     ========================================================= */

  const [newMedicine, setNewMedicine] = useState({

    name: "",
    category: "Tablet",
    manufacturer: "",
    batchNo: "",
    quantity: "",
    price: "",
    expiryDate: "",
    supplier: "",
    status: "Available",

  });


  /* =========================================================
     MEDICINE DATA (FROM API)
     ========================================================= */

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await pharmacyService.getMedicines();
      if (res && res.data) {
        setMedicines(res.data.map((m) => ({
          ...m,
          id: m._id || m.id,
        })));
      }
    } catch (err) {
      console.error("Error fetching medicines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);


  /* =========================================================
     STATISTICS
     ========================================================= */

  const totalMedicines = medicines.length;

  const availableMedicines = medicines.filter(
    (medicine) =>
      medicine.status === "Available"
  ).length;

  const lowStockMedicines = medicines.filter(
    (medicine) =>
      medicine.status === "Low Stock"
  ).length;

  const totalStock = medicines.reduce(
    (total, medicine) =>
      total + Number(medicine.quantity),
    0
  );


  /* =========================================================
     SEARCH AND FILTER
     ========================================================= */

  const filteredMedicines = medicines.filter(
    (medicine) => {

      const searchText =
        search.toLowerCase();

      const matchesSearch =
        medicine.name
          .toLowerCase()
          .includes(searchText) ||

        medicine.medicineId
          .toLowerCase()
          .includes(searchText) ||

        medicine.manufacturer
          .toLowerCase()
          .includes(searchText) ||

        medicine.batchNo
          .toLowerCase()
          .includes(searchText) ||

        medicine.supplier
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        category === "All" ||
        medicine.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );


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
     ADD MEDICINE
     ========================================================= */

  const handleAddMedicine = async (e) => {
    e.preventDefault();

    if (
      !newMedicine.name ||
      !newMedicine.quantity ||
      !newMedicine.price
    ) {
      showToast(
        "Please fill all required fields!",
        "error"
      );
      return;
    }

    try {
      const res = await pharmacyService.createMedicine({
        name: newMedicine.name,
        category: newMedicine.category || "Tablet",
        manufacturer: newMedicine.manufacturer || "Generic",
        batchNo: newMedicine.batchNo || `BATCH-${Date.now().toString().slice(-4)}`,
        quantity: Number(newMedicine.quantity),
        price: Number(newMedicine.price),
        expiryDate: newMedicine.expiryDate || "Dec 2027",
        supplier: newMedicine.supplier || "Default Supplier",
        status: Number(newMedicine.quantity) > 50 ? "Available" : (Number(newMedicine.quantity) > 0 ? "Low Stock" : "Out of Stock"),
      });

      if (res && res.data) {
        const added = { ...res.data, id: res.data._id || res.data.id };
        setMedicines((prevMedicines) => [added, ...prevMedicines]);
      } else {
        await fetchMedicines();
      }

      setShowAddMedicine(false);

      setNewMedicine({
        name: "",
        category: "Tablet",
        manufacturer: "",
        batchNo: "",
        quantity: "",
        price: "",
        expiryDate: "",
        supplier: "",
        status: "Available",
      });

      showToast("Medicine added successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add medicine!", "error");
    }
  };


  /* =========================================================
     EDIT MEDICINE
     ========================================================= */

  const handleEditMedicine = async (e) => {
    e.preventDefault();

    if (
      !editMedicine.name ||
      !editMedicine.quantity ||
      !editMedicine.price
    ) {
      showToast(
        "Please fill all required fields!",
        "error"
      );
      return;
    }

    try {
      const medId = editMedicine._id || editMedicine.id;
      const res = await pharmacyService.updateMedicine(medId, {
        name: editMedicine.name,
        category: editMedicine.category,
        manufacturer: editMedicine.manufacturer,
        batchNo: editMedicine.batchNo,
        quantity: Number(editMedicine.quantity),
        price: Number(editMedicine.price),
        expiryDate: editMedicine.expiryDate,
        supplier: editMedicine.supplier,
        status: Number(editMedicine.quantity) > 50 ? "Available" : (Number(editMedicine.quantity) > 0 ? "Low Stock" : "Out of Stock"),
      });

      const updated = res.data ? { ...res.data, id: res.data._id || res.data.id } : editMedicine;

      setMedicines((prevMedicines) =>
        prevMedicines.map((medicine) =>
          (medicine.id === medId || medicine._id === medId)
            ? updated
            : medicine
        )
      );

      setEditMedicine(null);
      showToast("Medicine updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update medicine!", "error");
    }
  };


  /* =========================================================
     DELETE MEDICINE
     ========================================================= */

  const confirmDelete = async () => {
    if (!deleteMedicine) return;

    try {
      const medId = deleteMedicine._id || deleteMedicine.id;
      await pharmacyService.deleteMedicine(medId);

      setMedicines((prevMedicines) =>
        prevMedicines.filter(
          (medicine) => medicine.id !== medId && medicine._id !== medId
        )
      );

      setDeleteMedicine(null);
      showToast("Medicine deleted successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete medicine!", "error");
    }
  };


  /* =========================================================
     STATUS CLASS
     ========================================================= */

  const getStatusClass = (status) => {

    return status === "Available"
      ? "available"
      : "low-stock";
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

        .pharmacy-page {

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

        .pharmacy-header {

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

        .add-medicine-btn {

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


        .add-medicine-btn:hover {

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


        .add-medicine-btn:active {

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
          animation-delay: 0.1s;
        }


        .stat-card:nth-child(2) {
          animation-delay: 0.2s;
        }


        .stat-card:nth-child(3) {
          animation-delay: 0.3s;
        }


        .stat-card:nth-child(4) {
          animation-delay: 0.4s;
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


        /* ================= PHARMACY CARD ================= */

        .pharmacy-card {

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


        .pharmacy-card:hover {

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

        .pharmacy-toolbar {

          padding: 20px;

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 15px;

          border-bottom:
            1px solid #edf2f5;
        }


        .toolbar-left {

          display: flex;

          align-items: center;

          gap: 12px;
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


        .category-select {

          height: 43px;

          border:
            1px solid #dce6ec;

          border-radius: 10px;

          padding:
            0 14px;

          outline: none;

          color: #455a64;

          background: #fbfdff;

          font-size: 13px;

          cursor: pointer;
        }


        .category-select:focus {

          border-color:
            #64b5f6;
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

          min-width: 1150px;
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


        /* ================= MEDICINE INFO ================= */

        .medicine-info {

          display: flex;

          align-items: center;

          gap: 11px;
        }


        .medicine-avatar {

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
        .medicine-avatar {

          transform:
            scale(0.88);
        }


        .medicine-name {

          color: #263238;

          font-weight: 600;
        }


        .medicine-id {

          color: #90a4ae;

          font-size: 11px;

          margin-top: 3px;
        }


        /* ================= STOCK ================= */

        .stock {

          font-weight: 700;

          color: #37474f;
        }


        .low-stock-text {

          color: #ef6c00;
        }


        /* ================= PRICE ================= */

        .price {

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


        .status.available {

          background: #e8f5e9;

          color: #2e7d32;
        }


        .status.low-stock {

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


        /* VIEW - TEXT ONLY */

        .view-btn {

          background: #e3f2fd;

          color: #1976d2;
        }


        /* EDIT - TEXT ONLY */

        .edit-btn {

          background: #fff3e0;

          color: #ef6c00;
        }


        /* DELETE - ICON ONLY */

        .delete-btn {

          width: 34px;

          padding: 0;

          background: #ffebee;

          color: #e53935;

          font-size: 15px;
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

          width: 600px;

          max-width: 100%;

          max-height: 90vh;

          overflow-y: auto;

          background: #ffffff;

          border-radius: 18px;

          box-shadow:
            0 20px 60px
            rgba(
              0,
              0,
              0,
              0.15
            );

          overflow: hidden;

          animation:
            modalZoom 0.3s ease;
        }


        @keyframes modalZoom {

          from {

            opacity: 0;

            transform:
              scale(0.9)
              translateY(15px);
          }

          to {

            opacity: 1;

            transform:
              scale(1)
              translateY(0);
          }

        }


        .modal-header {

          padding:
            20px 22px;

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          background: #f7fbfe;

          border-bottom:
            1px solid #e8f0f5;
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

          justify-content:
            flex-end;

          gap: 10px;

          margin-top: 22px;
        }


        .form-cancel-btn,
        .form-save-btn {

          height: 40px;

          padding:
            0 20px;

          border: none;

          border-radius: 9px;

          cursor: pointer;

          font-size: 13px;

          font-weight: 600;

          transition:
            0.25s ease;
        }


        .form-cancel-btn {

          background: #f1f5f7;

          color: #546e7a;
        }


        .form-save-btn {

          background: #1976d2;

          color: #ffffff;
        }


        .form-cancel-btn:hover,
        .form-save-btn:hover {

          transform:
            translateY(-2px)
            scale(0.96);
        }


        .form-save-btn:hover {

          background: #1565c0;
        }


        .form-cancel-btn:hover {

          background: #e3ebef;
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

          .pharmacy-page {

            padding-left: 220px;
          }

          .stats-grid {

            grid-template-columns:
              repeat(2, 1fr);
          }

        }


        @media (max-width: 900px) {

          .pharmacy-page {

            margin-left: 0;

            width: 100%;

            padding:
              20px 18px 18px;
          }

        }


        @media (max-width: 700px) {

          .pharmacy-page {

            padding:
              70px 18px 18px 18px;
          }


          .pharmacy-header {

            flex-direction:
              column;

            align-items: stretch;

            gap: 15px;

            padding: 20px;
          }


          .add-medicine-btn {

            width: 100%;

            justify-content: center;
          }


          .stats-grid {

            grid-template-columns:
              1fr;
          }


          .pharmacy-toolbar {

            flex-direction:
              column;

            align-items: stretch;
          }


          .toolbar-left {

            flex-direction:
              column;

            align-items: stretch;
          }


          .search-box {

            width: 100%;
          }


          .category-select {

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

      <div className="pharmacy-page">


        {/* ================= HEADER ================= */}

        <div className="pharmacy-header">

          <div className="header-title">

            <h1>
              Manage Pharmacy
            </h1>

            <p>
              Manage and monitor all medicines
            </p>

          </div>


          <button
            className="add-medicine-btn"
            onClick={() =>
              setShowAddMedicine(true)
            }
          >

            <span className="add-icon">
              +
            </span>

            Add Medicine

          </button>

        </div>


        {/* =================================================
            STAT CARDS
            ================================================= */}

        <div className="stats-grid">


          <div className="stat-card">

            <div className="stat-icon blue-icon">
              <i class="bi bi-capsule-pill"></i>
            </div>

            <div className="stat-info">

              <p>
                Total Medicines
              </p>

              <h2>

                <Counter
                  value={totalMedicines}
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
                Available
              </p>

              <h2>

                <Counter
                  value={availableMedicines}
                />

              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon orange-icon">
              <i class="bi bi-exclamation-triangle"></i>
            </div>

            <div className="stat-info">

              <p>
                Low Stock
              </p>

              <h2>

                <Counter
                  value={lowStockMedicines}
                />

              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon purple-icon">
              <i class="bi bi-box"></i>
            </div>

            <div className="stat-info">

              <p>
                Total Stock
              </p>

              <h2>

                <Counter
                  value={totalStock}
                />

              </h2>

            </div>

          </div>


        </div>


        {/* ================= MEDICINE TABLE ================= */}

        <div className="pharmacy-card">


          <div className="pharmacy-toolbar">


            <div className="toolbar-left">


              <div className="search-box">

                <span>
                  <i className="bi bi-search"></i>
                </span>

                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>


              <select
                className="category-select"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
              >

                <option value="All">
                  All Categories
                </option>

                <option value="Tablet">
                  Tablet
                </option>

                <option value="Capsule">
                  Capsule
                </option>

                <option value="Injection">
                  Injection
                </option>

                <option value="Syrup">
                  Syrup
                </option>

              </select>


            </div>


          </div>


          <div className="table-container">


            {filteredMedicines.length === 0 ? (

              <div className="empty-state">

                <div>
                   <i class="bi bi-search"></i>
                </div>

                <strong>
                  No medicines found
                </strong>

                <p>
                  Try changing your search or category.
                </p>

              </div>

            ) : (

              <table>

                <thead>

                  <tr>

                    <th>
                      Medicine
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Manufacturer
                    </th>

                    <th>
                      Batch No
                    </th>

                    <th>
                      Quantity
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Expiry Date
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredMedicines.map(
                    (medicine) => (

                      <tr key={medicine.id}>


                        <td>

                          <div className="medicine-info">

                            <div className="medicine-avatar">
                              <i class="bi bi-capsule-pill"></i>
                            </div>

                            <div>

                              <div className="medicine-name">

                                {medicine.name}

                              </div>

                              <div className="medicine-id">

                                {medicine.medicineId}

                              </div>

                            </div>

                          </div>

                        </td>


                        <td>

                          {medicine.category}

                        </td>


                        <td>

                          {medicine.manufacturer}

                        </td>


                        <td>

                          {medicine.batchNo}

                        </td>


                        <td>

                          <span
                            className={
                              medicine.quantity <= 60
                                ? "stock low-stock-text"
                                : "stock"
                            }
                          >

                            {medicine.quantity}

                          </span>

                        </td>


                        <td>

                          <span className="price">

                            ₹
                            {medicine.price}

                          </span>

                        </td>


                        <td>

                          {medicine.expiryDate}

                        </td>


                        <td>

                          <span
                            className={
                              `status ${
                                getStatusClass(
                                  medicine.status
                                )
                              }`
                            }
                          >

                            {medicine.status}

                          </span>

                        </td>


                        <td>

                          <div className="actions">


                            {/* VIEW - TEXT ONLY */}

                            <button
                              className="action-btn view-btn"
                              onClick={() =>
                                setSelectedMedicine(
                                  medicine
                                )
                              }
                            >
                              View
                            </button>


                            {/* EDIT - TEXT ONLY */}

                            <button
                              className="action-btn edit-btn"
                              onClick={() =>
                                setEditMedicine({
                                  ...medicine,
                                })
                              }
                            >
                              Edit
                            </button>


                            {/* DELETE - ICON ONLY */}

                            <button
                              className="action-btn delete-btn"
                              onClick={() =>
                                setDeleteMedicine(
                                  medicine
                                )
                              }
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
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
          ADD MEDICINE MODAL
          ===================================================== */}

      {showAddMedicine && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddMedicine(false)
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
                Add New Medicine
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setShowAddMedicine(false)
                }
              >
                ✕
              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleAddMedicine}
            >

              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Medicine Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter medicine name"
                    value={
                      newMedicine.name
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        name:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <select
                    value={
                      newMedicine.category
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        category:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Tablet">
                      Tablet
                    </option>

                    <option value="Capsule">
                      Capsule
                    </option>

                    <option value="Injection">
                      Injection
                    </option>

                    <option value="Syrup">
                      Syrup
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Manufacturer *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter manufacturer"
                    value={
                      newMedicine.manufacturer
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        manufacturer:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Batch Number *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter batch number"
                    value={
                      newMedicine.batchNo
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        batchNo:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Quantity *
                  </label>

                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={
                      newMedicine.quantity
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        quantity:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Price *
                  </label>

                  <input
                    type="number"
                    placeholder="Enter price"
                    value={
                      newMedicine.price
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        price:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Expiry Date *
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Dec 2027"
                    value={
                      newMedicine.expiryDate
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        expiryDate:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Supplier *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter supplier name"
                    value={
                      newMedicine.supplier
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        supplier:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      newMedicine.status
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Available">
                      Available
                    </option>

                    <option value="Low Stock">
                      Low Stock
                    </option>

                  </select>

                </div>


              </div>


              <div className="form-buttons">

                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setShowAddMedicine(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="form-save-btn"
                >
                  Add Medicine
                </button>

              </div>


            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT MEDICINE MODAL
          ===================================================== */}

      {editMedicine && (

        <div
          className="modal-overlay"
          onClick={() =>
            setEditMedicine(null)
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
                Edit Medicine
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setEditMedicine(null)
                }
              >
                ✕
              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleEditMedicine}
            >

              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Medicine Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter medicine name"
                    value={
                      editMedicine.name
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        name:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <select
                    value={
                      editMedicine.category
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        category:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Tablet">
                      Tablet
                    </option>

                    <option value="Capsule">
                      Capsule
                    </option>

                    <option value="Injection">
                      Injection
                    </option>

                    <option value="Syrup">
                      Syrup
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Manufacturer *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter manufacturer"
                    value={
                      editMedicine.manufacturer
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        manufacturer:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Batch Number *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter batch number"
                    value={
                      editMedicine.batchNo
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        batchNo:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Quantity *
                  </label>

                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={
                      editMedicine.quantity
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        quantity:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Price *
                  </label>

                  <input
                    type="number"
                    placeholder="Enter price"
                    value={
                      editMedicine.price
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        price:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Expiry Date *
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Dec 2027"
                    value={
                      editMedicine.expiryDate
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        expiryDate:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Supplier *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter supplier name"
                    value={
                      editMedicine.supplier
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        supplier:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      editMedicine.status
                    }
                    onChange={(e) =>
                      setEditMedicine({
                        ...editMedicine,
                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Available">
                      Available
                    </option>

                    <option value="Low Stock">
                      Low Stock
                    </option>

                  </select>

                </div>


              </div>


              <div className="form-buttons">

                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setEditMedicine(null)
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
          VIEW MEDICINE MODAL
          ===================================================== */}

      {selectedMedicine && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedMedicine(null)
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
                Medicine Details
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setSelectedMedicine(null)
                }
              >
                ✕
              </button>

            </div>


            <div className="modal-body">


              <div className="profile-section">

                <div className="large-avatar">
                  💊
                </div>

                <h3>
                  {selectedMedicine.name}
                </h3>

                <p>
                  {selectedMedicine.medicineId}
                </p>

              </div>


              <div className="details-grid">


                <div className="detail-item">

                  <span>
                    Medicine Name
                  </span>

                  <strong>
                    {selectedMedicine.name}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Medicine ID
                  </span>

                  <strong>
                    {selectedMedicine.medicineId}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Category
                  </span>

                  <strong>
                    {selectedMedicine.category}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Manufacturer
                  </span>

                  <strong>
                    {selectedMedicine.manufacturer}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Batch Number
                  </span>

                  <strong>
                    {selectedMedicine.batchNo}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Quantity
                  </span>

                  <strong>
                    {selectedMedicine.quantity}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Price
                  </span>

                  <strong>
                    ₹{selectedMedicine.price}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Expiry Date
                  </span>

                  <strong>
                    {selectedMedicine.expiryDate}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Supplier
                  </span>

                  <strong>
                    {selectedMedicine.supplier}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Status
                  </span>

                  <strong>
                    {selectedMedicine.status}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Added Date
                  </span>

                  <strong>
                    {selectedMedicine.date}
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

      {deleteMedicine && (

        <div
          className="modal-overlay"
          onClick={() =>
            setDeleteMedicine(null)
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
              Delete Medicine?
            </h3>


            <p>

              Are you sure you want to delete{" "}

              <strong>
                {deleteMedicine.name}
              </strong>

              ?

              This action cannot be undone.

            </p>


            <div className="delete-actions">


              <button
                className="cancel-btn"
                onClick={() =>
                  setDeleteMedicine(null)
                }
              >
                Cancel
              </button>


              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Delete Medicine
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


export default Pharmacy;