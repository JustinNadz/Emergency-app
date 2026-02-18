// Geoapify Map Configuration - Same as mobile app

export const GEOAPIFY_API_KEY = '01e9f3db00934802b98373d6fef1b9b5';

// Map tile URLs
export const MAP_TILES = {
    dark: `https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    light: `https://maps.geoapify.com/v1/tile/positron/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    osm: `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    satellite: `https://maps.geoapify.com/v1/tile/satellite/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
};

// Geoapify Geocoding API (for reverse geocoding addresses)
export const GEOCODING_URL = `https://api.geoapify.com/v1/geocode/reverse?apiKey=${GEOAPIFY_API_KEY}`;

// Geoapify Routing API (for ETA calculations)
export const ROUTING_URL = `https://api.geoapify.com/v1/routing?apiKey=${GEOAPIFY_API_KEY}`;
