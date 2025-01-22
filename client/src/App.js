import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import Home from './Home';
import Chat from './Chat';
import EmailForm from './auth/EmailForm';
import Register from './auth/Register';
import GuestLayout from './layouts/GuestLayout';
import { registerLoader as registerGuard, forgotPasswordLoader as forgotPasswordGuard } from './guards/MagicLinkGuard';
import AuthGuard from './guards/AuthGuard';
import Login from './auth/Login';
import { ModalProvider } from './contexts/ModalContext';
import ForgotPassword from './forgot-password/ForgotPassword';
import ResetPassword from './forgot-password/ResetPassword';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GuestGuard from './guards/GuestGuard';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import {ConfigCatProvider, createConsoleLogger, LogLevel} from 'configcat-react';
import ChatGuard from './guards/ChatGuard';

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthGuard><AuthLayout /></AuthGuard>,
    children: [
      {
        index: true,
        element: <Home />
      }
    ]
  },
  {
    path: "/chat",
    element: <AuthGuard><AuthLayout /></AuthGuard>,
    children: [
      {
        index: true,
        element: <ChatGuard><Chat /></ChatGuard>
      }
    ]
  },
  {
    path: "login",
    element: <GuestGuard><GuestLayout /></GuestGuard>,
    children: [
      {
        index: true,
        element: <Login />
      }
    ]
  },
  {
    path: "register",
    element: <GuestGuard><GuestLayout /></GuestGuard>,
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
    element: <GuestGuard><GuestLayout /></GuestGuard>,
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
    <ConfigCatProvider sdkKey="configcat-sdk-1/dTrdCPqpgEeBQLJ1dnKMew/wTjQfgcLlE29DHM_Hz4PDA" options={{
      logger: createConsoleLogger(LogLevel.Info)
    }}>
    <AuthProvider>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <ModalProvider>
          <RouterProvider router={router} />
        </ModalProvider>
      </GoogleOAuthProvider>
    </AuthProvider>
    </ConfigCatProvider>
  );
}

export default App;
