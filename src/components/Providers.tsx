"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// ponytail: one global client, default options. ceiling: no retry/staleTime
// tuning. upgrade: tune defaults when load matters.
export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
