import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  roles: { id: number; name: string; description: string }[];
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean | undefined;
    isAnalyst: boolean | undefined;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/me');
            setUser(response.data);
        } catch (err) {
            console.error('Failed to fetch user me', err);
            setUser(null);
            localStorage.removeItem('token'); // auto kick corrupted tokens
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const isAdmin = user?.roles.some(r => r.name === 'Admin');
    const isAnalyst = user?.roles.some(r => r.name === 'Admin' || r.name === 'Analyst');

    return React.createElement(
        UserContext.Provider, 
        { value: { user, loading, isAdmin, isAnalyst, refreshUser: fetchUser } }, 
        children
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
