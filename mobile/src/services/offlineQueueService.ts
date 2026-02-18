// Offline Queue Service - Manages pending operations when offline

import AsyncStorage from '@react-native-async-storage/async-storage';
import networkService from './networkService';

interface QueuedOperation {
    id: string;
    type: 'emergency_report' | 'location_update' | 'incident_resolve';
    data: any;
    timestamp: number;
    retries: number;
}

const QUEUE_KEY = '@offline_queue';
const MAX_RETRIES = 5;

class OfflineQueueService {
    private queue: QueuedOperation[] = [];
    private isProcessing: boolean = false;
    private syncCallbacks: Map<string, (data: any) => Promise<boolean>> = new Map();

    /**
     * Initialize queue from storage
     */
    async init(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(QUEUE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }

            // Listen for network changes
            networkService.addListener(this.onNetworkChange);
        } catch (error) {
            console.error('Failed to init offline queue:', error);
        }
    }

    /**
     * Network change handler
     */
    private onNetworkChange = async (isConnected: boolean): Promise<void> => {
        if (isConnected) {
            console.log('📶 Network restored, processing queue...');
            await this.processQueue();
        }
    };

    /**
     * Register sync callback for operation type
     */
    registerSyncHandler(type: string, handler: (data: any) => Promise<boolean>): void {
        this.syncCallbacks.set(type, handler);
    }

    /**
     * Add operation to queue
     */
    async enqueue(type: QueuedOperation['type'], data: any): Promise<string> {
        const operation: QueuedOperation = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now(),
            retries: 0,
        };

        this.queue.push(operation);
        await this.saveQueue();

        console.log(`📥 Queued operation: ${type} (${operation.id})`);

        // Try to process immediately if online
        if (networkService.getStatus()) {
            this.processQueue();
        }

        return operation.id;
    }

    /**
     * Process all queued operations
     */
    async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) return;
        if (!networkService.getStatus()) return;

        this.isProcessing = true;
        console.log(`🔄 Processing ${this.queue.length} queued operations...`);

        const processed: string[] = [];

        for (const operation of this.queue) {
            try {
                const handler = this.syncCallbacks.get(operation.type);
                if (!handler) {
                    console.warn(`No handler for operation type: ${operation.type}`);
                    continue;
                }

                const success = await handler(operation.data);
                if (success) {
                    processed.push(operation.id);
                    console.log(`✅ Processed: ${operation.id}`);
                } else {
                    operation.retries++;
                    if (operation.retries >= MAX_RETRIES) {
                        processed.push(operation.id); // Remove after max retries
                        console.warn(`❌ Max retries reached: ${operation.id}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing ${operation.id}:`, error);
                operation.retries++;
            }
        }

        // Remove processed operations
        this.queue = this.queue.filter(op => !processed.includes(op.id));
        await this.saveQueue();

        this.isProcessing = false;
        console.log(`📊 Queue size: ${this.queue.length}`);
    }

    /**
     * Save queue to storage
     */
    private async saveQueue(): Promise<void> {
        try {
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save queue:', error);
        }
    }

    /**
     * Get queue size
     */
    getQueueSize(): number {
        return this.queue.length;
    }

    /**
     * Get pending operations
     */
    getPendingOperations(): QueuedOperation[] {
        return [...this.queue];
    }

    /**
     * Clear all queued operations
     */
    async clearQueue(): Promise<void> {
        this.queue = [];
        await AsyncStorage.removeItem(QUEUE_KEY);
    }
}

export default new OfflineQueueService();
