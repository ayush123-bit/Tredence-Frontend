import React from 'react'
import { Routes, Route } from 'react-router-dom'
import RoomJoin from './components/RoomJoin'
import CodeEditor from './components/CodeEditor'

const App: React.FC = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<RoomJoin />} />
        <Route path="/room/:roomId" element={<CodeEditor />} />
      </Routes>
    </div>
  )
}

export default App