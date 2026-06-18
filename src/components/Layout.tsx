import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getRoleIcon, getRoleLabel } from '../utils/helpers';
import {
  Bell, LogOut, Home, FileText, CheckSquare, QrCode,
  BarChart3, Users, Shield, Clock, Settings, X, Search
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { currentUser, logout, notifications } = useStore();
  const [showProfile, setShowProfile] = useState(false);

  if (!currentUser) return null;

  const unreadCount = notifications.filter(
    (n) => n.userId === currentUser.id && !n.read
  ).length;

  const getNavItems = (): NavItem[] => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
          { id: 'new-request', label: 'Request', icon: <FileText className="w-5 h-5" /> },
          { id: 'my-passes', label: 'My Passes', icon: <QrCode className="w-5 h-5" /> },
          { id: 'notifications', label: 'Alerts', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
        ];
      case 'faculty':
      case 'hod':
      case 'warden':
        return [
          { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
          { id: 'approvals', label: 'Approve', icon: <CheckSquare className="w-5 h-5" /> },
          { id: 'history', label: 'History', icon: <Clock className="w-5 h-5" /> },
          { id: 'notifications', label: 'Alerts', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
        ];
      case 'security':
        return [
          { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
          { id: 'scanner', label: 'Scan', icon: <QrCode className="w-5 h-5" /> },
          { id: 'movement-log', label: 'Logs', icon: <Clock className="w-5 h-5" /> },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
          { id: 'analytics', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
          { id: 'all-requests', label: 'Requests', icon: <FileText className="w-5 h-5" /> },
          { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
        ];
      default:
        return [];
    }
  };

  const getSecondaryItems = (): NavItem[] => {
    switch (currentUser.role) {
      case 'student':
        return [];
      case 'faculty':
      case 'hod':
      case 'warden':
        return [];
      case 'security':
        return [];
      case 'admin':
        return [
          { id: 'movement-log', label: 'Movement Log', icon: <Clock className="w-5 h-5" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const secondaryItems = getSecondaryItems();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ========== Mobile Header ========== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 leading-tight">CampusPass</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-tight">{getRoleLabel(currentUser.role)}</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <button
              onClick={() => onTabChange('notifications')}
              className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center text-lg">
                {getRoleIcon(currentUser.role)}
              </div>
            </button>
          </div>
        </div>

        {/* Search bar (below header) */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search passes, students, IDs..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>
        </div>
      </header>

      {/* ========== Profile Slide-Down ========== */}
      {showProfile && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setShowProfile(false)} />
          <div className="fixed top-0 left-0 right-0 bg-white rounded-b-2xl shadow-2xl z-50 animate-slide-down max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              {/* Close */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800">Profile</h3>
                <button
                  onClick={() => setShowProfile(false)}
                  className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-5 text-white mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                    {getRoleIcon(currentUser.role)}
                  </div>
                  <div>
                    <p className="text-xl font-bold">{currentUser.name}</p>
                    <p className="text-primary-200 text-sm">{getRoleLabel(currentUser.role)}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-primary-200 text-xs">Email</p>
                    <p className="font-medium truncate">{currentUser.email}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-primary-200 text-xs">Department</p>
                    <p className="font-medium">{currentUser.department || 'N/A'}</p>
                  </div>
                  {currentUser.studentId && (
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-primary-200 text-xs">Roll No</p>
                      <p className="font-mono font-medium">{currentUser.studentId}</p>
                    </div>
                  )}
                  {currentUser.phone && (
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-primary-200 text-xs">Phone</p>
                      <p className="font-medium">{currentUser.phone}</p>
                    </div>
                  )}
                  {currentUser.hostelBlock && (
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-primary-200 text-xs">Hostel</p>
                      <p className="font-medium">{currentUser.hostelBlock} / {currentUser.roomNumber}</p>
                    </div>
                  )}
                  {currentUser.year && (
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-primary-200 text-xs">Year</p>
                      <p className="font-medium">Year {currentUser.year}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions in profile */}
              {secondaryItems.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">More Options</h4>
                  <div className="space-y-1.5">
                    {secondaryItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { onTabChange(item.id); setShowProfile(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <span className="text-gray-400">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings shortcut for all roles */}
              <button
                onClick={() => { onTabChange('settings'); setShowProfile(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors mb-2"
              >
                <Settings className="w-5 h-5 text-gray-400" />
                Settings
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========== Main Content ========== */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4 lg:px-6 lg:py-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* ========== Bottom Navigation Bar ========== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] safe-area-bottom">
        <div className="flex items-stretch justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] relative transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-400 active:text-gray-600'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full" />
                )}
                <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-semibold leading-tight ${
                  isActive ? 'text-primary-700' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-4 min-w-[16px] h-4 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
