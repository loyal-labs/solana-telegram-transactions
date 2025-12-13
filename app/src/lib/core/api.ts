export const resolveEndpoint = (path: string): string => {
  const serverHost = process.env.NEXT_PUBLIC_SERVER_HOST;
  if (!serverHost) return path;

  try {
    const configured = new URL(serverHost);
    const url = new URL(path, configured);

    return url.toString();
  } catch {
    return path;
  }
};
