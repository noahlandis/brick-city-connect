import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (user?.id && token && !user.level) {

        console.log("fetch again, refresh");
        const fetchedUser = await getUser(user.id);
        setUser(fetchedUser.data);
      }
    };
    fetchUser();
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
    <AuthContext.Provider value={{ user, clientLogin, clientLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
