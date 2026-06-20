import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function ProtectedRoute({ children }) {
  const { user } = useUser();

  if (!user || !user.id) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
