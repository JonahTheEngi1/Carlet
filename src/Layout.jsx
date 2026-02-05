import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Settings, LogOut, Menu, X, Car
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const isAdmin = user?.is_platform_admin || user?.role === 'admin';
  const showNav = !['CarDetail'].includes(currentPageName);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    ...(isAdmin ? [{ name: 'Admin', icon: Settings, page: 'Admin' }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --color-primary: #f59e0b;
          --color-primary-hover: #d97706;
        }
        
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {showNav && (
        <>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-4 left-4 z-50 lg:hidden w-12 h-12 bg-amber-500 text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Mobile Sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 lg:hidden transform transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-800">Carlet</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <nav className="p-4 space-y-1">
              {navItems.map(item => (
                <Link 
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    currentPageName === item.page 
                      ? "bg-amber-50 text-amber-700" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-700 w-full"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Desktop Bottom Nav */}
          <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 px-2 py-2 flex items-center gap-1">
              <div className="flex items-center gap-2 px-3 pr-4 border-r border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-800 text-sm">Carlet</span>
              </div>
              
              {navItems.map(item => (
                <Link 
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
                    currentPageName === item.page 
                      ? "bg-amber-500 text-white" 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              
              <button
                onClick={() => base44.auth.logout()}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {children}
    </div>
  );
}