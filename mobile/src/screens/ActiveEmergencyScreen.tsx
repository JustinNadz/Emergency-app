// Active Emergency Screen - Shows when emergency is triggered

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Alert,
    Linking,
} from 'react-native';
import GeoapifyMap from '../components/GeoapifyMap';

interface ActiveEmergencyScreenProps {
    userLocation: { latitude: number; longitude: number };
    userAddress: string;
    nearestStation: {
        name: string;
        address: string;
        estimatedArrival: number;
        latitude: number;
        longitude: number;
        phone?: string;
    } | null;
    onEndCall: () => void;
}

export default function ActiveEmergencyScreen({
    userLocation,
    userAddress,
    nearestStation,
    onEndCall,
}: ActiveEmergencyScreenProps) {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isDetecting, setIsDetecting] = useState(true);
    const [mapZoom, setMapZoom] = useState(14);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Timer for elapsed time
        const timer = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        // Simulate detecting phase
        const detectTimer = setTimeout(() => {
            setIsDetecting(false);
        }, 2000);

        // Pulse animation for detecting indicator
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => {
            clearInterval(timer);
            clearTimeout(detectTimer);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDetailsPress = () => {
        Alert.alert(
            'Emergency Details',
            `📍 Your Location:\n${userAddress}\nLat: ${userLocation.latitude.toFixed(6)}\nLng: ${userLocation.longitude.toFixed(6)}\n\n🚔 Responder:\n${nearestStation?.name || 'Finding...'}\nETA: ${nearestStation?.estimatedArrival || '--'} mins`,
            [
                { 
                    text: 'Call Responder', 
                    onPress: () => {
                        if (nearestStation?.phone) {
                            Linking.openURL(`tel:${nearestStation.phone}`);
                        } else {
                            Linking.openURL('tel:911');
                        }
                    }
                },
                { 
                    text: 'Open in Maps',
                    onPress: () => {
                        const url = `https://maps.google.com/maps?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${nearestStation?.latitude},${nearestStation?.longitude}`;
                        Linking.openURL(url);
                    }
                },
                { text: 'Close', style: 'cancel' }
            ]
        );
    };

    const handleCenterMap = () => {
        setMapZoom(15);
    };

    const handleToggleMapStyle = () => {
        // Toggle between zoom levels to simulate layer change
        setMapZoom(mapZoom === 14 ? 16 : 14);
    };

    const handleEndCallPress = () => {
        Alert.alert(
            'End Emergency',
            'Are you sure you want to end this emergency call?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'End Call', 
                    style: 'destructive',
                    onPress: onEndCall
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Info Card */}
            <View style={styles.infoCard}>
                {/* Detecting indicator */}
                <TouchableOpacity style={styles.detectingRow} activeOpacity={0.7}>
                    <Animated.View style={[styles.detectingDot, { opacity: pulseAnim }]} />
                    <Text style={styles.detectingText}>
                        {isDetecting ? 'DETECTING LOCATION...' : 'LOCATION CONFIRMED'}
                    </Text>
                </TouchableOpacity>

                {/* Your Location */}
                <TouchableOpacity 
                    style={styles.section} 
                    activeOpacity={0.7}
                    onPress={() => {
                        Linking.openURL(`https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`);
                    }}
                >
                    <View style={styles.locationLine}>
                        <View style={styles.redDot} />
                        <View style={styles.verticalLine} />
                    </View>
                    <View style={styles.sectionContent}>
                        <Text style={styles.sectionLabel}>YOUR LOCATION</Text>
                        <Text style={styles.sectionTitle}>{userAddress}</Text>
                        <Text style={styles.sectionSubtitle}>Agusan del Norte, Philippines</Text>
                    </View>
                </TouchableOpacity>

                {/* Nearest Station */}
                {nearestStation && (
                    <TouchableOpacity 
                        style={styles.section}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (nearestStation.phone) {
                                Linking.openURL(`tel:${nearestStation.phone}`);
                            }
                        }}
                    >
                        <View style={styles.locationLine}>
                            <View style={styles.blueDot} />
                        </View>
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionLabel}>NEAREST STATION</Text>
                            <Text style={styles.sectionTitle}>{nearestStation.name}</Text>
                            <Text style={styles.sectionSubtitle}>{nearestStation.address}</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* ETA */}
                {nearestStation && (
                    <View style={styles.etaRow}>
                        <Text style={styles.etaIcon}>🚗</Text>
                        <Text style={styles.etaText}>
                            ESTIMATED ARRIVAL: <Text style={styles.etaBold}>{nearestStation.estimatedArrival} MINS</Text>
                        </Text>
                        <TouchableOpacity onPress={handleDetailsPress}>
                            <Text style={styles.detailsLink}>DETAILS ›</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                <GeoapifyMap
                    latitude={userLocation.latitude}
                    longitude={userLocation.longitude}
                    theme="light"
                    zoom={mapZoom}
                    showMarker={true}
                    responderLocation={nearestStation}
                    showRoute={!!nearestStation}
                />

                {/* Map label */}
                <View style={styles.mapLabel}>
                    <Text style={styles.mapLabelText}>EMERGENCY IN PROGRESS</Text>
                </View>

                {/* Map controls */}
                <View style={styles.mapControls}>
                    <TouchableOpacity style={styles.mapButton} onPress={handleCenterMap}>
                        <Text style={styles.mapButtonIcon}>◎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mapButton} onPress={handleToggleMapStyle}>
                        <Text style={styles.mapButtonIcon}>◫</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.timerLabel}>ACTIVE EMERGENCY CALL</Text>

                <TouchableOpacity style={styles.endCallButton} onPress={handleEndCallPress}>
                    <Text style={styles.endCallIcon}>📞</Text>
                    <Text style={styles.endCallText}>END CALL</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8EEF4',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    detectingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    detectingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4444',
        marginRight: 8,
    },
    detectingText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FF4444',
        letterSpacing: 0.5,
    },
    section: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    locationLine: {
        alignItems: 'center',
        marginRight: 12,
        width: 12,
    },
    redDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF4444',
    },
    blueDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4A90D9',
    },
    verticalLine: {
        flex: 1,
        width: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    sectionContent: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 18,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 1,
    },
    etaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    etaIcon: {
        fontSize: 14,
        marginRight: 8,
    },
    etaText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        letterSpacing: 0.3,
    },
    etaBold: {
        fontWeight: '700',
        color: '#FF4444',
    },
    detailsLink: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FF4444',
        letterSpacing: 0.3,
    },
    mapContainer: {
        flex: 1,
        marginHorizontal: 0,
        marginTop: 0,
        backgroundColor: '#D4E4EC',
    },
    mapLabel: {
        position: 'absolute',
        left: 16,
        bottom: 60,
    },
    mapLabelText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#9CA3AF',
        letterSpacing: 0.3,
    },
    mapControls: {
        position: 'absolute',
        right: 12,
        bottom: 60,
        gap: 8,
    },
    mapButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mapButtonIcon: {
        fontSize: 18,
        color: '#6B7280',
    },
    bottomSection: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: '#E8EEF4',
    },
    timer: {
        fontSize: 32,
        fontWeight: '300',
        color: '#9CA3AF',
        letterSpacing: 2,
    },
    timerLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#C0C5CB',
        letterSpacing: 0.5,
        marginTop: 2,
        marginBottom: 16,
    },
    endCallButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF4444',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 28,
        width: '100%',
        shadowColor: '#FF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    endCallIcon: {
        fontSize: 18,
        marginRight: 10,
        transform: [{ rotate: '135deg' }],
    },
    endCallText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
