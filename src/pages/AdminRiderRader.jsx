import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import { io } from "socket.io-client";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export default function AdminRiderRadar() {
  const [riders, setRiders] = useState([]);
  const socketRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  useEffect(() => {
    loadRiders();

    socketRef.current = io(import.meta.env.VITE_API_URL);

    socketRef.current.on("rider_location_update", payload => {
      setRiders(prev =>
        prev.map(r =>
          r._id === payload.riderId
            ? { ...r, currentLocation: payload.location }
            : r
        )
      );
    });

    return () => socketRef.current.disconnect();
  }, []);

  const loadRiders = async () => {
    const res = await api.get("/riders");
    setRiders(res.data || []);
  };

  if (!isLoaded) return null;

  return (
    <div className="h-[80vh] rounded shadow overflow-hidden">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={{ lat: 4.8156, lng: 7.0498 }}
        zoom={12}
      >
        {riders.map(r => (
          r.currentLocation && (
            <Marker
              key={r._id}
              position={{
                lat: r.currentLocation.lat,
                lng: r.currentLocation.lng
              }}
              label={r.user?.name || "Rider"}
            />
          )
        ))}
      </GoogleMap>
    </div>
  );
}
