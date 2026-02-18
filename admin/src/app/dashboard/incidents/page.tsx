'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GEOCODING_URL } from '@/lib/map.config';
import { Incident } from '@/types';

type StatusFilter = 'all' | 'reported' | 'acknowledged' | 'dispatched' | 'resolved' | 'cancelled';

async function getAddressFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`${GEOCODING_URL}&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      const barangay = props.suburb || props.neighbourhood || '';
      const city = props.city || props.town || '';
      return barangay ? `${barangay}, ${city}` : props.formatted || 'Unknown';
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [addresses, setAddresses] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    fetchIncidents();
    const channel = supabase
      .channel('incidents-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchIncidents())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { filterIncidents(); }, [incidents, searchQuery, statusFilter]);

  useEffect(() => {
    incidents.forEach(async (incident) => {
      if (!addresses[incident.id]) {
        const address = await getAddressFromCoords(incident.latitude, incident.longitude);
        setAddresses((prev) => ({ ...prev, [incident.id]: address }));
      }
    });
  }, [incidents]);

  const fetchIncidents = async () => {
    try {
      const { data } = await supabase.from('incidents').select('*').order('reported_at', { ascending: false });
      setIncidents(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterIncidents = () => {
    let filtered = [...incidents];
    if (statusFilter !== 'all') filtered = filtered.filter((i) => i.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((i) => i.id.toString().includes(q) || addresses[i.id]?.toLowerCase().includes(q));
    }
    setFilteredIncidents(filtered);
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'acknowledged') updates.acknowledged_at = new Date().toISOString();
    if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString();
    await supabase.from('incidents').update(updates).eq('id', id);
    setSelectedIncident(null);
    fetchIncidents();
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      reported: 'bg-red-500/20 text-red-400',
      acknowledged: 'bg-yellow-500/20 text-yellow-400',
      dispatched: 'bg-blue-500/20 text-blue-400',
      resolved: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-slate-500/20 text-slate-400',
    };
    return styles[status] || styles.cancelled;
  };

  return (
    <div className="h-full bg-[#111921] p-5 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-white">Incidents</h1>
        <button onClick={fetchIncidents} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white rounded-lg">
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
          <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 bg-white/5 border border-white/10 text-sm text-white rounded-lg focus:outline-none"
        >
          <option value="all" className="bg-[#1c2631]">All</option>
          <option value="reported" className="bg-[#1c2631]">Reported</option>
          <option value="acknowledged" className="bg-[#1c2631]">Acknowledged</option>
          <option value="dispatched" className="bg-[#1c2631]">Dispatched</option>
          <option value="resolved" className="bg-[#1c2631]">Resolved</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No incidents found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Location</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Time</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">#{incident.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(incident.status)}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{addresses[incident.id] || 'Loading...'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(incident.reported_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedIncident(incident)} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2631] rounded-xl border border-white/10 w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-bold text-white">Incident #{selectedIncident.id}</h3>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(selectedIncident.status)}`}>
                  {selectedIncident.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Location</p>
                <p className="text-white text-sm">{addresses[selectedIncident.id] || 'Loading...'}</p>
                <p className="text-slate-500 text-xs">{selectedIncident.latitude.toFixed(5)}, {selectedIncident.longitude.toFixed(5)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                {selectedIncident.status === 'reported' && (
                  <button onClick={() => updateStatus(selectedIncident.id, 'acknowledged')} className="py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg">Acknowledge</button>
                )}
                {(selectedIncident.status === 'reported' || selectedIncident.status === 'acknowledged') && (
                  <button onClick={() => updateStatus(selectedIncident.id, 'dispatched')} className="py-2 bg-blue-500 text-white text-sm font-medium rounded-lg">Dispatch</button>
                )}
                {selectedIncident.status !== 'resolved' && selectedIncident.status !== 'cancelled' && (
                  <button onClick={() => updateStatus(selectedIncident.id, 'resolved')} className="py-2 bg-green-500 text-white text-sm font-medium rounded-lg">Resolve</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
