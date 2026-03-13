import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Dashboard.css';

const SERVER_ROOT = 'http://127.0.0.1:3000';

const URGENCY_COLORS = {
    critical: { bg: '#FFF0F0', color: '#E53935' },
    high: { bg: '#FFF3E0', color: '#E65100' },
    medium: { bg: '#FFF8E5', color: '#E6A817' },
    low: { bg: '#E8F5E9', color: '#2E7D32' },
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [aiInsights, setAiInsights] = useState(null);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');

    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedCity) params.city = selectedCity;
            if (sortBy === 'priority') params.sort = 'priority';
            const res = await api.get('/reports/', { params });
            setReports(res.data.data.reports || []);
        } catch (err) { console.error('Fetch failed', err); }
        finally { setLoading(false); }
    };

    const fetchInsights = async () => {
        try { const r = await api.get('/reports/ai-insights'); setAiInsights(r.data.data); } catch {}
    };

    const fetchCities = async () => {
        try { const r = await api.get('/reports/cities'); setCities(r.data.data.cities || []); } catch {}
    };

    useEffect(() => { fetchReports(); fetchInsights(); fetchCities(); }, [selectedCity, sortBy]);

    const handleStatusChange = async (reportId, newStatus) => {
        try { await api.patch('/reports/changeProgress', { reportId, progress: newStatus }); fetchReports(); fetchInsights(); }
        catch { alert('Failed to update.'); }
    };

    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        inProgress: reports.filter(r => r.status === 'in-progress').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
    };

    const filteredReports = reports
        .filter(r => filter === 'all' || r.status === filter)
        .filter(r => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return r.title?.toLowerCase().includes(term) || r.category?.toLowerCase().includes(term) || r.address?.toLowerCase().includes(term) || r.aiAnalysis?.department?.toLowerCase().includes(term);
        });

    const getStatusClass = (s) => s === 'pending' ? 'status-pending' : s === 'in-progress' ? 'status-progress' : 'status-resolved';
    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="dashboard">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">AI Operations Dashboard</h1>
                    <p className="dash-subtitle">AI-powered civic issue management and resolution</p>
                </div>
            </div>

            {/* AI Insights Row */}
            {aiInsights && (
                <div className="ai-insights-row">
                    <div className="insight-card insight-urgency">
                        <h4>Urgency Distribution</h4>
                        <div className="insight-bars">
                            {Object.entries(aiInsights.urgencyDistribution || {}).map(([key, val]) => (
                                <div key={key} className="insight-bar-item">
                                    <span className="insight-bar-label">{key}</span>
                                    <div className="insight-bar-track">
                                        <div className="insight-bar-fill" style={{ width: `${Math.min(100, (val / Math.max(1, stats.total)) * 100)}%`, backgroundColor: URGENCY_COLORS[key]?.color || '#8E8E93' }} />
                                    </div>
                                    <span className="insight-bar-val">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="insight-card insight-dept">
                        <h4>Department Load</h4>
                        <div className="dept-list">
                            {Object.entries(aiInsights.departmentLoad || {}).map(([dept, count]) => (
                                <div key={dept} className="dept-item">
                                    <span className="dept-name">{dept}</span>
                                    <span className="dept-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="insight-card insight-priority">
                        <h4>Priority Tiers</h4>
                        <div className="priority-grid">
                            {Object.entries(aiInsights.priorityTiers || {}).map(([tier, count]) => (
                                <div key={tier} className={`priority-tile priority-${tier}`}>
                                    <span className="priority-num">{count}</span>
                                    <span className="priority-label">{tier}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                {[
                    { label: 'Total Reports', num: stats.total, cls: 'total', f: 'all' },
                    { label: 'Pending', num: stats.pending, cls: 'pending', f: 'pending' },
                    { label: 'In Progress', num: stats.inProgress, cls: 'progress', f: 'in-progress' },
                    { label: 'Resolved', num: stats.resolved, cls: 'resolved', f: 'resolved' },
                ].map(s => (
                    <div key={s.cls} className="stat-card" onClick={() => setFilter(s.f)}>
                        <div className={`stat-icon stat-icon-${s.cls}`}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                        </div>
                        <div className="stat-info">
                            <span className={`stat-number ${s.cls !== 'total' ? 'stat-num-' + s.cls : ''}`}>{s.num}</span>
                            <span className="stat-label">{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="filter-tabs">
                    {['all', 'pending', 'in-progress', 'resolved'].map(f => (
                        <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="toolbar-right">
                    <select className="city-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                        <option value="">All Cities</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="date">Sort: Latest</option>
                        <option value="priority">Sort: Priority</option>
                    </select>
                    <div className="search-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Search reports..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Reports Grid */}
            {loading ? (
                <div className="loading-state"><div className="spinner"></div><p>Loading reports...</p></div>
            ) : filteredReports.length === 0 ? (
                <div className="empty-state"><p>No reports match your filter.</p></div>
            ) : (
                <div className="reports-grid">
                    {filteredReports.map(report => {
                        const ai = report.aiAnalysis;
                        const urg = ai?.urgency ? URGENCY_COLORS[ai.urgency] : null;
                        return (
                            <div key={report._id} className="report-card" onClick={() => navigate(`/report/${report._id}`)} style={{ cursor: 'pointer' }}>
                                {report.image && (
                                    <div className="report-image-wrap">
                                        <img src={`${SERVER_ROOT}/${report.image}`} alt={report.title} className="report-image" />
                                        <span className={`report-status-pill ${getStatusClass(report.status)}`}>{report.status}</span>
                                        {ai?.priorityScore != null && (
                                            <span className="report-priority-pill">Score: {ai.priorityScore}/100</span>
                                        )}
                                    </div>
                                )}
                                <div className="report-body">
                                    {/* AI Badges */}
                                    {ai && (
                                        <div className="ai-badge-row">
                                            {urg && (
                                                <span className="ai-urgency-badge" style={{ backgroundColor: urg.bg, color: urg.color }}>
                                                    {ai.urgency}
                                                </span>
                                            )}
                                            {ai.department && <span className="ai-dept-badge">{ai.department}</span>}
                                        </div>
                                    )}
                                    <div className="report-meta-row">
                                        <span className="report-category">{report.category}</span>
                                        <span className="report-date">{formatDate(report.createdAt)}</span>
                                    </div>
                                    <h3 className="report-title">{report.title}</h3>
                                    {ai?.aiSummary && <p className="report-ai-summary">{ai.aiSummary}</p>}
                                    <p className="report-desc">{report.description}</p>

                                    <div className="report-location">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                        <span>{report.address}</span>
                                    </div>

                                    <div className="report-author">
                                        <div className="report-author-avatar">{report.author?.name?.[0]?.toUpperCase() || '?'}</div>
                                        <div>
                                            <span className="report-author-name">{report.author?.name || 'Anonymous'}</span>
                                            {report.author?.trustScore != null && (
                                                <span className="trust-badge">Trust: {report.author.trustScore}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="report-footer">
                                    <div className="report-votes">
                                        <span className="vote-up">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                                            {report.upvotedBy?.length || 0}
                                        </span>
                                    </div>
                                    <select
                                        className={`status-select ${getStatusClass(report.status)}`}
                                        value={report.status}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleStatusChange(report._id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
