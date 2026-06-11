"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { AuthProvider } from "@/lib/auth-context";

const theme = createTheme({
  primaryColor: "indigo",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  headings: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  defaultRadius: "md",
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MantineProvider theme={theme}>{children}</MantineProvider>
    </AuthProvider>
  );
}
