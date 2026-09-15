import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaCrosshairs, FaMapMarkerAlt, FaCheck } from "react-icons/fa";

// Fix default marker icon issues in Leaflet with bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

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
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

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

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: initialZoom,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    let marker = null;
    if (hasCoords) {
      marker = L.marker([currentLat, currentLng], {
        draggable: true,
      }).addTo(map);

      marker.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        onChange({
          latitude: parseFloat(lat.toFixed(8)),
          longitude: parseFloat(lng.toFixed(8)),
        });
        setLocationStatus("Pin repositioned");
      });
    }

    // Click map to place/move pin
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      const roundedLat = parseFloat(lat.toFixed(8));
      const roundedLng = parseFloat(lng.toFixed(8));

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const newMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
        newMarker.on("dragend", (event) => {
          const pos = event.target.getLatLng();
          onChange({
            latitude: parseFloat(pos.lat.toFixed(8)),
            longitude: parseFloat(pos.lng.toFixed(8)),
          });
          setLocationStatus("Pin repositioned");
        });
        markerRef.current = newMarker;
      }

      onChange({ latitude: roundedLat, longitude: roundedLng });
      setLocationStatus("Pin placed at clicked location");
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    if (autoLocate && !hasCoords) {
      handleUseCurrentLocation();
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map when external coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !hasCoords) return;

    const numLat = parseFloat(latitude);
    const numLng = parseFloat(longitude);

    if (isNaN(numLat) || isNaN(numLng)) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([numLat, numLng]);
    } else {
      const newMarker = L.marker([numLat, numLng], { draggable: true }).addTo(
        mapInstanceRef.current
      );
      newMarker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        onChange({
          latitude: parseFloat(pos.lat.toFixed(8)),
          longitude: parseFloat(pos.lng.toFixed(8)),
        });
        setLocationStatus("Pin repositioned");
      });
      markerRef.current = newMarker;
    }

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
        const lat = parseFloat(position.coords.latitude.toFixed(8));
        const lng = parseFloat(position.coords.longitude.toFixed(8));

        onChange({ latitude: lat, longitude: lng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const newMarker = L.marker([lat, lng], { draggable: true }).addTo(
              mapInstanceRef.current
            );
            newMarker.on("dragend", (e) => {
              const pos = e.target.getLatLng();
              onChange({
                latitude: parseFloat(pos.lat.toFixed(8)),
                longitude: parseFloat(pos.lng.toFixed(8)),
              });
              setLocationStatus("Pin repositioned");
            });
            markerRef.current = newMarker;
          }
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
      }
    );
  };

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
        {hasCoords && (
          <span
            className="badge bg-light text-dark border d-inline-flex align-items-center gap-1"
            style={{ fontSize: "0.78rem", padding: "4px 8px" }}
          >
            <FaCheck className="text-success" size={10} />
            Lat: {parseFloat(latitude).toFixed(5)}, Lng: {parseFloat(longitude).toFixed(5)}
          </span>
        )}
      </div>

      {locationStatus && (
        <div
          className="mt-1"
          style={{ fontSize: "0.78rem", color: locationStatus.includes("denied") || locationStatus.includes("timed out") ? "#dc2626" : "#16a34a" }}
        >
          {locationStatus}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
