// Haversine formula - calculate distance between two lat/lng points in miles
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface GeoPosition {
  lat: number;
  lng: number;
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isPWA(): boolean {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

export function getCurrentPosition(options?: PositionOptions): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    // iOS requires user gesture context — ensure we're called from a click handler
    // Also iOS Safari in PWA mode needs enableHighAccuracy: true for better results
    const opts: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,       // iOS can be slow to get first fix
      maximumAge: 0,        // Don't use cached position
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            if (isIOS()) {
              message = 'Location access was denied. On iPhone, go to Settings → Privacy & Security → Location Services → Safari (or your browser) → set to "While Using". Then try again.';
            } else {
              message = 'Location access denied. Please enable location permissions in your browser settings and try again.';
            }
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable. Make sure GPS is enabled on your device.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Make sure you have a clear view of the sky and try again.';
            break;
          default:
            message = 'Unable to get your location. You can manually log this trip instead.';
        }
        reject(new Error(message));
      },
      opts
    );
  });
}

// Check if geolocation permission is already granted
export async function checkGeolocationPermission(): Promise<PermissionState | 'unavailable'> {
  if (!navigator.geolocation) return 'unavailable';
  if (!navigator.permissions) return 'unavailable';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    return 'unavailable';
  }
}
