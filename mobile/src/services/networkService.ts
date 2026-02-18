// Network service - Connection status monitoring

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

type NetworkCallback = (isConnected: boolean) => void;

class NetworkService {
    private isConnected: boolean = false;
    private listeners: NetworkCallback[] = [];
    private subscription: NetInfoSubscription | null = null;

    /**
     * Initialize network monitoring
     */
    async init(): Promise<void> {
        // Get initial state
        const state = await NetInfo.fetch();
        this.isConnected = state.isConnected ?? false;

        // Subscribe to changes
        this.subscription = NetInfo.addEventListener(this.handleNetworkChange);
    }

    /**
     * Handle network state changes
     */
    private handleNetworkChange = (state: NetInfoState): void => {
        const wasConnected = this.isConnected;
        this.isConnected = state.isConnected ?? false;

        // Notify listeners only if state changed
        if (wasConnected !== this.isConnected) {
            this.notifyListeners();
        }
    };

    /**
     * Get current connection status
     */
    getStatus(): boolean {
        return this.isConnected;
    }

    /**
     * Check if online
     */
    async checkConnection(): Promise<boolean> {
        try {
            const state = await NetInfo.fetch();
            this.isConnected = state.isConnected ?? false;
            return this.isConnected;
        } catch {
            return false;
        }
    }

    /**
     * Add listener for network changes
     */
    addListener(callback: NetworkCallback): void {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     */
    removeListener(callback: NetworkCallback): void {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        this.listeners.forEach(callback => callback(this.isConnected));
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.subscription) {
            this.subscription();
            this.subscription = null;
        }
        this.listeners = [];
    }
}

export default new NetworkService();
