'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GEOCODING_URL } from '@/lib/map.config';
import { Incident, Responder } from '@/types';

// Dynamic import for map (no SSR)
const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

// Reverse geocoding
async function getAddressFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`${GEOCODING_URL}&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      const area = props.suburb || props.neighbourhood || props.district || '';
      return area || props.city || 'Unknown';
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Priority types
type Priority = 'critical' | 'high' | 'standard' | 'other';

interface AlertItem {
  id: number;
  priority: Priority;
  title: string;
  description: string;
  timeAgo: string;
  latitude: number;
  longitude: number;
}

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
    
    // Real-time subscription for incidents
    const channel = supabase
      .channel('incidents-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'incidents' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch incidents
      const { data: incidentsData } = await supabase
        .from('incidents')
        .select('*')
        .order('reported_at', { ascending: false });

      // Fetch responders
      const { data: respondersData } = await supabase
        .from('responders')
        .select('*');

      const incidentsList = incidentsData || [];
      const respondersList = respondersData || [];

      // Filter active incidents
      const active = incidentsList.filter(
        (i) => i.status !== 'resolved' && i.status !== 'cancelled'
      );

      setIncidents(active);
      setResponders(respondersList);

      // Convert to alerts with addresses
      const alertsPromises = active.slice(0, 10).map(async (incident, index) => {
        const address = await getAddressFromCoords(incident.latitude, incident.longitude);
        const timeAgo = getTimeAgo(incident.reported_at);
        
        // Assign priority based on status
        let priority: Priority = 'standard';
        if (incident.status === 'reported') priority = index === 0 ? 'critical' : 'high';
        else if (incident.status === 'acknowledged') priority = 'high';
        else if (incident.status === 'dispatched') priority = 'standard';
        
        // Generate title based on priority
        const titles: Record<Priority, string[]> = {
          critical: ['Fire at Sector', 'Major Emergency', 'Critical Incident'],
          high: ['Medical at', 'Urgent Assistance', 'Priority Call'],
          standard: ['Traffic Control', 'Public Assist', 'Routine Call'],
          other: ['General Alert', 'Information', 'Notice'],
        };
        
        return {
          id: incident.id,
          priority,
          title: `${titles[priority][index % 3]} ${address}`,
          description: `Emergency reported. Unit dispatched to coordinates ${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}.`,
          timeAgo,
          latitude: incident.latitude,
          longitude: incident.longitude,
        };
      });

      const alertsData = await Promise.all(alertsPromises);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getPriorityConfig = (priority: Priority) => {
    switch (priority) {
      case 'critical':
        return { 
          bg: 'bg-[#ef4444]/10', 
          text: 'text-[#ef4444]', 
          border: 'border-[#ef4444]',
          label: 'CRITICAL' 
        };
      case 'high':
        return { 
          bg: 'bg-[#f59e0b]/10', 
          text: 'text-[#f59e0b]', 
          border: 'border-[#f59e0b]',
          label: 'HIGH PRIORITY' 
        };
      case 'standard':
        return { 
          bg: 'bg-[#197fe6]/10', 
          text: 'text-[#197fe6]', 
          border: 'border-[#197fe6]',
          label: 'STANDARD' 
        };
      default:
        return { 
          bg: 'bg-slate-500/10', 
          text: 'text-slate-500', 
          border: 'border-slate-500',
          label: 'OTHER' 
        };
    }
  };

  // Calculate unit stats based on responder type
  const fireUnits = responders.filter(r => r.type === 'BFP').length;
  const medicalUnits = responders.filter(r => r.type === 'CDRRMO' || r.type === 'MDRRMO').length;
  const policeUnits = responders.filter(r => r.type === 'PNP').length;
  const totalUnits = responders.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#111921]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#197fe6]"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map Background */}
      <div className="absolute inset-0 z-0 bg-slate-900 overflow-hidden">
        <LiveMap incidents={incidents} responders={responders} />
      </div>

      {/* Left Floating Controls: Search & Legend */}
      <div className="absolute left-5 top-5 z-30 flex flex-col gap-4 pointer-events-none">
        {/* Search Bar */}
        <div className="glass-panel w-72 rounded-xl border border-white/10 p-2.5 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg">
            <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm text-white placeholder:text-slate-500 focus:ring-0 focus:outline-none w-full" 
              placeholder="Search sectors, units, coords..."
            />
          </div>
        </div>

        {/* Legend Card */}
        <div className="glass-panel w-56 rounded-xl border border-white/10 p-5 shadow-2xl pointer-events-auto">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Incident Types</h3>
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#ef4444] flex-shrink-0"></div>
              <span className="text-sm font-medium text-slate-200">Critical (Fire)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b] flex-shrink-0"></div>
              <span className="text-sm font-medium text-slate-200">High (Medical)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#197fe6] flex-shrink-0"></div>
              <span className="text-sm font-medium text-slate-200">Standard (Police)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-500 flex-shrink-0"></div>
              <span className="text-sm font-medium text-slate-200">Other Alerts</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-white/10">
            <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">layers</span>
              Map Layers
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Live Alerts Feed */}
      <div className="absolute right-5 top-5 bottom-5 z-30 w-80 glass-panel rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">Live Alerts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time update stream</p>
          </div>
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        
        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {alerts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-500 text-sm">No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const config = getPriorityConfig(alert.priority);
              return (
                <div 
                  key={alert.id}
                  className={`bg-white/5 rounded-lg p-3.5 border-l-4 ${config.border} hover:bg-white/10 transition-colors cursor-pointer`}
                >
                  {/* Badge + Time */}
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${config.bg} ${config.text} px-2 py-1 rounded`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">{alert.timeAgo}</span>
                  </div>
                  {/* Title */}
                  <h4 className="text-sm font-bold text-white mb-1.5">{alert.title}</h4>
                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{alert.description}</p>
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-[#197fe6] hover:bg-[#197fe6]/90 rounded text-[10px] font-bold uppercase transition-all active:scale-95">
                      Focus
                    </button>
                    <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold uppercase transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer Button */}
        <div className="p-4 bg-[#111921]/80 border-t border-white/10">
          <button className="w-full py-3 bg-[#197fe6] hover:bg-[#197fe6]/90 rounded-lg font-bold text-sm shadow-lg shadow-[#197fe6]/20 transition-all flex items-center justify-center gap-2.5">
            <span className="material-symbols-outlined text-lg">add_alert</span>
            Create Manual Incident
          </button>
        </div>
      </div>

      {/* Bottom Left: Map Controls */}
      <div className="absolute bottom-5 left-5 z-30 flex flex-col gap-1.5">
        <button className="w-10 h-10 glass-panel rounded-lg border border-white/10 flex items-center justify-center text-white hover:bg-white/10 pointer-events-auto transition-colors">
          <span className="material-symbols-outlined text-xl">add</span>
        </button>
        <button className="w-10 h-10 glass-panel rounded-lg border border-white/10 flex items-center justify-center text-white hover:bg-white/10 pointer-events-auto transition-colors">
          <span className="material-symbols-outlined text-xl">remove</span>
        </button>
        <button className="w-10 h-10 glass-panel rounded-lg border border-white/10 flex items-center justify-center text-[#197fe6] hover:bg-white/10 pointer-events-auto mt-3 transition-colors">
          <span className="material-symbols-outlined text-xl">my_location</span>
        </button>
      </div>

      {/* Bottom Center: Active Units Bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-5 px-6 py-3.5 glass-panel rounded-full border border-white/10 shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-3 pr-5 border-r border-white/10">
          <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
          <span className="text-sm font-bold text-white whitespace-nowrap">{totalUnits || 48} Total Units</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-slate-400">local_fire_department</span>
            <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">{fireUnits || 12} Available</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-slate-400">medical_services</span>
            <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">{medicalUnits || 8} Available</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-slate-400">local_police</span>
            <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">{policeUnits || 15} Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
