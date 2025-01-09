import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => {
    const storedTokens = localStorage.getItem('authTokens');
    return storedTokens ? JSON.parse(storedTokens) : null;
  });
  const [user, setUser] = useState(() =>
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth Tokens updated to ", authTokens)
    if (authTokens) {
      localStorage.setItem('authTokens', JSON.stringify(authTokens));
    } else {
      localStorage.removeItem('authTokens');
    }
    setLoading(false)
  }, [authTokens]);

  const logout = useCallback(() => {
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');
    setAuthTokens(null);
    setUser(null);
  }, []);

  const login = useCallback(async (access, refresh) => {
    const tokens = { access, refresh };
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    setAuthTokens(tokens);

    try {
      // Decode access token to get user details
      const decodedAccess = JSON.parse(atob(access.split('.')[1]));
      const userData = { id: decodedAccess.user_id, username: decodedAccess.username };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Error decoding the token", error);
      logout()
    }

  }, [logout]);


  const updateTokens = useCallback(async () => {
    if (!authTokens?.refresh) {
      logout();
      return null;
    }
    try {
      console.log("Attempting to refresh token...")
      const response = await api.post('/users/jwt/refresh/', { refresh: authTokens.refresh });
      if (response.status === 200) {
        const newAccess = response.data.access;
        setAuthTokens((prevTokens) => ({
          ...prevTokens,
          access: newAccess,
        }));
        localStorage.setItem('authTokens', JSON.stringify({ ...authTokens, access: newAccess }));
        return newAccess;
      }
    } catch (error) {
      console.error('Failed to refresh tokens', error);
      logout();
    }
    return null;
  }, [authTokens, logout]);

  // Automatic Token Refresh
  useEffect(() => {
    if (loading) return

    const intervalId = setInterval(() => {
      if (authTokens) {
        console.log("Checking token...")
        updateTokens();
      }
    }, 20 * 60 * 1000); // Refresh token every 20 minutes

    return () => clearInterval(intervalId);
  }, [loading, authTokens, updateTokens]);


  const isLoggedIn = !!authTokens;

  const contextData = {
    authTokens,
    user,
    login,
    logout,
    isLoggedIn,
    updateTokens,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  return useContext(AuthContext);
};