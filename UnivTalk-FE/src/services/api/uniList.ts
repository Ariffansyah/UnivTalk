export async function fetchUniversitySuggestions(
  name: string,
): Promise<string[]> {
  if (!name) return [];
  const res = await fetch(
    `https://api.arpthef.my.id/universities?name=${encodeURIComponent(name)}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (Array.isArray(data)) {
    if (typeof data[0] === "object" && "name" in data[0]) {
      return data.map((u: { name: string }) => u.name);
    }
    return data as string[];
  }
  if (Array.isArray(data.universities)) {
    if (
      typeof data.universities[0] === "object" &&
      "name" in data.universities[0]
    ) {
      return data.universities.map((u: { name: string }) => u.name);
    }
    return data.universities as string[];
  }
  return [];
}
