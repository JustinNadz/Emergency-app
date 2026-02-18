import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import ActiveEmergencyScreen from './src/screens/ActiveEmergencyScreen';
import { Location } from './src/types';

type AppState = 'home' | 'emergency';

interface EmergencyData {
    location: Location;
    address: string;
    nearestStation: {
        name: string;
        address: string;
        estimatedArrival: number;
        latitude: number;
        longitude: number;
    } | null;
}

function AppContent() {
    const [appState, setAppState] = useState<AppState>('home');
    const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);
    const { endEmergency } = useApp();

    const handleEmergencyActivate = async (location: Location, address: string, nearestResponder?: any) => {
        // Set emergency data
        setEmergencyData({
            location,
            address,
            nearestStation: nearestResponder ? {
                name: nearestResponder.name || 'NEAREST STATION',
                address: nearestResponder.address || address,
                estimatedArrival: nearestResponder.estimatedArrival || 4,
                latitude: nearestResponder.latitude || location.latitude + 0.008,
                longitude: nearestResponder.longitude || location.longitude + 0.005,
            } : {
                // Fallback mock data for demo
                name: 'LIBERTAD POLICE STATION',
                address: 'Libertad, Butuan City',
                estimatedArrival: 4,
                latitude: location.latitude + 0.008,
                longitude: location.longitude + 0.005,
            },
        });
        setAppState('emergency');
    };

    const handleEndCall = async () => {
        await endEmergency();
        setAppState('home');
        setEmergencyData(null);
    };

    return (
        <View style={styles.container}>
            <StatusBar style={appState === 'home' ? 'light' : 'dark'} />
            
            {appState === 'home' && (
                <HomeScreen onEmergencyActivate={handleEmergencyActivate} />
            )}

            {appState === 'emergency' && emergencyData && (
                <ActiveEmergencyScreen
                    userLocation={emergencyData.location}
                    userAddress={emergencyData.address}
                    nearestStation={emergencyData.nearestStation}
                    onEndCall={handleEndCall}
                />
            )}
        </View>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
