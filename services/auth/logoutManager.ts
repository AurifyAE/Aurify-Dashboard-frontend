/**
 * LogoutManager — Central enterprise orchestrator for sign-out and session teardown.
 *
 * Implements:
 * 1. Authentication State Machine ('initializing' | 'authenticated' | 'unauthenticated' | 'logging_out')
 * 2. Concurrent Multi-Click Lock (Idempotency)
 * 3. Fault-Tolerant Lifecycle Hooks (beforeLogout, onReset, afterLogout using Promise.allSettled)
 * 4. Registry Execution (CleanupRegistry, RequestRegistry, SocketRegistry)
 * 5. Timeout-Safe Backend Session Revocation
 * 6. Scoped Storage Clearance
 * 7. Cross-Tab Logout Synchronization
 * 8. Hard Document Replacement (window.location.replace)
 * 9. Observability & Structured Telemetry
 */

import { CleanupRegistry } from '@/lib/CleanupRegistry';
import { RequestRegistry } from '@/lib/RequestRegistry';
import { SocketRegistry } from '@/lib/SocketRegistry';
import { clearAuthStorage, LOGOUT_SYNC_KEY } from '@/lib/storage';
import { apiLogout } from '@/services/auth/auth';

export type AuthState = 'initializing' | 'authenticated' | 'unauthenticated' | 'logging_out';

export interface LogoutResult {
  success: boolean;
  reason: 'success' | 'network_error' | 'timeout' | 'server_error' | 'remote_sync' | 'duplicate_blocked';
  durationMs: number;
}

type AsyncHook = () => void | Promise<void>;
type SyncHook = () => void;
type StateListener = (state: AuthState) => void;
type NavigatorFn = (url: string) => void;

class LogoutManagerClass {
  private _state: AuthState = 'initializing';
  private _isLoggingOut = false;
  private _navigator: NavigatorFn | null = null;

  private beforeHooks: Set<AsyncHook> = new Set();
  private resetHooks: Set<SyncHook> = new Set();
  private afterHooks: Set<AsyncHook> = new Set();
  private stateListeners: Set<StateListener> = new Set();

  /**
   * Registers a client-side SPA router navigator (e.g. Next.js router.replace)
   */
  public setNavigator(navigator: NavigatorFn): () => void {
    this._navigator = navigator;
    return () => {
      if (this._navigator === navigator) {
        this._navigator = null;
      }
    };
  }

  public get state(): AuthState {
    return this._state;
  }

  public get isLoggingOut(): boolean {
    return this._isLoggingOut;
  }

  /**
   * Transitions authentication state and alerts all active subscribers
   */
  public setState(newState: AuthState): void {
    if (this._state === newState) return;
    this._state = newState;
    this._isLoggingOut = newState === 'logging_out';
    this.notifyStateListeners();
  }

  /**
   * Subscribes to state machine transitions
   */
  public onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this._state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private notifyStateListeners(): void {
    for (const listener of this.stateListeners) {
      try {
        listener(this._state);
      } catch (err) {
        console.warn('[LogoutManager] Error in state listener:', err);
      }
    }
  }

  /**
   * Registers a lifecycle hook executed BEFORE cleanup begins.
   * Useful for flushing telemetry or cancelling active file uploads.
   */
  public onBeforeLogout(hook: AsyncHook): () => void {
    this.beforeHooks.add(hook);
    return () => {
      this.beforeHooks.delete(hook);
    };
  }

  /**
   * Registers a context reset hook (e.g. AuthContext.reset, NotificationContext.reset).
   */
  public onReset(hook: SyncHook): () => void {
    this.resetHooks.add(hook);
    return () => {
      this.resetHooks.delete(hook);
    };
  }

  /**
   * Registers a lifecycle hook executed AFTER cleanups before page reload.
   */
  public onAfterLogout(hook: AsyncHook): () => void {
    this.afterHooks.add(hook);
    return () => {
      this.afterHooks.delete(hook);
    };
  }

  /**
   * Main Logout Orchestrator
   */
  public async executeLogout(options?: { redirectUrl?: string }): Promise<LogoutResult> {
    const startTime = performance.now();

    // 1. Guard against concurrent multi-clicks (Idempotent Lock)
    if (this._isLoggingOut) {
      console.log('[LogoutManager] Logout already in progress. Duplicate execution prevented.');
      return {
        success: true,
        reason: 'duplicate_blocked',
        durationMs: Math.round(performance.now() - startTime),
      };
    }

    this.setState('logging_out');
    console.log('[LogoutManager] ─── Starting Enterprise Logout Pipeline ───');

    // 2. Fault-Tolerant Before Hooks (Promise.allSettled)
    if (this.beforeHooks.size > 0) {
      console.log(`[LogoutManager] Running ${this.beforeHooks.size} beforeLogout hooks...`);
      await Promise.allSettled(Array.from(this.beforeHooks).map((fn) => Promise.resolve().then(fn)));
    }

    // 3. Terminate Background Timers and Pollers
    console.log(`[LogoutManager] Draining CleanupRegistry (${CleanupRegistry.size()} handlers)...`);
    CleanupRegistry.executeAllCleanups();

    // 4. Abort In-Flight HTTP Requests
    console.log(`[LogoutManager] Aborting RequestRegistry (${RequestRegistry.size()} controllers)...`);
    RequestRegistry.abortAllRequests();

    // 5. Disconnect Real-Time WebSockets
    console.log(`[LogoutManager] Disconnecting SocketRegistry (${SocketRegistry.size()} sockets)...`);
    SocketRegistry.disconnectAllSockets();

    // 6. Backend Session Revocation with Timeout Guard
    console.log('[LogoutManager] Contacting Backend POST /api/auth/logout (2.5s cap)...');
    let backendResult: { success: boolean; error?: string } = { success: true };
    try {
      backendResult = await apiLogout(2500);
    } catch (err: any) {
      backendResult = { success: false, error: err?.message || 'network_error' };
    }

    // 7. Scoped Storage Clearance
    console.log('[LogoutManager] Purging Aurify auth storage & client cookies...');
    clearAuthStorage();

    // 8. Cross-Tab Logout Synchronization Broadcast
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOGOUT_SYNC_KEY, Date.now().toString());
      }
    } catch (err) {
      console.warn('[LogoutManager] Cross-tab broadcast warning:', err);
    }

    // 9. Reset Context States
    console.log(`[LogoutManager] Executing ${this.resetHooks.size} context reset hooks...`);
    for (const resetFn of this.resetHooks) {
      try {
        resetFn();
      } catch (err) {
        console.warn('[LogoutManager] Context reset hook error:', err);
      }
    }

    this.setState('unauthenticated');

    // 10. Fault-Tolerant After Hooks (Promise.allSettled)
    if (this.afterHooks.size > 0) {
      await Promise.allSettled(Array.from(this.afterHooks).map((fn) => Promise.resolve().then(fn)));
    }

    const durationMs = Math.round(performance.now() - startTime);
    const finalReason = backendResult.success
      ? 'success'
      : backendResult.error === 'timeout'
      ? 'timeout'
      : 'network_error';

    console.log(`[LogoutManager] ✅ Logout pipeline completed in ${durationMs}ms (Reason: ${finalReason})`);

    // 11. Seamless Navigation to Login
    const targetUrl = options?.redirectUrl || '/login';
    if (this._navigator) {
      this._navigator(targetUrl);
    } else if (typeof window !== 'undefined') {
      window.location.replace(targetUrl);
    }

    return {
      success: true,
      reason: finalReason,
      durationMs,
    };
  }

  /**
   * Handles remote logout triggered by another browser tab
   */
  public executeRemoteLogout(): void {
    if (this._isLoggingOut) return;
    this.setState('logging_out');
    console.log('[LogoutManager] ⚡ Remote logout broadcast received from another tab.');

    // Cleanup local registries
    CleanupRegistry.executeAllCleanups();
    RequestRegistry.abortAllRequests();
    SocketRegistry.disconnectAllSockets();
    clearAuthStorage();

    for (const resetFn of this.resetHooks) {
      try {
        resetFn();
      } catch {}
    }

    this.setState('unauthenticated');

    if (this._navigator) {
      this._navigator('/login');
    } else if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  }

  /**
   * Initializes Cross-Tab Synchronization via the browser 'storage' event.
   * Returns a teardown handler.
   */
  public initCrossTabLogoutSync(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === LOGOUT_SYNC_KEY && event.newValue) {
        this.executeRemoteLogout();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }
}

export const LogoutManager = new LogoutManagerClass();
