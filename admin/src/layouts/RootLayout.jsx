import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const RootLayout = ({ isSignedIn, setIsSignedIn }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isSignedIn && <Navbar setIsSignedIn={setIsSignedIn} />}
      <main style={{ flex: 1, paddingTop: isSignedIn ? 72 : 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;