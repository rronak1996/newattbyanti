import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import Navbar from '../components/Navbar'
import { QRCodeCanvas } from 'qrcode.react'
import toast from 'react-hot-toast'

export default function Students() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [showQR, setShowQR] = useState(null) // student object
    const [form, setForm] = useState({ name: '', roll_no: '', division: '', email: '' })
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const qrRef = useRef(null)

    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from('students').select('*').order('roll_no')
        if (error) toast.error('Failed to load students')
        else setStudents(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchStudents() }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase.from('students').insert([form])
        setSaving(false)
        if (error) { toast.error(error.message); return }
        toast.success('Student added!')
        setShowAdd(false)
        setForm({ name: '', roll_no: '', division: '', email: '' })
        fetchStudents()
    }

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete ${name}? This will also remove all their attendance records.`)) return
        const { error } = await supabase.from('students').delete().eq('id', id)
        if (error) toast.error(error.message)
        else { toast.success('Student removed'); fetchStudents() }
    }

    const downloadQR = (student) => {
        const canvas = document.getElementById(`qr-canvas-${student.id}`)
        if (!canvas) return
        const url = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = `QR_${student.roll_no}_${student.name.replace(/\s+/g, '_')}.png`
        a.click()
        toast.success(`QR downloaded for ${student.name}`)
    }

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.roll_no.toLowerCase().includes(search.toLowerCase()) ||
        (s.division || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="page-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Students</h1>
                        <p className="page-sub">{students.length} students registered</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Student</button>
                </div>

                <div className="search-bar">
                    <input
                        type="text" placeholder="🔍 Search by name, roll no or division..."
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">👥</span>
                        <p>{students.length === 0 ? 'No students yet. Add your first student!' : 'No students match your search.'}</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Roll No.</th>
                                    <th>Division</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id}>
                                        <td className="td-name">{s.name}</td>
                                        <td><span className="roll-badge">{s.roll_no}</span></td>
                                        <td>{s.division || '—'}</td>
                                        <td className="td-email">{s.email || '—'}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn-qr" onClick={() => setShowQR(s)}>
                                                    View QR
                                                </button>
                                                <button className="btn-del" onClick={() => handleDelete(s.id, s.name)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                        {/* Hidden canvas for download */}
                                        <td style={{ display: 'none' }}>
                                            <QRCodeCanvas
                                                id={`qr-canvas-${s.id}`}
                                                value={s.id}
                                                size={300}
                                                includeMargin={true}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Student Modal */}
            {showAdd && (
                <div className="modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Add Student</h2>
                        <form onSubmit={handleAdd} className="auth-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="Ravi Sharma" required
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Roll Number</label>
                                <input type="text" placeholder="21CS45" required
                                    value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Division</label>
                                <input type="text" placeholder="A"
                                    value={form.division} onChange={e => setForm({ ...form, division: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email (optional)</label>
                                <input type="email" placeholder="ravi@example.com"
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? <span className="btn-spinner" /> : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQR && (
                <div className="modal-overlay" onClick={() => setShowQR(null)}>
                    <div className="modal modal-qr" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Student QR Code</h2>
                        <div className="qr-info">
                            <p className="qr-name">{showQR.name}</p>
                            <p className="qr-roll">Roll No: {showQR.roll_no}
                                {showQR.division && ` · Division ${showQR.division}`}
                            </p>
                        </div>
                        <div className="qr-container">
                            <QRCodeCanvas
                                id={`qr-display-${showQR.id}`}
                                value={showQR.id}
                                size={220}
                                includeMargin={true}
                                bgColor="#ffffff"
                                fgColor="#1e1b4b"
                                level="H"
                            />
                        </div>
                        <p className="qr-hint">📱 Share this QR with the student. They should save it to their phone gallery.</p>
                        <div className="modal-footer">
                            <button className="btn-outline" onClick={() => setShowQR(null)}>Close</button>
                            <button className="btn-primary" onClick={() => {
                                // Use the display canvas directly
                                const canvas = document.getElementById(`qr-display-${showQR.id}`)
                                if (!canvas) return
                                const url = canvas.toDataURL('image/png')
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `QR_${showQR.roll_no}_${showQR.name.replace(/\s+/g, '_')}.png`
                                a.click()
                                toast.success('QR downloaded!')
                            }}>
                                ⬇ Download QR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
