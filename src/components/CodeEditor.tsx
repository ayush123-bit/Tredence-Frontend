import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Editor from '@monaco-editor/react'
import { RootState } from '../store/store'
import { setCode, setRoomId, setAutocompleteSuggestion } from '../store/editorSlice'
import { WebSocketService } from '../services/websocket'
import { api } from '../services/api'

const CodeEditor: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { code, autocompleteSuggestion } = useSelector((state: RootState) => state.editor)
  
  const [wsService, setWsService] = useState<WebSocketService | null>(null)
  const [connectedUsers, setConnectedUsers] = useState(1)
  const autocompleteTimeoutRef = useRef<number | null>(null)


  useEffect(() => {
    if (!roomId) return

    // Fetch room data
    api.getRoom(roomId)
      .then(room => {
        dispatch(setCode(room.code))
        dispatch(setRoomId(room.room_id))
      })
      .catch(() => {
        alert('Room not found')
        navigate('/')
      })

    // Setup WebSocket
    const ws = new WebSocketService(roomId, handleWebSocketMessage)
    ws.connect()
    setWsService(ws)

    return () => {
      ws.disconnect()
    }
  }, [roomId])

  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'code_update') {
      dispatch(setCode(data.content))
    } else if (data.type === 'user_joined') {
      setConnectedUsers(prev => prev + 1)
    } else if (data.type === 'user_left') {
      setConnectedUsers(prev => Math.max(1, prev - 1))
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return
    
    dispatch(setCode(value))
    
    // Send update via WebSocket
    if (wsService) {
      wsService.sendMessage('code_update', value)
    }

    // Trigger autocomplete after 600ms of inactivity
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current)
    }

    autocompleteTimeoutRef.current = setTimeout(() => {
      fetchAutocomplete(value)
    }, 600)
  }

  const fetchAutocomplete = async (currentCode: string) => {
    try {
      const result = await api.getAutocomplete({
        code: currentCode,
        cursor_position: currentCode.length,
        language: 'python'
      })
      
      if (result.confidence > 0.6) {
        dispatch(setAutocompleteSuggestion(result.suggestion))
        setTimeout(() => dispatch(setAutocompleteSuggestion(null)), 3000)
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        background: '#1e293b',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Room: {roomId}</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
            {connectedUsers} user{connectedUsers !== 1 ? 's' : ''} connected
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Leave Room
        </button>
      </div>

      {autocompleteSuggestion && (
        <div style={{
          background: '#fef3c7',
          padding: '12px 24px',
          borderBottom: '1px solid #fbbf24',
          color: '#92400e',
          fontSize: '14px'
        }}>
          💡 Suggestion: {autocompleteSuggestion}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true
          }}
        />
      </div>
    </div>
  )
}

export default CodeEditor