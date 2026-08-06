/**
 * RequestRegistry — Generic AbortController registry for in-flight HTTP requests.
 *
 * Allows fetch calls, Axios requests, or file upload jobs to register their AbortController.
 * On logout, abortAllRequests() cleanly cancels every active HTTP connection.
 */

class RequestRegistryClass {
  private controllers: Set<AbortController> = new Set();

  /**
   * Registers an AbortController instance. Returns an unregister function.
   */
  public registerController(controller: AbortController): () => void {
    this.controllers.add(controller);
    return () => {
      this.controllers.delete(controller);
    };
  }

  /**
   * Creates, registers, and returns a new AbortController automatically.
   */
  public createController(): AbortController {
    const controller = new AbortController();
    this.registerController(controller);
    return controller;
  }

  /**
   * Aborts all active HTTP requests and clears the registry.
   */
  public abortAllRequests(): void {
    for (const controller of this.controllers) {
      try {
        if (!controller.signal.aborted) {
          controller.abort('User logged out');
        }
      } catch (err) {
        console.warn('[RequestRegistry] Error aborting request:', err);
      }
    }
    this.controllers.clear();
  }

  /**
   * Current number of tracked in-flight requests.
   */
  public size(): number {
    return this.controllers.size;
  }
}

export const RequestRegistry = new RequestRegistryClass();
