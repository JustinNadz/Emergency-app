// SOS Button Component - Hold to Activate

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Pressable,
    Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface SOSButtonProps {
    onActivate: () => void;
    disabled?: boolean;
}

export default function SOSButton({ onActivate, disabled = false }: SOSButtonProps) {
    const [isHolding, setIsHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const holdTimer = useRef<NodeJS.Timeout | null>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    const HOLD_DURATION = 2000; // 2 seconds to activate

    const resetButton = useCallback(() => {
        console.log('🔴 SOS Button: Reset');
        setIsHolding(false);
        setProgress(0);

        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }

        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }

        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();

        Animated.timing(progressAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, []);

    const startHold = useCallback(() => {
        if (disabled) return;

        console.log('🔴 SOS Button: Hold started');
        setIsHolding(true);
        
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
            console.log('Haptics not available');
        }

        // Scale animation
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();

        // Progress animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: HOLD_DURATION,
            useNativeDriver: false,
        }).start();

        // Progress counter
        let prog = 0;
        progressInterval.current = setInterval(() => {
            prog += 100 / (HOLD_DURATION / 100);
            setProgress(Math.min(prog, 100));
        }, 100);

        // Activation timer
        holdTimer.current = setTimeout(() => {
            console.log('🚨 SOS Button: ACTIVATED!');
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Vibration.vibrate([0, 200, 100, 200]);
            } catch (e) {
                console.log('Haptics/Vibration not available');
            }
            onActivate();
            resetButton();
        }, HOLD_DURATION);
    }, [disabled, onActivate, resetButton]);

    const cancelHold = useCallback(() => {
        console.log('🔴 SOS Button: Hold cancelled');
        resetButton();
    }, [resetButton]);

    const ringScale = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.15],
    });

    const ringOpacity = progressAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.6, 0],
    });

    return (
        <View style={styles.container}>
            {/* Outer animated ring */}
            <Animated.View
                style={[
                    styles.outerRing,
                    {
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                    },
                ]}
                pointerEvents="none"
            />

            {/* Main button using Pressable for reliable hold detection */}
            <Pressable
                onPressIn={startHold}
                onPressOut={cancelHold}
                disabled={disabled}
            >
                <Animated.View
                    style={[
                        styles.button,
                        { transform: [{ scale: scaleAnim }] },
                        disabled && styles.buttonDisabled,
                    ]}
                >
                    {/* Progress overlay */}
                    {isHolding && (
                        <View style={styles.progressOverlay}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { height: `${progress}%` },
                                ]}
                            />
                        </View>
                    )}

                    {/* Button content */}
                    <View style={styles.content}>
                        <Text style={styles.asterisk}>✳</Text>
                        <Text style={styles.sosText}>SOS</Text>
                        <Text style={styles.holdText}>
                            {isHolding ? `${Math.round(progress)}%` : 'HOLD TO ACTIVATE'}
                        </Text>
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerRing: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FF4444',
    },
    button: {
        width: 170,
        height: 170,
        borderRadius: 85,
        backgroundColor: '#FF4444',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
        overflow: 'hidden',
    },
    buttonDisabled: {
        backgroundColor: '#999999',
        shadowColor: '#999999',
    },
    progressOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        justifyContent: 'flex-end',
    },
    progressFill: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        width: '100%',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    asterisk: {
        fontSize: 28,
        color: '#FFFFFF',
        marginBottom: 0,
    },
    sosText: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 4,
        marginTop: -2,
    },
    holdText: {
        fontSize: 8,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
        letterSpacing: 1,
    },
});
