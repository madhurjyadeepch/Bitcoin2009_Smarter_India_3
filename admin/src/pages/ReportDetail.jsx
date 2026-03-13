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
];
const STATUSES = ['pending', 'in-progress', 'resolved'];

export default function ReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [workers, setWorkers] = useState([]);

    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

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
            fetchWorkers(data.aiAnalysis?.department || 'General Municipal Services');
        } catch {
            alert('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkers = async (dept) => {
        try {
            const r = await api.get(`/workers/department/${encodeURIComponent(dept)}`);
            setWorkers(r.data.data.workers || []);
        } catch {}
    };

    useEffect(() => {
        fetchReport();
    }, [id]);

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
        if (!window.confirm("Forward this report to worker via WhatsApp?")) return;
        try {
            const r = await api.post(`/workers/${workerId}/assign/${id}`);
            const { whatsappLink } = r.data.data;
            window.open(whatsappLink, '_blank');
            fetchReport(); // Refresh assignedTo
        } catch {
            alert("Failed to assign report");
        }
    };

    if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading detail...</p></div>;
    if (!report) return <div className="empty-state"><p>Report not found.</p></div>;

    const ai = report.aiAnalysis || {};

    return (
        <div className="report-detail-page">
            <button className="back-btn" onClick={() => navigate(-1)}>← Back to Dashboard</button>
            <div className="rd-header">
                <div>
                    <h1 className="rd-title">Report Detail</h1>
                    <p className="rd-id">ID: {report._id}</p>
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

            <div className="rd-grid">
                {/* Left Column: Info */}
                <div className="rd-left">
                    <div className="rd-card">
                        <img src={`${SERVER_ROOT}/${report.image}`} alt={report.title} className="rd-image" />
                        <div className="rd-author-bar">
                            <div className="rd-author-info">
                                <div className="rd-avatar">{report.author?.name?.charAt(0) || '?'}</div>
                                <div>
                                    <p className="rd-author-name">{report.author?.name || 'Anonymous'}</p>
                                    <p className="rd-author-trust">Trust Score: <strong>{report.author?.trustScore || 50}/100</strong></p>
                                </div>
                            </div>
                            <div className="rd-date">{new Date(report.createdAt).toLocaleString()}</div>
                        </div>

                        <div className="rd-content">
                            <h2>{report.title}</h2>
                            <p className="rd-category-tag">{report.category}</p>
                            <p className="rd-desc">{report.description}</p>
                            <div className="rd-location">
                                📍 {report.address} {report.city ? `(${report.city})` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Analysis + Assignment */}
                <div className="rd-right">
                    <div className="rd-card ai-card">
                        <h3>🤖 AI Analysis & Routing</h3>
                        {editMode ? (
                            <div className="edit-form">
                                <label>
                                    Status
                                    <select value={editedData.status} onChange={e => setEditedData({...editedData, status: e.target.value})}>
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
                                    <select value={editedData.department} onChange={e => {
                                        setEditedData({...editedData, department: e.target.value});
                                        fetchWorkers(e.target.value);
                                    }}>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </label>
                            </div>
                        ) : (
                            <div className="ai-read-view">
                                <div className="ai-read-row"><strong>Status:</strong> <span className={`status-pill ${report.status}`}>{report.status}</span></div>
                                <div className="ai-read-row"><strong>Urgency:</strong> <span className={`urgency-tag ${ai.urgency}`}>{ai.urgency || 'N/A'}</span></div>
                                <div className="ai-read-row"><strong>Priority Score:</strong> <span>{ai.priorityScore || 'N/A'}/100</span></div>
                                <div className="ai-read-row"><strong>Department:</strong> <span>{ai.department || 'N/A'}</span></div>
                                {ai.aiSummary && <div className="ai-read-summary">"{ai.aiSummary}"</div>}
                            </div>
                        )}
                    </div>

                    <div className="rd-card">
                        <h3>Worker Assignment</h3>
                        {report.assignedTo ? (
                            <div className="assigned-box">
                                <p className="success-text">✓ Assigned to {report.assignedTo.name}</p>
                                <p className="phone-text">📞 {report.assignedTo.phone}</p>
                            </div>
                        ) : (
                            <div className="worker-list">
                                <p className="list-hint">Forward to a worker in <strong>{editedData.department || ai.department}</strong></p>
                                {workers.length === 0 ? <p className="empty-text">No workers found in this department.</p> : (
                                    workers.map(w => (
                                        <div key={w._id} className="worker-row">
                                            <div className="w-info">
                                                <strong>{w.name}</strong>
                                                <span>Active tasks: {w.assignmentCount || 0}</span>
                                            </div>
                                            <button className="primary-btn sm whatsapp-btn" onClick={() => handleAssign(w._id)}>Forward 💬</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
