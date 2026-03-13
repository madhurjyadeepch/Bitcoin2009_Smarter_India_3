// src/pages/Homepage.jsx

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SmallReport from '../components/SmallReport';
import './Homepage.css';
import { useNavigate } from 'react-router-dom';
import Stats from '../components/Stats';
import api from '../utils/api'; // <-- 1. IMPORT THE API CLIENT

const Homepage = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [reports, setReports] = useState([]); // <-- 2. START WITH AN EMPTY ARRAY
  const [loading, setLoading] = useState(true); // <-- 3. ADD LOADING STATE
  const [error, setError] = useState(null); // <-- 4. ADD ERROR STATE
  const navigate = useNavigate();

  // --- 5. FUNCTION TO FETCH REPORTS ---
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the api client to make an authenticated request
      const response = await api.get('/reports/'); 
      setReports(response.data.data.reports);
    } catch (err) {
      setError('Failed to fetch reports. Please make sure you are logged in.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- 6. FETCH DATA WHEN THE COMPONENT MOUNTS ---
  useEffect(() => {
    fetchReports();
  }, []); // The empty dependency array means this runs once on mount

  // --- 7. FUNCTION TO CHANGE REPORT PROGRESS ---
  const handleChangeProgress = async (reportId, progress) => {
    try {
      await api.patch('/reports/changeProgress', {
        reportId,
        progress,
      });
      // Refresh the reports list to show the updated status
      fetchReports(); 
    } catch (err) {
      alert('Failed to update status.');
      console.error(err);
    }
  };

  function handlePageChange(change) {
    // ... your existing pagination logic ...
  }

  return (
    <div className='homepage-container'>
      <Navbar />
      <Stats />
      <h1 id='community-reports-title'>Community Reports</h1>
      
      {/* --- 8. HANDLE LOADING AND ERROR STATES --- */}
      {loading && <p>Loading reports...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {!loading && !error && (
        <div className='reports-grid'>
          {reports.map((report) => {
            return (
              <SmallReport
                key={report._id} // Use the unique _id from the database
                report={report} // Pass the whole report object for simplicity
                // Pass the handler function as a prop
                onChangeProgress={handleChangeProgress} 
              />
            );
          })}
        </div>
      )}

      <div className='pagination-container'>
        {/* ... your existing pagination buttons ... */}
      </div>
    </div>
  );
};

export default Homepage;