// Home Screen - Main SOS screen with dark map

import React from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    Alert,
    TouchableOpacity,
    Linking,
} from 'react-native';
import GeoapifyMap from '../components/GeoapifyMap';
import SOSButton from '../components/SOSButton';
import StatusBadge from '../components/StatusBadge';
import LocationCard from '../components/LocationCard';
import { useApp } from '../contexts/AppContext';
import { Location } from '../types';

interface HomeScreenProps {
    onEmergencyActivate: (location: Location, address: string, nearestResponder?: any) => void;
}

export default function HomeScreen({ onEmergencyActivate }: HomeScreenProps) {
    const { 
        currentLocation, 
        currentAddress, 
        isGpsActive, 
        isOnline,
        isSmsAvailable,
        isLocationUpdating,
        locationAccuracy,
        refreshLocation,
        startEmergency,
    } = useApp();

    const handleSOSActivate = async () => {
        if (!currentLocation) {
            Alert.alert('Error', 'Could not get your location. Please enable GPS.');
            return;
        }

        const result = await startEmergency();
        
        if (result.success) {
            // Check if emergency was sent via SMS (offline mode)
            if ((result as any).mode === 'sms') {
                Alert.alert(
                    '📱 SMS Emergency Sent',
                    `Your emergency alert with location has been sent via SMS to:\n\n${(result as any).contactsNotified?.join('\n') || 'Emergency contacts'}`,
                    [{ text: 'OK', onPress: () => onEmergencyActivate(currentLocation, currentAddress, null) }]
                );
            } else {
                onEmergencyActivate(currentLocation, currentAddress, result.nearestResponder);
            }
        } else {
            Alert.alert(
                'Emergency Alert Failed', 
                (result as any).message || 'Failed to report emergency. Please call emergency services directly.',
                [
                    { text: 'Call 911', onPress: () => Linking.openURL('tel:911') },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
        }
    };

    // Get network status label
    const getNetworkLabel = () => {
        if (isOnline) return "ONLINE";
        if (isSmsAvailable) return "SMS READY";
        return "OFFLINE";
    };

    // Get network badge variant
    const isNetworkActive = isOnline || isSmsAvailable;

    const handleSettingsPress = () => {
        Alert.alert(
            'Settings',
            'Configure your emergency preferences',
            [
                { text: 'Emergency Contacts', onPress: () => console.log('Open contacts') },
                { text: 'Notification Settings', onPress: () => console.log('Open notifications') },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleInfoPress = () => {
        Alert.alert(
            'Location Info',
            `Latitude: ${currentLocation?.latitude.toFixed(6) || 'N/A'}\nLongitude: ${currentLocation?.longitude.toFixed(6) || 'N/A'}\nAccuracy: ${currentLocation?.accuracy?.toFixed(0) || 'N/A'}m`,
            [
                { 
                    text: 'Open in Maps', 
                    onPress: () => {
                        if (currentLocation) {
                            const url = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
                            Linking.openURL(url);
                        }
                    } 
                },
                { text: 'Refresh', onPress: refreshLocation },
                { text: 'Close', style: 'cancel' },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Map Background */}
            <View style={styles.mapBackground} pointerEvents="none">
                {currentLocation ? (
                    <GeoapifyMap
                        latitude={currentLocation.latitude}
                        longitude={currentLocation.longitude}
                        zoom={16}
                        theme="dark"
                        showMarker={false}
                    />
                ) : (
                    <View style={styles.mapPlaceholder} />
                )}

                {/* Dark overlay for better contrast */}
                <View style={styles.mapOverlay} pointerEvents="none" />
            </View>

            {/* Content */}
            <SafeAreaView style={styles.content}>
                {/* Status Badges */}
                <View style={styles.header}>
                    <View style={styles.badges}>
                        <TouchableOpacity onPress={refreshLocation} activeOpacity={0.7}>
                            <StatusBadge 
                                icon="📍" 
                                label={isGpsActive ? "GPS: ACTIVE" : "GPS: OFF"}
                                variant="dark"
                                isActive={isGpsActive}
                            />
                        </TouchableOpacity>
                        <StatusBadge 
                            icon="📶" 
                            label={getNetworkLabel()}
                            variant="dark"
                            isActive={isNetworkActive}
                        />
                    </View>
                </View>

                {/* SOS Button - Centered */}
                <View style={styles.sosContainer}>
                    <SOSButton 
                        onActivate={handleSOSActivate}
                        disabled={!currentLocation}
                    />
                </View>

                {/* Bottom Location Card */}
                <LocationCard 
                    address={currentAddress}
                    accuracy={locationAccuracy}
                    isUpdating={isLocationUpdating}
                    coordinates={currentLocation}
                    onSettingsPress={handleSettingsPress}
                    onInfoPress={handleInfoPress}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    mapBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    mapPlaceholder: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    badges: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
    },
    sosContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
