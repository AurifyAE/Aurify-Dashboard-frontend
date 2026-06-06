"use client";

import { useEffect, useState } from "react";

/** Returns true only after the component has mounted on the client. */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
