// SMS Service - Offline emergency alerts via text message

import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location } from '../types';

// Default emergency contacts for Butuan/Caraga region
const DEFAULT_EMERGENCY_CONTACTS = [
    { name: 'Butuan CDRRMO', phone: '09171234567', type: 'CDRRMO' },
    { name: 'PNP Butuan', phone: '09181234567', type: 'PNP' },
    { name: 'BFP Butuan', phone: '09191234567', type: 'BFP' },
];

const STORAGE_KEY = 'emergency_contacts';

interface EmergencyContact {
    name: string;
    phone: string;
    type: string;
}

interface SMSResult {
    success: boolean;
    message: string;
    contactsNotified: string[];
}

class SMSService {
    private contacts: EmergencyContact[] = [];

    /**
     * Initialize SMS service and load contacts
     */
    async init(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.contacts = JSON.parse(stored);
            } else {
                // Use default contacts
                this.contacts = DEFAULT_EMERGENCY_CONTACTS;
                await this.saveContacts();
            }
            console.log('📱 SMS Service initialized with', this.contacts.length, 'contacts');
        } catch (error) {
            console.error('Failed to init SMS service:', error);
            this.contacts = DEFAULT_EMERGENCY_CONTACTS;
        }
    }

    /**
     * Check if SMS is available on device
     */
    async isAvailable(): Promise<boolean> {
        try {
            return await SMS.isAvailableAsync();
        } catch {
            return false;
        }
    }

    /**
     * Send emergency SMS to all contacts
     */
    async sendEmergencySMS(location: Location, address: string): Promise<SMSResult> {
        const isAvailable = await this.isAvailable();
        
        if (!isAvailable) {
            return {
                success: false,
                message: 'SMS not available on this device',
                contactsNotified: [],
            };
        }

        if (this.contacts.length === 0) {
            return {
                success: false,
                message: 'No emergency contacts configured',
                contactsNotified: [],
            };
        }

        // Build emergency message with location
        const googleMapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
        const message = `🚨 EMERGENCY ALERT 🚨

I need immediate help!

📍 Location: ${address}

🗺️ GPS Coordinates:
Lat: ${location.latitude.toFixed(6)}
Lon: ${location.longitude.toFixed(6)}

📎 Google Maps: ${googleMapsLink}

Accuracy: ±${location.accuracy?.toFixed(0) || 'N/A'}m
Time: ${new Date().toLocaleString()}

Sent via Emergency Responder App`;

        try {
            // Get all phone numbers
            const phoneNumbers = this.contacts.map(c => c.phone);
            
            // Send SMS (opens SMS app with pre-filled message)
            const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
            
            if (result === 'sent' || result === 'unknown') {
                // 'unknown' means user may have sent it (we can't confirm)
                return {
                    success: true,
                    message: 'Emergency SMS sent',
                    contactsNotified: this.contacts.map(c => c.name),
                };
            } else {
                return {
                    success: false,
                    message: 'SMS was cancelled',
                    contactsNotified: [],
                };
            }
        } catch (error) {
            console.error('SMS send error:', error);
            return {
                success: false,
                message: 'Failed to send SMS',
                contactsNotified: [],
            };
        }
    }

    /**
     * Send quick SOS (shorter message for faster sending)
     */
    async sendQuickSOS(location: Location): Promise<SMSResult> {
        const isAvailable = await this.isAvailable();
        
        if (!isAvailable || this.contacts.length === 0) {
            return {
                success: false,
                message: 'SMS not available',
                contactsNotified: [],
            };
        }

        // Short emergency message
        const message = `🆘 SOS EMERGENCY
📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
🗺️ https://maps.google.com/?q=${location.latitude},${location.longitude}`;

        try {
            const phoneNumbers = this.contacts.map(c => c.phone);
            const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
            
            return {
                success: result === 'sent' || result === 'unknown',
                message: result === 'sent' ? 'SOS sent' : 'SMS opened',
                contactsNotified: this.contacts.map(c => c.name),
            };
        } catch (error) {
            return {
                success: false,
                message: 'SMS failed',
                contactsNotified: [],
            };
        }
    }

    /**
     * Get current emergency contacts
     */
    getContacts(): EmergencyContact[] {
        return [...this.contacts];
    }

    /**
     * Add emergency contact
     */
    async addContact(contact: EmergencyContact): Promise<void> {
        this.contacts.push(contact);
        await this.saveContacts();
    }

    /**
     * Remove emergency contact
     */
    async removeContact(phone: string): Promise<void> {
        this.contacts = this.contacts.filter(c => c.phone !== phone);
        await this.saveContacts();
    }

    /**
     * Update all contacts
     */
    async setContacts(contacts: EmergencyContact[]): Promise<void> {
        this.contacts = contacts;
        await this.saveContacts();
    }

    /**
     * Save contacts to storage
     */
    private async saveContacts(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.contacts));
        } catch (error) {
            console.error('Failed to save contacts:', error);
        }
    }
}

export default new SMSService();
