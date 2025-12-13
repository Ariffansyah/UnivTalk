const API_URL =
  import.meta.env.VITE_API_URL || "https://api.arpthef.my.id";

export async function fetchUniversitySuggestions(
  name: string,
): Promise<string[]> {
  if (!name.trim()) return [];

  try {
    const base = String(API_URL).replace(/\/+$/, "");
    const res = await fetch(
      `${base}/universities?name=${encodeURIComponent(name)}`
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
      if (
        typeof item === "object" &&
        item !== null &&
        "name" in item
      ) {
        return String(item.name);
      }
      return String(item);
    });
  } catch {
    console.error("Failed to fetch university suggestions", name);
  } catch (err) {
    console.error("Failed to fetch university suggestions:", err);
    return [];
  }
}
