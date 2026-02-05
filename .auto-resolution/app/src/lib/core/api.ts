export function resolveEndpoint(path: string): string {
  const serverHost = process.env.NEXT_PUBLIC_SERVER_HOST;
  if (!serverHost) return path;

  try {
    const url = new URL(path, serverHost);
    return url.toString();
  } catch {
    return path;
  }
}
