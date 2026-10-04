import { env } from "cloudflare:workers";
import { headers } from "next/headers";

type WorkersSubtleCrypto = SubtleCrypto & {
  timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean;
};

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.byteLength !== right.byteLength) return false;
  return (crypto.subtle as WorkersSubtleCrypto).timingSafeEqual(left, right);
}

export function isAuthorized(authorization: string | null): boolean {
  const password = env.ADMIN_PASSWORD;
  if (!password || !authorization?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(authorization.slice("Basic ".length));
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;
  return timingSafeEqual(decoded.slice(separator + 1), password);
}

// Server Actions can be invoked via POST to any route, so they cannot rely on the proxy matcher alone.
export async function requireAdmin(): Promise<void> {
  if (!isAuthorized((await headers()).get("authorization"))) {
    throw new Error("Unauthorized");
  }
}
