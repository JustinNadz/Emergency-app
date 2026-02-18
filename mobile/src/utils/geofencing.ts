// Geofencing utilities - Point-in-Polygon algorithm

import { Location, GeoJSONPolygon } from '../types';

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param point - The location to check
 * @param polygon - GeoJSON polygon coordinates
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(
    point: Location,
    polygon: GeoJSONPolygon
): boolean {
    const { latitude: lat, longitude: lng } = point;
    const coords = polygon.coordinates[0]; // Outer ring

    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0]; // longitude
        const yi = coords[i][1]; // latitude
        const xj = coords[j][0];
        const yj = coords[j][1];

        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 - First location
 * @param point2 - Second location
 * @returns Distance in kilometers
 */
export function calculateDistance(
    point1: Location,
    point2: Location
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);

    const lat1 = toRad(point1.latitude);
    const lat2 = toRad(point2.latitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Format coordinates for Google Maps URL
 */
export function formatGoogleMapsUrl(location: Location): string {
    return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
}
