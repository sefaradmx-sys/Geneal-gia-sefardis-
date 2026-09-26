export function appBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

export function withBase(path: string): string {
  if (!path.startsWith("/")) {
    return path;
  }
  return `${appBasePath()}${path}`;
}
