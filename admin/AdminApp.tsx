import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import CandleList from './CandleList';
import CandleForm from './CandleForm';

const AdminApp: React.FC = () => (
  <Routes>
    <Route path="login" element={<AdminLogin />} />
    <Route
      path="*"
      element={
        <ProtectedRoute>
          <AdminLayout>
            <Routes>
              <Route index element={<Navigate to="candles" replace />} />
              <Route path="candles" element={<CandleList />} />
              <Route path="candles/new" element={<CandleForm />} />
              <Route path="candles/:id" element={<CandleForm />} />
            </Routes>
          </AdminLayout>
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default AdminApp;
