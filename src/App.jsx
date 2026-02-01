import { Routes, Route } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import Onboarding from './pages/Onboarding'
import CoupleDashboard from './pages/couple/CoupleDashboard'
import MyWedding from './pages/couple/MyWedding'
import BrowseServices from './pages/couple/BrowseServices'
import MyBookings from './pages/couple/MyBookings'
import GuestManagement from './pages/couple/GuestManagement'
import WeddingCardPage from './pages/couple/WeddingCardPage'
import AttendeeDashboard from './pages/attendee/AttendeeDashboard'
import CoupleProfile from './pages/couple/CoupleProfile'
import CoupleSettings from './pages/couple/CoupleSettings'
import VendorDashboard from './pages/vendor/VendorDashboard'
import AddService from './pages/vendor/AddService'
import EditService from './pages/vendor/EditService'
import Bookings from './pages/vendor/Bookings'
import VendorProfile from './pages/vendor/VendorProfile'
import VendorSettings from './pages/vendor/VendorSettings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminWeddings from './pages/admin/AdminWeddings'
import AdminServices from './pages/admin/AdminServices'
import AdminPayments from './pages/admin/AdminPayments'
import AdminReports from './pages/admin/AdminReports'
import AdminSettings from './pages/admin/AdminSettings'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerMissions from './pages/manager/ManagerMissions'
import ManagerTeam from './pages/manager/ManagerTeam'
import ManagerMessages from './pages/manager/ManagerMessages'
import ManagerSchedule from './pages/manager/ManagerSchedule'
import ProtocolDashboard from './pages/protocol/ProtocolDashboard'
import Profile from './pages/common/Profile'
import Settings from './pages/common/Settings'
import WeddingManagement from './pages/common/WeddingManagement'
import Login from './pages/Login'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Couple Routes */}
      <Route path="/couple/dashboard" element={<CoupleDashboard />} />
      <Route path="/couple/wedding" element={<MyWedding />} />
      <Route path="/couple/guests" element={<GuestManagement />} />
      <Route path="/couple/wedding-card" element={<WeddingCardPage />} />
      <Route path="/couple/browse-services" element={<BrowseServices />} />
      <Route path="/couple/bookings" element={<MyBookings />} />
      <Route path="/couple/wedding-management" element={<WeddingManagement role="couple" />} />
      <Route path="/couple/profile" element={<CoupleProfile />} />
      <Route path="/couple/settings" element={<CoupleSettings />} />

      {/* Attendee Routes */}
      <Route path="/attendee/dashboard" element={<AttendeeDashboard />} />

      {/* Vendor Routes */}
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/vendor/add-service" element={<AddService />} />
      <Route path="/vendor/edit-service/:id" element={<EditService />} />
      <Route path="/vendor/bookings" element={<Bookings />} />
      <Route path="/vendor/profile" element={<VendorProfile />} />
      <Route path="/vendor/settings" element={<VendorSettings />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/weddings" element={<AdminWeddings />} />
      <Route path="/admin/services" element={<AdminServices />} />
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/settings" element={<AdminSettings />} />

      {/* Manager Routes */}
      <Route path="/manager/dashboard" element={<ManagerDashboard />} />
      <Route path="/manager/missions" element={<ManagerMissions />} />
      <Route path="/manager/wedding-management" element={<WeddingManagement role="manager" />} />
      <Route path="/manager/team" element={<ManagerTeam />} />
      <Route path="/manager/messages" element={<ManagerMessages />} />
      <Route path="/manager/schedule" element={<ManagerSchedule />} />
      <Route path="/manager/profile" element={<Profile />} />
      <Route path="/manager/settings" element={<Settings />} />

      {/* Protocol Routes */}
      <Route path="/protocol/dashboard" element={<ProtocolDashboard />} />
      <Route path="/protocol/profile" element={<Profile />} />
      <Route path="/protocol/settings" element={<Settings />} />

      {/* Common Routes (fallback for all roles) */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export default App

