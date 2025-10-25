"use client";

/**
 * Client-side network utilities with React hooks
 * These require "use client" directive and can only be used in client components
 */

import { useEffect, useState } from "react";
import { isOnline } from "./network";

/**
 * React hook to monitor network connectivity status
 * Usage:
 *   const online = useNetworkStatus();
 *   if (!online) return <div>You are offline</div>;
 *
 * ⚠️ This hook can only be used in client components
 */
export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
