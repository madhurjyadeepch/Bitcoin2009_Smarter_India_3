import React from 'react'
import './Stats.css'

const Stats = () => {
  return (
    <div className='stats-container'>
      <div className='pending-issues-container'>
        <h1>20</h1>
        <p>Pending issues</p>
      </div>
      <div className='resolved-issues-container'>
        <h1>244</h1>
        <p>Resolved this month</p>
      </div>
    </div>
  )
}

export default Stats
