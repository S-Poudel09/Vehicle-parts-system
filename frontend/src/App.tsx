import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected by role — teammates will replace the placeholder divs */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <div>Admin Dashboard — coming soon</div>
            </ProtectedRoute>
          }/>

          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['Staff']}>
              <div>Staff Dashboard — coming soon</div>
            </ProtectedRoute>
          }/>

          <Route path="/customer" element={
            <ProtectedRoute allowedRoles={['Customer']}>
              <div>Customer Portal — coming soon</div>
            </ProtectedRoute>
          }/>

          {/* Catch-all → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
