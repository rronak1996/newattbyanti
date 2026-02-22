import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await signIn(email, password)
        setLoading(false)
        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Welcome back!')
            navigate('/dashboard')
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-bg" />
            <div className="auth-card">
                <div className="auth-logo">
                    <span className="logo-icon">🎓</span>
                    <h1 className="logo-title">AttendX</h1>
                    <p className="logo-sub">QR Attendance System</p>
                </div>
                <h2 className="auth-heading">Admin Login</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="admin@college.edu"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span className="btn-spinner" /> : 'Sign In'}
                    </button>
                </form>
                <p className="auth-hint">🔒 Admin access only</p>
            </div>
        </div>
    )
}
