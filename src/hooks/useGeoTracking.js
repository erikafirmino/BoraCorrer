import { useState, useRef, useCallback } from 'react';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

function distanceBetweenPoints(pointA, pointB) {
    const deltaLat = toRadians(pointB.lat - pointA.lat);
    const deltaLng = toRadians(pointB.lng - pointA.lng);

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRadians(pointA.lat)) *
            Math.cos(toRadians(pointB.lat)) *
            Math.sin(deltaLng / 2) *
            Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
}

export function useGeoTracking() {
    const [route, setRoute] = useState([]);
    const [distanceMeters, setDistanceMeters] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState(null);

    const watchIdRef = useRef(null);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocalização não é suportada neste dispositivo.');
            return;
        }

        setRoute([]);
        setDistanceMeters(0);
        setError(null);
        setIsTracking(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const newPoint = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                setRoute((prevRoute) => {
                    if (prevRoute.length > 0) {
                        const lastPoint = prevRoute[prevRoute.length - 1];
                        const segmentDistance = distanceBetweenPoints(lastPoint, newPoint);

                        if (segmentDistance > 2) {
                            setDistanceMeters((prevDistance) => prevDistance + segmentDistance);
                            return [...prevRoute, newPoint];
                        }

                        return prevRoute;
                    }

                    return [newPoint];
                });
            },
            (geoError) => {
                setError(`Não foi possível acessar o GPS: ${geoError.message}`);
                setIsTracking(false);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 10000
            }
        );
    }, []);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    }, []);

    const resetTracking = useCallback(() => {
        stopTracking();
        setRoute([]);
        setDistanceMeters(0);
        setError(null);
    }, [stopTracking]);

    const distanceKm = distanceMeters / 1000;

    return {
        route,
        distanceMeters,
        distanceKm,
        isTracking,
        error,
        startTracking,
        stopTracking,
        resetTracking
    };
}
