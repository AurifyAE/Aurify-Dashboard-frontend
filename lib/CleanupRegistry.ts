/**
 * CleanupRegistry — Enterprise teardown registry.
 *
 * Allows any context, hook, or component to register cleanup functions
 * (e.g. clearInterval, clearTimeout, event listeners, workers).
 * When logout executes, all registered cleanups are safely drained.
 */

type CleanupFn = () => void;

class CleanupRegistryClass {
  private cleanups: Set<CleanupFn> = new Set();

  /**
   * Registers a cleanup callback. Returns an unregister function.
   */
  public registerCleanup(fn: CleanupFn): () => void {
    this.cleanups.add(fn);
    return () => {
      this.cleanups.delete(fn);
    };
  }

  /**
   * Drains and executes all registered cleanups inside safe try/catch wrappers.
   */
  public executeAllCleanups(): void {
    const list = Array.from(this.cleanups);
    this.cleanups.clear();

    for (const fn of list) {
      try {
        fn();
      } catch (err) {
        console.warn('[CleanupRegistry] Error during cleanup execution:', err);
      }
    }
  }

  /**
   * Returns current count of registered cleanup handlers (useful for telemetry/testing).
   */
  public size(): number {
    return this.cleanups.size;
  }
}

export const CleanupRegistry = new CleanupRegistryClass();
