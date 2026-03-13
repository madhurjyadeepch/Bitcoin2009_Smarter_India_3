import React from 'react'
import Navbar from '../components/Navbar'
import './ErrorPage.css'
import { useNavigate } from 'react-router-dom'

const ErrorPage = () => {
    const navigate = useNavigate();
  return (
    <div>
      <Navbar />
      <div className='error-message' style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '85vh'}}>
        <h1 id='oops'><span id='blur'>Oops!</span></h1>
        <h1 id="error-message">404: Page not found!</h1>
        <button id='gohome-button' onClick={() => navigate('/')}>Go Home</button>
      </div>
    </div>
  )
}

export default ErrorPage
