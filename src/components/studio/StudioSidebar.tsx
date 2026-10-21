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
  X
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
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const NAV_ITEMS: StudioNavSection[] = [
  { id: 'dashboard', label: 'Dashboard', iconName: 'LayoutDashboard' },
  { id: 'destinations', label: 'Destinations (Regional packages)', iconName: 'MapPin', badge: '5 Active' },
  { id: 'recommendations', label: 'Destinations (Curated spots)', iconName: 'Compass', badge: '113 Spots' },
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
  onToggleCollapse,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer
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

  const handleSelectSection = (tab: StudioTab) => {
    onSelectTab(tab);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const handleSignOut = () => {
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
    onLogout();
  };

  const renderSidebarContent = (mode: 'mobile' | 'desktop') => {
    const collapsed = mode === 'desktop' && isCollapsed;

    return (
      <>
        {/* Top Header (Fixed/Non-scrolling) */}
        <div className="shrink-0">
          <div
            className={`border-b border-white/10 flex items-center ${
              collapsed ? 'p-2 justify-center' : 'px-4 py-3 justify-between'
            }`}
          >
            {!collapsed && (
              <div className="flex items-center gap-2.5 min-w-0">
                <IdemoLogo className="h-6 w-auto shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-sm font-bold tracking-tight text-white leading-none truncate">
                    IDEMO Studio
                  </span>
                  <span className="font-mono text-[8.5px] uppercase tracking-widest text-[#C5A059] font-bold mt-1 truncate">
                    Ops Console
                  </span>
                </div>
              </div>
            )}

            {mode === 'desktop' ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!collapsed}
                title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                aria-label="Close navigation menu"
                title="Close Menu"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* User Role Banner */}
          {!collapsed && (
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
        </div>

        {/* Independently Vertically Scrollable Navigation Items */}
        <nav
          aria-label={mode === 'mobile' ? 'Studio mobile navigation' : 'Studio desktop navigation'}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1 mt-2"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FAF9F5] text-[#23251E] shadow-xs font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/15'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <div className={`shrink-0 ${isActive ? 'text-[#8A1F1F]' : 'text-[#C5A059]'}`}>
                  {getIcon(item.id)}
                </div>

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between gap-2 min-w-0 text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider shrink-0 ${
                          isActive ? 'bg-[#23251E] text-white' : 'bg-white/10 text-white/80'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Sign Out (Pinned, Always Reachable) */}
        <div
          className={`shrink-0 p-3 border-t border-white/10 ${
            mode === 'mobile' ? 'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]' : ''
          }`}
        >
          <button
            type="button"
            onClick={handleSignOut}
            className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:bg-white/15 font-mono text-xs font-semibold transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title="Sign Out of Studio"
          >
            <LogOut size={16} className="text-[#8A1F1F] shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Mobile Overlay Backdrop & Drawer (< 768px) — Never shrinks or shifts workspace */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />
          <aside
            id="studio-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="IDEMO Studio Navigation"
            className="relative z-10 w-[min(85vw,300px)] max-w-full h-full max-h-dvh bg-[#23251E] text-white flex flex-col justify-between border-r border-[#32352B] shadow-2xl overflow-hidden pt-[env(safe-area-inset-top,0px)]"
          >
            {renderSidebarContent('mobile')}
          </aside>
        </div>
      )}

      {/* Desktop Inline Collapsible Sidebar (>= 768px) */}
      <aside
        className={`hidden md:flex bg-[#23251E] text-white flex-col justify-between border-r border-[#32352B] transition-all duration-300 relative shrink-0 h-full min-h-0 overflow-hidden ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderSidebarContent('desktop')}
      </aside>
    </>
  );
}

