import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleAuthCallback, setError } = useAuth();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const userParam = searchParams.get('user');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            console.error("OAuth Callback Error:", errorParam);
            setError(`Authentication failed: ${errorParam}`);
            navigate('/login', { replace: true });
            return;
        }

        if (accessToken && userParam) {
            try {
                const user = JSON.parse(userParam);
                handleAuthCallback(accessToken, user);
            } catch (e) {
                console.error("Failed to parse user data from callback:", e);
                setError('Authentication callback failed: Invalid data received.');
                navigate('/login', { replace: true });
            }
        } else {
            console.error("OAuth Callback missing token or user data");
            setError('Authentication callback failed: Missing data.');
            navigate('/login', { replace: true });
        }
    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Processing authentication...
        </div>
    );
};

export default AuthCallback;