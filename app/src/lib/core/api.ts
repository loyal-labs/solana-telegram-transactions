export const resolveEndpoint = (path: string): string => {
  const serverHost = process.env.NEXT_PUBLIC_SERVER_HOST;
  if (!serverHost) return path;

  try {
    const configured = new URL(serverHost);
    const current = new URL(window.location.origin);
    const hostsMatch =
      configured.protocol === current.protocol &&
      configured.host === current.host;
    return hostsMatch ? new URL(path, configured).toString() : path;
  } catch {
    return path;
  }
};
