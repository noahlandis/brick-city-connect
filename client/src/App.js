import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import './App.css';
import Home from './pages/auth/Home';
import Chat from './pages/auth/Chat';
import EmailForm from './pages/guest/EmailForm';
import Register from './pages/guest/Register';
import GuestLayout from './layouts/GuestLayout';
import { registerLoader as registerGuard, forgotPasswordLoader as forgotPasswordGuard } from './guards/MagicLinkGuard';
import AuthGuard from './guards/AuthGuard';
import Login from './pages/guest/Login';
import { ModalProvider } from './contexts/ModalContext';
import ForgotPassword from './pages/guest/ForgotPassword';
import ResetPassword from './pages/guest/ResetPassword';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GuestGuard from './guards/GuestGuard';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import {ConfigCatProvider, createConsoleLogger, LogLevel} from 'configcat-react';
import ChatGuard from './guards/ChatGuard';
import Terms from './pages/legal/Terms';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import { usePageTracking } from './utils/usePageTracking';

const RootLayout = () => {
  usePageTracking();
  return <Outlet />
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
    },
    {
      path: "terms",
      element: <AuthLayout />,
      children: [{
        index: true,
        element: <Terms />
      }]
    },
    {
      path: "privacy",
      element: <AuthLayout />,
      children: [{
        index: true,
        element: <PrivacyPolicy />
      }]
    }
    ]
  }
]);

function App() {
  return (
    <ConfigCatProvider sdkKey={process.env.REACT_APP_CONFIGCAT_SDK_KEY} options={{
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
