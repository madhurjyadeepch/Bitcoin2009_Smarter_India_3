// src/layouts/AppLayout.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AppLayout = ({ isSignedIn, setIsSignedIn }) => {
  if (!isSignedIn) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div>
      <Navbar setIsSignedIn={setIsSignedIn} />
      <Outlet />
    </div>
  );
};

export default AppLayout;