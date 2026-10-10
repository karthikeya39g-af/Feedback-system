import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const isAllowed = Array.isArray(allowedRole)
        ? allowedRole.includes(user.role)
        : user.role === allowedRole;

    if (allowedRole && !isAllowed) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
