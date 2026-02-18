// Emergency API Service - Direct Supabase connection (no backend needed)

import { supabase, SupabaseIncident, SupabaseResponder, SupabaseCity } from '../lib/supabase';
import networkService from './networkService';
import offlineQueueService from './offlineQueueService';
import { Location, Incident } from '../types';

interface ReportEmergencyResponse {
    success: boolean;
    incidentId?: number;
    nearestResponder?: {
        id: number;
        name: string;
        type: string;
        phone: string;
        latitude: number;
        longitude: number;
        estimatedArrival: number;
    };
    message?: string;
    offline?: boolean;
}

interface NearbyResponder {
    id: number;
    name: string;
    type: string;
    phone: string;
    latitude: number;
    longitude: number;
    distance: number;
    estimatedArrival: number;
}

class EmergencyApiService {
    /**
     * Initialize service and register sync handlers
     */
    async init(): Promise<void> {
        // Register offline queue handlers
        offlineQueueService.registerSyncHandler('emergency_report', this.syncEmergencyReport.bind(this));
        offlineQueueService.registerSyncHandler('incident_resolve', this.syncIncidentResolve.bind(this));
    }

    /**
     * Report emergency - Supabase direct with offline queue fallback
     */
    async reportEmergency(location: Location, cityId?: number): Promise<ReportEmergencyResponse> {
        const isOnline = networkService.getStatus();

        if (isOnline) {
            // Direct Supabase connection
            try {
                const response = await this.reportViaSupabase(location, cityId);
                if (response.success) return response;
            } catch (error) {
                console.log('Supabase failed, queuing offline...', error);
            }
        }

        // Queue for offline processing
        await offlineQueueService.enqueue('emergency_report', {
            latitude: location.latitude,
            longitude: location.longitude,
            cityId,
            timestamp: Date.now(),
        });

        return {
            success: true,
            offline: true,
            message: 'Emergency queued for sync when online',
        };
    }

    /**
     * Report via Supabase directly
     */
    private async reportViaSupabase(location: Location, cityId?: number): Promise<ReportEmergencyResponse> {
        // Create incident
        const { data: incident, error: incidentError } = await supabase
            .from('incidents')
            .insert({
                latitude: location.latitude,
                longitude: location.longitude,
                city_id: cityId || null,
                status: 'reported',
                reported_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (incidentError) throw incidentError;

        // Find nearest responder
        const nearestResponder = await this.findNearestResponder(location, cityId);

        // Update incident with notified responders
        if (nearestResponder) {
            await supabase
                .from('incidents')
                .update({
                    responders_notified: [nearestResponder.id],
                    status: 'responding',
                })
                .eq('id', incident.id);
        }

        return {
            success: true,
            incidentId: incident.id,
            nearestResponder: nearestResponder ? {
                ...nearestResponder,
                estimatedArrival: this.calculateETA(nearestResponder.distance),
            } : undefined,
        };
    }

    /**
     * Find nearest available responder
     */
    async findNearestResponder(location: Location, cityId?: number): Promise<NearbyResponder | null> {
        try {
            let query = supabase
                .from('responders')
                .select('*')
                .eq('is_available', true);

            if (cityId) {
                query = query.eq('city_id', cityId);
            }

            const { data: responders, error } = await query;

            if (error || !responders?.length) return null;

            // Calculate distances and sort
            const withDistances = responders.map(r => ({
                ...r,
                distance: this.calculateDistance(
                    location.latitude,
                    location.longitude,
                    r.latitude,
                    r.longitude
                ),
            }));

            withDistances.sort((a, b) => a.distance - b.distance);

            const nearest = withDistances[0];
            return {
                id: nearest.id,
                name: nearest.name,
                type: nearest.type,
                phone: nearest.phone,
                latitude: nearest.latitude,
                longitude: nearest.longitude,
                distance: nearest.distance,
                estimatedArrival: this.calculateETA(nearest.distance),
            };
        } catch (error) {
            console.error('Find nearest responder error:', error);
            return null;
        }
    }

    /**
     * Get all nearby responders
     */
    async getNearbyResponders(location: Location, radiusKm: number = 10): Promise<NearbyResponder[]> {
        try {
            const { data: responders, error } = await supabase
                .from('responders')
                .select('*')
                .eq('is_available', true);

            if (error || !responders) return [];

            return responders
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    phone: r.phone,
                    latitude: r.latitude,
                    longitude: r.longitude,
                    distance: this.calculateDistance(
                        location.latitude,
                        location.longitude,
                        r.latitude,
                        r.longitude
                    ),
                    estimatedArrival: 0,
                }))
                .filter(r => r.distance <= radiusKm)
                .map(r => ({ ...r, estimatedArrival: this.calculateETA(r.distance) }))
                .sort((a, b) => a.distance - b.distance);
        } catch (error) {
            console.error('Get nearby responders error:', error);
            return [];
        }
    }

    /**
     * Get incident status
     */
    async getIncidentStatus(incidentId: number): Promise<SupabaseIncident | null> {
        try {
            const { data, error } = await supabase
                .from('incidents')
                .select('*')
                .eq('id', incidentId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get incident status error:', error);
            return null;
        }
    }

    /**
     * Resolve/end incident
     */
    async resolveIncident(incidentId: number): Promise<boolean> {
        const isOnline = networkService.getStatus();

        if (!isOnline) {
            await offlineQueueService.enqueue('incident_resolve', { incidentId });
            return true;
        }

        try {
            const { error } = await supabase
                .from('incidents')
                .update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString(),
                })
                .eq('id', incidentId);

            return !error;
        } catch (error) {
            console.error('Resolve incident error:', error);
            return false;
        }
    }

    /**
     * Get cities for location
     */
    async getCities(): Promise<SupabaseCity[]> {
        try {
            const { data, error } = await supabase
                .from('cities')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get cities error:', error);
            return [];
        }
    }

    /**
     * Subscribe to incident updates (real-time)
     */
    subscribeToIncident(incidentId: number, callback: (incident: SupabaseIncident) => void): () => void {
        const subscription = supabase
            .channel(`incident-${incidentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'incidents',
                    filter: `id=eq.${incidentId}`,
                },
                (payload) => {
                    callback(payload.new as SupabaseIncident);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }

    /**
     * Sync emergency report (offline queue handler)
     */
    private async syncEmergencyReport(data: any): Promise<boolean> {
        try {
            const response = await this.reportViaSupabase(
                { latitude: data.latitude, longitude: data.longitude },
                data.cityId
            );
            return response.success;
        } catch {
            return false;
        }
    }

    /**
     * Sync incident resolve (offline queue handler)
     */
    private async syncIncidentResolve(data: any): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('incidents')
                .update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString(),
                })
                .eq('id', data.incidentId);

            return !error;
        } catch {
            return false;
        }
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Calculate ETA based on distance (assuming ~30km/h avg speed in city)
     */
    private calculateETA(distanceKm: number): number {
        const avgSpeedKmH = 30;
        const etaMinutes = Math.ceil((distanceKm / avgSpeedKmH) * 60);
        return Math.max(etaMinutes, 1); // Minimum 1 minute
    }
}

export default new EmergencyApiService();
