import { useState } from 'react';
import { useStore } from './store/useStore';
import LoginScreen from './components/LoginScreen';
import Layout from './components/Layout';
import StudentDashboard from './pages/student/StudentDashboard';
import NewRequest from './pages/student/NewRequest';
import MyPasses from './pages/student/MyPasses';
import ApproverDashboard from './pages/approver/ApproverDashboard';
import Approvals from './pages/approver/Approvals';
import SecurityDashboard from './pages/security/SecurityDashboard';
import QRScanner from './pages/security/QRScanner';
import AdminDashboard from './pages/admin/AdminDashboard';
import Analytics from './pages/admin/Analytics';
import UsersPage from './pages/admin/UsersPage';
import Settings from './pages/admin/Settings';
import Notifications from './pages/shared/Notifications';
import MovementLog from './pages/shared/MovementLog';
import AllRequests from './pages/shared/AllRequests';

export default function App() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    // Shared pages across roles
    if (activeTab === 'notifications') return <Notifications />;
    if (activeTab === 'settings') return <Settings />;

    switch (currentUser.role) {
      case 'student':
        switch (activeTab) {
          case 'dashboard': return <StudentDashboard onNavigate={setActiveTab} />;
          case 'new-request': return <NewRequest onNavigate={setActiveTab} />;
          case 'my-passes': return <MyPasses />;
          default: return <StudentDashboard onNavigate={setActiveTab} />;
        }

      case 'faculty':
      case 'hod':
      case 'warden':
        switch (activeTab) {
          case 'dashboard': return <ApproverDashboard onNavigate={setActiveTab} />;
          case 'approvals': return <Approvals />;
          case 'history': return <AllRequests showOnlyHistory />;
          default: return <ApproverDashboard onNavigate={setActiveTab} />;
        }

      case 'security':
        switch (activeTab) {
          case 'dashboard': return <SecurityDashboard onNavigate={setActiveTab} />;
          case 'scanner': return <QRScanner onNavigate={setActiveTab} />;
          case 'movement-log': return <MovementLog />;
          default: return <SecurityDashboard onNavigate={setActiveTab} />;
        }

      case 'admin':
        switch (activeTab) {
          case 'dashboard': return <AdminDashboard onNavigate={setActiveTab} />;
          case 'analytics': return <Analytics />;
          case 'all-requests': return <AllRequests />;
          case 'users': return <UsersPage />;
          case 'movement-log': return <MovementLog />;
          default: return <AdminDashboard onNavigate={setActiveTab} />;
        }

      default:
        return <div className="p-8 text-center text-gray-500">Unknown role</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
