import React, { createContext, useContext, useState, useCallback } from 'react';
import { getUser } from '../api/userApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch (e) {
        localStorage.removeItem('token');
        clientLogout();
        return null;
      }
    }
    return null;
  });

  const fetchUser = useCallback(async () => {
    try {
      const fetchedUser = await getUser(user.id);
      setUser(fetchedUser.data);
    } catch (error) {
      clientLogout();
    }
  }, [user?.id]);

  const clientLogin = (data) => {
    try {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error) {
      clientLogout();
    }
  };

  const clientLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, clientLogin, clientLogout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
