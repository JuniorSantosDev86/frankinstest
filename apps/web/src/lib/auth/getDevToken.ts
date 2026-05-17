export function getDevToken(): string | null {
  return process.env.NEXT_PUBLIC_DEV_TOKEN ?? null
}
