"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { DistrictShape } from "@/lib/types";

function FitBounds({ shape }: { shape: DistrictShape }) {
  const map = useMap();
  useEffect(() => {
    const b = L.geoJSON(shape.geojson).getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [16, 16] });
  }, [map, shape]);
  return null;
}

export default function DistrictMapInner({
  shape,
  point,
}: {
  shape: DistrictShape;
  point: { lat: number; lon: number };
}) {
  return (
    <MapContainer
      center={[point.lat, point.lon]}
      zoom={9}
      scrollWheelZoom={false}
      className="h-80 w-full rounded-xl"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* One neutral color for every district. Never party colors. */}
      <GeoJSON
        key={shape.label}
        data={shape.geojson}
        style={{ color: "#1f5e45", weight: 3, fillColor: "#1f5e45", fillOpacity: 0.12 }}
      />
      <CircleMarker
        center={[point.lat, point.lon]}
        radius={8}
        pathOptions={{ color: "#1c262b", weight: 3, fillColor: "#ffffff", fillOpacity: 1 }}
      />
      <FitBounds shape={shape} />
    </MapContainer>
  );
}
