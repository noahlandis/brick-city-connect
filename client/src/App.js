import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './Home';
import Chat from './Chat';
import EmailForm from './auth/EmailForm';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/email" element={<EmailForm />} />
      </Routes>
    </Router>
  );
}

export default App;
