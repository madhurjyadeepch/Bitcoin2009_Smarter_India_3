import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './CommentBox.css';

const STATUS_COLORS = {
    'received': { bg: '#EDE9FE', color: '#4F46E5' },
    'under-review': { bg: '#FFF8E5', color: '#E6A817' },
    'assigned': { bg: '#E0F2FE', color: '#0284C7' },
    'work-in-progress': { bg: '#FFF3E0', color: '#E65100' },
    'verification': { bg: '#F3E8FF', color: '#7C3AED' },
    'resolved': { bg: '#E8F5E9', color: '#2E7D32' },
    'closed': { bg: '#F5F5F5', color: '#757575' },
    'pending': { bg: '#EDE9FE', color: '#4F46E5' },
};

const STATUS_LABELS = {
    'received': 'Received', 'under-review': 'Under Review',
    'assigned': 'Assigned', 'work-in-progress': 'In Progress',
    'verification': 'Verification', 'resolved': 'Resolved',
    'closed': 'Closed', 'pending': 'Pending',
};

const SERVER_ROOT = 'http://127.0.0.1:3000';

const CommentBox = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const r = await api.get('/reports');
            setReports(r.data.data.reports || []);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = filter === 'all'
        ? reports
        : reports.filter(r => r.status === filter);

    const timeAgo = (date) => {
        const now = new Date();
        const d = new Date(date);
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="cb-container">
            <div className="cb-header">
                <h2 className="cb-title">📋 Recent Reports</h2>
                <span className="cb-count">{filteredReports.length} reports</span>
            </div>

            <div className="cb-filters">
                {['all', 'received', 'assigned', 'work-in-progress', 'resolved'].map(f => (
                    <button
                        key={f}
                        className={`cb-filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : STATUS_LABELS[f] || f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="cb-loading">
                    <div className="spinner"></div>
                    <p>Loading reports...</p>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="cb-empty">
                    <p>No reports found for this filter.</p>
                </div>
            ) : (
                <div className="cb-feed">
                    {filteredReports.map(report => {
                        const statusStyle = STATUS_COLORS[report.status] || STATUS_COLORS['pending'];
                        return (
                            <div key={report._id} className="cb-card">
                                <div className="cb-card-header">
                                    <div className="cb-avatar">
                                        {report.author?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="cb-author-info">
                                        <span className="cb-author-name">{report.author?.name || 'Anonymous'}</span>
                                        <span className="cb-time">{timeAgo(report.createdAt)}</span>
                                    </div>
                                    <span className="cb-status-pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                        {STATUS_LABELS[report.status] || report.status}
                                    </span>
                                </div>

                                <h3 className="cb-report-title">{report.title}</h3>
                                <p className="cb-report-desc">{report.description}</p>

                                {report.image && (
                                    <img src={`${SERVER_ROOT}/${report.image}`} alt={report.title} className="cb-report-image" />
                                )}

                                <div className="cb-card-footer">
                                    <div className="cb-meta">
                                        <span className="cb-category-tag">{report.category}</span>
                                        {report.city && <span className="cb-city">📍 {report.city}</span>}
                                    </div>
                                    <div className="cb-votes">
                                        <span className="cb-upvote">▲ {report.upvotedBy?.length || 0}</span>
                                        <span className="cb-downvote">▼ {report.downvotedBy?.length || 0}</span>
                                    </div>
                                </div>

                                {report.aiAnalysis?.aiSummary && (
                                    <div className="cb-ai-summary">
                                        <span className="cb-ai-label">🤖 AI Summary</span>
                                        <p>{report.aiAnalysis.aiSummary}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CommentBox;
