import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './runmap.css';

// Corrige o problema do Leaflet no PWA onde os ícones padrão
// tentam carregar arquivos PNG de caminhos que o service worker não encontra
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const START_ICON_COLOR = '#22c55e';
const CURRENT_ICON_COLOR = '#3b82f6';

function createDotIcon(color, size = 16) {
    return L.divIcon({
        className: '',
        html: `<div style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
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

        const initialCenter = route.length > 0
            ? [route[0].lat, route[0].lng]
            : [-3.7172, -38.5433]; // Fortaleza como fallback

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            // Desabilita animações que podem causar problemas no PWA
            fadeAnimation: false,
            zoomAnimation: false
        }).setView(initialCenter, 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            // Crossorigin necessário para o service worker não bloquear os tiles
            crossOrigin: true
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
            startMarkerRef.current = null;
            currentMarkerRef.current = null;
            polylineRef.current = null;
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
            startMarkerRef.current = L.marker(
                [firstPoint.lat, firstPoint.lng],
                { icon: createDotIcon(START_ICON_COLOR, 14) }
            ).addTo(map);
        }

        if (!currentMarkerRef.current) {
            currentMarkerRef.current = L.marker(
                [lastPoint.lat, lastPoint.lng],
                { icon: createDotIcon(CURRENT_ICON_COLOR, 18) }
            ).addTo(map);
        } else {
            currentMarkerRef.current.setLatLng([lastPoint.lat, lastPoint.lng]);
        }

        map.panTo([lastPoint.lat, lastPoint.lng]);
    }, [route]);

    // Força o mapa a recalcular o tamanho ao ser exibido
    // (necessário quando o container estava oculto no PWA)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        setTimeout(() => map.invalidateSize(), 100);
    });

    return <div ref={mapContainerRef} className="run-map-container" />;
}
