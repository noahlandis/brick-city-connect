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
const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthGuard><Home /></AuthGuard>
  },
  {
    path: "/chat",
    element: <AuthGuard><Chat /></AuthGuard>
  },
  {
    path: "login",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Login />
      }
    ]
  },
  {
    path: "register",
    element: <AuthLayout />,
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
    element: <AuthLayout />,
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
    <ModalProvider>
      <RouterProvider router={router} />
    </ModalProvider>
  );
}

export default App;
