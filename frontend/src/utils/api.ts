export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

export function getImageUrl(
  path?: string | null,
) {
  if (!path) return "";

  if (path.startsWith("http")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}