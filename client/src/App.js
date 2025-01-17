import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import Home from './Home';
import Chat from './Chat';
import EmailForm from './auth/EmailForm';
import Register from './auth/Register';
import AuthLayout from './layouts/AuthLayout';
import { registerLoader as registerGuard, forgotPasswordLoader as forgotPasswordGuard } from './guards/MagicLinkGuard';
import AuthGuard from './guards/AuthGuard';
import Login from './auth/Login';
import { ModalProvider } from './contexts/ModalContext';
import ForgotPassword from './forgot-password/ForgotPassword';
import ResetPassword from './forgot-password/ResetPassword';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GuestGuard from './guards/GuestGuard';
const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthGuard><Home /></AuthGuard>
  },
  {
    path: "/chat",
    element: <Chat />
  },
  {
    path: "login",
    element: <GuestGuard><AuthLayout /></GuestGuard>,
    children: [
      {
        index: true,
        element: <Login />
      }
    ]
  },
  {
    path: "register",
    element: <GuestGuard><AuthLayout /></GuestGuard>,
    children: [
      {
        index: true,
        element: <EmailForm />
      },
      {
        path: "callback",
        element: <Register />,
        loader: registerGuard
      }
    ]
  },
  {
    path: "forgot-password",
    element: <GuestGuard><AuthLayout /></GuestGuard>,
    children: [
      {
        index: true,
        element: <ForgotPassword />
      },
      {
        path: "callback",
        element: <ResetPassword />,
        loader: forgotPasswordGuard
      }
    ]
  }
]);

function App() {
  return (
    <GoogleOAuthProvider clientId="678807010034-42f8f3ttofp752pvp83jdgrg7o7am9u5.apps.googleusercontent.com">
      <ModalProvider>
        <RouterProvider router={router} />
      </ModalProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
