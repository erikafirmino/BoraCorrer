import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './runmap.css';

const START_ICON_COLOR = '#22c55e';
const CURRENT_ICON_COLOR = '#3b82f6';

function createDotIcon(color) {
    return L.divIcon({
        className: 'run-map-dot',
        html: `<span style="background:${color};"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
}

export default function RunMap({ route }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const polylineRef = useRef(null);
    const startMarkerRef = useRef(null);
    const currentMarkerRef = useRef(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const initialCenter = route.length > 0 ? [route[0].lat, route[0].lng] : [-23.5505, -46.6333];

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView(initialCenter, 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;

        polylineRef.current = L.polyline([], {
            color: '#22c55e',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        const polyline = polylineRef.current;

        if (!map || !polyline || route.length === 0) return;

        const latLngs = route.map((point) => [point.lat, point.lng]);
        polyline.setLatLngs(latLngs);

        const firstPoint = route[0];
        const lastPoint = route[route.length - 1];

        if (!startMarkerRef.current) {
            startMarkerRef.current = L.marker([firstPoint.lat, firstPoint.lng], {
                icon: createDotIcon(START_ICON_COLOR)
            }).addTo(map);
        }

        if (!currentMarkerRef.current) {
            currentMarkerRef.current = L.marker([lastPoint.lat, lastPoint.lng], {
                icon: createDotIcon(CURRENT_ICON_COLOR)
            }).addTo(map);
        } else {
            currentMarkerRef.current.setLatLng([lastPoint.lat, lastPoint.lng]);
        }

        map.panTo([lastPoint.lat, lastPoint.lng]);
    }, [route]);

    return <div ref={mapContainerRef} className="run-map-container" />;
}
