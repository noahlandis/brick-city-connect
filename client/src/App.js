import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import Home from './Home';
import Chat from './Chat';
import EmailForm from './auth/EmailForm';
import Register from './auth/Register';
import AuthLayout from './layouts/AuthLayout';
import { loader as registerGuard } from './guards/RegisterGuard';
import AuthGuard from './guards/AuthGuard';

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
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
