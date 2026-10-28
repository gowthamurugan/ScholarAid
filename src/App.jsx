import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Navbar from './components/common/Navbar.jsx';
import Footer from './components/common/Footer.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// Pages
import StudentLogin from './pages/StudentLogin.jsx';
import StudentRegister from './pages/StudentRegister.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import ApprovedScholarships from './pages/ApprovedScholarships.jsx';
import EligibleScholarships from './pages/EligibleScholarships.jsx';
import ScholarshipDetails from './pages/ScholarshipDetails.jsx';
import ReadinessDashboard from './pages/ReadinessDashboard.jsx';
import ApplicationTracking from './pages/ApplicationTracking.jsx';
import StudentNotifications from './pages/StudentNotifications.jsx';

// Administrator Pages
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminAllScholarships from './pages/AdminAllScholarships.jsx';
import AdminApprovedScholarships from './pages/AdminApprovedScholarships.jsx';
import ScholarshipDiscovery from './pages/ScholarshipDiscovery.jsx';
import PendingScholarships from './pages/PendingScholarships.jsx';
import ScholarshipReview from './pages/ScholarshipReview.jsx';
import ApprovedRejectedManagement from './pages/ApprovedRejectedManagement.jsx';
import AnnouncementCreation from './pages/AnnouncementCreation.jsx';
import ApplicationMonitoring from './pages/ApplicationMonitoring.jsx';

// Utility Pages
import AccessDenied from './pages/AccessDenied.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main style={{ flex: 1 }}>
                <Routes>
                {/* Public Routes - Root directly redirects to Login page */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/home" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<StudentLogin />} />
                <Route path="/register" element={<StudentRegister />} />
                <Route path="/scholarships" element={<ApprovedScholarships />} />
                <Route path="/scholarships/:id" element={<ScholarshipDetails />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Student Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/eligible"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <EligibleScholarships />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/readiness"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <ReadinessDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <ApplicationTracking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentNotifications />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAllScholarships />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAllScholarships />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/all-scholarships"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAllScholarships />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/approved"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminApprovedScholarships />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/monitoring"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ApplicationMonitoring />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/review/:id"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ScholarshipReview />
                    </ProtectedRoute>
                  }
                />

                {/* Status & Fallback Routes */}
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  );
}
