import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './ReportDetail.css';

const SERVER_ROOT = 'http://127.0.0.1:3000';

const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'];
const DEPARTMENTS = [
    "Road & Infrastructure",
    "Sanitation & Waste Management",
    "Electricity & Lighting",
    "Water & Drainage",
    "Law Enforcement & Security",
    "General Municipal Services",
    "Public Works Department (PWD)",
    "Urban Development & Housing",
    "Fire & Emergency Services",
    "Health & Family Welfare",
    "Environment & Forest",
    "Transport & Traffic",
    "Revenue & Land Records",
    "Education & Literacy",
    "Social Welfare & Women Development",
    "Panchayati Raj & Rural Development",
    "Disaster Management Authority",
    "Food & Civil Supplies",
    "Telecommunications & IT",
    "Municipal Corporation Administration",
];
const STATUSES = [
    'received', 'under-review', 'assigned',
    'work-in-progress', 'verification', 'resolved', 'closed',
];

const STATUS_LABELS = {
    'received': 'Received',
    'under-review': 'Under Review',
    'assigned': 'Assigned',
    'work-in-progress': 'Work in Progress',
    'verification': 'Verification',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'pending': 'Received',
    'in-progress': 'In Progress',
};

export default function ReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allWorkers, setAllWorkers] = useState([]);
    const [workerDeptFilter, setWorkerDeptFilter] = useState('');

    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [assigning, setAssigning] = useState(null);
    const [assignResult, setAssignResult] = useState(null);

    const fetchReport = async () => {
        try {
            const r = await api.get(`/reports/${id}`);
            const data = r.data.data.report;
            setReport(data);
            setEditedData({
                status: data.status,
                urgency: data.aiAnalysis?.urgency || 'medium',
                priorityScore: data.aiAnalysis?.priorityScore || 50,
                department: data.aiAnalysis?.department || 'General Municipal Services',
            });
            setWorkerDeptFilter(data.aiAnalysis?.department || '');
        } catch {
            console.error('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllWorkers = async () => {
        try {
            const r = await api.get('/workers');
            setAllWorkers(r.data.data.workers || []);
        } catch {}
    };

    useEffect(() => {
        fetchReport();
        fetchAllWorkers();
    }, [id]);

    const filteredWorkers = workerDeptFilter
        ? allWorkers.filter(w => w.department === workerDeptFilter && w.isActive !== false)
        : allWorkers.filter(w => w.isActive !== false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.patch(`/reports/${id}/admin-update`, editedData);
            setEditMode(false);
            fetchReport();
        } catch {
            alert('Failed to update report');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAssign = async (workerId) => {
        setAssigning(workerId);
        setAssignResult(null);
        try {
            const res = await api.post(`/workers/${workerId}/assign/${id}`);
            const data = res.data.data;
            setAssignResult(data);
            fetchReport();
            fetchAllWorkers();

            // Auto-open WhatsApp if available
            if (data.whatsappLink) {
                window.open(data.whatsappLink, '_blank');
            }
        } catch {
            alert("Failed to assign report");
        } finally {
            setAssigning(null);
        }
    };

    const getMapsUrl = (addr) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr || '')}`;

    const currentStepIndex = STATUSES.indexOf(report?.status || 'received');

    if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading details...</p></div>;
    if (!report) return <div className="empty-state"><p>Report not found.</p></div>;

    const ai = report.aiAnalysis || {};

    return (
        <div className="report-detail-page fade-in">
            <button className="back-btn" onClick={() => navigate(-1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Dashboard
            </button>

            <div className="rd-header">
                <div>
                    <h1 className="rd-title">{report.title}</h1>
                    <p className="rd-id">Ref: {report._id?.slice(-8).toUpperCase()}</p>
                </div>
                {!editMode ? (
                    <button className="primary-btn outline" onClick={() => setEditMode(true)}>Edit Details</button>
                ) : (
                    <div className="btn-group">
                        <button className="cancel-btn" onClick={() => setEditMode(false)} disabled={isSaving}>Cancel</button>
                        <button className="primary-btn" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                )}
            </div>

            {/* Status Stepper */}
            <div className="status-stepper">
                {STATUSES.map((s, i) => (
                    <div key={s} className={`step ${i <= currentStepIndex ? 'completed' : ''} ${i === currentStepIndex ? 'current' : ''}`}>
                        <div className="step-dot">{i < currentStepIndex ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : <span>{i + 1}</span>}</div>
                        {i < STATUSES.length - 1 && <div className="step-line"></div>}
                        <span className="step-label">{STATUS_LABELS[s]}</span>
                    </div>
                ))}
            </div>

            <div className="rd-grid">
                {/* Left Column: Info */}
                <div className="rd-left">
                    <div className="rd-card slide-up">
                        <img src={`${SERVER_ROOT}/${report.image}`} alt={report.title} className="rd-image" />
                        <div className="rd-author-bar">
                            <div className="rd-author-info">
                                <div className="rd-avatar">{report.author?.name?.charAt(0) || '?'}</div>
                                <div>
                                    <p className="rd-author-name">{report.author?.name || 'Anonymous'}</p>
                                    <p className="rd-author-trust">Reputation: <strong>{report.author?.trustScore || 50}/100</strong></p>
                                </div>
                            </div>
                            <div className="rd-date">{new Date(report.createdAt).toLocaleString()}</div>
                        </div>

                        <div className="rd-content">
                            <p className="rd-category-tag">{report.category}</p>
                            <p className="rd-desc">{report.description}</p>
                            <a href={getMapsUrl(report.address)} target="_blank" rel="noopener noreferrer" className="rd-location-link">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {report.address} {report.city ? `(${report.city})` : ''}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                        </div>
                    </div>

                    {/* Status History */}
                    {report.statusHistory?.length > 0 && (
                        <div className="rd-card slide-up">
                            <h3 className="card-section-title">Status Timeline</h3>
                            <div className="timeline">
                                {report.statusHistory.map((entry, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <span className="timeline-status">{STATUS_LABELS[entry.status] || entry.status}</span>
                                            <span className="timeline-date">{new Date(entry.timestamp).toLocaleString()}</span>
                                            {entry.note && <span className="timeline-note">{entry.note}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Analysis + Assignment */}
                <div className="rd-right">
                    <div className="rd-card slide-up">
                        <h3 className="card-section-title">Analysis & Routing</h3>
                        {editMode ? (
                            <div className="edit-form">
                                <label>
                                    Status
                                    <select value={editedData.status} onChange={e => setEditedData({...editedData, status: e.target.value})}>
                                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                    </select>
                                </label>
                                <label>
                                    Urgency Level
                                    <select value={editedData.urgency} onChange={e => setEditedData({...editedData, urgency: e.target.value})}>
                                        {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </label>
                                <label>
                                    Priority Score (0-100)
                                    <input type="number" min="0" max="100" value={editedData.priorityScore} onChange={e => setEditedData({...editedData, priorityScore: Number(e.target.value)})} />
                                </label>
                                <label>
                                    Department
                                    <select value={editedData.department} onChange={e => setEditedData({...editedData, department: e.target.value})}>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </label>
                            </div>
                        ) : (
                            <div className="analysis-read-view">
                                <div className="analysis-row"><strong>Status:</strong> <span className={`status-pill s-${report.status}`}>{STATUS_LABELS[report.status] || report.status}</span></div>
                                <div className="analysis-row"><strong>Urgency:</strong> <span className={`urgency-tag u-${ai.urgency}`}>{ai.urgency || 'N/A'}</span></div>
                                <div className="analysis-row"><strong>Priority Score:</strong> <span className="score-val">{ai.priorityScore || 'N/A'}/100</span></div>
                                <div className="analysis-row"><strong>Department:</strong> <span>{ai.department || 'N/A'}</span></div>
                                {ai.aiSummary && <div className="analysis-summary">{ai.aiSummary}</div>}
                            </div>
                        )}
                    </div>

                    <div className="rd-card slide-up">
                        <h3 className="card-section-title">Assign to Worker</h3>
                        {report.assignedTo ? (
                            <div className="assigned-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                <div>
                                    <p className="success-text">Assigned: {report.assignedTo.name}</p>
                                    <p className="phone-text">Phone: {report.assignedTo.phone}</p>
                                    {report.assignedTo.telegramChatId && <p className="phone-text">Telegram: {report.assignedTo.telegramChatId}</p>}
                                    {report.assignedTo.whatsappNumber && <p className="phone-text">WhatsApp: {report.assignedTo.whatsappNumber}</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="worker-list">
                                <div className="worker-filter-row">
                                    <select value={workerDeptFilter} onChange={e => setWorkerDeptFilter(e.target.value)} className="worker-dept-select">
                                        <option value="">All Departments</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                {filteredWorkers.length === 0 ? <p className="empty-text">No workers found. Add workers from the Workers page.</p> : (
                                    filteredWorkers.map(w => (
                                        <div key={w._id} className="worker-row">
                                            <div className="w-info">
                                                <strong>{w.name}</strong>
                                                <span className="w-dept-tag">{w.department}</span>
                                                <span>Active tasks: {w.assignmentCount || 0}</span>
                                            </div>
                                            <button
                                                className="primary-btn sm"
                                                onClick={() => handleAssign(w._id)}
                                                disabled={assigning === w._id}
                                            >
                                                {assigning === w._id ? 'Assigning...' : 'Assign & Notify'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Assignment result with WhatsApp + Telegram feedback */}
                        {assignResult && (
                            <div className="assign-result-box slide-up">
                                <h4>Assignment Complete</h4>
                                {assignResult.telegramSent && <p className="result-success">Telegram message delivered successfully</p>}
                                {!assignResult.telegramSent && assignResult.worker?.telegramChatId && (
                                    <p className="result-warn">Telegram failed: {assignResult.telegramError || 'Unknown error'}</p>
                                )}
                                {!assignResult.worker?.telegramChatId && <p className="result-warn">No Telegram chat ID set for this worker</p>}
                                {assignResult.whatsappLink && (
                                    <a href={assignResult.whatsappLink} target="_blank" rel="noopener noreferrer" className="wa-link-btn">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                        Send via WhatsApp
                                    </a>
                                )}
                                {!assignResult.whatsappLink && !assignResult.worker?.whatsappNumber && <p className="result-warn">No WhatsApp number set for this worker</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
