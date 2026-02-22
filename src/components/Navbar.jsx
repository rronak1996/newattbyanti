import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
    const { signOut } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = async () => {
        await signOut()
        toast.success('Logged out')
        navigate('/login')
    }

    const isActive = (path) => location.pathname === path ? 'active' : ''

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span className="brand-icon">🎓</span>
                <span className="brand-name">AttendX</span>
            </div>
            <div className="navbar-links">
                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                    <span>📋</span> Sessions
                </Link>
                <Link to="/students" className={`nav-link ${isActive('/students')}`}>
                    <span>👥</span> Students
                </Link>
                <Link to="/scanner" className={`nav-link ${isActive('/scanner')}`}>
                    <span>📷</span> Scanner
                </Link>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
                Logout
            </button>
        </nav>
    )
}
