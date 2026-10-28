import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingState from './LoadingState.jsx';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Verifying authentication session..." />;
  }

  if (!user) {
    // If route requires admin, redirect to admin login
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
