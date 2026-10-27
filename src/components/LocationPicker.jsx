import React, { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaCrosshairs, FaMapMarkerAlt, FaCheck } from "react-icons/fa";

// Fix default marker icon issues in Leaflet with bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

/**
 * Free map styles (no API key, no signup).
 * Order in FALLBACK_ORDER = order the picker tries if a provider stops responding.
 */
const MAP_STYLES = {
  streets: {
    label: "Streets",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      maxNativeZoom: 13, // detailed data missing beyond this in India, so stretch tiles instead of showing blanks
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    },
  },
  light: {
    label: "Light",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      maxNativeZoom: 13,
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    },
  },
  topo: {
    label: "Topo",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      maxNativeZoom: 13,
      attribution: "Tiles &copy; Esri",
    },
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      maxNativeZoom: 17,
      attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics",
    },
    // Road and place name labels drawn on top (free, no key)
    overlays: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    ],
  },
  osm: {
    label: "Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
};

const FALLBACK_ORDER = ["satellite", "osm", "streets", "light", "topo"];
const ERROR_LIMIT = 6; // tile errors before auto-switching provider

const roundCoord = (n) => parseFloat(Number(n).toFixed(8));

const LocationPicker = ({
  latitude,
  longitude,
  onChange,
  label = "Delivery GPS Location",
  height = "250px",
  autoLocate = false,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const tileErrorsRef = useRef(0);
  const styleKeyRef = useRef("satellite");
  const onChangeRef = useRef(onChange);

  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [styleKey, setStyleKey] = useState("satellite");

  // Always call the latest onChange (avoids stale closures inside map handlers)
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const hasCoords =
    latitude !== null &&
    latitude !== undefined &&
    latitude !== "" &&
    longitude !== null &&
    longitude !== undefined &&
    longitude !== "";

  const currentLat = hasCoords ? parseFloat(latitude) : 23.0225; // Default Ahmedabad / India
  const currentLng = hasCoords ? parseFloat(longitude) : 72.5714;
  const initialZoom = hasCoords ? 15 : 6;

  // Create / move the draggable marker
  const placeMarker = useCallback((lat, lng) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      return;
    }

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      onChangeRef.current?.({
        latitude: roundCoord(pos.lat),
        longitude: roundCoord(pos.lng),
      });
      setLocationStatus("Pin repositioned");
    });
    markerRef.current = marker;
  }, []);

  // Switch the tile layer
  const applyStyle = useCallback((key) => {
    const map = mapInstanceRef.current;
    const def = MAP_STYLES[key];
    if (!map || !def) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileErrorsRef.current = 0;
    styleKeyRef.current = key;

    const layer = L.tileLayer(def.url, {
      ...def.options,
      crossOrigin: true,
    });

    // Auto-fallback: if a provider is down/blocked, move to the next one
    layer.on("tileerror", () => {
      tileErrorsRef.current += 1;
      if (tileErrorsRef.current === ERROR_LIMIT) {
        const idx = FALLBACK_ORDER.indexOf(styleKeyRef.current);
        const next = FALLBACK_ORDER[(idx + 1) % FALLBACK_ORDER.length];
        setLocationStatus(
          `Map style unavailable, switched to "${MAP_STYLES[next].label}"`,
        );
        setStyleKey(next);
      }
    });

    const overlayLayers = (def.overlays || []).map((url) =>
      L.tileLayer(url, { maxZoom: 19, maxNativeZoom: 17, zIndex: 10 }),
    );
    const group = L.layerGroup([layer, ...overlayLayers]);
    group.addTo(map);
    tileLayerRef.current = group;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: initialZoom,
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    applyStyle(styleKeyRef.current);

    // Make sure it renders correctly inside modals/accordions
    const t = setTimeout(() => map.invalidateSize(), 250);

    if (hasCoords) placeMarker(currentLat, currentLng);

    // Click map to place/move pin
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);
      onChangeRef.current?.({
        latitude: roundCoord(lat),
        longitude: roundCoord(lng),
      });
      setLocationStatus("Pin placed at clicked location");
    });

    if (autoLocate && !hasCoords) {
      handleUseCurrentLocation();
    }

    return () => {
      clearTimeout(t);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to style changes (user click or auto-fallback)
  useEffect(() => {
    if (mapInstanceRef.current && styleKey !== styleKeyRef.current) {
      applyStyle(styleKey);
    }
  }, [styleKey, applyStyle]);

  // Update map when external coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !hasCoords) return;

    const numLat = parseFloat(latitude);
    const numLng = parseFloat(longitude);
    if (isNaN(numLat) || isNaN(numLng)) return;

    placeMarker(numLat, numLng);
    mapInstanceRef.current.setView([numLat, numLng], 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  // Request browser GPS position
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    setLocationStatus("Detecting current GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = roundCoord(position.coords.latitude);
        const lng = roundCoord(position.coords.longitude);

        onChangeRef.current?.({ latitude: lat, longitude: lng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          placeMarker(lat, lng);
        }

        setLocating(false);
        setLocationStatus("Location detected using device GPS!");
      },
      (error) => {
        setLocating(false);
        let msg = "Could not get current location.";
        if (error.code === 1) msg = "Location permission denied.";
        if (error.code === 2) msg = "Position unavailable.";
        if (error.code === 3) msg = "Location request timed out.";
        setLocationStatus(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const isError =
    locationStatus.includes("denied") ||
    locationStatus.includes("timed out") ||
    locationStatus.includes("unavailable") ||
    locationStatus.includes("not supported") ||
    locationStatus.includes("Could not");

  return (
    <div className="location-picker-wrap pf-field--full mb-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <label className="pf-label mb-0 d-flex align-items-center gap-1 fw-semibold">
          <FaMapMarkerAlt className="text-brand-green" /> {label}
        </label>
        <button
          type="button"
          className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-2"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          style={{ fontSize: "0.8rem", borderRadius: "8px", fontWeight: "600" }}
        >
          {locating ? (
            <span className="spinner-border spinner-border-sm" role="status" />
          ) : (
            <FaCrosshairs />
          )}
          {locating ? "Locating..." : "Use Current GPS Location"}
        </button>
      </div>

      {/* Map style switcher */}
      <div className="d-flex flex-wrap gap-1 mb-2">
        {Object.entries(MAP_STYLES).map(([key, def]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStyleKey(key)}
            className={`btn btn-sm ${styleKey === key ? "btn-success" : "btn-outline-secondary"}`}
            style={{
              fontSize: "0.72rem",
              borderRadius: "6px",
              padding: "2px 10px",
            }}
          >
            {def.label}
          </button>
        ))}
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height,
          borderRadius: "10px",
          border: "1.5px solid #e2e8f0",
          overflow: "hidden",
          zIndex: 1,
        }}
      />

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
        <small className="text-muted" style={{ fontSize: "0.78rem" }}>
          💡 Click map or drag pin to fine-tune exact delivery point.
        </small>
        {hasCoords &&
          !isNaN(parseFloat(latitude)) &&
          !isNaN(parseFloat(longitude)) && (
            <span
              className="badge bg-light text-dark border d-inline-flex align-items-center gap-1"
              style={{ fontSize: "0.78rem", padding: "4px 8px" }}
            >
              <FaCheck className="text-success" size={10} />
              Lat: {parseFloat(latitude).toFixed(5)}, Lng:{" "}
              {parseFloat(longitude).toFixed(5)}
            </span>
          )}
      </div>

      {locationStatus && (
        <div
          className="mt-1"
          style={{
            fontSize: "0.78rem",
            color: isError ? "#dc2626" : "#16a34a",
          }}
        >
          {locationStatus}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
