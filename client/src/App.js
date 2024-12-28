import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './Home';
import Chat from './Chat';
import EmailForm from './auth/EmailForm';
import Register from './auth/Register';
import RegisterGuard from './guards/RegisterGuard';
import AuthLayout from './layouts/AuthLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/email" element={
          <AuthLayout>
            <EmailForm />
          </AuthLayout>
        } />
        <Route element={<RegisterGuard />}>
          <Route path='/register' element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
