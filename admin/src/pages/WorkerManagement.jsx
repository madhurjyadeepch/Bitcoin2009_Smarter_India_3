import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './WorkerManagement.css';

export default function WorkerManagement() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showTgHelper, setShowTgHelper] = useState(false);
    const [tgChats, setTgChats] = useState([]);
    const [tgLoading, setTgLoading] = useState(false);
    const [tgConfigured, setTgConfigured] = useState(true);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [dept, setDept] = useState('General Municipal Services');

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

    useEffect(() => { fetchWorkers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/workers', { name, phone, telegramChatId, whatsappNumber, department: dept });
            setShowForm(false);
            setName(''); setPhone(''); setTelegramChatId(''); setWhatsappNumber('');
            fetchWorkers();
        } catch { alert('Error adding worker'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this worker?")) return;
        try { await api.delete(`/workers/${id}`); fetchWorkers(); }
        catch { alert("Error removing worker"); }
    };

    const fetchTelegramChats = async () => {
        setTgLoading(true);
        try {
            const r = await api.get('/workers/telegram-updates');
            const data = r.data.data;
            setTgConfigured(data.configured);
            setTgChats(data.chatIds || []);
        } catch { }
        finally { setTgLoading(false); }
    };

    const useChatId = (chatId) => {
        setTelegramChatId(chatId);
        setShowTgHelper(false);
        if (!showForm) setShowForm(true);
    };

    return (
        <div className="worker-page fade-in">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">Worker Management</h1>
                    <p className="dash-subtitle">Manage department personnel and their assignments</p>
                </div>
                <div className="btn-group">
                    <button className="secondary-btn" onClick={() => { setShowTgHelper(!showTgHelper); if (!showTgHelper) fetchTelegramChats(); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Find Chat IDs
                    </button>
                    <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Close Form' : '+ Add Worker'}
                    </button>
                </div>
            </div>

            {/* Telegram Chat ID Finder */}
            {showTgHelper && (
                <div className="tg-helper-card slide-up">
                    <h3>Telegram Chat ID Finder</h3>
                    <div className="tg-instructions">
                        <p><strong>How to get a worker's Chat ID:</strong></p>
                        <ol>
                            <li>Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a> on Telegram</li>
                            <li>Copy the bot token to your <code>.env</code> file as <code>TELEGRAM_BOT_TOKEN</code></li>
                            <li>Ask each worker to search your bot on Telegram and send <code>/start</code></li>
                            <li>Click "Refresh" below — their chat ID will appear here</li>
                        </ol>
                    </div>
                    {!tgConfigured && (
                        <div className="tg-warning">Bot token not configured. Add TELEGRAM_BOT_TOKEN to your server .env file and restart the server.</div>
                    )}
                    <div className="tg-actions">
                        <button className="secondary-btn sm" onClick={fetchTelegramChats} disabled={tgLoading}>
                            {tgLoading ? 'Loading...' : 'Refresh Chat IDs'}
                        </button>
                    </div>
                    {tgChats.length > 0 ? (
                        <div className="tg-chat-list">
                            {tgChats.map((chat, i) => (
                                <div key={i} className="tg-chat-item">
                                    <div className="tg-chat-info">
                                        <strong>{chat.firstName} {chat.lastName}</strong>
                                        {chat.username && <span className="tg-username">@{chat.username}</span>}
                                        <code className="tg-chatid">{chat.chatId}</code>
                                    </div>
                                    <button className="primary-btn sm" onClick={() => useChatId(chat.chatId)}>
                                        Use This ID
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : tgConfigured && !tgLoading ? (
                        <p className="empty-text">No messages found. Ask workers to send /start to your bot first.</p>
                    ) : null}
                </div>
            )}

            {showForm && (
                <div className="worker-form-card slide-up">
                    <h3>Add New Worker</h3>
                    <form onSubmit={handleCreate} className="worker-form">
                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Enter worker name" />
                        </div>
                        <div className="input-group">
                            <label>Phone Number</label>
                            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                        </div>
                        <div className="input-group">
                            <label>Telegram Chat ID <small>(use the button above to find it)</small></label>
                            <input type="text" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="e.g. 123456789" />
                        </div>
                        <div className="input-group">
                            <label>WhatsApp Number</label>
                            <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+919876543210 (with country code)" />
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
                        <div key={w._id} className="worker-card slide-up">
                            <div className="worker-header">
                                <div className="worker-avatar">{w.name.charAt(0)}</div>
                                <div>
                                    <h4 className="worker-name">{w.name}</h4>
                                    <span className="worker-dept">{w.department}</span>
                                </div>
                            </div>
                            <div className="worker-contact">
                                <p><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg> {w.phone}</p>
                                {w.telegramChatId && <p><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> TG: {w.telegramChatId}</p>}
                                {w.whatsappNumber && <p><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> WA: {w.whatsappNumber}</p>}
                            </div>
                            <div className="worker-stats">
                                <span className="stat-pill">Active: {w.assignmentCount}</span>
                                <button className="icon-btn delete" onClick={() => handleDelete(w._id)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {workers.length === 0 && <p className="empty-state">No workers found. Add personnel to get started.</p>}
                </div>
            )}
        </div>
    );
}
