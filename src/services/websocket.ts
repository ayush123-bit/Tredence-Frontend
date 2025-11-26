export class WebSocketService {
  private ws: WebSocket | null = null
  private roomId: string
  private onMessageCallback: (data: any) => void

  constructor(roomId: string, onMessage: (data: any) => void) {
    this.roomId = roomId
    this.onMessageCallback = onMessage
  }

  connect() {
  this.ws = new WebSocket(`wss://tredence-backend-318c.onrender.com/ws/${this.roomId}`);

    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.onMessageCallback(data)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
    }
  }

  sendMessage(type: string, content: string, cursorPosition?: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type,
        content,
        cursor_position: cursorPosition
      }))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }
}