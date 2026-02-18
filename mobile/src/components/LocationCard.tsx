// Location Card Component - Bottom sheet style with real-time GPS

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface LocationCardProps {
    address: string;
    accuracy?: number | null;
    isUpdating?: boolean;
    coordinates?: { latitude: number; longitude: number } | null;
    onSettingsPress?: () => void;
    onInfoPress?: () => void;
}

export default function LocationCard({ 
    address, 
    accuracy,
    isUpdating = false,
    coordinates,
    onSettingsPress,
    onInfoPress 
}: LocationCardProps) {
    // Pulse animation for live indicator
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Continuous pulse for live indicator
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.8,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Flash animation when location updates
    useEffect(() => {
        if (isUpdating) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.5,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [address, isUpdating]);

    // Get accuracy indicator color
    const getAccuracyColor = () => {
        if (!accuracy) return '#9CA3AF';
        if (accuracy <= 5) return '#10B981';  // Excellent (green)
        if (accuracy <= 15) return '#22C55E'; // Good (light green)
        if (accuracy <= 30) return '#F59E0B'; // Fair (yellow)
        return '#EF4444'; // Poor (red)
    };

    const getAccuracyLabel = () => {
        if (!accuracy) return '';
        if (accuracy <= 5) return 'Excellent';
        if (accuracy <= 15) return 'Good';
        if (accuracy <= 30) return 'Fair';
        return 'Low';
    };

    const getAccuracyText = () => {
        if (!accuracy) return '';
        return `±${Math.round(accuracy)}m`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.handle} />
            
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <View style={styles.locationInfo}>
                    <View style={styles.labelRow}>
                        {/* Live indicator with pulse */}
                        <View style={styles.liveIndicator}>
                            <Animated.View 
                                style={[
                                    styles.pulseRing,
                                    { 
                                        backgroundColor: getAccuracyColor(),
                                        transform: [{ scale: pulseAnim }],
                                        opacity: pulseAnim.interpolate({
                                            inputRange: [1, 1.8],
                                            outputRange: [0.5, 0],
                                        }),
                                    }
                                ]} 
                            />
                            <View style={[styles.dot, { backgroundColor: getAccuracyColor() }]} />
                        </View>
                        <Text style={styles.label}>LIVE</Text>
                        {accuracy && (
                            <View style={styles.accuracyBadge}>
                                <Text style={[styles.accuracyText, { color: getAccuracyColor() }]}>
                                    {getAccuracyText()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.address} numberOfLines={2}>
                        {address}
                    </Text>
                    {coordinates && (
                        <Text style={styles.coords}>
                            {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                        </Text>
                    )}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={onInfoPress}
                    >
                        <Text style={styles.iconText}>ⓘ</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={onSettingsPress}
                    >
                        <Text style={styles.iconText}>⚙</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    handle: {
        width: 32,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    locationInfo: {
        flex: 1,
        marginRight: 12,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    liveIndicator: {
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    pulseRing: {
        width: 16,
        height: 16,
        borderRadius: 8,
        position: 'absolute',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        position: 'absolute',
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#EF4444',
        letterSpacing: 1,
    },
    accuracyBadge: {
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
    },
    accuracyText: {
        fontSize: 9,
        fontWeight: '600',
    },
    address: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 20,
        marginBottom: 2,
    },
    coords: {
        fontSize: 11,
        color: '#9CA3AF',
        fontFamily: 'monospace',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 16,
        color: '#6B7280',
    },
});
