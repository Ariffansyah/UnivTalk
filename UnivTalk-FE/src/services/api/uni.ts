const API_URL = import.meta.env.VITE_API_URL;

export async function fetchUniversitySuggestions(
  name: string,
): Promise<string[]> {
  if (!name) return [];

  try {
    const res = await fetch(
      `${API_URL}/universities?name=${encodeURIComponent(name)}`,
    );

    if (!res.ok) return [];

    const data = await res.json();
    let list: any[] = [];

    if (Array.isArray(data)) {
      list = data;
    } else if (data && Array.isArray(data.universities)) {
      list = data.universities;
    }

    return list.map((item) => {
      if (typeof item === "object" && item !== null && "name" in item) {
        return item.name;
      }
      return String(item);
    });
  } catch {
    return [];
  }
}
