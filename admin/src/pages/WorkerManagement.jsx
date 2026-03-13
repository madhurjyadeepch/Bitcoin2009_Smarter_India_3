import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './WorkerManagement.css';

export default function WorkerManagement() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [dept, setDept] = useState('General Municipal Services');

    const DEPARTMENTS = [
        "Road & Infrastructure",
        "Sanitation & Waste Management",
        "Electricity & Lighting",
        "Water & Drainage",
        "Law Enforcement & Security",
        "General Municipal Services",
    ];

    const fetchWorkers = async () => {
        try {
            setLoading(true);
            const r = await api.get('/workers');
            setWorkers(r.data.data.workers || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/workers', { name, phone, whatsappNumber: whatsapp, department: dept });
            setShowForm(false);
            setName('');
            setPhone('');
            setWhatsapp('');
            fetchWorkers();
        } catch (error) {
            alert('Error adding worker');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this worker?")) return;
        try {
            await api.delete(`/workers/${id}`);
            fetchWorkers();
        } catch {
            alert("Error deleting worker");
        }
    };

    return (
        <div className="worker-page">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">Worker Management</h1>
                    <p className="dash-subtitle">Manage department workers and view their assignments</p>
                </div>
                <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Close Form' : '+ Add New Worker'}
                </button>
            </div>

            {showForm && (
                <div className="worker-form-card">
                    <h3>Add New Worker</h3>
                    <form onSubmit={handleCreate} className="worker-form">
                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Phone Number</label>
                            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>WhatsApp Number (+91...)</label>
                            <input type="tel" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Department</label>
                            <select value={dept} onChange={e => setDept(e.target.value)}>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="primary-btn">Save Worker</button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="loading-state"><div className="spinner"></div><p>Loading workers...</p></div>
            ) : (
                <div className="worker-grid">
                    {workers.map(w => (
                        <div key={w._id} className="worker-card">
                            <div className="worker-header">
                                <div className="worker-avatar">{w.name.charAt(0)}</div>
                                <div>
                                    <h4 className="worker-name">{w.name}</h4>
                                    <span className="worker-dept">{w.department}</span>
                                </div>
                            </div>
                            <div className="worker-contact">
                                <p>📞 {w.phone}</p>
                                <p>💬 {w.whatsappNumber}</p>
                            </div>
                            <div className="worker-stats">
                                <span className="stat-pill">Active Assignments: {w.assignmentCount}</span>
                                <button className="icon-btn delete" onClick={() => handleDelete(w._id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                    {workers.length === 0 && <p className="empty-state">No workers found. Add some to get started.</p>}
                </div>
            )}
        </div>
    );
}
