// Status Badge Component with real-time pulse animation

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface StatusBadgeProps {
    icon: string;
    label: string;
    isActive?: boolean;
    variant?: 'light' | 'dark';
    pulse?: boolean;
}

export default function StatusBadge({ 
    icon, 
    label, 
    isActive = true,
    variant = 'light',
    pulse = true,
}: StatusBadgeProps) {
    const isGps = label.includes('GPS');
    const isOnline = label.includes('ONLINE');
    const isSms = label.includes('SMS');
    
    // Color based on type
    const getIndicatorColor = () => {
        if (!isActive) return '#9CA3AF';
        if (isGps) return '#22C55E';
        if (isOnline) return '#3B82F6';
        if (isSms) return '#F59E0B';
        return '#6B7280';
    };
    
    // Pulse animation for real-time indicator
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    useEffect(() => {
        if (isActive && pulse) {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.5,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
            return () => animation.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isActive, pulse]);
    
    const indicatorColor = getIndicatorColor();
    
    return (
        <View style={[
            styles.badge,
            variant === 'dark' ? styles.badgeDark : styles.badgeLight,
            !isActive && styles.badgeInactive
        ]}>
            <View style={styles.indicatorContainer}>
                {/* Pulse ring */}
                {isActive && pulse && (
                    <Animated.View 
                        style={[
                            styles.pulseRing,
                            { 
                                backgroundColor: indicatorColor,
                                transform: [{ scale: pulseAnim }],
                                opacity: pulseAnim.interpolate({
                                    inputRange: [1, 1.5],
                                    outputRange: [0.6, 0],
                                }),
                            }
                        ]} 
                    />
                )}
                {/* Solid indicator */}
                <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
            </View>
            <Text style={[
                styles.label,
                variant === 'dark' ? styles.labelDark : styles.labelLight
            ]}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 22,
        alignSelf: 'flex-start',
    },
    badgeLight: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    badgeDark: {
        backgroundColor: 'rgba(30, 30, 45, 0.95)',
    },
    badgeInactive: {
        opacity: 0.5,
    },
    indicatorContainer: {
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        position: 'absolute',
    },
    pulseRing: {
        width: 16,
        height: 16,
        borderRadius: 8,
        position: 'absolute',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    labelLight: {
        color: '#1F2937',
    },
    labelDark: {
        color: '#FFFFFF',
    },
});
