import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Navbar from '../components/Navbar'
import jsQR from 'jsqr'
import toast from 'react-hot-toast'

export default function Scanner() {
    const location = useLocation()
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const scanningRef = useRef(false)

    const [sessions, setSessions] = useState([])
    const [selectedSession, setSelectedSession] = useState(
        location.state?.sessionId || ''
    )
    const [selectedSubject, setSelectedSubject] = useState(
        location.state?.subject || ''
    )
    const [cameraOn, setCameraOn] = useState(false)
    const [lastScan, setLastScan] = useState(null)
    const [scannedCount, setScannedCount] = useState(0)

    useEffect(() => {
        supabase.from('sessions')
            .select('id, subject, date, lecture_no')
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .then(({ data }) => setSessions(data || []))

        return () => stopCamera()
    }, [])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            streamRef.current = stream
            videoRef.current.srcObject = stream
            await videoRef.current.play()
            setCameraOn(true)
            scanningRef.current = true
            scanFrame()
        } catch (err) {
            toast.error('Camera access denied. Please allow camera permission.')
        }
    }

    const stopCamera = () => {
        scanningRef.current = false
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setCameraOn(false)
    }

    const scanFrame = () => {
        if (!scanningRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, canvas.width, canvas.height, {
                inversionAttempts: 'dontInvert'
            })
            if (code) {
                handleQRDetected(code.data)
                return
            }
        }
        requestAnimationFrame(scanFrame)
    }

    const handleQRDetected = async (studentId) => {
        scanningRef.current = false // pause scanning
        if (!selectedSession) {
            toast.error('Please select a session first!')
            scanningRef.current = true
            scanFrame()
            return
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(studentId)) {
            toast.error('Invalid QR code. Not a student ID.')
            setTimeout(() => { scanningRef.current = true; scanFrame() }, 1500)
            return
        }

        // Get student info
        const { data: student, error: sErr } = await supabase
            .from('students').select('name, roll_no').eq('id', studentId).single()
        if (sErr || !student) {
            toast.error('Student not found in database.')
            setTimeout(() => { scanningRef.current = true; scanFrame() }, 1500)
            return
        }

        // Mark attendance
        const { error } = await supabase.from('attendance').insert([{
            session_id: selectedSession,
            student_id: studentId
        }])

        if (error) {
            if (error.code === '23505') {
                toast('⚠️ Already marked present!', { icon: '⚠️', style: { background: '#7c3aed' } })
            } else {
                toast.error(error.message)
            }
        } else {
            setLastScan({ name: student.name, roll_no: student.roll_no })
            setScannedCount(c => c + 1)
            toast.success(`✅ ${student.name} — Roll ${student.roll_no} — Present!`)
        }

        // Resume scanning after 1.5s
        setTimeout(() => { scanningRef.current = true; scanFrame() }, 1500)
    }

    const handleSessionChange = (e) => {
        const id = e.target.value
        setSelectedSession(id)
        const s = sessions.find(s => s.id === id)
        setSelectedSubject(s?.subject || '')
        setScannedCount(0)
        setLastScan(null)
    }

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="page-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">QR Scanner</h1>
                        <p className="page-sub">Scan student QR codes to mark attendance</p>
                    </div>
                    {scannedCount > 0 && (
                        <div className="scan-count-badge">
                            ✅ {scannedCount} scanned
                        </div>
                    )}
                </div>

                <div className="scanner-layout">
                    <div className="scanner-controls card">
                        <h3 className="card-title">Select Session</h3>
                        <select
                            className="select-input"
                            value={selectedSession}
                            onChange={handleSessionChange}
                        >
                            <option value="">— Choose a session —</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.subject} · {new Date(s.date).toLocaleDateString('en-IN')}
                                    {s.lecture_no ? ` · Lec #${s.lecture_no}` : ''}
                                </option>
                            ))}
                        </select>

                        {selectedSubject && (
                            <div className="session-banner">
                                <p>📋 <strong>{selectedSubject}</strong></p>
                            </div>
                        )}

                        <div className="camera-btns">
                            {!cameraOn ? (
                                <button className="btn-primary btn-lg" onClick={startCamera} disabled={!selectedSession}>
                                    📷 Start Camera
                                </button>
                            ) : (
                                <button className="btn-outline btn-lg" onClick={stopCamera}>
                                    ⏹ Stop Camera
                                </button>
                            )}
                        </div>

                        {lastScan && (
                            <div className="last-scan-card">
                                <p className="last-scan-label">Last Scanned</p>
                                <p className="last-scan-name">{lastScan.name}</p>
                                <p className="last-scan-roll">Roll No: {lastScan.roll_no}</p>
                            </div>
                        )}
                    </div>

                    <div className="scanner-camera card">
                        <div className="video-wrapper">
                            <video ref={videoRef} className="video-feed" playsInline muted />
                            {!cameraOn && (
                                <div className="video-placeholder">
                                    <span className="cam-icon">📷</span>
                                    <p>Camera preview will appear here</p>
                                </div>
                            )}
                            {cameraOn && <div className="scan-overlay"><div className="scan-line" /></div>}
                        </div>
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
