// Geoapify Map Component using WebView

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { GEOAPIFY_API_KEY } from '../config/map.config';

interface MapViewProps {
    latitude: number;
    longitude: number;
    zoom?: number;
    theme?: 'dark' | 'light';
    showMarker?: boolean;
    responderLocation?: { latitude: number; longitude: number } | null;
    showRoute?: boolean;
}

export default function GeoapifyMap({
    latitude,
    longitude,
    zoom = 15,
    theme = 'dark',
    showMarker = true,
    responderLocation = null,
    showRoute = false,
}: MapViewProps) {
    const webViewRef = useRef<WebView>(null);

    const mapStyle = theme === 'dark' ? 'dark-matter' : 'positron';

    const getMapHTML = () => {
        const routeScript = responderLocation && showRoute ? `
            // Draw route
            fetch('https://api.geoapify.com/v1/routing?waypoints=${responderLocation.latitude},${responderLocation.longitude}|${latitude},${longitude}&mode=drive&apiKey=${GEOAPIFY_API_KEY}')
                .then(response => response.json())
                .then(data => {
                    if (data.features && data.features.length > 0) {
                        L.geoJSON(data, {
                            style: {
                                color: '#4A90D9',
                                weight: 4,
                                opacity: 0.8,
                                dashArray: '10, 10'
                            }
                        }).addTo(map);
                    }
                });
            
            // Responder marker
            var responderIcon = L.divIcon({
                html: '<div style="background: #4A90D9; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                className: 'responder-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            L.marker([${responderLocation.latitude}, ${responderLocation.longitude}], {icon: responderIcon}).addTo(map);
        ` : '';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>
                    * { margin: 0; padding: 0; }
                    html, body, #map { 
                        width: 100%; 
                        height: 100%; 
                        background: ${theme === 'dark' ? '#1a1a2e' : '#e8e8e8'};
                    }
                    .leaflet-control-attribution { display: none; }
                    .leaflet-control-zoom { display: none; }
                    .user-marker {
                        background: transparent;
                    }
                    .responder-marker {
                        background: transparent;
                    }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var map = L.map('map', {
                        zoomControl: false,
                        attributionControl: false
                    }).setView([${latitude}, ${longitude}], ${zoom});
                    
                    L.tileLayer('https://maps.geoapify.com/v1/tile/${mapStyle}/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}', {
                        maxZoom: 20,
                    }).addTo(map);
                    
                    ${showMarker ? `
                    // User location marker with pulsing effect
                    var userIcon = L.divIcon({
                        html: '<div style="position: relative;"><div style="background: #FF4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative; z-index: 2;"></div><div style="background: rgba(255, 68, 68, 0.3); width: 40px; height: 40px; border-radius: 50%; position: absolute; top: -10px; left: -10px; animation: pulse 2s infinite;"></div></div><style>@keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.3); opacity: 0.4; } 100% { transform: scale(1); opacity: 0.8; } }</style>',
                        className: 'user-marker',
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    });
                    L.marker([${latitude}, ${longitude}], {icon: userIcon}).addTo(map);
                    ` : ''}
                    
                    ${routeScript}
                </script>
            </body>
            </html>
        `;
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: getMapHTML() }}
                style={styles.webview}
                scrollEnabled={false}
                bounces={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
