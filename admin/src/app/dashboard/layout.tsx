'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navTabs = [
  { href: '/dashboard', label: 'Live Map' },
  { href: '/dashboard/incidents', label: 'Incidents' },
  { href: '/dashboard/responders', label: 'Responders' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIncidents, setActiveIncidents] = useState(12);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    if (isLoggedIn !== 'true') {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_email');
    router.push('/login');
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-[#111921]">
      {/* Header / Navigation Bar */}
      <header className="z-50 flex items-center justify-between border-b border-white/10 bg-[#111921]/95 backdrop-blur-sm px-6 h-14 flex-shrink-0">
        {/* Left Section: Logo + Nav */}
        <div className="flex items-center gap-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#197fe6]/10">
              <span className="material-symbols-outlined text-[#197fe6] text-xl">shield_with_heart</span>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight">ERS Mission Control</h2>
          </div>
          
          {/* Nav Tabs */}
          <nav className="flex items-center gap-8 h-full">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.href || 
                (tab.href === '/dashboard' && pathname === '/dashboard');
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`text-sm font-medium transition-colors h-full flex items-center border-b-2 ${
                    isActive 
                      ? 'text-white font-semibold border-[#197fe6]' 
                      : 'text-slate-400 hover:text-white border-transparent'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Right Section: Status + Actions */}
        <div className="flex items-center gap-4">
          {/* Active Incidents Badge */}
          <div className="hidden md:flex items-center gap-2.5 bg-slate-800/50 px-4 py-2 rounded-lg border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">{activeIncidents} Active Incidents</span>
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            
            {/* User Avatar */}
            <button 
              onClick={handleLogout}
              className="bg-[#197fe6]/20 p-0.5 rounded-full border border-[#197fe6]/50 hover:border-[#197fe6] transition-colors"
              title="Logout"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">person</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
