/**
 * SocketRegistry — Enterprise WebSocket and Socket.io instance registry.
 *
 * Tracks all active real-time connections (SpotRate feed, Notifications, DeviceTracker).
 * On logout, cleanly disconnects and purges all listeners without allowing auto-reconnects.
 */

export interface TrackedSocket {
  disconnect?: () => void;
  close?: () => void;
  removeAllListeners?: (event?: string) => void;
  [key: string]: any;
}

class SocketRegistryClass {
  private sockets: Map<string, TrackedSocket> = new Map();

  /**
   * Registers a socket connection under a unique namespace/name.
   * Returns an unregister function.
   */
  public registerSocket(name: string, socket: TrackedSocket): () => void {
    this.sockets.set(name, socket);
    return () => {
      if (this.sockets.get(name) === socket) {
        this.sockets.delete(name);
      }
    };
  }

  /**
   * Disconnects, removes listeners, and closes all registered sockets.
   */
  public disconnectAllSockets(): void {
    for (const [name, socket] of this.sockets.entries()) {
      try {
        if (typeof socket.removeAllListeners === 'function') {
          socket.removeAllListeners();
        }
        if (typeof socket.disconnect === 'function') {
          socket.disconnect();
        } else if (typeof socket.close === 'function') {
          socket.close();
        }
      } catch (err) {
        console.warn(`[SocketRegistry] Error disconnecting socket "${name}":`, err);
      }
    }
    this.sockets.clear();
  }

  /**
   * Current number of active registered sockets.
   */
  public size(): number {
    return this.sockets.size;
  }
}

export const SocketRegistry = new SocketRegistryClass();
