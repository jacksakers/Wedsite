import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GuestIdentityProvider } from './context/GuestIdentityContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import OurStory from './pages/OurStory'
import Information from './pages/Information'
import Registry from './pages/Registry'
import GuestGate from './pages/GuestGate'
import RSVP from './pages/RSVP'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLogin from './pages/admin/AdminLogin'
import Lounge from './pages/Lounge'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GuestIdentityProvider>
          <div className="min-h-svh flex flex-col bg-paper">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/story" element={<OurStory />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/gate" element={<GuestGate />} />
            <Route
              path="/information"
              element={<ProtectedRoute><Information /></ProtectedRoute>}
            />
            <Route
              path="/rsvp"
              element={<ProtectedRoute><RSVP /></ProtectedRoute>}
            />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={<AdminRoute><AdminDashboard /></AdminRoute>}
            />
            <Route
              path="/lounge"
              element={<ProtectedRoute><Lounge /></ProtectedRoute>}
            />
          </Routes>
          <Footer />
          </div>
        </GuestIdentityProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
