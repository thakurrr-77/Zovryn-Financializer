import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import UserManagement from './components/UserManagement';
import Profile from './components/Profile';
import Insights from './components/Insights';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider } from './hooks/useUser';
import './index.css';

const App: React.FC = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/records" 
                        element={
                            <ProtectedRoute>
                                <Transactions />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/users" 
                        element={
                            <ProtectedRoute>
                                <UserManagement />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/reports" 
                        element={
                            <ProtectedRoute>
                                <Insights />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;
