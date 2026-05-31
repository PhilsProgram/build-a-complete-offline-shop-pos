export const API_BASE_URL =
  "http://localhost:4000";

export function getImageUrl(
  path?: string | null,
) {
  if (!path) return "";

  if (path.startsWith("http")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}