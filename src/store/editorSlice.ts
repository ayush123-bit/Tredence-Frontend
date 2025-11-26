import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface EditorState {
  code: string
  language: string
  roomId: string | null
  connectedUsers: number
  autocompleteSuggestion: string | null
}

const initialState: EditorState = {
  code: '# Start coding here...\n',
  language: 'python',
  roomId: null,
  connectedUsers: 0,
  autocompleteSuggestion: null,
}

export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload
    },
    setRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload
    },
    setConnectedUsers: (state, action: PayloadAction<number>) => {
      state.connectedUsers = action.payload
    },
    setAutocompleteSuggestion: (state, action: PayloadAction<string | null>) => {
      state.autocompleteSuggestion = action.payload
    },
  },
})

export const { 
  setCode, 
  setLanguage, 
  setRoomId, 
  setConnectedUsers,
  setAutocompleteSuggestion 
} = editorSlice.actions

export default editorSlice.reducer