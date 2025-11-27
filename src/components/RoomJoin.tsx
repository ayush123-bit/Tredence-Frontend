import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const RoomJoin: React.FC = () => {
  const [roomId, setRoomId] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 400)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const createNewRoom = async () => {
    setLoading(true)
    try {
      const room = await api.createRoom()
      navigate(`/room/${room.room_id}`)
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Failed to create room. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: window.innerWidth < 500 ? '24px' : window.innerWidth < 700 ? '32px' : '48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontSize: window.innerWidth < 400 ? '24px' : window.innerWidth < 600 ? '28px' : '32px',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: '#1e293b',
          textAlign: 'center'
        }}>
          Pair Programming
        </h1>
        <p style={{
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '32px',
          fontSize: window.innerWidth < 400 ? '14px' : '16px'
        }}>
          Code together in real-time
        </p>

        <button
          onClick={createNewRoom}
          disabled={loading}
          style={{
            width: '100%',
            padding: window.innerWidth < 400 ? '12px' : '16px',
            background: loading 
              ? '#94a3b8' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: window.innerWidth < 400 ? '14px' : '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1,
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {loading ? 'Creating...' : 'Create New Room'}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
          color: '#94a3b8'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ 
            padding: '0 16px', 
            fontSize: window.innerWidth < 400 ? '12px' : '14px',
            whiteSpace: 'nowrap'
          }}>
            OR
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '12px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            style={{
              flex: 1,
              padding: window.innerWidth < 400 ? '12px' : '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: window.innerWidth < 400 ? '14px' : '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
              width: '100%',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          />
          <button
            onClick={joinRoom}
            disabled={!roomId.trim()}
            style={{
              padding: window.innerWidth < 400 ? '12px 20px' : '16px 32px',
              background: roomId.trim() ? '#1e293b' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: window.innerWidth < 400 ? '14px' : '16px',
              fontWeight: '600',
              cursor: roomId.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              if (roomId.trim()) {
                e.currentTarget.style.background = '#334155'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = roomId.trim() ? '#1e293b' : '#94a3b8'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Join
          </button>
        </div>

        {/* Mobile-friendly info */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: '#f1f5f9',
          borderRadius: '8px',
          fontSize: window.innerWidth < 400 ? '12px' : '14px',
          color: '#475569',
          textAlign: 'center'
        }}>
          💡 Create a room and share the ID with your pair programming partner
        </div>
      </div>

      {/* Footer for mobile */}
      <div style={{
        marginTop: '20px',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: window.innerWidth < 400 ? '12px' : '14px',
        textAlign: 'center'
      }}>
        Built with FastAPI & MongoDB
      </div>
    </div>
  )
}

export default RoomJoin