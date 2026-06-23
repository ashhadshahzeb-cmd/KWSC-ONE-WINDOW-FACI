import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type OfflineAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface OfflineMutation {
  id: string; // unique ID for the mutation queue
  table: string;
  action: OfflineAction;
  payload: any;
  timestamp: number;
}

const QUEUE_KEY = 'kwsc_offline_queue';

export function getOfflineQueue(): OfflineMutation[] {
  try {
    const q = localStorage.getItem(QUEUE_KEY);
    return q ? JSON.parse(q) : [];
  } catch (e) {
    return [];
  }
}

export function addToOfflineQueue(table: string, action: OfflineAction, payload: any) {
  const queue = getOfflineQueue();
  const mutation: OfflineMutation = {
    id: crypto.randomUUID(),
    table,
    action,
    payload,
    timestamp: Date.now(),
  };
  
  queue.push(mutation);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  
  // Dispatch a custom event so UI can update immediately
  window.dispatchEvent(new Event('offline-queue-updated'));
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
  window.dispatchEvent(new Event('offline-queue-updated'));
}

export async function processOfflineQueue() {
  if (!navigator.onLine) return;
  
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  toast.info(`Syncing ${queue.length} offline changes to cloud...`, { id: 'sync-toast' });
  
  let successCount = 0;
  let failedQueue: OfflineMutation[] = [];

  for (const mutation of queue) {
    try {
      let error = null;

      if (mutation.action === 'INSERT') {
        const { error: err } = await supabase.from(mutation.table as any).insert(mutation.payload);
        error = err;
      } else if (mutation.action === 'UPDATE') {
        const { id, ...updateData } = mutation.payload;
        // Specifically for file_tracking_records, we might update by receiving_number if id is not present but usually id is present
        const matchField = id ? { id } : { receiving_number: updateData.receiving_number };
        const { error: err } = await supabase.from(mutation.table as any).update(updateData).match(matchField);
        error = err;
      } else if (mutation.action === 'DELETE') {
        const { id } = mutation.payload;
        const { error: err } = await supabase.from(mutation.table as any).delete().eq('id', id);
        error = err;
      }

      if (error) {
        console.error('Failed to sync mutation:', mutation, error);
        failedQueue.push(mutation); // Keep it in queue if it failed due to server error
      } else {
        successCount++;
      }
    } catch (e) {
      console.error('Exception syncing mutation:', mutation, e);
      failedQueue.push(mutation);
    }
  }

  // Update queue with only failed items
  if (failedQueue.length === 0) {
    clearOfflineQueue();
    toast.success(`Successfully synced ${successCount} offline changes!`, { id: 'sync-toast' });
  } else {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(failedQueue));
    window.dispatchEvent(new Event('offline-queue-updated'));
    toast.error(`${failedQueue.length} changes failed to sync. Will retry later.`, { id: 'sync-toast' });
  }
}

// Function to setup global listeners
export function setupOfflineListeners() {
  window.addEventListener('online', () => {
    processOfflineQueue();
  });
}
