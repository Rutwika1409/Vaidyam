import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  LayoutDashboard,
  Stethoscope,
  FileText,
  UserCheck,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import DoctorAvatar from './DoctorAvatar';
import logoImg from '../assets/logo.jpg';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dashboard/symptoms', icon: Stethoscope, label: 'Symptom Analyzer' },
  { path: '/dashboard/reports', icon: FileText, label: 'Report Analysis' },
  { path: '/dashboard/doctors', icon: UserCheck, label: 'Find Doctors' },
  { path: '/dashboard/requests', icon: Bell, label: 'My Requests' },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const languages = [
  { code: 'en', label: 'EN', native: 'English' },
  { code: 'te', label: 'TE', native: 'తెలుగు' },
  { code: 'hi', label: 'HI', native: 'हिंदी' },
  { code: 'ta', label: 'TA', native: 'தமிழ்' },
  { code: 'kn', label: 'KN', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'ML', native: 'മലയാളം' },
];

export default function AppLayout() {
  const { user, language, setLanguage, logout, theme, toggleTheme } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const currentPath = location.pathname;
    if (currentPath === '/dashboard') return 'Dashboard';
    if (currentPath === '/dashboard/symptoms') return 'Symptom Analyzer';
    if (currentPath === '/dashboard/reports') return 'Report Intelligence';
    if (currentPath === '/dashboard/doctors') return 'Find Specialists';
    if (currentPath === '/dashboard/requests') return 'My Consultation Requests';
    if (currentPath === '/dashboard/settings') return 'Settings';
    return 'vAIdyam';
  };

  return (
    <div className="min-h-screen bg-navy text-[#EEF2FF] flex flex-col md:flex-row">
      {/* ─── SIDEBAR (Desktop) ─── */}
      <aside
        className={`hidden md:flex flex-col bg-navy-surface border-r border-[#ffffff07] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-[#ffffff07]">
          <div className="flex items-center overflow-hidden">
            <img 
              src={logoImg} 
              alt="vAIdyam Logo" 
              className={`object-contain shadow-[0_0_15px_var(--teal-glow)] transition-all ${
                collapsed ? 'h-8 w-8' : 'h-14 w-auto max-w-[150px]'
              }`} 
            />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#8A9BC4] hover:text-[#EEF2FF] transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all relative ${
                  isActive
                    ? 'text-teal bg-[#00C9A7]/10 border-l-[3px] border-teal shadow-[inset_3px_0_10px_rgba(0,201,167,0.05)]'
                    : 'text-[#8A9BC4] hover:text-[#EEF2FF] hover:bg-navy-elevated/40'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-teal' : 'text-[#8A9BC4]'} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-[#ffffff07] flex flex-col space-y-3 overflow-hidden">
          <div className="flex items-center space-x-3">
            <DoctorAvatar name={user?.full_name || 'User'} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-[#EEF2FF]">
                  {user?.full_name || 'Guest User'}
                </p>
                <span className="inline-block mt-0.5 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal border border-teal/20 uppercase">
                  {language}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/auth');
            }}
            className="w-full flex items-center space-x-3 text-[#FF5C5C] hover:text-red-400 hover:bg-red-500/10 py-2 px-3 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="flex-1 flex flex-col min-h-0 bg-navy">
        {/* Header (Top) */}
        <header className="h-16 bg-navy-surface border-b border-[#ffffff07] px-4 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#EEF2FF]">
            {getPageTitle()}
          </h1>

          <div className="flex items-center space-x-4">
            {/* Language Selector Pills */}
            <div className="hidden lg:flex items-center bg-navy-elevated p-1 rounded-lg border border-[#ffffff07] space-x-0.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                    language === lang.code
                      ? 'bg-teal text-black shadow-[0_0_8px_var(--teal-glow)]'
                      : 'text-[#8A9BC4] hover:text-[#EEF2FF] hover:bg-[#ffffff03]'
                  }`}
                  title={lang.native}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Quick Language Select Dropdown (Mobile/Tablet) */}
            <div className="lg:hidden">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-navy-elevated text-xs font-semibold text-teal border border-teal/20 rounded px-2 py-1 outline-none"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[#8A9BC4] hover:text-[#EEF2FF] hover:bg-navy-elevated transition-all"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Notification Indicator */}
            <button
              onClick={() => navigate('/dashboard/requests')}
              className="relative p-2 rounded-full text-[#8A9BC4] hover:text-[#EEF2FF] hover:bg-navy-elevated transition-all"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal shadow-[0_0_8px_#00C9A7]"></span>
            </button>

            {/* Profile Avatar Quick View */}
            <Link to="/dashboard/settings">
              <DoctorAvatar name={user?.full_name || 'User'} size="sm" />
            </Link>
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ─── BOTTOM NAVIGATION (Mobile Only - screens < 768px) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-navy-surface border-t border-[#ffffff07] flex items-center justify-around px-2 z-40 backdrop-blur-md">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${
                isActive ? 'text-teal' : 'text-[#8A9BC4]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[9px] mt-0.5 font-medium truncate max-w-full">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
        {/* Settings Tab on Mobile */}
        <Link
          to="/dashboard/settings"
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${
            location.pathname === '/dashboard/settings' ? 'text-teal' : 'text-[#8A9BC4]'
          }`}
        >
          <Settings size={20} />
          <span className="text-[9px] mt-0.5 font-medium">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
