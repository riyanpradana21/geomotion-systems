import React from 'react';
import { Camera, BookOpen, LayoutDashboard, History, Settings, Sparkles, Box } from 'lucide-react';

export type NavTab = 'dashboard' | 'learning' | 'camera' | 'studio3d' | 'result' | 'history' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasRecentResult: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, hasRecentResult }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learning', label: 'Learning Center', icon: BookOpen },
    { id: 'camera', label: 'Interactive Camera', icon: Camera, highlight: true },
    { id: 'studio3d', label: 'Studio 3D', icon: Box, badge: '360°' },
    ...(hasRecentResult
      ? [{ id: 'result', label: 'Latest Result', icon: Sparkles, badge: 'New' }]
      : []),
    { id: 'history', label: 'Learning History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                  Simple AI Geometry
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Kids STEM
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Gesture-Powered Interactive Geometry
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as NavTab)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${
                    item.highlight && !isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white hover:opacity-95 shadow-sm'
                      : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : ''}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Start Action on Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onSelectTab('studio3d')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold"
            >
              <Box className="w-3.5 h-3.5" />
              3D
            </button>
            <button
              onClick={() => onSelectTab('camera')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              Draw
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-50/90 border-t border-slate-200 py-1.5 px-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold ${
                isActive ? 'text-indigo-600 bg-white shadow-xs' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
