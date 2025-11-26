const API_BASE = 'https://tredence-backend-318c.onrender.com/api'

export interface Room {
  room_id: string
  code: string
  language: string
  created_at: string
}

export interface AutocompleteRequest {
  code: string
  cursor_position: number
  language: string
}

export interface AutocompleteResponse {
  suggestion: string
  confidence: number
}

export const api = {
  createRoom: async (): Promise<Room> => {
    const response = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'python' })
    })
    return response.json()
  },

  getRoom: async (roomId: string): Promise<Room> => {
    const response = await fetch(`${API_BASE}/rooms/${roomId}`)
    return response.json()
  },

  getAutocomplete: async (request: AutocompleteRequest): Promise<AutocompleteResponse> => {
    const response = await fetch(`${API_BASE}/autocomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    return response.json()
  }
}