const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 dakika

export async function fetchWithCache<T>(url: string): Promise<T> {
  const now = Date.now();
  
  // Eğer önbellekte varsa ve süresi dolmadıysa doğrudan onu dön
  if (cache[url] && (now - cache[url].timestamp < CACHE_TTL)) {
    return cache[url].data as T;
  }

  // Yoksa veya süresi dolduysa yeni istek at
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Ağ hatası: ${res.status}`);
  }
  
  const data = await res.json();
  
  // Önbelleğe kaydet
  cache[url] = {
    data,
    timestamp: now,
  };
  
  return data as T;
}
