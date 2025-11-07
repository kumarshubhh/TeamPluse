import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import RoomsPage from './pages/Rooms.jsx';
import RoomPage from './pages/Room.jsx';
import NotificationsPage from './pages/Notifications.jsx';
import ProfilePage from './pages/Profile.jsx';

/**
 * Router Configuration
 * 
 * Routes setup:
 * - /login, /signup → Public routes (no auth required)
 * - /, /rooms/:id, /notifications, /profile → Protected routes (auth required)
 * - Layout component sabhi protected routes ko wrap karta hai
 */
export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<RoomsPage />} />
        <Route path="/rooms/:roomId" element={<RoomPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  )
);
