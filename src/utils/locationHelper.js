/**
 * Location Helper for Customer App
 * Manages live GPS coordinates, local caching, and permission handling
 */

export const getCachedCustomerLocation = () => {
  try {
    const raw = localStorage.getItem("customer_live_location");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number" &&
        !isNaN(parsed.latitude) &&
        !isNaN(parsed.longitude)
      ) {
        return {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          timestamp: parsed.timestamp || Date.now(),
        };
      }
    }
  } catch (e) {
    console.debug("Failed to parse cached customer location:", e);
  }
  return null;
};

export const fetchCurrentCustomerLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const cached = getCachedCustomerLocation();
      if (cached) return resolve(cached);
      return reject(new Error("Geolocation is not supported by your browser"));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: parseFloat(position.coords.latitude.toFixed(8)),
          longitude: parseFloat(position.coords.longitude.toFixed(8)),
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        try {
          localStorage.setItem("customer_live_location", JSON.stringify(coords));
        } catch (e) {
          // ignore localStorage errors
        }
        resolve(coords);
      },
      (error) => {
        const cached = getCachedCustomerLocation();
        if (cached) {
          return resolve(cached);
        }
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: options.timeout || 8000,
        maximumAge: options.maximumAge || 60000,
      }
    );
  });
};

export const ensureCustomerLocation = async () => {
  const cached = getCachedCustomerLocation();
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached;
  }

  try {
    return await fetchCurrentCustomerLocation();
  } catch (err) {
    if (cached) return cached;
    return null;
  }
};
