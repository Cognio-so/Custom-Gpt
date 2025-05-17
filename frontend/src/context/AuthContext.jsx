import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosInstance, setAccessToken, getAccessToken, removeAccessToken } from '../api/axiosInstance';
import axios from 'axios';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, _setAccessToken] = useState(() => getAccessToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();


  const updateAccessToken = useCallback((token) => {
    if (token) {
      setAccessToken(token);
      _setAccessToken(token);
    } else {
      removeAccessToken();
      _setAccessToken(null);
    }
  }, []);


  const fetchUser = useCallback(async () => {
    try {
      const currentToken = getAccessToken();
      if (!currentToken) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
            const response = await axiosInstance.post('/api/auth/refresh');
            if (response.data && response.data.accessToken) {
              updateAccessToken(response.data.accessToken);
            } else {
              setUser(null);
              localStorage.removeItem('user');
              updateAccessToken(null);
            }
          } catch (e) {
            console.error("Failed to use saved user data or refresh token:", e);
            setUser(null);
            localStorage.removeItem('user');
            updateAccessToken(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await axiosInstance.get('/api/auth/me');

      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } else {
        console.error("No user data in response");
        updateAccessToken(null);
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      updateAccessToken(null);
      setUser(null);
      localStorage.removeItem('user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateAccessToken]);


  useEffect(() => {
    fetchUser();
  }, [fetchUser]);


  const handleAuthCallback = useCallback((token, userData) => {
    updateAccessToken(token);
    setUser(userData);
    setLoading(false);


    localStorage.setItem('user', JSON.stringify(userData));

    if (userData?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/employee', { replace: true });
    }
  }, [navigate, updateAccessToken]);


  const login = async (email, password) => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/api/auth/login', { email, password });

      const userData = response.data.user;
      setUser(userData);
      updateAccessToken(response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      if (userData.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/employee', { replace: true });
      }

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/api/auth/signup', { name, email, password });

      navigate('/verify-email', { state: { email } });

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      removeAccessToken();
      localStorage.removeItem('user');
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      setUser(null);
      _setAccessToken(null);
      navigate('/login', { replace: true });
    }
  };

  const googleAuthInitiate = () => {
    window.location.href = `${axiosInstance.defaults.baseURL}/api/auth/google`;
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/api/auth/forget-password', { email });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send password reset email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post(`/api/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (code) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/api/auth/verify-email', { code });

      if (response.data.success && response.data.user) {
        const userData = response.data.user;

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

      }

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Email verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      error,
      login,
      signup,
      logout,
      googleAuthInitiate,
      handleAuthCallback,
      fetchUser,
      setError,
      forgotPassword,
      resetPassword,
      verifyEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
