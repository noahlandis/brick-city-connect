import React, { createContext, useContext, useState, useCallback } from 'react';
import { getUser } from '../api/userApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to validate the token here
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch (e) {
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  });

  const fetchUser = useCallback(async () => {
    const fetchedUser = await getUser(user.id);
    setUser(fetchedUser.data);
  }, [user?.id]);

  const clientLogin = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
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
