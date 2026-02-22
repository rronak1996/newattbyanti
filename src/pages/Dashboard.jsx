import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

export default function Dashboard() {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ subject: '', date: '', lecture_no: '' })
    const [saving, setSaving] = useState(false)

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false })
        if (error) toast.error('Failed to load sessions')
        else setSessions(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchSessions() }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase.from('sessions').insert([{
            subject: form.subject,
            date: form.date,
            lecture_no: parseInt(form.lecture_no) || null,
            status: 'open'
        }])
        setSaving(false)
        if (error) { toast.error(error.message); return }
        toast.success('Session created!')
        setShowModal(false)
        setForm({ subject: '', date: '', lecture_no: '' })
        fetchSessions()
    }

    const handleClose = async (id) => {
        const { error } = await supabase
            .from('sessions').update({ status: 'closed' }).eq('id', id)
        if (error) toast.error(error.message)
        else { toast.success('Session closed'); fetchSessions() }
    }

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    })

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="page-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Sessions</h1>
                        <p className="page-sub">Manage lecture attendance sessions</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        + New Session
                    </button>
                </div>

                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : sessions.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📋</span>
                        <p>No sessions yet. Create your first one!</p>
                    </div>
                ) : (
                    <div className="card-grid">
                        {sessions.map(s => (
                            <div key={s.id} className={`session-card ${s.status}`}>
                                <div className="session-card-top">
                                    <div>
                                        <h3 className="session-subject">{s.subject}</h3>
                                        <p className="session-meta">
                                            📅 {formatDate(s.date)}
                                            {s.lecture_no && <span> · Lecture #{s.lecture_no}</span>}
                                        </p>
                                    </div>
                                    <span className={`badge ${s.status}`}>
                                        {s.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                                    </span>
                                </div>
                                <div className="session-actions">
                                    <Link to={`/session/${s.id}`} className="btn-outline">View Report</Link>
                                    {s.status === 'open' && (
                                        <>
                                            <Link to="/scanner" state={{ sessionId: s.id, subject: s.subject }} className="btn-scan">
                                                📷 Scan
                                            </Link>
                                            <button className="btn-close-session" onClick={() => handleClose(s.id)}>
                                                Close
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">New Session</h2>
                        <form onSubmit={handleCreate} className="auth-form">
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text" placeholder="e.g. Data Structures" required
                                    value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date" required
                                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Lecture No. (optional)</label>
                                <input
                                    type="number" placeholder="e.g. 12"
                                    value={form.lecture_no} onChange={e => setForm({ ...form, lecture_no: e.target.value })}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? <span className="btn-spinner" /> : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
