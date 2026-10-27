"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { DistrictShape } from "@/lib/types";

const FIT_PADDING: [number, number] = [16, 16];
const INITIAL_ZOOM = 7;
const OPENSTREETMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DISTRICT_STYLE = { color: "#005ea2", weight: 3, fillColor: "#73b3e7", fillOpacity: 0.25 };

function FitBounds({ shape }: { shape: DistrictShape }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.geoJSON(shape.geojson).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: FIT_PADDING });
  }, [map, shape]);
  return null;
}

const ARKANSAS_CENTER: [number, number] = [34.8, -92.2];

export default function DistrictMapInner({ shape }: { shape: DistrictShape }) {
  return (
    <MapContainer
      center={ARKANSAS_CENTER}
      zoom={INITIAL_ZOOM}
      scrollWheelZoom={false}
      className="h-80 w-full rounded"
      attributionControl
    >
      <TileLayer
        attribution={OPENSTREETMAP_ATTRIBUTION}
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        key={shape.label}
        data={shape.geojson}
        style={DISTRICT_STYLE}
      />
      <FitBounds shape={shape} />
    </MapContainer>
  );
}
