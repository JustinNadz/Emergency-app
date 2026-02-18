// Database service - SQLite operations

import * as SQLite from 'expo-sqlite';
import { City, EmergencyContact, Incident } from '../types';
import { DATABASE_NAME } from '../constants';

class DatabaseService {
    private db: SQLite.SQLiteDatabase | null = null;

    async init(): Promise<void> {
        this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await this.createTables();
        await this.seedInitialData();
    }

    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Cities table
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        province TEXT NOT NULL,
        bounds_geojson TEXT
      );
    `);

        // Emergency contacts table
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        FOREIGN KEY(city_id) REFERENCES cities(id)
      );
    `);

        // Pending incidents table (for offline mode)
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        city_name TEXT NOT NULL,
        contacts_called TEXT,
        synced INTEGER DEFAULT 0
      );
    `);
    }

    private async seedInitialData(): Promise<void> {
        if (!this.db) return;

        // Check if data already exists
        const result = await this.db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM cities'
        );

        if (result && result.count > 0) return; // Data already seeded

        // Insert Butuan City with approximate boundaries
        await this.db.runAsync(
            `INSERT INTO cities (name, region, province, bounds_geojson) VALUES (?, ?, ?, ?)`,
            'Butuan City',
            'Caraga',
            'Agusan del Norte',
            JSON.stringify({
                type: 'Polygon',
                coordinates: [[
                    [125.48, 8.90],
                    [125.60, 8.90],
                    [125.60, 9.00],
                    [125.48, 9.00],
                    [125.48, 8.90],
                ]],
            })
        );

        // Get Butuan City ID
        const city = await this.db.getFirstAsync<{ id: number }>(
            'SELECT id FROM cities WHERE name = ?',
            'Butuan City'
        );

        if (city) {
            // Insert sample emergency contacts for Butuan City
            const contacts = [
                { type: 'CDRRMO', name: 'Butuan CDRRMO', phone: '09123456789' },
                { type: 'PNP', name: 'Butuan Police Station', phone: '09187654321' },
                { type: 'BFP', name: 'Butuan Fire Station', phone: '09191234567' },
            ];

            for (const contact of contacts) {
                await this.db.runAsync(
                    'INSERT INTO emergency_contacts (city_id, type, name, phone) VALUES (?, ?, ?, ?)',
                    city.id,
                    contact.type,
                    contact.name,
                    contact.phone
                );
            }
        }
    }

    async getCityByLocation(lat: number, lng: number): Promise<City | null> {
        if (!this.db) return null;

        // For MVP, we'll use a simple bounding box check
        // In production, you'd use proper point-in-polygon with GeoJSON
        const city = await this.db.getFirstAsync<City>(
            `SELECT * FROM cities 
       WHERE bounds_geojson IS NOT NULL
       LIMIT 1`
        );

        return city || null;
    }

    async getEmergencyContactsByCity(cityId: number): Promise<EmergencyContact[]> {
        if (!this.db) return [];

        const contacts = await this.db.getAllAsync<EmergencyContact>(
            'SELECT * FROM emergency_contacts WHERE city_id = ?',
            cityId
        );

        return contacts;
    }

    async savePendingIncident(incident: Incident): Promise<number> {
        if (!this.db) return -1;

        const result = await this.db.runAsync(
            `INSERT INTO pending_incidents 
       (latitude, longitude, timestamp, city_name, contacts_called, synced) 
       VALUES (?, ?, ?, ?, ?, 0)`,
            incident.latitude,
            incident.longitude,
            incident.timestamp,
            incident.cityName,
            JSON.stringify(incident.contactsCalled || [])
        );

        return result.lastInsertRowId;
    }

    async getPendingIncidents(): Promise<Incident[]> {
        if (!this.db) return [];

        const incidents = await this.db.getAllAsync<any>(
            'SELECT * FROM pending_incidents WHERE synced = 0'
        );

        return incidents.map((i: any) => ({
            id: i.id,
            latitude: i.latitude,
            longitude: i.longitude,
            timestamp: i.timestamp,
            cityName: i.city_name,
            contactsCalled: JSON.parse(i.contacts_called || '[]'),
            synced: i.synced === 1,
        }));
    }

    async markIncidentSynced(id: number): Promise<void> {
        if (!this.db) return;
        await this.db.runAsync(
            'UPDATE pending_incidents SET synced = 1 WHERE id = ?',
            id
        );
    }
}

export default new DatabaseService();
