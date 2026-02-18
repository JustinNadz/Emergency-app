// App Context - Global state management with real-time GPS tracking

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import * as ExpoLocation from 'expo-location';
import networkService from '../services/networkService';
import locationService from '../services/locationService';
import offlineQueueService from '../services/offlineQueueService';
import emergencyApiService from '../services/emergencyApiService';
import databaseService from '../services/databaseService';
import smsService from '../services/smsService';
import { Location } from '../types';

interface AppContextType {
    // Connection status
    isOnline: boolean;
    isGpsActive: boolean;
    isSmsAvailable: boolean;
    isLocationUpdating: boolean;
    
    // Location
    currentLocation: Location | null;
    currentAddress: string;
    locationAccuracy: number | null;
    
    // Emergency state
    isEmergencyActive: boolean;
    currentIncidentId: number | null;
    
    // Offline queue
    pendingOperations: number;
    
    // Actions
    refreshLocation: () => Promise<void>;
    startEmergency: () => Promise<{ success: boolean; incidentId?: number; nearestResponder?: any }>;
    endEmergency: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    // Connection status
    const [isOnline, setIsOnline] = useState(false);
    const [isGpsActive, setIsGpsActive] = useState(false);
    const [isSmsAvailable, setIsSmsAvailable] = useState(false);
    const [isLocationUpdating, setIsLocationUpdating] = useState(false);
    
    // Location
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [currentAddress, setCurrentAddress] = useState('Detecting location...');
    const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
    
    // Emergency state
    const [isEmergencyActive, setIsEmergencyActive] = useState(false);
    const [currentIncidentId, setCurrentIncidentId] = useState<number | null>(null);
    
    // Offline queue
    const [pendingOperations, setPendingOperations] = useState(0);

    // Location watcher subscription ref
    const locationSubscription = useRef<ExpoLocation.LocationSubscription | null>(null);
    const lastAddressUpdate = useRef<number>(0);

    // Initialize services
    useEffect(() => {
        initializeServices();
        
        return () => {
            // Cleanup location watcher on unmount
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
            networkService.destroy();
        };
    }, []);

    const initializeServices = async () => {
        try {
            // Initialize database
            await databaseService.init();
            
            // Initialize network monitoring
            await networkService.init();
            setIsOnline(networkService.getStatus());
            
            networkService.addListener((connected) => {
                setIsOnline(connected);
                // Sync offline queue when back online
                if (connected) {
                    offlineQueueService.processQueue().then(() => {
                        setPendingOperations(offlineQueueService.getQueueSize());
                    });
                }
            });
            
            // Initialize offline queue
            await offlineQueueService.init();
            setPendingOperations(offlineQueueService.getQueueSize());
            
            // Initialize API service
            await emergencyApiService.init();
            
            // Initialize SMS service for offline emergencies
            await smsService.init();
            const smsAvailable = await smsService.isAvailable();
            setIsSmsAvailable(smsAvailable);
            console.log('📱 SMS available:', smsAvailable);
            
            // Request location permissions and get initial location
            await initializeLocation();
            
            console.log('✅ All services initialized');
        } catch (error) {
            console.error('Failed to initialize services:', error);
        }
    };

    const initializeLocation = async () => {
        const hasPermission = await locationService.requestPermissions();
        
        if (hasPermission) {
            // Check if GPS is enabled
            const gpsEnabled = await locationService.isGpsEnabled();
            if (!gpsEnabled) {
                setIsGpsActive(false);
                setCurrentAddress('Please enable GPS');
                return;
            }
            
            setIsGpsActive(true);
            await refreshLocation();
            
            // Start continuous real-time location updates
            startLocationUpdates();
        } else {
            setIsGpsActive(false);
            setCurrentAddress('Location permission denied');
        }
    };

    const startLocationUpdates = async () => {
        try {
            // Remove existing subscription if any
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }

            // Start real-time location tracking with highest accuracy
            locationSubscription.current = await ExpoLocation.watchPositionAsync(
                {
                    accuracy: ExpoLocation.Accuracy.BestForNavigation, // Highest: GPS + WiFi + Cell
                    timeInterval: 1000,   // Update every 1 second (real-time)
                    distanceInterval: 1,  // Or every 1 meter movement (very sensitive)
                    mayShowUserSettingsDialog: true, // Prompt user to enable GPS if off
                },
                async (location) => {
                    setIsLocationUpdating(true);
                    
                    const newLocation: Location = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy || undefined,
                        altitude: location.coords.altitude || undefined,
                        heading: location.coords.heading || undefined,
                        speed: location.coords.speed || undefined,
                        timestamp: location.timestamp,
                    };
                    
                    // Always update coordinates immediately (real-time)
                    setCurrentLocation(newLocation);
                    setLocationAccuracy(location.coords.accuracy || null);
                    setIsGpsActive(true);
                    
                    // Update address every 2 seconds to avoid too many API calls
                    const now = Date.now();
                    if (now - lastAddressUpdate.current > 2000) {
                        lastAddressUpdate.current = now;
                        const address = await locationService.getAddressFromLocation(newLocation);
                        setCurrentAddress(address);
                    }
                    
                    setIsLocationUpdating(false);
                    
                    console.log(`📍 Real-time: ${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)} (±${newLocation.accuracy?.toFixed(0)}m)`);
                }
            );
            
            console.log('🛰️ Real-time GPS tracking started');
        } catch (error) {
            console.error('Location watch error:', error);
            setIsGpsActive(false);
            setCurrentAddress('GPS error - please restart app');
        }
    };

    const refreshLocation = useCallback(async () => {
        setIsLocationUpdating(true);
        const location = await locationService.getCurrentLocation();
        
        if (location) {
            setCurrentLocation(location);
            setLocationAccuracy(location.accuracy || null);
            setIsGpsActive(true);
            
            const address = await locationService.getAddressFromLocation(location);
            setCurrentAddress(address);
        } else {
            setIsGpsActive(false);
        }
        setIsLocationUpdating(false);
    }, []);

    const startEmergency = useCallback(async () => {
        if (!currentLocation) {
            return { success: false, message: 'No location available' };
        }

        try {
            // If ONLINE: Use Supabase API
            if (isOnline) {
                const response = await emergencyApiService.reportEmergency(currentLocation);
                
                if (response.success) {
                    setIsEmergencyActive(true);
                    if (response.incidentId) {
                        setCurrentIncidentId(response.incidentId);
                        
                        // Subscribe to Supabase real-time updates
                        emergencyApiService.subscribeToIncident(response.incidentId, (incident) => {
                            console.log('📡 Incident update:', incident.status);
                        });
                    }
                    
                    return {
                        success: true,
                        incidentId: response.incidentId,
                        nearestResponder: response.nearestResponder,
                        mode: 'online',
                    };
                }
            }
            
            // If OFFLINE: Use SMS with cellular signal
            console.log('📴 Offline mode - attempting SMS emergency');
            
            const smsResult = await smsService.sendEmergencySMS(currentLocation, currentAddress);
            
            if (smsResult.success) {
                setIsEmergencyActive(true);
                
                // Also queue for later sync when online
                await offlineQueueService.enqueue('emergency_report', {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    timestamp: Date.now(),
                    sentViaSMS: true,
                });
                setPendingOperations(offlineQueueService.getQueueSize());
                
                return {
                    success: true,
                    message: smsResult.message,
                    contactsNotified: smsResult.contactsNotified,
                    mode: 'sms',
                };
            }
            
            return { 
                success: false, 
                message: 'No internet and SMS failed. Please call emergency services directly.',
            };
            
        } catch (error) {
            console.error('Start emergency error:', error);
            return { success: false, message: 'Emergency report failed' };
        }
    }, [currentLocation, currentAddress, isOnline]);

    const endEmergency = useCallback(async () => {
        try {
            if (currentIncidentId) {
                await emergencyApiService.resolveIncident(currentIncidentId);
            }
            
            setIsEmergencyActive(false);
            setCurrentIncidentId(null);
            
            return true;
        } catch (error) {
            console.error('End emergency error:', error);
            return false;
        }
    }, [currentIncidentId]);

    const value: AppContextType = {
        isOnline,
        isGpsActive,
        isSmsAvailable,
        isLocationUpdating,
        currentLocation,
        currentAddress,
        locationAccuracy,
        isEmergencyActive,
        currentIncidentId,
        pendingOperations,
        refreshLocation,
        startEmergency,
        endEmergency,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp(): AppContextType {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}

export default AppContext;
