import React, { useEffect, useRef, useState } from "react";
import roomService from "../../Services/roomService";

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
   MANAGE ROOMS COMPONENT
   ========================================================= */

function ManageRooms() {

  const [search, setSearch] = useState("");
  const [roomType, setRoomType] = useState("All");

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [deleteRoom, setDeleteRoom] = useState(null);

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);

  const [toast, setToast] = useState(null);


  /* =========================================================
     NEW ROOM FORM
     ========================================================= */

  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    roomType: "General Ward",
    floor: "Ground Floor",
    bedCount: "",
    availableBeds: "",
    doctor: "Dr. Rajesh Kumar",
    status: "Available",
    price: "",
  });


  /* =========================================================
     EDIT ROOM
     ========================================================= */

  const [editRoom, setEditRoom] = useState({
    id: "",
    roomNumber: "",
    roomType: "",
    floor: "",
    bedCount: "",
    availableBeds: "",
    doctor: "",
    status: "",
    price: "",
  });


  /* =========================================================
     ROOM DATA (FROM API)
     ========================================================= */

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await roomService.getRooms();
      if (res && res.data) {
        setRooms(res.data.map((r) => ({
          ...r,
          id: r._id || r.id,
        })));
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);


  /* =========================================================
     STATISTICS
     ========================================================= */

  const totalRooms = rooms.length;

  const availableRooms = rooms.filter(
    (room) => room.status === "Available"
  ).length;

  const occupiedRooms = rooms.filter(
    (room) => room.status === "Occupied"
  ).length;

  const totalBeds = rooms.reduce(
    (total, room) => total + Number(room.bedCount),
    0
  );

  const availableBeds = rooms.reduce(
    (total, room) => total + Number(room.availableBeds),
    0
  );


  /* =========================================================
     SEARCH + FILTER
     ========================================================= */

  const filteredRooms = rooms.filter((room) => {

    const searchText = search.toLowerCase();

    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchText) ||
      room.roomType.toLowerCase().includes(searchText) ||
      room.floor.toLowerCase().includes(searchText) ||
      room.doctor.toLowerCase().includes(searchText) ||
      room.status.toLowerCase().includes(searchText);

    const matchesRoomType =
      roomType === "All" ||
      room.roomType === roomType;

    return matchesSearch && matchesRoomType;
  });


  /* =========================================================
     TOAST
     ========================================================= */

  const showToast = (message, type = "success") => {

    setToast({
      type,
      message,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };


  /* =========================================================
     ADD ROOM
     ========================================================= */

  const handleAddRoom = async (e) => {
    e.preventDefault();

    if (
      !newRoom.roomNumber ||
      !newRoom.bedCount ||
      !newRoom.availableBeds ||
      !newRoom.price
    ) {
      showToast(
        "Please fill all required fields!",
        "error"
      );
      return;
    }

    if (
      Number(newRoom.availableBeds) >
      Number(newRoom.bedCount)
    ) {
      showToast(
        "Available beds cannot be greater than total beds!",
        "error"
      );
      return;
    }

    try {
      const res = await roomService.createRoom({
        roomNumber: newRoom.roomNumber,
        roomType: newRoom.roomType,
        floor: newRoom.floor,
        bedCount: Number(newRoom.bedCount),
        availableBeds: Number(newRoom.availableBeds),
        doctor: newRoom.doctor,
        status:
          Number(newRoom.availableBeds) === 0
            ? "Occupied"
            : (newRoom.status || "Available"),
        price: Number(newRoom.price),
      });

      if (res && res.data) {
        const added = { ...res.data, id: res.data._id || res.data.id };
        setRooms((prevRooms) => [added, ...prevRooms]);
      } else {
        await fetchRooms();
      }

      setShowAddRoom(false);

      setNewRoom({
        roomNumber: "",
        roomType: "General Ward",
        floor: "Ground Floor",
        bedCount: "",
        availableBeds: "",
        doctor: "Dr. Rajesh Kumar",
        status: "Available",
        price: "",
      });

      showToast("Room added successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add room!", "error");
    }
  };


  /* =========================================================
     OPEN EDIT MODAL
     ========================================================= */

  const openEditRoom = (room) => {
    setEditRoom({
      id: room._id || room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      floor: room.floor,
      bedCount: room.bedCount,
      availableBeds: room.availableBeds,
      doctor: room.doctor,
      status: room.status,
      price: room.price,
    });

    setShowEditRoom(true);
  };


  /* =========================================================
     UPDATE ROOM
     ========================================================= */

  const handleEditRoom = async (e) => {
    e.preventDefault();

    if (
      !editRoom.roomNumber ||
      !editRoom.bedCount ||
      !editRoom.availableBeds ||
      !editRoom.price
    ) {
      showToast(
        "Please fill all required fields!",
        "error"
      );
      return;
    }

    if (
      Number(editRoom.availableBeds) >
      Number(editRoom.bedCount)
    ) {
      showToast(
        "Available beds cannot be greater than total beds!",
        "error"
      );
      return;
    }

    try {
      const roomId = editRoom.id || editRoom._id;
      const res = await roomService.updateRoom(roomId, {
        roomNumber: editRoom.roomNumber,
        roomType: editRoom.roomType,
        floor: editRoom.floor,
        bedCount: Number(editRoom.bedCount),
        availableBeds: Number(editRoom.availableBeds),
        doctor: editRoom.doctor,
        status:
          Number(editRoom.availableBeds) === 0
            ? "Occupied"
            : (editRoom.status || "Available"),
        price: Number(editRoom.price),
      });

      const updated = res.data ? { ...res.data, id: res.data._id || res.data.id } : editRoom;

      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          (room.id === roomId || room._id === roomId)
            ? updated
            : room
        )
      );

      setShowEditRoom(false);
      showToast("Room updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update room!", "error");
    }
  };


  /* =========================================================
     DELETE ROOM
     ========================================================= */

  const confirmDelete = async () => {
    if (!deleteRoom) return;

    try {
      const roomId = deleteRoom._id || deleteRoom.id;
      await roomService.deleteRoom(roomId);

      setRooms((prevRooms) =>
        prevRooms.filter(
          (room) => room.id !== roomId && room._id !== roomId
        )
      );

      setDeleteRoom(null);
      showToast("Room deleted successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete room!", "error");
    }
  };


  /* =========================================================
     ROOM ICON
     ========================================================= */

  const getRoomIcon = (type) => {

    if (type === "ICU") {
      return <i class="bi bi-h-square-fill"></i>;
    }

    if (type === "Emergency") {
      return <i class="bi bi-truck-front"></i>;
    }

    if (type === "Private Room") {
      return <i class="bi bi-hospital"></i>;
    }

    if (type === "Semi Private") {
      return <i class="bi bi-hospital"></i>;
    }

    return <i class="bi bi-hospital"></i>;
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
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f8fb;
        }


        /* ================= PAGE ================= */

        .rooms-page {

          min-height: calc(100vh - 70px);

          margin-top: 70px;

          margin-left: 240px;

          width: calc(100% - 240px);

          padding: 30px;

          background: #f4f8fb;

          animation:
            pageFade 0.6s ease;
        }


        @keyframes pageFade {

          from {
            opacity: 0;
            transform: translateY(15px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }


        /* ================= HEADER ================= */

        .rooms-header {

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-bottom: 28px;

          padding: 24px 22px;

          background: #eaf5ff;

          border:
            1px solid #cfe7ff;

          border-radius: 17px;

          box-shadow:
            0 5px 16px
            rgba(25, 118, 210, 0.05);

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
            rgba(25, 118, 210, 0.18);
        }


        .header-title p {

          margin: 7px 0 0;

          color: #4779ad;

          font-size: 14px;
        }


        /* ================= ADD BUTTON ================= */

        .add-room-btn {

          border: none;

          background: #1976d2;

          color: white;

          height: 44px;

          padding: 0 20px;

          border-radius: 10px;

          font-size: 14px;

          font-weight: 600;

          cursor: pointer;

          display: flex;

          align-items: center;

          gap: 8px;

          box-shadow:
            0 5px 15px
            rgba(25, 118, 210, 0.18);

          transition:
            all 0.3s ease;
        }


        .add-room-btn:hover {

          background: #1565c0;

          transform:
            translateY(-2px)
            scale(0.96);

          box-shadow:
            0 8px 20px
            rgba(25, 118, 210, 0.24);
        }


        .add-room-btn:active {

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
            rgba(50, 90, 110, 0.07);

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
            transform: translateY(25px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }


        .stat-card:hover {

          transform:
            translateY(-5px)
            scale(0.97);

          box-shadow:
            0 12px 28px
            rgba(50, 90, 110, 0.12);
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


        .stat-card:hover .stat-icon {

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


        .purple-icon {

          background: #f3e5f5;

          color: #8e44ad;
        }


        .orange-icon {

          background: #fff3e0;

          color: #ef6c00;
        }


        .stat-info p {

          margin: 0 0 6px;

          color: #78909c;

          font-size: 13px;
        }


        .stat-info h2 {

          margin: 0;

          font-size: 25px;

          color: #263238;
        }


        /* ================= ROOM CARD ================= */

        .rooms-card {

          background: #ffffff;

          border:
            1px solid #e5edf3;

          border-radius: 18px;

          box-shadow:
            0 7px 22px
            rgba(50, 90, 110, 0.06);

          overflow: hidden;

          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease;

          animation:
            contentAppear 0.8s ease;
        }


        .rooms-card:hover {

          transform:
            scale(0.995);

          box-shadow:
            0 15px 35px
            rgba(50, 90, 110, 0.10);
        }


        @keyframes contentAppear {

          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }


        /* ================= TOOLBAR ================= */

        .rooms-toolbar {

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
            rgba(33, 150, 243, 0.08);

          transform:
            scale(0.99);
        }


        .filter-area {

          display: flex;

          gap: 10px;
        }


        .filter-area select {

          height: 43px;

          padding:
            0 35px 0 13px;

          border:
            1px solid #dce6ec;

          border-radius: 10px;

          background: #ffffff;

          color: #455a64;

          outline: none;

          cursor: pointer;

          transition:
            0.3s ease;
        }


        .filter-area select:hover {

          transform:
            scale(0.97);

          border-color:
            #90caf9;
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

          min-width: 1100px;
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
            transform: translateX(-10px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }

        }


        /* ================= ROOM ================= */

        .room-info {

          display: flex;

          align-items: center;

          gap: 11px;
        }


        .room-avatar {

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


        tr:hover .room-avatar {

          transform:
            scale(0.88);
        }


        .room-name {

          color: #263238;

          font-weight: 600;
        }


        .room-id {

          color: #90a4ae;

          font-size: 11px;

          margin-top: 3px;
        }


        /* ================= ROOM TYPE ================= */

        .room-type {

          background: #eef7fd;

          color: #1976d2;

          padding:
            6px 10px;

          border-radius: 20px;

          font-size: 11px;

          display: inline-block;

          transition:
            transform 0.25s ease;
        }


        tr:hover .room-type {

          transform:
            scale(0.94);
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


        .status.occupied {

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
            rgba(30, 50, 65, 0.35);

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

          width: 560px;

          max-width: 100%;

          max-height: 90vh;

          overflow-y: auto;

          background: #ffffff;

          border-radius: 18px;

          box-shadow:
            0 20px 60px
            rgba(0, 0, 0, 0.15);

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

          transition:
            0.25s;
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
            rgba(33, 150, 243, 0.08);
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
              rgba(25, 118, 210, 0.12);
          }

          50% {

            box-shadow:
              0 0 0 10px
              rgba(25, 118, 210, 0.04);
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
            rgba(0, 0, 0, 0.15);
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
            rgba(0, 0, 0, 0.13);

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


        .toast.error .toast-icon {

          background: #ffebee;

          color: #e53935;
        }


        /* ================= RESPONSIVE ================= */

        @media (max-width: 1200px) {

          .rooms-page {

            padding-left: 220px;
          }

          .stats-grid {

            grid-template-columns:
              repeat(2, 1fr);
          }

        }


        @media (max-width: 900px) {

          .rooms-page {

            margin-left: 0;

            width: 100%;

            padding:
              20px 18px 18px;
          }

        }


        @media (max-width: 700px) {

          .rooms-page {

            padding:
              70px 18px 18px 18px;
          }


          .rooms-header {

            flex-direction: column;

            align-items: stretch;

            gap: 15px;

            padding: 20px;
          }


          .add-room-btn {

            width: 100%;

            justify-content: center;
          }


          .stats-grid {

            grid-template-columns: 1fr;
          }


          .rooms-toolbar {

            flex-direction: column;

            align-items: stretch;
          }


          .search-box {

            width: 100%;
          }


          .filter-area {

            width: 100%;
          }


          .filter-area select {

            width: 100%;
          }


          .details-grid {

            grid-template-columns: 1fr;
          }


          .form-grid {

            grid-template-columns: 1fr;
          }


          .form-group.full {

            grid-column: span 1;
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

      <div className="rooms-page">


        {/* ================= HEADER ================= */}

        <div className="rooms-header">

          <div className="header-title">

            <h1>
              Manage Rooms
            </h1>

            <p>
              Manage and monitor all hospital rooms
            </p>

          </div>


          <button
            className="add-room-btn"
            onClick={() =>
              setShowAddRoom(true)
            }
          >

            <span className="add-icon">
              +
            </span>

            Add Room

          </button>

        </div>


        {/* =================================================
            STAT CARDS
            ================================================= */}

        <div className="stats-grid">


          <div className="stat-card">

            <div className="stat-icon blue-icon">
              <i class="bi bi-hospital"></i>
            </div>

            <div className="stat-info">

              <p>
                Total Rooms
              </p>

              <h2>
                <Counter
                  value={totalRooms}
                />
              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon green-icon">
              ✓
            </div>

            <div className="stat-info">

              <p>
                Available Rooms
              </p>

              <h2>
                <Counter
                  value={availableRooms}
                />
              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon purple-icon">
              <i class="bi bi-hospital"></i>
            </div>

            <div className="stat-info">

              <p>
                Occupied Rooms
              </p>

              <h2>
                <Counter
                  value={occupiedRooms}
                />
              </h2>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon orange-icon">
              <i class="bi bi-hospital"></i>
            </div>

            <div className="stat-info">

              <p>
                Available Beds
              </p>

              <h2>
                <Counter
                  value={availableBeds}
                />
              </h2>

            </div>

          </div>


        </div>


        {/* ================= ROOM TABLE ================= */}

        <div className="rooms-card">


          <div className="rooms-toolbar">


            <div className="search-box">

              <span>
                <i class="bi bi-search"></i>
              </span>

              <input
                type="text"
                placeholder="Search rooms..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>


            <div className="filter-area">

              <select
                value={roomType}
                onChange={(e) =>
                  setRoomType(e.target.value)
                }
              >

                <option value="All">
                  All Room Types
                </option>

                <option value="General Ward">
                  General Ward
                </option>

                <option value="Private Room">
                  Private Room
                </option>

                <option value="Semi Private">
                  Semi Private
                </option>

                <option value="ICU">
                  ICU
                </option>

                <option value="Emergency">
                  Emergency
                </option>

              </select>

            </div>

          </div>


          <div className="table-container">


            {filteredRooms.length === 0 ? (

              <div className="empty-state">

                <div>
                  <i class="bi bi-search"></i>
                </div>

                <strong>
                  No rooms found
                </strong>

                <p>
                  Try changing your search or filter.
                </p>

              </div>

            ) : (

              <table>

                <thead>

                  <tr>

                    <th>
                      Room
                    </th>

                    <th>
                      Room Type
                    </th>

                    <th>
                      Floor
                    </th>

                    <th>
                      Beds
                    </th>

                    <th>
                      Doctor
                    </th>

                    <th>
                      Price
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

                  {filteredRooms.map(
                    (room) => (

                      <tr key={room.id}>


                        <td>

                          <div className="room-info">

                            <div className="room-avatar">

                              {getRoomIcon(
                                room.roomType
                              )}

                            </div>


                            <div>

                              <div className="room-name">

                                Room {room.roomNumber}

                              </div>

                              <div className="room-id">

                                RM-{room.id
                                  .toString()
                                  .padStart(4, "0")}

                              </div>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span className="room-type">

                            {room.roomType}

                          </span>

                        </td>


                        <td>

                          {room.floor}

                        </td>


                        <td>

                          <strong>
                            {room.availableBeds}
                          </strong>

                          {" / "}

                          {room.bedCount}

                          <br />

                          <span
                            style={{
                              color: "#90a4ae",
                              fontSize: "11px",
                            }}
                          >
                            Available
                          </span>

                        </td>


                        <td>

                          {room.doctor}

                        </td>


                        <td>

                          ₹{room.price}

                          <br />

                          <span
                            style={{
                              color: "#90a4ae",
                              fontSize: "11px",
                            }}
                          >
                            per day
                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              `status ${
                                room.status.toLowerCase()
                              }`
                            }
                          >

                            {room.status}

                          </span>

                        </td>


                        <td>

                          <div className="actions">


                            <button
                              className="action-btn view-btn"
                              onClick={() =>
                                setSelectedRoom(room)
                              }
                            >
                              View
                            </button>


                            <button
                              className="action-btn edit-btn"
                              onClick={() =>
                                openEditRoom(room)
                              }
                            >
                              Edit
                            </button>


                            <button
                              className="action-btn delete-btn"
                              onClick={() =>
                                setDeleteRoom(room)
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
          ADD ROOM MODAL
          ===================================================== */}

      {showAddRoom && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddRoom(false)
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
                Add New Room
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setShowAddRoom(false)
                }
              >
                ✕
              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleAddRoom}
            >

              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Room Number *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter room number"
                    value={newRoom.roomNumber}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        roomNumber:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Room Type
                  </label>

                  <select
                    value={newRoom.roomType}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        roomType:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      General Ward
                    </option>

                    <option>
                      Private Room
                    </option>

                    <option>
                      Semi Private
                    </option>

                    <option>
                      ICU
                    </option>

                    <option>
                      Emergency
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Floor
                  </label>

                  <select
                    value={newRoom.floor}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        floor:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Ground Floor
                    </option>

                    <option>
                      First Floor
                    </option>

                    <option>
                      Second Floor
                    </option>

                    <option>
                      Third Floor
                    </option>

                    <option>
                      Fourth Floor
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Total Beds *
                  </label>

                  <input
                    type="number"
                    placeholder="Enter total beds"
                    value={newRoom.bedCount}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        bedCount:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Available Beds *
                  </label>

                  <input
                    type="number"
                    placeholder="Enter available beds"
                    value={newRoom.availableBeds}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        availableBeds:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Assigned Doctor
                  </label>

                  <select
                    value={newRoom.doctor}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
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
                    Price Per Day *
                  </label>

                  <input
                    type="number"
                    placeholder="Enter room price"
                    value={newRoom.price}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        price:
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
                    value={newRoom.status}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Available
                    </option>

                    <option>
                      Occupied
                    </option>

                  </select>

                </div>


              </div>


              <div className="form-buttons">


                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setShowAddRoom(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="form-save-btn"
                >
                  Add Room
                </button>


              </div>


            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT ROOM MODAL
          ===================================================== */}

      {showEditRoom && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowEditRoom(false)
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
                Edit Room
              </h2>

              <button
                className="close-btn"
                onClick={() =>
                  setShowEditRoom(false)
                }
              >
                ✕
              </button>

            </div>


            <form
              className="add-form"
              onSubmit={handleEditRoom}
            >

              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Room Number *
                  </label>

                  <input
                    type="text"
                    value={editRoom.roomNumber}
                    onChange={(e) =>
                      setEditRoom({
                        ...editRoom,
                        roomNumber:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Room Type
                  </label>

                  <select
                    value={editRoom.roomType}
                    onChange={(e) =>
                      setEditRoom({
                        ...editRoom,
                        roomType:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      General Ward
                    </option>

                    <option>
                      Private Room
                    </option>

                    <option>
                      Semi Private
                    </option>

                    <option>
                      ICU
                    </option>

                    <option>
                      Emergency
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Floor
                  </label>

                  <select
                    value={editRoom.floor}
                    onChange={(e) =>
                      setEditRoom({
                        ...editRoom,
                        floor:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Ground Floor
                    </option>

                    <option>
                      First Floor
                    </option>

                    <option>
                      Second Floor
                    </option>

                    <option>
                      Third Floor
                    </option>

                    <option>
                      Fourth Floor
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Total Beds *
                  </label>

                  <input
                    type="number"
                    value={editRoom.bedCount}
                    onChange={(e) =>
                      setEditRoom({
                        ...editRoom,
                        bedCount:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Available Beds *
                  </label>

                  <input
                    type="number"
                    value={editRoom.availableBeds}
                    onChange={(e) =>
                      setEditRoom({
                        ...editRoom,
                        availableBeds:
                          e.target.value,
                      })
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Assigned Doctor
                  </label>

                  <select
                    value={editRoom.doctor}
                    onChange={(e) =>
                      setEditRoom({
                        ...editRoom,
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
                    Price Per Day *
                  </label>

                  <input
                    type="number"
                    value={editRoom.price}
                    onChange={(e) =>
                      setEditRoom({
                        ...editRoom,
                        price:
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
                    value={editRoom.status}
                    onChange={(e) =>
                      setEditRoom({
                        ...editRoom,
                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Available
                    </option>

                    <option>
                      Occupied
                    </option>

                  </select>

                </div>


              </div>


              <div className="form-buttons">


                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() =>
                    setShowEditRoom(false)
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
          VIEW ROOM MODAL
          ===================================================== */}

      {selectedRoom && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedRoom(null)
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
                Room Details
              </h2>


              <button
                className="close-btn"
                onClick={() =>
                  setSelectedRoom(null)
                }
              >
                ✕
              </button>

            </div>


            <div className="modal-body">


              <div className="profile-section">


                <div className="large-avatar">

                  {getRoomIcon(
                    selectedRoom.roomType
                  )}

                </div>


                <h3>

                  Room {selectedRoom.roomNumber}

                </h3>


                <p>

                  {selectedRoom.roomType}

                </p>


              </div>


              <div className="details-grid">


                <div className="detail-item">

                  <span>
                    Room Number
                  </span>

                  <strong>
                    {selectedRoom.roomNumber}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Room Type
                  </span>

                  <strong>
                    {selectedRoom.roomType}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Floor
                  </span>

                  <strong>
                    {selectedRoom.floor}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Total Beds
                  </span>

                  <strong>
                    {selectedRoom.bedCount}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Available Beds
                  </span>

                  <strong>
                    {selectedRoom.availableBeds}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Occupied Beds
                  </span>

                  <strong>
                    {selectedRoom.bedCount -
                      selectedRoom.availableBeds}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Assigned Doctor
                  </span>

                  <strong>
                    {selectedRoom.doctor}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Price Per Day
                  </span>

                  <strong>
                    ₹{selectedRoom.price}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Registration Date
                  </span>

                  <strong>
                    {selectedRoom.date}
                  </strong>

                </div>


                <div className="detail-item">

                  <span>
                    Status
                  </span>

                  <strong>
                    {selectedRoom.status}
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

      {deleteRoom && (

        <div
          className="modal-overlay"
          onClick={() =>
            setDeleteRoom(null)
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
              Delete Room?
            </h3>


            <p>

              Are you sure you want to delete{" "}

              <strong>
                Room {deleteRoom.roomNumber}
              </strong>

              ?

              This action cannot be undone.

            </p>


            <div className="delete-actions">


              <button
                className="cancel-btn"
                onClick={() =>
                  setDeleteRoom(null)
                }
              >
                Cancel
              </button>


              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Delete Room
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


export default ManageRooms;