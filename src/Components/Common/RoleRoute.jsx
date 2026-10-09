import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7fb' }}>
        <div style={{ color: '#1976d2', fontWeight: 600, fontSize: '18px' }}>
          Loading MedCare HMS...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If patient tries to access admin, redirect to client dashboard
    if (role === 'patient') {
      return <Navigate to="/client/dashboard" replace />;
    }
    // If admin tries to access other pages, redirect to admin dashboard
    if (role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    // If doctor tries to access unauthorized pages, redirect to doctor dashboard
    if (role === 'doctor') {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
