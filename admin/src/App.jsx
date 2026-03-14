import { useState, useEffect } from 'react';
import './index.css';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import Dashboard from './pages/Dashboard';
import ReportDetail from './pages/ReportDetail';
import WorkerManagement from './pages/WorkerManagement';
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) setIsSignedIn(true);
    setLoading(false);
  }, []);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<RootLayout isSignedIn={isSignedIn} setIsSignedIn={setIsSignedIn} />}>
        <Route index element={isSignedIn ? <Dashboard /> : <Navigate to="/signin" replace />} />
        <Route path='report/:id' element={isSignedIn ? <ReportDetail /> : <Navigate to="/signin" replace />} />
        <Route path='workers' element={isSignedIn ? <WorkerManagement /> : <Navigate to="/signin" replace />} />
        <Route path='signin' element={isSignedIn ? <Navigate to="/" replace /> : <SignInPage setIsSignedIn={setIsSignedIn} />} />
        <Route path='signup' element={isSignedIn ? <Navigate to="/" replace /> : <SignUpPage setIsSignedIn={setIsSignedIn} />} />
        <Route path='*' element={<Navigate to="/" replace />} />
      </Route>
    )
  );

  if (loading) return null;
  return <RouterProvider router={router} />;
}

export default App;