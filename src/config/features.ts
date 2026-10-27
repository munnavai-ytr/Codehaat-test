/**
 * Global feature flags for CodeHaat marketplace.
 * Controls progressive release of V1/V1.5/V2 capabilities.
 */
export const featureFlags = {
  chat: false,      // Real-time messenger (Enabled in Prompt 7)
  aiAgent: false,   // Offline seller AI Sales Agent (Enabled in Prompt 8)
  dealRoom: true,   // Smart Links & Deal Room view
} as const;

export type FeatureFlags = typeof featureFlags;
