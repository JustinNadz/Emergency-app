// Location service - GPS and location tracking with maximum accuracy

import * as ExpoLocation from 'expo-location';
import { Location } from '../types';
import { GEOAPIFY_API_KEY } from '../config/map.config';

class LocationService {
    private hasPermission: boolean = false;

    async requestPermissions(): Promise<boolean> {
        try {
            // Request foreground permissions first
            const { status: foregroundStatus } = await ExpoLocation.requestForegroundPermissionsAsync();
            
            if (foregroundStatus !== 'granted') {
                console.log('❌ Foreground location permission denied');
                this.hasPermission = false;
                return false;
            }

            // Try to get background permissions for continuous tracking
            try {
                const { status: backgroundStatus } = await ExpoLocation.requestBackgroundPermissionsAsync();
                console.log('📍 Background permission:', backgroundStatus);
            } catch (e) {
                // Background permission may not be available on all platforms
                console.log('ℹ️ Background permission not available');
            }

            this.hasPermission = true;
            return true;
        } catch (error) {
            console.error('Error requesting location permissions:', error);
            return false;
        }
    }

    async getCurrentLocation(): Promise<Location | null> {
        if (!this.hasPermission) {
            const granted = await this.requestPermissions();
            if (!granted) return null;
        }

        try {
            // Check if GPS is enabled
            const isEnabled = await ExpoLocation.hasServicesEnabledAsync();
            if (!isEnabled) {
                console.log('⚠️ GPS services not enabled');
                return null;
            }

            // Get location with HIGHEST accuracy settings
            const location = await ExpoLocation.getCurrentPositionAsync({
                accuracy: ExpoLocation.Accuracy.BestForNavigation, // Highest accuracy (uses GPS + WiFi + Cell)
                timeInterval: 1000,  // Update every 1 second
                distanceInterval: 1, // Update every 1 meter change
            });

            console.log(`📍 Location: ${location.coords.latitude}, ${location.coords.longitude} (±${location.coords.accuracy?.toFixed(0)}m)`);

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || undefined,
                altitude: location.coords.altitude || undefined,
                heading: location.coords.heading || undefined,
                speed: location.coords.speed || undefined,
                timestamp: location.timestamp,
            };
        } catch (error) {
            console.error('Error getting location:', error);
            
            // Fallback: try with lower accuracy if high accuracy fails
            try {
                const fallbackLocation = await ExpoLocation.getLastKnownPositionAsync();
                if (fallbackLocation) {
                    console.log('📍 Using last known location');
                    return {
                        latitude: fallbackLocation.coords.latitude,
                        longitude: fallbackLocation.coords.longitude,
                        accuracy: fallbackLocation.coords.accuracy || undefined,
                        timestamp: fallbackLocation.timestamp,
                    };
                }
            } catch (e) {
                console.error('Fallback location also failed:', e);
            }
            
            return null;
        }
    }

    async getAddressFromLocation(location: Location): Promise<string> {
        try {
            // Use Geoapify Reverse Geocoding for detailed Philippine addresses (includes barangay)
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json&apiKey=${GEOAPIFY_API_KEY}`
            );
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    
                    // Geoapify provides detailed address components for Philippines
                    // suburb = barangay, city = municipality/city
                    const barangay = result.suburb || result.neighbourhood || result.district;
                    const city = result.city || result.county;
                    const province = result.state;
                    
                    // Build detailed address: "Pagatpatan, Butuan City" or "Brgy. Pagatpatan, Butuan City, Agusan del Norte"
                    const parts = [];
                    
                    if (barangay) {
                        // Check if it already has "Barangay" or "Brgy" prefix
                        if (!barangay.toLowerCase().includes('barangay') && !barangay.toLowerCase().includes('brgy')) {
                            parts.push(`Brgy. ${barangay}`);
                        } else {
                            parts.push(barangay);
                        }
                    }
                    
                    if (city) parts.push(city);
                    if (province && province !== city) parts.push(province);
                    
                    if (parts.length > 0) {
                        const address = parts.join(', ');
                        console.log(`📍 Address: ${address}`);
                        return address;
                    }
                    
                    // Fallback to formatted address from Geoapify
                    if (result.formatted) {
                        return result.formatted;
                    }
                }
            }
            
            // Fallback to Expo's reverse geocoding if Geoapify fails
            console.log('⚠️ Geoapify failed, using Expo fallback');
            return await this.getAddressFromExpo(location);
            
        } catch (error) {
            console.error('Error reverse geocoding with Geoapify:', error);
            return await this.getAddressFromExpo(location);
        }
    }

    /**
     * Fallback address lookup using Expo
     */
    private async getAddressFromExpo(location: Location): Promise<string> {
        try {
            const addresses = await ExpoLocation.reverseGeocodeAsync({
                latitude: location.latitude,
                longitude: location.longitude,
            });

            if (addresses && addresses.length > 0) {
                const addr = addresses[0];
                const parts = [
                    addr.district,
                    addr.city || addr.subregion,
                    addr.region,
                ].filter(Boolean);
                
                return parts.length > 0 ? parts.join(', ') : 'Unknown location';
            }
            return 'Unknown location';
        } catch (error) {
            console.error('Expo reverse geocoding failed:', error);
            return 'Unknown location';
        }
    }

    /**
     * Check if GPS/location services are enabled on device
     */
    async isGpsEnabled(): Promise<boolean> {
        try {
            return await ExpoLocation.hasServicesEnabledAsync();
        } catch {
            return false;
        }
    }

    /**
     * Get provider status (GPS, WiFi, Network)
     */
    async getProviderStatus(): Promise<ExpoLocation.LocationProviderStatus | null> {
        try {
            return await ExpoLocation.getProviderStatusAsync();
        } catch {
            return null;
        }
    }
}

export default new LocationService();
