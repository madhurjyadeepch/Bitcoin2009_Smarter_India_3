import React, { useState, useEffect } from 'react'; // <-- 1. IMPORT useEffect
import './SmallReport.css';
import upvote from '../assets/upvote.png';
import upvote_filled from '../assets/upvote_filled.png';
import commenticon from '../assets/commenticon.png';

// <-- 2. ACCEPT THE FULL 'report' OBJECT AND THE 'onChangeProgress' FUNCTION
const SmallReport = ({ report, onChangeProgress }) => {   
    
    // <-- 3. INITIALIZE STATE WITH VALUES FROM THE 'report' PROP
    const [upvotes, setUpvotes] = useState(report.upvotes);
    const [downvotes, setDownvotes] = useState(report.downvotes);
    
    const [upvoted, setUpvoted] = useState(false);
    const [downvoted, setDownvoted] = useState(false);

    // This effect ensures the component updates if the props change
    useEffect(() => {
        setUpvotes(report.upvotes);
        setDownvotes(report.downvotes);
    }, [report]);


    // Your voting logic can remain the same for now
    function handleUpvote() {
        if(upvoted && !downvoted) {
            setUpvotes(upvotes - 1);
        } else if(!upvoted && downvoted) {
            setUpvotes(upvotes + 1);
            setDownvotes(downvotes - 1);
            setDownvoted(false);
        } else {
            setUpvotes(upvotes + 1);
        }
        setUpvoted(!upvoted);
    }

    function handleDownvote() {
        if(downvoted && !upvoted) {
            setDownvotes(downvotes - 1);
        } else if(!downvoted && upvoted) {
            setDownvotes(downvotes + 1);
            setUpvotes(upvotes - 1);
            setUpvoted(false);
        } else {
            setDownvotes(downvotes + 1);
        }
        setDownvoted(!downvoted);
    }

    return (
        <div className='small-report-container'>
            <div className='user-info-container'>
                <div className='user-info'>
                    <img className='user-profile-picture' src='https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg' alt="User profile"/>
                    {/* Use data from the report object */}
                    <p className='username'>{report.author?.name || 'Anonymous'}</p> 
                    <p className='post-time'>{new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
                <div className='status-dropdown-box'>
                    {/* <-- 4. CONNECT THE DROPDOWN TO THE 'onChangeProgress' HANDLER --> */}
                    <select 
                        name='status' 
                        id='status' 
                        defaultValue={report.status}
                        onChange={(e) => onChangeProgress(report._id, e.target.value)}
                    >
                        <option value='pending'>Pending</option>
                        <option value='in-progress'>In-Progress</option>
                        <option value='resolved'>Resolved</option>
                    </select>
                </div>
            </div>
            <div className='main-content'>
                <h1 className='small-container-report-title'>{report.title}</h1>
                <div className='bottom-section'> 
                    <div className='report-image-wrapper'>
                        {/* Construct the full image URL */}
                        <img id='user-image' src={`http://127.0.0.1:3000/${report.image}`} alt="Report"/>
                    </div>
                    <div className='user-interactions'>
                        <span onClick={handleUpvote}>
                            <img src={upvoted ? upvote_filled : upvote} alt="Upvote"/>
                            <p>{upvotes}</p>
                        </span>
            
                        <span onClick={handleDownvote}>
                            <img src={downvoted ? upvote_filled : upvote} id='downvote' alt="Downvote"/>
                            <p>{downvotes}</p>
                        </span>
                        
                        {/* Comments are not yet in your schema, so we'll default to 0 */}
                        <span><img src={commenticon} alt="Comment"/><p>{report.comments?.length || 0}</p></span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SmallReport;