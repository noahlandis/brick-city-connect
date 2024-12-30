import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import Home from './Home';
import Chat from './Chat';
import EmailForm from './auth/EmailForm';
import Register from './auth/Register';
import AuthLayout from './layouts/AuthLayout';
import { loader as registerGuard } from './guards/RegisterGuard';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />
  },
  {
    path: "/chat",
    element: <Chat />
  },
  {
    path: "/email",
    element: (
      <AuthLayout>
        <EmailForm />
      </AuthLayout>
    )
  },
  {
    path: "/register",
    element: (
      <AuthLayout>
        <Register />
      </AuthLayout>
    ),
    loader: registerGuard
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
