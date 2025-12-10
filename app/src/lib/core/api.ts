export const resolveEndpoint = (path: string): string => {
  const serverHost = process.env.NEXT_PUBLIC_SERVER_HOST;
  if (!serverHost) return path;

  try {
    const configured = new URL(serverHost);
    const url = new URL(path, configured);

    console.log("configured", configured);
    console.log("url", url);
    console.log("result", url.toString());
    return url.toString();
  } catch {
    return path;
  }
};
