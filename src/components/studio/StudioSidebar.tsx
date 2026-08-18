import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Compass, 
  FileCheck,
  Users, 
  PackageCheck, 
  Activity, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { StudioTab, StudioUserSession, StudioNavSection } from './types';
import IdemoLogo from '../IdemoLogo';

interface StudioSidebarProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  session: StudioUserSession;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS: StudioNavSection[] = [
  { id: 'dashboard', label: 'Dashboard', iconName: 'LayoutDashboard' },
  { id: 'destinations', label: 'Destinations', iconName: 'MapPin', badge: '5 Active' },
  { id: 'recommendations', label: 'Recommendations', iconName: 'Compass', badge: '113 Recs' },
  { id: 'editorial-review', label: 'Editorial Review', iconName: 'FileCheck', badge: 'WP-10' },
  { id: 'partners', label: 'Partners', iconName: 'Users', badge: '5 Verified' },
  { id: 'partner-coverage', label: 'Coverage Control', iconName: 'ShieldCheck', badge: 'Matrix' },
  { id: 'publications', label: 'Publications', iconName: 'PackageCheck', badge: 'v1.2.0' },
  { id: 'operations', label: 'Operations', iconName: 'Activity', badge: 'Healthy' },
  { id: 'settings', label: 'Settings', iconName: 'Settings' }
];

export function StudioSidebar({
  activeTab,
  onSelectTab,
  session,
  onLogout,
  isCollapsed,
  onToggleCollapse
}: StudioSidebarProps) {
  const getIcon = (id: StudioTab) => {
    switch (id) {
      case 'dashboard': return <LayoutDashboard size={18} />;
      case 'destinations': return <MapPin size={18} />;
      case 'recommendations': return <Compass size={18} />;
      case 'editorial-review': return <FileCheck size={18} />;
      case 'partners': return <Users size={18} />;
      case 'partner-coverage': return <ShieldCheck size={18} />;
      case 'publications': return <PackageCheck size={18} />;
      case 'operations': return <Activity size={18} />;
      case 'settings': return <Settings size={18} />;
      default: return <LayoutDashboard size={18} />;
    }
  };

  return (
    <aside
      className={`bg-[#23251E] text-white flex flex-col justify-between border-r border-[#32352B] transition-all duration-300 relative shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <IdemoLogo className="h-6 w-auto" />
              <div className="flex flex-col">
                <span className="font-serif text-sm font-bold tracking-tight text-white leading-none">
                  IDEMO Studio
                </span>
                <span className="font-mono text-[8.5px] uppercase tracking-widest text-[#C5A059] font-bold mt-1">
                  Ops Console
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto">
              <IdemoLogo className="h-6 w-auto" />
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer flex"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* User Role Banner */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-mono uppercase tracking-wider text-[#C5A059] font-bold truncate">
                {session.role}
              </p>
              <p className="text-xs font-sans font-semibold text-white/90 truncate">
                {session.name}
              </p>
            </div>
            <ShieldCheck size={16} className="text-[#C5A059] shrink-0" />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 mt-3">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FAF9F5] text-[#23251E] shadow-xs font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div className={isActive ? 'text-[#8A1F1F]' : 'text-[#C5A059]'}>
                  {getIcon(item.id)}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider ${
                        isActive ? 'bg-[#23251E] text-white' : 'bg-white/10 text-white/80'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 font-mono text-xs font-semibold transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Sign Out of Studio"
        >
          <LogOut size={16} className="text-[#8A1F1F]" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
