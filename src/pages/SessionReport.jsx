import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

export default function SessionReport() {
    const { id } = useParams()
    const [session, setSession] = useState(null)
    const [attendance, setAttendance] = useState([])
    const [allStudents, setAllStudents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const [{ data: sess }, { data: att }, { data: students }] = await Promise.all([
                supabase.from('sessions').select('*').eq('id', id).single(),
                supabase.from('attendance')
                    .select('*, students(name, roll_no, division)')
                    .eq('session_id', id)
                    .order('scanned_at'),
                supabase.from('students').select('id, name, roll_no, division').order('roll_no')
            ])
            setSession(sess)
            setAttendance(att || [])
            setAllStudents(students || [])
            setLoading(false)
        }
        fetchData()
    }, [id])

    const handleClose = async () => {
        const { error } = await supabase.from('sessions').update({ status: 'closed' }).eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success('Session closed')
            setSession(s => ({ ...s, status: 'closed' }))
        }
    }

    const presentIds = new Set(attendance.map(a => a.student_id))
    const absentStudents = allStudents.filter(s => !presentIds.has(s.id))

    const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
    })
    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    })

    if (loading) return (
        <div className="page-wrapper">
            <Navbar />
            <div className="loading-center"><div className="spinner" /></div>
        </div>
    )

    if (!session) return (
        <div className="page-wrapper">
            <Navbar />
            <div className="empty-state">Session not found. <Link to="/dashboard">Go back</Link></div>
        </div>
    )

    const pct = allStudents.length ? Math.round((attendance.length / allStudents.length) * 100) : 0

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="page-content">
                <div className="page-header">
                    <div>
                        <Link to="/dashboard" className="back-link">← Back to Sessions</Link>
                        <h1 className="page-title">{session.subject}</h1>
                        <p className="page-sub">
                            {formatDate(session.date)}
                            {session.lecture_no && ` · Lecture #${session.lecture_no}`}
                        </p>
                    </div>
                    {session.status === 'open' && (
                        <button className="btn-primary" onClick={handleClose}>Close Session</button>
                    )}
                </div>

                {/* Stats row */}
                <div className="stats-row">
                    <div className="stat-card green">
                        <span className="stat-num">{attendance.length}</span>
                        <span className="stat-label">Present</span>
                    </div>
                    <div className="stat-card red">
                        <span className="stat-num">{absentStudents.length}</span>
                        <span className="stat-label">Absent</span>
                    </div>
                    <div className="stat-card blue">
                        <span className="stat-num">{allStudents.length}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-card purple">
                        <span className="stat-num">{pct}%</span>
                        <span className="stat-label">Attendance</span>
                    </div>
                </div>

                {/* Present students */}
                <h2 className="section-title">✅ Present ({attendance.length})</h2>
                {attendance.length === 0 ? (
                    <div className="empty-state"><p>No one scanned yet.</p></div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Roll No.</th>
                                    <th>Division</th>
                                    <th>Scanned At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map((a, i) => (
                                    <tr key={a.id}>
                                        <td className="td-num">{i + 1}</td>
                                        <td className="td-name">{a.students?.name}</td>
                                        <td><span className="roll-badge">{a.students?.roll_no}</span></td>
                                        <td>{a.students?.division || '—'}</td>
                                        <td className="td-time">{formatTime(a.scanned_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Absent students */}
                {absentStudents.length > 0 && (
                    <>
                        <h2 className="section-title absent-title">❌ Absent ({absentStudents.length})</h2>
                        <div className="table-wrapper">
                            <table className="data-table absent-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Roll No.</th>
                                        <th>Division</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {absentStudents.map((s, i) => (
                                        <tr key={s.id} className="absent-row">
                                            <td className="td-num">{i + 1}</td>
                                            <td className="td-name">{s.name}</td>
                                            <td><span className="roll-badge absent">{s.roll_no}</span></td>
                                            <td>{s.division || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
