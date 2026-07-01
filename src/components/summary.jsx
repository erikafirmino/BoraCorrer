// ===== GPX (GPS Exchange Format) =====
// Compatível com: Garmin Connect, Strava, Komoot, Google Maps, Apple Maps

export function generateGPX({ route, startTime, durationSeconds, title = 'BoraCorrer' }) {
    const start = startTime ? new Date(startTime) : new Date(Date.now() - durationSeconds * 1000);

    const trackpoints = route.map((point, index) => {
        const pointTime = new Date(start.getTime() + (index / route.length) * durationSeconds * 1000);
        return `        <trkpt lat="${point.lat}" lon="${point.lng}">
            <time>${pointTime.toISOString()}</time>
        </trkpt>`;
    }).join('\n');

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="BoraCorrer - https://bora-correr-mu.vercel.app"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
    <metadata>
        <name>${title}</name>
        <time>${start.toISOString()}</time>
    </metadata>
    <trk>
        <name>${title}</name>
        <type>running</type>
        <trkseg>
${trackpoints}
        </trkseg>
    </trk>
</gpx>`;

    return gpx;
}

// ===== TCX (Training Center XML) =====
// Compatível com: Garmin Connect, Polar Flow, Suunto App, Training Peaks

export function generateTCX({ route, startTime, durationSeconds, distanceKm, calories, title = 'BoraCorrer' }) {
    const start = startTime ? new Date(startTime) : new Date(Date.now() - durationSeconds * 1000);
    const endTime = new Date(start.getTime() + durationSeconds * 1000);
    const distanceMeters = distanceKm * 1000;

    const trackpoints = route.map((point, index) => {
        const pointTime = new Date(start.getTime() + (index / route.length) * durationSeconds * 1000);
        const distAtPoint = (index / route.length) * distanceMeters;
        return `                <Trackpoint>
                    <Time>${pointTime.toISOString()}</Time>
                    <Position>
                        <LatitudeDegrees>${point.lat}</LatitudeDegrees>
                        <LongitudeDegrees>${point.lng}</LongitudeDegrees>
                    </Position>
                    <DistanceMeters>${distAtPoint.toFixed(1)}</DistanceMeters>
                </Trackpoint>`;
    }).join('\n');

    const tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
    xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
    <Activities>
        <Activity Sport="Running">
            <Id>${start.toISOString()}</Id>
            <Lap StartTime="${start.toISOString()}">
                <TotalTimeSeconds>${durationSeconds}</TotalTimeSeconds>
                <DistanceMeters>${distanceMeters.toFixed(1)}</DistanceMeters>
                <Calories>${calories}</Calories>
                <Intensity>Active</Intensity>
                <TriggerMethod>Manual</TriggerMethod>
                <Track>
${trackpoints}
                </Track>
            </Lap>
            <Notes>${title} — BoraCorrer App</Notes>
        </Activity>
    </Activities>
</TrainingCenterDatabase>`;

    return tcx;
}

// ===== DOWNLOAD HELPER =====
export function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportGPX({ route, startTime, durationSeconds, title }) {
    if (route.length < 2) return false;
    const content = generateGPX({ route, startTime, durationSeconds, title });
    const filename = `boracorrer-${new Date().toISOString().slice(0, 10)}.gpx`;
    downloadFile(content, filename, 'application/gpx+xml');
    return true;
}

export function exportTCX({ route, startTime, durationSeconds, distanceKm, calories, title }) {
    if (route.length < 2) return false;
    const content = generateTCX({ route, startTime, durationSeconds, distanceKm, calories, title });
    const filename = `boracorrer-${new Date().toISOString().slice(0, 10)}.tcx`;
    downloadFile(content, filename, 'application/vnd.garmin.tcx+xml');
    return true;
}
