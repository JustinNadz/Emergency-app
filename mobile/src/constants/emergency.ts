// Emergency-related constants

// Database
export const DATABASE_NAME = 'emergency_responder.db';

// Emergency responder types
export const EMERGENCY_TYPES = {
    CDRRMO: 'City Disaster Risk Reduction and Management Office',
    MDRRMO: 'Municipal Disaster Risk Reduction and Management Office',
    PNP: 'Philippine National Police',
    BFP: 'Bureau of Fire Protection',
} as const;

// Incident status values
export const INCIDENT_STATUS = {
    REPORTED: 'reported',
    RESPONDING: 'responding',
    RESOLVED: 'resolved',
    CANCELLED: 'cancelled',
} as const;

// App network modes
export const NETWORK_MODES = {
    ONLINE: 'online',
    SMS_READY: 'sms_ready',
    OFFLINE: 'offline',
} as const;

// Error messages
export const ERROR_MESSAGES = {
    NO_LOCATION: 'Could not get your location. Please enable GPS.',
    NO_PERMISSION: 'Location permission is required for this app.',
    NO_CONTACTS: 'No emergency contacts found for your area.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    GPS_DISABLED: 'Please enable GPS in your device settings.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
    EMERGENCY_REPORTED: 'Emergency reported! Help is on the way.',
    LOCATION_UPDATED: 'Location updated successfully.',
    SMS_SENT: 'Emergency SMS sent successfully.',
} as const;

// Emergency contact defaults for Butuan/Caraga
export const DEFAULT_EMERGENCY_CONTACTS = [
    { name: 'Butuan CDRRMO', phone: '09171234567', type: 'CDRRMO' },
    { name: 'PNP Butuan', phone: '09181234567', type: 'PNP' },
    { name: 'BFP Butuan', phone: '09191234567', type: 'BFP' },
] as const;
