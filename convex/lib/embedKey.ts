const EMBED_KEY_PREFIX = "wk_";

export function generateEmbedKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${EMBED_KEY_PREFIX}${token}`;
}

export function getEmbedKeyPrefix(plainKey: string): string {
  return plainKey.slice(0, 12);
}

export async function hashEmbedKey(plainKey: string): Promise<string> {
  const data = new TextEncoder().encode(plainKey);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyEmbedKey(
  plainKey: string,
  storedHash: string,
): Promise<boolean> {
  const hash = await hashEmbedKey(plainKey);
  return hash === storedHash;
}

export const defaultWidgetSettings = {
  primaryColor: "#2563eb",
  position: "bottom-right" as const,
  title: "Chat with us",
  borderRadius: 12,
  marginBottom: 16,
  marginSide: 16,
  soundEnabled: true,
  proactiveEnabled: false,
  proactiveDelayMs: 5000,
  leadCaptureEnabled: false,
  leadCaptureRequired: false,
  faqShortcuts: [] as string[],
};
