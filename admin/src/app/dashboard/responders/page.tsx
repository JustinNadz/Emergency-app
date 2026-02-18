'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Responder, City } from '@/types';

export default function RespondersPage() {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResponder, setEditingResponder] = useState<Responder | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'CDRRMO', phone: '', latitude: '', longitude: '', city_id: '', is_active: true });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [res1, res2] = await Promise.all([
        supabase.from('responders').select('*').order('name'),
        supabase.from('cities').select('*').order('name'),
      ]);
      setResponders(res1.data || []);
      setCities(res2.data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const filteredResponders = responders.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (r?: Responder) => {
    setEditingResponder(r || null);
    setFormData(r ? { name: r.name, type: r.type, phone: r.phone, latitude: r.latitude.toString(), longitude: r.longitude.toString(), city_id: r.city_id?.toString() || '', is_active: r.is_active } : { name: '', type: 'CDRRMO', phone: '', latitude: '', longitude: '', city_id: '', is_active: true });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: formData.name, type: formData.type, phone: formData.phone, latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude), city_id: formData.city_id ? parseInt(formData.city_id) : null, is_active: formData.is_active };
    if (editingResponder) await supabase.from('responders').update(data).eq('id', editingResponder.id);
    else await supabase.from('responders').insert(data);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this responder?')) return;
    await supabase.from('responders').delete().eq('id', id);
    fetchData();
  };

  const getTypeStyle = (type: string) => {
    const styles: Record<string, string> = {
      PNP: 'bg-blue-500', BFP: 'bg-orange-500', CDRRMO: 'bg-red-500', MDRRMO: 'bg-red-500', Barangay: 'bg-green-500'
    };
    return styles[type] || 'bg-slate-500';
  };

  return (
    <div className="h-full bg-[#111921] p-5 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-white">Responders</h1>
        <div className="flex gap-2">
          <button onClick={fetchData} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white rounded-lg">
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-sm text-white rounded-lg">
            <span className="material-symbols-outlined text-base">add</span>
            Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg mb-5">
        <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none w-full" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
      ) : filteredResponders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No responders found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResponders.map((r) => (
            <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${getTypeStyle(r.type)} rounded-lg flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-lg">
                      {r.type === 'PNP' ? 'local_police' : r.type === 'BFP' ? 'local_fire_department' : 'medical_services'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{r.name}</h3>
                    <span className="text-xs text-slate-400">{r.type}</span>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${r.is_active ? 'bg-green-500' : 'bg-slate-500'}`} />
              </div>
              <div className="text-xs text-slate-400 mb-3">
                <div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-sm">call</span>{r.phone}</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">location_on</span>{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button onClick={() => openModal(r)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded">Edit</button>
                <button onClick={() => handleDelete(r.id)} className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2631] rounded-xl border border-white/10 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-bold text-white">{editingResponder ? 'Edit' : 'Add'} Responder</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" required />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="CDRRMO" className="bg-[#1c2631]">CDRRMO</option>
                  <option value="MDRRMO" className="bg-[#1c2631]">MDRRMO</option>
                  <option value="PNP" className="bg-[#1c2631]">PNP</option>
                  <option value="BFP" className="bg-[#1c2631]">BFP</option>
                  <option value="Barangay" className="bg-[#1c2631]">Barangay</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Latitude</label>
                  <input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Longitude</label>
                  <input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">City</label>
                <select value={formData.city_id} onChange={(e) => setFormData({ ...formData, city_id: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="" className="bg-[#1c2631]">Select...</option>
                  {cities.map((c) => <option key={c.id} value={c.id} className="bg-[#1c2631]">{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" />
                <label htmlFor="active" className="text-sm text-slate-300">Active</label>
              </div>
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-white/5 text-white text-sm rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg">{editingResponder ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
