import { useEffect, useState, useRef, useCallback } from "react";
import api from "../lib/api";
import { io } from "socket.io-client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN   = import.meta.env.VITE_MAPBOX_TOKEN;
const GOOGLE_KEY     = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const DEFAULT_CENTER = { lat: 6.2544, lng: 6.2003 };
const STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets:   "mapbox://styles/mapbox/streets-v12",
};

let googleMapsLoaded  = false;
let googleMapsLoading = false;
let googleMapsCallbacks = [];

function loadGoogleMaps(cb) {
  if (googleMapsLoaded) return cb();
  googleMapsCallbacks.push(cb);
  if (googleMapsLoading) return;
  googleMapsLoading = true;
  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}`;
  s.async = true;
  s.onload = () => {
    googleMapsLoaded = true;
    googleMapsLoading = false;
    googleMapsCallbacks.forEach(f => f());
    googleMapsCallbacks = [];
  };
  document.head.appendChild(s);
}

export default function AdminRiderRadar() {
  const [riders,        setRiders]        = useState([]);
  const [vendors,       setVendors]       = useState([]);
  const [mapProvider,   setMapProvider]   = useState("mapbox");
  const [mapReady,      setMapReady]      = useState(false);
  const [isSatellite,   setIsSatellite]   = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showVendors,   setShowVendors]   = useState(true);
  const [sidebarTab,    setSidebarTab]    = useState("riders"); // "riders" | "vendors"

  const socketRef       = useRef(null);
  const mapContainerRef = useRef(null);
  const mapboxMapRef    = useRef(null);
  const riderMarkersRef = useRef({});
  const vendorMarkersRef= useRef({});
  const googleMapRef    = useRef(null);
  const gRiderMarkersRef= useRef({});
  const gVendorMarkersRef=useRef({});

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadRiders = useCallback(async () => {
    try {
      const res = await api.get("/admin/riders");
      setRiders(res.data || []);
    } catch (e) {
      console.error("[Radar] Riders failed:", e);
    }
  }, []);

  const loadVendors = useCallback(async () => {
    try {
      const res = await api.get("/admin/vendors");
      setVendors(res.data || []);
    } catch (e) {
      console.error("[Radar] Vendors failed:", e);
    }
  }, []);

  // ── Fly to position ───────────────────────────────────────────────────────
  const flyToRider = (rider) => {
    const loc = rider.currentLocation;
    let lat, lng;
    if (loc?.coordinates?.length === 2) { [lng, lat] = loc.coordinates; }
    else if (loc?.lat && loc?.lng)      { lat = loc.lat; lng = loc.lng; }
    else return;

    if (mapboxMapRef.current) {
      mapboxMapRef.current.flyTo({ center: [lng, lat], zoom: 18, duration: 800 });
    } else if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat, lng });
      googleMapRef.current.setZoom(18);
    }
    setSelectedRider(rider);
  };

  const flyToVendor = (vendor) => {
    const coords = vendor.location?.coordinates;
    if (!coords?.length) return;
    const [lng, lat] = coords;
    if (mapboxMapRef.current) {
      mapboxMapRef.current.flyTo({ center: [lng, lat], zoom: 18, duration: 800 });
    } else if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat, lng });
      googleMapRef.current.setZoom(18);
    }
  };

  // ── Mapbox init ───────────────────────────────────────────────────────────
  const initMapbox = useCallback(() => {
    if (!mapContainerRef.current || mapboxMapRef.current) return;
    if (!MAPBOX_TOKEN) { setMapProvider("google"); return; }
    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: STYLES.satellite,
        center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
        zoom: 14,
      });
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new mapboxgl.ScaleControl(), "bottom-left");
      map.on("load", () => { mapboxMapRef.current = map; setMapReady(true); });
      map.on("error", () => {
        map.remove();
        mapboxMapRef.current = null;
        setMapProvider("google");
      });
    } catch {
      setMapProvider("google");
    }
  }, []);

  // ── Google init ───────────────────────────────────────────────────────────
  const initGoogle = useCallback(() => {
    if (!mapContainerRef.current || googleMapRef.current) return;
    loadGoogleMaps(() => {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 14,
        mapTypeId: "hybrid",
      });
      googleMapRef.current = map;
      setMapReady(true);
    });
  }, []);

  // ── Style toggle ──────────────────────────────────────────────────────────
  const toggleStyle = useCallback(() => {
    const map = mapboxMapRef.current;
    if (!map) return;
    const next = isSatellite ? STYLES.streets : STYLES.satellite;
    map.setStyle(next);
    map.once("styledata", () => {
      setIsSatellite(s => !s);
      Object.values(riderMarkersRef.current).forEach(m => m.remove());
      Object.values(vendorMarkersRef.current).forEach(m => m.remove());
      riderMarkersRef.current  = {};
      vendorMarkersRef.current = {};
      setRiders(r => [...r]);
      setVendors(v => [...v]);
    });
  }, [isSatellite]);

  // ── Mapbox rider markers ──────────────────────────────────────────────────
  const updateMapboxRiders = useCallback((list) => {
    if (!mapboxMapRef.current) return;
    const seen = new Set();
    list.forEach(rider => {
      const loc = rider.currentLocation;
      let lat, lng;
      if (loc?.coordinates?.length === 2) { [lng, lat] = loc.coordinates; }
      else if (loc?.lat && loc?.lng)      { lat = loc.lat; lng = loc.lng; }
      else return;

      const id    = rider._id;
      const color = rider.isAvailable ? "#00D97E" : "#FFC542";
      const name  = rider.user?.name?.split(" ")[0] || "Rider";
      seen.add(id);

      if (riderMarkersRef.current[id]) {
        riderMarkersRef.current[id].setLngLat([lng, lat]);
        return;
      }

      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
      const dot = document.createElement("div");
      dot.style.cssText = `width:36px;height:36px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:17px;`;
      dot.textContent = "🛵";
      const badge = document.createElement("div");
      badge.style.cssText = "background:rgba(0,0,0,0.75);color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-top:3px;white-space:nowrap;";
      badge.textContent = name;
      el.appendChild(dot); el.appendChild(badge);

      const popup = new mapboxgl.Popup({ offset: 28, closeButton: false }).setHTML(`
        <div style="font-family:system-ui;padding:4px;min-width:130px">
          <div style="font-weight:700;font-size:13px">${rider.user?.name || "Rider"}</div>
          <div style="font-size:11px;color:${color};margin-top:2px">${rider.isAvailable ? "✅ Available" : "🔴 On delivery"}</div>
          ${rider.vehicleType ? `<div style="font-size:10px;color:#888;margin-top:3px">${rider.vehicleType}${rider.vehiclePlate ? ` · ${rider.vehiclePlate}` : ""}</div>` : ""}
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapboxMapRef.current);

      el.addEventListener("click", () => { setSelectedRider(rider); setSidebarTab("riders"); });
      riderMarkersRef.current[id] = marker;
    });

    Object.keys(riderMarkersRef.current).forEach(id => {
      if (!seen.has(id)) { riderMarkersRef.current[id].remove(); delete riderMarkersRef.current[id]; }
    });
  }, []);

  // ── Mapbox vendor markers ─────────────────────────────────────────────────
  const updateMapboxVendors = useCallback((list) => {
    if (!mapboxMapRef.current || !showVendors) return;
    const seen = new Set();

    list.forEach(vendor => {
      const coords = vendor.location?.coordinates;
      if (!coords?.length) return;
      const [lng, lat] = coords;
      const id   = vendor._id;
      seen.add(id);

      if (vendorMarkersRef.current[id]) return; // static, no need to update

      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
      const dot = document.createElement("div");
      dot.style.cssText = `width:32px;height:32px;border-radius:8px;background:#FF6B35;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:15px;`;
      dot.textContent = "🍽️";
      const badge = document.createElement("div");
      badge.style.cssText = "background:rgba(255,107,53,0.9);color:white;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px;margin-top:2px;white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;";
      badge.textContent = vendor.businessName || vendor.name || "Vendor";
      el.appendChild(dot); el.appendChild(badge);

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="font-family:system-ui;padding:4px;min-width:120px">
          <div style="font-weight:700;font-size:13px">${vendor.businessName || vendor.name}</div>
          <div style="font-size:11px;color:${vendor.isOpen ? "#00D97E" : "#999"};margin-top:2px">${vendor.isOpen ? "🟢 Open" : "🔴 Closed"}</div>
        </div>
      `);

      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapboxMapRef.current);

      el.addEventListener("click", () => setSidebarTab("vendors"));
      vendorMarkersRef.current[id] = { remove: () => {}, setLngLat: () => {} };
    });

    Object.keys(vendorMarkersRef.current).forEach(id => {
      if (!seen.has(id)) { vendorMarkersRef.current[id].remove?.(); delete vendorMarkersRef.current[id]; }
    });
  }, [showVendors]);

  // ── Google rider markers ──────────────────────────────────────────────────
  const updateGoogleRiders = useCallback((list) => {
    if (!googleMapRef.current) return;
    const seen = new Set();
    list.forEach(rider => {
      const loc = rider.currentLocation;
      let lat, lng;
      if (loc?.coordinates?.length === 2) { [lng, lat] = loc.coordinates; }
      else if (loc?.lat && loc?.lng)      { lat = loc.lat; lng = loc.lng; }
      else return;

      const id = rider._id;
      seen.add(id);
      if (gRiderMarkersRef.current[id]) {
        gRiderMarkersRef.current[id].setPosition({ lat, lng });
        return;
      }
      const m = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
        title: rider.user?.name,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 14,
          fillColor: rider.isAvailable ? "#00D97E" : "#FFC542",
          fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
      m.addListener("click", () => { setSelectedRider(rider); setSidebarTab("riders"); });
      gRiderMarkersRef.current[id] = m;
    });
    Object.keys(gRiderMarkersRef.current).forEach(id => {
      if (!seen.has(id)) { gRiderMarkersRef.current[id].setMap(null); delete gRiderMarkersRef.current[id]; }
    });
  }, []);

  // ── Google vendor markers ─────────────────────────────────────────────────
  const updateGoogleVendors = useCallback((list) => {
    if (!googleMapRef.current || !showVendors) return;
    list.forEach(vendor => {
      const coords = vendor.location?.coordinates;
      if (!coords?.length || gVendorMarkersRef.current[vendor._id]) return;
      const [lng, lat] = coords;
      const m = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
        title: vendor.businessName || vendor.name,
        icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5, fillColor: "#FF6B35", fillOpacity: 1,
          strokeColor: "#fff", strokeWeight: 2 },
      });
      gVendorMarkersRef.current[vendor._id] = m;
    });
  }, [showVendors]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapProvider === "mapbox") initMapbox(); else initGoogle();
  }, [mapProvider, initMapbox, initGoogle]);

  useEffect(() => {
    if (!mapReady) return;
    if (mapProvider === "mapbox") {
      updateMapboxRiders(riders);
      updateMapboxVendors(vendors);
    } else {
      updateGoogleRiders(riders);
      updateGoogleVendors(vendors);
    }
  }, [riders, vendors, mapReady, mapProvider,
      updateMapboxRiders, updateMapboxVendors,
      updateGoogleRiders, updateGoogleVendors]);

  useEffect(() => {
    loadRiders();
    loadVendors();
    socketRef.current = io(import.meta.env.VITE_API_URL);
    socketRef.current.on("rider_location_update", payload => {
      setRiders(prev => prev.map(r =>
        r._id === payload.riderId
          ? { ...r, currentLocation: { type: "Point", coordinates: [payload.lng, payload.lat] } }
          : r
      ));
    });
    return () => {
      socketRef.current?.disconnect();
      Object.values(riderMarkersRef.current).forEach(m => m.remove?.());
      mapboxMapRef.current?.remove();
      Object.values(gRiderMarkersRef.current).forEach(m => m.setMap?.(null));
      Object.values(gVendorMarkersRef.current).forEach(m => m.setMap?.(null));
    };
  }, [loadRiders, loadVendors]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeRiders   = riders.filter(r => r.currentLocation?.coordinates || r.currentLocation?.lat);
  const availableCount = riders.filter(r => r.isAvailable).length;
  const busyCount      = riders.filter(r => !r.isAvailable && r.currentLocation).length;
  const openVendors    = vendors.filter(v => v.isOpen).length;

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Rider Radar</h1>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {availableCount} available
          </span>
          <span className="flex items-center gap-1 text-yellow-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            {busyCount} on delivery
          </span>
          <span className="flex items-center gap-1 text-orange-500 font-medium">
            <span className="text-base">🍽️</span>
            {openVendors} vendors open
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            mapProvider === "mapbox" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
          }`}>
            {mapProvider === "mapbox" ? "Mapbox" : "Google Maps"}
          </span>
        </div>
      </div>

      {/* Main layout: map + sidebar */}
      <div className="flex gap-3 flex-1" style={{ height: "78vh" }}>

        {/* Map */}
        <div className="relative flex-1 rounded-xl shadow overflow-hidden border border-gray-200">
          <div ref={mapContainerRef} className="w-full h-full" />

          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm">Loading map…</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            <button onClick={() => { loadRiders(); loadVendors(); }}
              className="bg-white shadow-md rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
              🔄 Refresh
            </button>
            {mapProvider === "mapbox" && mapReady && (
              <button onClick={toggleStyle}
                className="bg-white shadow-md rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {isSatellite ? "🗺️ Street" : "🛰️ Satellite"}
              </button>
            )}
            <button
              onClick={() => setShowVendors(v => !v)}
              className={`shadow-md rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-1.5 ${
                showVendors ? "bg-orange-500 text-white" : "bg-white text-gray-700"
              }`}>
              🍽️ {showVendors ? "Hide" : "Show"} Vendors
            </button>
          </div>

          {/* Rider count */}
          {mapReady && (
            <div className="absolute bottom-6 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full z-10">
              {activeRiders.length} rider{activeRiders.length !== 1 ? "s" : ""} on map
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 flex flex-col bg-white rounded-xl border border-gray-200 shadow overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {["riders", "vendors"].map(tab => (
              <button key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                  sidebarTab === tab
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                {tab === "riders" ? `🛵 Riders (${riders.length})` : `🍽️ Vendors (${vendors.length})`}
              </button>
            ))}
          </div>

          {/* Rider list */}
          {sidebarTab === "riders" && (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {riders.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">No riders found</div>
              )}
              {riders.map(rider => {
                const hasLocation = !!(rider.currentLocation?.coordinates ||
                  (rider.currentLocation?.lat && rider.currentLocation?.lng));
                return (
                  <div key={rider._id}
                    onClick={() => flyToRider(rider)}
                    className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedRider?._id === rider._id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                    }`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                      rider.isAvailable ? "bg-green-500" : "bg-yellow-400"
                    }`}>
                      {rider.user?.name?.[0] || "R"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {rider.user?.name || "Rider"}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          rider.isAvailable ? "bg-green-500" : "bg-yellow-400"
                        }`} />
                        {rider.isAvailable ? "Available" : "On delivery"}
                        {rider.vehicleType && ` · ${rider.vehicleType}`}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {hasLocation
                        ? <span className="text-xs text-blue-500 font-medium">📍 Live</span>
                        : <span className="text-xs text-gray-300">Offline</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vendor list */}
          {sidebarTab === "vendors" && (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {vendors.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">No vendors found</div>
              )}
              {vendors.map(vendor => {
                const hasLocation = !!vendor.location?.coordinates?.length;
                return (
                  <div key={vendor._id}
                    onClick={() => hasLocation && flyToVendor(vendor)}
                    className={`p-3 flex items-center gap-3 ${
                      hasLocation ? "cursor-pointer hover:bg-gray-50" : "opacity-50 cursor-default"
                    } transition-colors`}>
                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">
                      🍽️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {vendor.businessName || vendor.name || "Vendor"}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          vendor.isOpen ? "bg-green-500" : "bg-gray-300"
                        }`} />
                        {vendor.isOpen ? "Open" : "Closed"}
                      </div>
                    </div>
                    {hasLocation && (
                      <span className="text-xs text-orange-500 font-medium flex-shrink-0">📍</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected rider detail */}
          {selectedRider && sidebarTab === "riders" && (
            <div className="border-t border-gray-200 p-3 bg-blue-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm">{selectedRider.user?.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {selectedRider.vehicleType || "—"}
                    {selectedRider.vehiclePlate ? ` · ${selectedRider.vehiclePlate}` : ""}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${
                    selectedRider.isAvailable ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {selectedRider.isAvailable ? "✅ Available" : "🔴 On delivery"}
                  </div>
                </div>
                <button onClick={() => setSelectedRider(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}