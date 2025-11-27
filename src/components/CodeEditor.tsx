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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const autocompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRemoteUpdateRef = useRef(false)
  const editorRef = useRef<any>(null)

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!roomId) return

    // Fetch room data
    api.getRoom(roomId)
      .then(room => {
        dispatch(setCode(room.code))
        dispatch(setRoomId(room.room_id))
      })
      .catch((error) => {
        console.error('Failed to fetch room:', error)
        alert('Room not found. Please check the room ID.')
        navigate('/')
      })

    // Setup WebSocket
    const ws = new WebSocketService(roomId, handleWebSocketMessage)
    ws.connect()
    setWsService(ws)

    return () => {
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current)
      }
      ws.disconnect()
    }
  }, [roomId])

  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'code_update') {
      isRemoteUpdateRef.current = true
      dispatch(setCode(data.content))
    } else if (data.type === 'user_joined') {
      setConnectedUsers(prev => prev + 1)
    } else if (data.type === 'user_left') {
      setConnectedUsers(prev => Math.max(1, prev - 1))
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return
    
    // If this is a remote update, don't send it back or trigger autocomplete
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false
      return
    }
    
    dispatch(setCode(value))
    
    // Send update via WebSocket
    if (wsService) {
      wsService.sendMessage('code_update', value)
    }

    // Clear previous autocomplete timeout
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current)
    }

    // Trigger autocomplete after 600ms of inactivity
    autocompleteTimeoutRef.current = setTimeout(() => {
      fetchAutocomplete(value)
    }, 600)
  }

  const fetchAutocomplete = async (currentCode: string) => {
    // Don't fetch if code is too short
    if (!currentCode || currentCode.trim().length < 2) {
      return
    }

    try {
      console.log('Fetching autocomplete for:', currentCode.substring(0, 50) + '...')
      
      // Get cursor position from editor if available
      let cursorPos = currentCode.length
      if (editorRef.current) {
        const position = editorRef.current.getPosition()
        const model = editorRef.current.getModel()
        if (position && model) {
          cursorPos = model.getOffsetAt(position)
        }
      }

      const result = await api.getAutocomplete({
        code: currentCode,
        cursor_position: cursorPos,
        language: 'python'
      })
      
      console.log('Autocomplete result:', result)
      
      if (result && result.suggestion && result.confidence > 0.5) {
        dispatch(setAutocompleteSuggestion(result.suggestion))
        
        // Auto-hide after 6 seconds
        setTimeout(() => {
          dispatch(setAutocompleteSuggestion(null))
        }, 6000)
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
      // Silent fail - don't show error to user
    }
  }

  const copyRoomId = () => {
    if (roomId) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(roomId)
          .then(() => alert('Room ID copied to clipboard!'))
          .catch(() => alert(`Room ID: ${roomId}`))
      } else {
        // Fallback for older browsers
        alert(`Room ID: ${roomId}`)
      }
    }
  }

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    setEditorReady(true)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden',
      width: '100%'
    }}>
      {/* Header */}
      <div style={{
        background: '#1e293b',
        padding: isMobile ? '12px 16px' : '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        flexWrap: 'wrap',
        gap: '12px',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          flex: isMobile ? '1 1 100%' : '1',
          minWidth: isMobile ? '100%' : 'auto' 
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile ? '16px' : '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span>Room: {roomId}</span>
            {roomId && (
              <button
                onClick={copyRoomId}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                📋 Copy
              </button>
            )}
          </h2>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: isMobile ? '12px' : '14px', 
            color: '#94a3b8' 
          }}>
            {connectedUsers} user{connectedUsers !== 1 ? 's' : ''} connected
          </p>
        </div>
        
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ☰
          </button>
        )}

        {/* Desktop leave button */}
        {!isMobile && (
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
          >
            Leave Room
          </button>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {isMobile && showMobileMenu && (
        <div style={{
          background: '#334155',
          padding: '12px 16px',
          borderBottom: '1px solid #475569'
        }}>
          <button
            onClick={() => {
              navigate('/')
              setShowMobileMenu(false)
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Leave Room
          </button>
        </div>
      )}

      {/* Autocomplete suggestion banner */}
      {autocompleteSuggestion && (
        <div style={{
          background: '#fef3c7',
          padding: isMobile ? '10px 16px' : '12px 24px',
          borderBottom: '1px solid #fbbf24',
          color: '#92400e',
          fontSize: isMobile ? '12px' : '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          maxHeight: isMobile ? '120px' : '150px',
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <strong>💡 AI Suggestion:</strong>
            <pre style={{ 
              margin: '4px 0 0 0', 
              fontFamily: 'monospace',
              fontSize: isMobile ? '11px' : '13px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: 'rgba(251, 191, 36, 0.1)',
              padding: '8px',
              borderRadius: '4px'
            }}>
              {autocompleteSuggestion}
            </pre>
          </div>
          <button
            onClick={() => dispatch(setAutocompleteSuggestion(null))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#92400e',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0 4px',
              lineHeight: '1',
              flexShrink: 0,
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading state */}
      {!editorReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#64748b',
          fontSize: isMobile ? '14px' : '16px',
          textAlign: 'center',
          zIndex: 10
        }}>
          Loading editor...
        </div>
      )}

      {/* Monaco Editor */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: isMobile ? 12 : 14,
            minimap: { enabled: !isMobile },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: isMobile ? 'on' : 'off',
            lineNumbers: isMobile ? 'off' : 'on',
            glyphMargin: !isMobile,
            folding: !isMobile,
            lineDecorationsWidth: isMobile ? 0 : undefined,
            lineNumbersMinChars: isMobile ? 0 : 3,
            readOnly: false,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: isMobile ? 8 : 10,
              horizontalScrollbarSize: isMobile ? 8 : 10
            },
            padding: {
              top: isMobile ? 8 : 16,
              bottom: isMobile ? 8 : 16
            }
          }}
        />
      </div>

      {/* Mobile footer with helpful info */}
      {isMobile && (
        <div style={{
          background: '#1e293b',
          padding: '8px 16px',
          color: '#94a3b8',
          fontSize: '11px',
          textAlign: 'center',
          borderTop: '1px solid #334155'
        }}>
          Tap ☰ menu to leave • {connectedUsers} connected
        </div>
      )}
    </div>
  )
}

export default CodeEditor