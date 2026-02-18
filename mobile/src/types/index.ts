// Type definitions for the Emergency Responder App

export interface City {
    id: number;
    name: string;
    region: string;
    province: string;
    boundsGeoJSON?: string;
}

export interface EmergencyContact {
    id: number;
    cityId: number;
    type: 'CDRRMO' | 'MDRRMO' | 'Police' | 'Fire' | 'BFP' | 'PNP';
    name: string;
    phone: string;
}

export interface Location {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp?: number;
}

export interface Incident {
    id?: number;
    latitude: number;
    longitude: number;
    timestamp: number;
    cityName: string;
    contactsCalled?: string[];
    synced: boolean;
}

export interface GeoJSONPolygon {
    type: 'Polygon';
    coordinates: number[][][];
}

export type AppMode = 'online' | 'offline';
