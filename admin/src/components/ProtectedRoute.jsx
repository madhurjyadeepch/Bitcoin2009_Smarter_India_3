import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ isSignedIn, children }) => {
  if (!isSignedIn) {
    return <Navigate to="/signin" replace />;
  }
  return children;
};

export default ProtectedRoute;