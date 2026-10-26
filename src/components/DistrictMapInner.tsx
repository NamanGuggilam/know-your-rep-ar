"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { DistrictShape } from "@/lib/types";

function FitBounds({ shape }: { shape: DistrictShape }) {
  const map = useMap();
  useEffect(() => {
    const b = L.geoJSON(shape.geojson).getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [16, 16] });
  }, [map, shape]);
  return null;
}

// Center of Arkansas, used until the district outline loads.
const ARKANSAS: [number, number] = [34.8, -92.2];

export default function DistrictMapInner({ shape }: { shape: DistrictShape }) {
  return (
    <MapContainer
      center={ARKANSAS}
      zoom={7}
      scrollWheelZoom={false}
      className="h-80 w-full rounded"
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
        style={{ color: "#8c7fc4", weight: 3, fillColor: "#a99bd6", fillOpacity: 0.18 }}
      />
      <FitBounds shape={shape} />
    </MapContainer>
  );
}
