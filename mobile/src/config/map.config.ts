// Geoapify Map Configuration

export const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';

// Map tile URLs
export const MAP_TILES = {
    dark: `https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    light: `https://maps.geoapify.com/v1/tile/positron/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    osm: `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
    satellite: `https://maps.geoapify.com/v1/tile/satellite/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
};

// Geoapify Geocoding API
export const GEOCODING_URL = `https://api.geoapify.com/v1/geocode/reverse?apiKey=${GEOAPIFY_API_KEY}`;

// Geoapify Routing API
export const ROUTING_URL = `https://api.geoapify.com/v1/routing?apiKey=${GEOAPIFY_API_KEY}`;
