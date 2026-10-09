import React from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";

// Public Pages
import Homepage from "./Components/Homepage";
import Login from "./Components/Loginpage/Login";

// Admin Components
import AdminNavbar from "./Components/Admin/AdminNavbar";
import Sidebar from "./Components/Admin/Sidebar";
import Dashboard from "./Components/Admin/Dashboard";
import Billing from "./Components/Admin/Billing";
import Pharmacy from "./Components/Admin/Pharmacy";
import Reports from "./Components/Admin/Reports";
import Doctors from "./Components/Admin/Doctors";
import ManageAppointments from "./Components/Admin/ManageAppointments";
import Patients from "./Components/Admin/Patients";
import Rooms from "./Components/Admin/Rooms";
import AdminReportApprovals from "./Components/Admin/AdminReportApprovals";
import AdminMedicineApprovals from "./Components/Admin/AdminMedicineApprovals";
import AdminPrescriptions from "./Components/Admin/AdminPrescriptions";

// Client Components
import Navbar from "./Components/Client/Navbar";
import ClientSidebar from "./Components/Client/ClientSidebar";
import ClientDashboard from "./Components/Client/ClientDashboard";
import MyBilling from "./Components/Client/MyBilling";
import MyProfile from "./Components/Client/MyProfile";
import ClintDoctors from "./Components/Client/ClintDoctors";
import MyAppointments from "./Components/Client/MyAppointments";
import MedicalRecords from "./Components/Client/MedicalRecords";
import Prescription from "./Components/Client/Prescription";
import ClientReports from "./Components/Client/Reports";
import ClientMedicineRequests from "./Components/Client/ClientMedicineRequests";

// Doctor Components
import DoctorNavbar from "./Components/Doctor/DoctorNavbar";
import DoctorSidebar from "./Components/Doctor/DoctorSidebar";
import DoctorDashboard from "./Components/Doctor/DoctorDashboard";
import DoctorAppointments from "./Components/Doctor/DoctorAppointments";
import DoctorReports from "./Components/Doctor/DoctorReports";
import DoctorPrescriptions from "./Components/Doctor/DoctorPrescriptions";

// Route Guards
import RoleRoute from "./Components/Common/RoleRoute";

// Layout wrapper for Admin Dashboard
const AdminLayout = () => {
  return (
    <div>
      <AdminNavbar />
      <Sidebar />
      <Outlet />
    </div>
  );
};

// Layout wrapper for Client / Patient Portal
const ClientLayout = () => {
  return (
    <div>
      <Navbar />
      <ClientSidebar />
      <Outlet />
    </div>
  );
};

// Layout wrapper for Doctor Portal
const DoctorLayout = () => {
  return (
    <div>
      <DoctorNavbar />
      <DoctorSidebar />
      <Outlet />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Portal (Protected for admin role) */}
      <Route
        element={
          <RoleRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/manageappointments" element={<ManageAppointments />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/report-approvals" element={<AdminReportApprovals />} />
        <Route path="/medicine-approvals" element={<AdminMedicineApprovals />} />
        <Route path="/admin/medicine-requests" element={<AdminMedicineApprovals />} />
        <Route path="/prescriptions" element={<AdminPrescriptions />} />
      </Route>

      {/* Client / Patient Portal (Protected for patient role) */}
      <Route
        element={
          <RoleRoute allowedRoles={["patient"]}>
            <ClientLayout />
          </RoleRoute>
        }
      >
        <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/myBilling" element={<MyBilling />} />
        <Route path="/myProfile" element={<MyProfile />} />
        <Route path="/clintDoctors" element={<ClintDoctors />} />
        <Route path="/myAppointments" element={<MyAppointments />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/prescription" element={<Prescription />} />
        <Route path="/reports/client" element={<ClientReports />} />
        <Route path="/myReports" element={<ClientReports />} />
        <Route path="/medicine-requests" element={<ClientMedicineRequests />} />
      </Route>

      {/* Doctor Portal (Protected for doctor role) */}
      <Route
        element={
          <RoleRoute allowedRoles={["doctor"]}>
            <DoctorLayout />
          </RoleRoute>
        }
      >
        <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/reports" element={<DoctorReports />} />
        <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
