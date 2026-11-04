import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  AlertOctagon, 
  SearchCheck, 
  Satellite, 
  BarChart3, 
  Sparkles, 
  FileCheck2, 
  Settings2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeIncidentsCount: number;
  unresolvedReportsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  activeIncidentsCount,
  unresolvedReportsCount
}) => {
  const navItems: {
    id: ViewMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    badgeText?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Operations Overview',
      icon: LayoutDashboard,
      badgeText: 'OPS'
    },
    {
      id: 'map',
      label: 'Satellite Monitoring Map',
      icon: Map,
      badgeText: 'LIVE'
    },
    {
      id: 'incidents',
      label: 'Deforestation Incidents',
      icon: AlertOctagon,
      badge: activeIncidentsCount,
      badgeColor: 'bg-[#EF4444] text-white'
    },
    {
      id: 'investigation',
      label: 'Investigation Details',
      icon: SearchCheck
    },
    {
      id: 'satellites',
      label: 'Satellite Data Sources',
      icon: Satellite,
      badgeText: '6 ORBITS'
    },
    {
      id: 'analytics',
      label: 'Forest Analytics',
      icon: BarChart3
    },
    {
      id: 'assistant',
      label: 'AI Investigation Assistant',
      icon: Sparkles,
      badgeText: 'GENAI'
    },
    {
      id: 'reports',
      label: 'Evidence Reports',
      icon: FileCheck2,
      badge: unresolvedReportsCount,
      badgeColor: 'bg-[#06B6D4] text-black'
    },
    {
      id: 'settings',
      label: 'Monitoring Settings',
      icon: Settings2
    }
  ];

  return (
    <aside
      className={`relative z-40 flex flex-col bg-[#0D1612] border-r border-white/8 transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-80'
      }`}
    >
      {/* Top Collapse toggle button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#080E0B]/60">
        {!collapsed && (
          <span className="font-mono text-[10px] text-white/40 tracking-wider uppercase font-semibold">
            NAVIGATION DOCK
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-sm transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav Items List */}
      <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-3 py-2.5 text-xs font-mono transition-all text-left relative group ${
                isActive
                  ? 'bg-[#14201A] text-white border-l-2 border-[#10B981]'
                  : 'text-white/60 hover:text-white hover:bg-[#14201A]/60 border-l-2 border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#10B981]' : 'text-white/50 group-hover:text-white/80'
                  }`}
                />
              </div>

              {!collapsed && (
                <div className="ml-3 flex-1 flex items-center justify-between min-w-0">
                  <span className={`truncate text-xs ${isActive ? 'font-semibold text-white' : ''}`}>
                    {item.label}
                  </span>

                  {item.badge !== undefined && (typeof item.badge === 'number' ? item.badge > 0 : Boolean(item.badge)) && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-sm text-[10px] font-bold shrink-0 ${
                        item.badgeColor || 'bg-[#10B981] text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.badgeText && !item.badge && (
                    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-sm bg-white/5 text-white/50 border border-white/10 font-semibold shrink-0 whitespace-nowrap">
                      {item.badgeText}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip on collapsed hover */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#14201A] text-white text-xs font-mono rounded-sm border border-white/10 shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                  {item.badge !== undefined && (typeof item.badge === 'number' ? item.badge > 0 : Boolean(item.badge)) && (
                    <span className="ml-2 px-1 py-0.2 bg-red-500 rounded text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Telemetry Health Status Panel */}
      <div className="p-3 border-t border-white/8 bg-[#080E0B]/80 font-mono text-xs">
        {collapsed ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" title="Constellation Online"></span>
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          </div>
        ) : (
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between text-white/50">
              <span className="flex items-center space-x-1">
                <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
                <span>SAR INGEST PIPELINE</span>
              </span>
              <span className="text-[#10B981] font-bold">100% NOMINAL</span>
            </div>
            <div className="flex items-center justify-between text-white/40">
              <span>ORBITAL REVISIT:</span>
              <span className="text-white/70">12 MIN AVG</span>
            </div>
            <div className="flex items-center justify-between text-white/40">
              <span>CLOUD PENETRATION:</span>
              <span className="text-[#06B6D4]">SENTINEL-1C C-SAR</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
