// GPS Tracker Dashboard JavaScript

let map;
let marker;
let trackingEnabled = true;
// Live vs Import getrennt halten
let livePositionHistory = []; // {lat, lon, ts?, speed?}
let liveHistoryMarkers = [];
let livePolyline;

let importPositionHistory = [];
let importHistoryMarkers = [];
let importPolyline;

let showPolyline = false; // false = Punkte, true = Linie (visual mode applies per active view)
let activeView = 'live'; // 'live' or 'import' - which area is currently shown
// Begrenzungs-Option für maximale Anzahl gespeicherter Punkte
let useLimit = false; // false = unbegrenzt, true = begrenzen
let maxPoints = 50; // Standardlimit

// Initialisierung der Karte
function initMap() {
    // Erstelle Karte mit Standardposition (Berlin)
    map = L.map('map').setView([52.520008, 13.404954], 13);

    // OpenStreetMap Tile Layer hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Custom Marker Icon
    const trackerIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Marker zur Karte hinzufügen
    marker = L.marker([52.520008, 13.404954], {icon: trackerIcon}).addTo(map);
    marker.bindPopup("<b>GPS Tracker</b><br>Aktuelle Position").openPopup();

    // Historie wird als einzelne Marker angezeigt (keine Verbindungslinie)
    // Polyline vorbereiten (wird nur sichtbar, wenn showPolyline === true)
    livePolyline = L.polyline([], {
        color: 'blue',
        weight: 3,
        opacity: 0.7
    });
    importPolyline = L.polyline([], {
        color: 'green',
        weight: 3,
        opacity: 0.7
    });
}

// Aktuelle Position vom Server abrufen
async function updatePosition() {
    try {
        const response = await fetch('/api/current-position');
        const data = await response.json();
        
        // Karte und Marker aktualisieren
        const newLatLng = [data.lat, data.lon];
        marker.setLatLng(newLatLng);
        
        // Popup aktualisieren
        marker.bindPopup(`
            <b>GPS Tracker</b><br>
            Position: ${data.lat.toFixed(6)}, ${data.lon.toFixed(6)}<br>
            Geschwindigkeit: ${data.speed} km/h<br>
            Höhe: ${data.altitude} m
        `);

        // Wenn Auto-Tracking aktiviert ist, Karte zentrieren
        if (trackingEnabled) {
            map.setView(newLatLng, map.getZoom());
        }

    // Position zur Live-Historie hinzufügen (speichere Timestamp falls vorhanden)
    const ts = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();
    livePositionHistory.push({lat: data.lat, lon: data.lon, ts: ts, speed: data.speed});

    if (showPolyline) {
        // Polyline-Modus: aktualisiere und zeige die Live-Polyline
        livePolyline.setLatLngs(livePositionHistory.map(p => [p.lat, p.lon]));
        if (!map.hasLayer(livePolyline)) {
            livePolyline.addTo(map);
        }
        // Blende Live-Punkt-Marker aus (sie bleiben im Array erhalten)
        liveHistoryMarkers.forEach(m => {
            if (map.hasLayer(m)) map.removeLayer(m);
        });
    } else {
        // Punkte-Modus: entferne Live-Polyline (falls vorhanden) und füge neuen Punkt-Marker hinzu
        if (map.hasLayer(livePolyline)) {
            map.removeLayer(livePolyline);
        }

        const historyMarker = L.circleMarker([data.lat, data.lon], {
            radius: 4,
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.7
        }).addTo(map);
        liveHistoryMarkers.push(historyMarker);
    }

    // Wenn Begrenzung aktiv ist, entferne ältere Einträge für Live-Historie
    if (useLimit) {
        while (livePositionHistory.length > maxPoints) {
            // Entferne älteste Position
            livePositionHistory.shift();
            // Entferne ältesten Marker, falls im Punkte-Modus
            if (liveHistoryMarkers.length > 0) {
                const old = liveHistoryMarkers.shift();
                if (map.hasLayer(old)) map.removeLayer(old);
            }
        }
        // Bei Polyline-Modus sicherstellen, dass Polyline mit dem getrimmten Array übereinstimmt
        if (showPolyline) {
            livePolyline.setLatLngs(livePositionHistory.map(p => [p.lat, p.lon]));
        }
    }

        // UI aktualisieren
        document.getElementById('current-lat').textContent = data.lat.toFixed(6);
        document.getElementById('current-lon').textContent = data.lon.toFixed(6);
        document.getElementById('current-speed').textContent = data.speed;
        document.getElementById('current-altitude').textContent = data.altitude;
        document.getElementById('current-location').textContent = data.location || 'Unbekannt';

        // Statistiken aktualisieren
        updateStatistics();
    } catch (error) {
        console.error('Fehler beim Abrufen der Position:', error);
    }
}

// Tracker-Status vom Server abrufen
async function updateTrackerStatus() {
    try {
        const response = await fetch('/api/tracker-status');
        const data = await response.json();

        // Status Badge aktualisieren
        const statusBadge = document.getElementById('status-badge');
        if (data.online) {
            statusBadge.textContent = 'Online';
            statusBadge.className = 'badge bg-success';
        } else {
            statusBadge.textContent = 'Offline';
            statusBadge.className = 'badge bg-danger';
        }

        // Batterie aktualisieren
        document.getElementById('battery-level').textContent = data.battery + '%';
        const batteryBar = document.getElementById('battery-bar');
        batteryBar.style.width = data.battery + '%';
        
        // Batterie-Farbe je nach Level
        if (data.battery > 50) {
            batteryBar.className = 'progress-bar bg-success';
        } else if (data.battery > 20) {
            batteryBar.className = 'progress-bar bg-warning';
        } else {
            batteryBar.className = 'progress-bar bg-danger';
        }

        // Signal-Stärke aktualisieren
        document.getElementById('signal-strength').textContent = data.signal_strength + '%';

        // Letzte Aktualisierung
        const lastUpdate = new Date(data.last_update);
        document.getElementById('last-update').textContent = lastUpdate.toLocaleString('de-DE');

    } catch (error) {
        console.error('Fehler beim Abrufen des Status:', error);
    }
}

// Statistiken aktualisieren
function updateStatistics() {
    // Max. Geschwindigkeit (simuliert)
    const maxSpeed = Math.floor(Math.random() * 120) + 30;
    document.getElementById('stat-max-speed').textContent = maxSpeed;

    // Zurückgelegte Strecke (simuliert)
    const distance = (Math.random() * 50).toFixed(1);
    document.getElementById('stat-distance').textContent = distance;

    // Dauer (simuliert)
    const hours = Math.floor(Math.random() * 5);
    const minutes = Math.floor(Math.random() * 60);
    document.getElementById('stat-duration').textContent = `${hours}h ${minutes}m`;

    // Erfasste Punkte
    document.getElementById('stat-points').textContent = positionHistory.length;
}

// Hilfsfunktion: Haversine-Distanz in Kilometern
function haversineKm(aLat, aLon, bLat, bLon) {
    const toRad = v => v * Math.PI / 180;
    const R = 6371; // Erdradius km
    const dLat = toRad(bLat - aLat);
    const dLon = toRad(bLon - aLon);
    const lat1 = toRad(aLat);
    const lat2 = toRad(bLat);
    const sinDLat = Math.sin(dLat/2);
    const sinDLon = Math.sin(dLon/2);
    const a = sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLon*sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Aktualisiere Statistiken basierend auf positionHistory: Distanz und Dauer
function updateStatistics() {
    // Wähle die aktuell sichtbare History (live oder importiert)
    const hist = (activeView === 'live') ? livePositionHistory : importPositionHistory;

    // Berechne Strecke (km) aus aufeinanderfolgenden Punkten
    let totalKm = 0;
    for (let i = 1; i < hist.length; i++) {
        const a = hist[i-1];
        const b = hist[i];
        totalKm += haversineKm(a.lat, a.lon, b.lat, b.lon);
    }
    document.getElementById('stat-distance').textContent = totalKm.toFixed(2);

    // Berechne Gesamtdauer zwischen erstem und letztem Timestamp, falls vorhanden
    let durationText = '0h 0m';
    if (hist.length >= 2) {
        const first = hist[0].ts ? new Date(hist[0].ts) : null;
        const last = hist[hist.length-1].ts ? new Date(hist[hist.length-1].ts) : null;
        if (first && last && !isNaN(first) && !isNaN(last)) {
            const diffMs = Math.max(0, last - first);
            const diffMin = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMin / 60);
            const minutes = diffMin % 60;
            durationText = `${hours}h ${minutes}m`;
        }
    }
    document.getElementById('stat-duration').textContent = durationText;

    // Max Speed: falls vorhanden in Daten, sonst '-'
    let maxSpeed = 0;
    for (const p of hist) {
        if (p.speed && !isNaN(p.speed)) maxSpeed = Math.max(maxSpeed, Number(p.speed));
    }
    document.getElementById('stat-max-speed').textContent = (maxSpeed === 0) ? '-' : Math.round(maxSpeed);

    // Erfasste Punkte
    document.getElementById('stat-points').textContent = hist.length;
}

// Karte auf Tracker zentrieren
function centerMap() {
    if (marker) {
        map.setView(marker.getLatLng(), 15);
    }
}

// Auto-Tracking umschalten
function toggleTracking() {
    trackingEnabled = !trackingEnabled;
    const button = event.target;
    
    if (trackingEnabled) {
        button.innerHTML = '<i class="bi bi-pause-circle"></i> Auto-Tracking';
        button.className = 'btn btn-outline-secondary w-100 mb-2';
    } else {
        button.innerHTML = '<i class="bi bi-play-circle"></i> Auto-Tracking';
        button.className = 'btn btn-success w-100 mb-2';
    }
}

// --- File import / drag & drop for CSV / Excel (SheetJS) ---
function detectLatLonKeys(row) {
    // Return [latKey, lonKey] or [null,null]
    const keys = Object.keys(row || {});
    const lower = keys.map(k => k.toLowerCase());
    const latCandidates = ['lat', 'latitude'];
    const lonCandidates = ['lon', 'lng', 'longitude', 'long'];

    let latKey = null, lonKey = null;
    for (let i = 0; i < lower.length; i++) {
        const k = lower[i];
        if (!latKey && latCandidates.some(c => k.includes(c))) latKey = keys[i];
        if (!lonKey && lonCandidates.some(c => k.includes(c))) lonKey = keys[i];
    }
    return [latKey, lonKey];
}

function handleImportedPoints(points) {
    // points: array of [lat, lon]
    if (!points || points.length === 0) return;

    // Add to positionHistory and map according to showPolyline
    points.forEach(p => {
        const lat = parseFloat(p[0]);
        const lon = parseFloat(p[1]);
        const rawTs = p[2] || null;
        const speed = (p.length > 3 ? p[3] : null);
        if (isNaN(lat) || isNaN(lon)) return;
        const ts = rawTs ? (new Date(rawTs)).toISOString() : null;
        importPositionHistory.push({lat: lat, lon: lon, ts: ts, speed: speed});
        if (showPolyline) {
            // update import polyline
            importPolyline.setLatLngs(importPositionHistory.map(pt => [pt.lat, pt.lon]));
            if (!map.hasLayer(importPolyline)) importPolyline.addTo(map);
        } else {
            const m = L.circleMarker([lat, lon], {radius:4, color:'green', fillColor:'green', fillOpacity:0.7}).addTo(map);
            importHistoryMarkers.push(m);
        }
    });

    // Apply limit if active
    if (useLimit) {
        while (importPositionHistory.length > maxPoints) {
            importPositionHistory.shift();
            if (importHistoryMarkers.length > 0) {
                const old = importHistoryMarkers.shift();
                if (map.hasLayer(old)) map.removeLayer(old);
            }
        }
        if (showPolyline) importPolyline.setLatLngs(importPositionHistory.map(p => [p.lat, p.lon]));
    }

    // Fit bounds to imported track
    try {
        const bounds = L.latLngBounds(points.map(p => [parseFloat(p[0]), parseFloat(p[1])]).filter(p=>!isNaN(p[0]) && !isNaN(p[1])));
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
    } catch (e) {}

    // Update stats/UI
    updateStatistics();
    const status = document.getElementById('gps-import-status');
    if (status) status.textContent = `Importiert ${points.length} Punkte`;
}

function parseFile(file) {
    const status = document.getElementById('gps-import-status');
    if (status) status.textContent = `Lese ${file.name} ...`;

    const reader = new FileReader();
    reader.onload = function(e) {
        let data = e.target.result;
        let workbook;
        try {
            // ArrayBuffer works for xlsx and csv
            workbook = XLSX.read(data, {type: 'array'});
        } catch (err) {
            try {
                workbook = XLSX.read(data, {type: 'binary'});
            } catch (err2) {
                if (status) status.textContent = 'Fehler beim Lesen der Datei';
                console.error(err2);
                return;
            }
        }

        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const json = XLSX.utils.sheet_to_json(sheet, {defval: null});
        if (!json || json.length === 0) {
            if (status) status.textContent = 'Keine Daten in Datei gefunden';
            return;
        }

        const [latKey, lonKey] = detectLatLonKeys(json[0]);
        if (!latKey || !lonKey) {
            if (status) status.innerHTML = 'Konnte Latitude/Longitude-Spalten nicht erkennen. Erwartete Spaltennamen wie <code>lat</code>, <code>latitude</code>, <code>lon</code>, <code>lng</code>.';
            return;
        }

        // Versuche, Zeit- und Speed-Spalten zu erkennen
        const keys = Object.keys(json[0]);
        const lower = keys.map(k => k.toLowerCase());
        const timeCandidates = ['time','timestamp','datetime','date','time_utc','ts'];
        const speedCandidates = ['speed','velocity'];
        let timeKey = null, speedKey = null;
        for (let i = 0; i < lower.length; i++) {
            const k = lower[i];
            if (!timeKey && timeCandidates.some(c => k.includes(c))) timeKey = keys[i];
            if (!speedKey && speedCandidates.some(c => k.includes(c))) speedKey = keys[i];
        }

        // Build points array: [lat, lon, ts?, speed?]
        const points = json.map(r => [r[latKey], r[lonKey], timeKey ? r[timeKey] : null, speedKey ? r[speedKey] : null])
                          .filter(p => p[0] !== null && p[1] !== null);
        handleImportedPoints(points);
    };
    reader.readAsArrayBuffer(file);
}

function setupImportUi() {
    const drop = document.getElementById('gps-drop-area');
    const input = document.getElementById('gps-file-input');
    const status = document.getElementById('gps-import-status');

    if (drop) {
        drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('border-primary'); });
        drop.addEventListener('dragleave', (e) => { e.preventDefault(); drop.classList.remove('border-primary'); });
        drop.addEventListener('drop', (e) => {
            e.preventDefault(); drop.classList.remove('border-primary');
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                parseFile(files[0]);
            }
        });
    }

    if (input) {
        input.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (f) parseFile(f);
        });
    }
}

// Kartenansicht umschalten (zwischen OpenStreetMap und Satellit)
let satelliteView = false;
let currentTileLayer;

function toggleSatellite() {
    satelliteView = !satelliteView;
    
    if (satelliteView) {
        // Entferne aktuellen Layer
        map.eachLayer(function(layer) {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        
        // Füge Satellitenansicht hinzu
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        }).addTo(map);
    } else {
        // Entferne aktuellen Layer
        map.eachLayer(function(layer) {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        
        // Füge Standard OpenStreetMap hinzu
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
    }
}

// Wechsel zwischen Live- und Import-Ansicht
function switchView(view) {
    if (!map) return;
    activeView = view === 'import' ? 'import' : 'live';
    // Update tab active classes
    const liveTab = document.getElementById('live-tab');
    const importTab = document.getElementById('import-tab');
    if (liveTab && importTab) {
        if (activeView === 'live') {
            liveTab.classList.add('active');
            importTab.classList.remove('active');
        } else {
            importTab.classList.add('active');
            liveTab.classList.remove('active');
        }
    }

    // Determine which layer sets to show/hide
    const livePL = livePolyline;
    const importPL = importPolyline;

    // Hide both first
    if (map.hasLayer(livePL)) map.removeLayer(livePL);
    if (map.hasLayer(importPL)) map.removeLayer(importPL);
    liveHistoryMarkers.forEach(m => { if (map.hasLayer(m)) map.removeLayer(m); });
    importHistoryMarkers.forEach(m => { if (map.hasLayer(m)) map.removeLayer(m); });

    // Show relevant layers
    if (activeView === 'live') {
        if (showPolyline) {
            if (livePositionHistory.length > 0) {
                livePL.setLatLngs(livePositionHistory.map(p => [p.lat, p.lon]));
                map.addLayer(livePL);
            }
        } else {
            liveHistoryMarkers.forEach(m => { if (!map.hasLayer(m)) m.addTo(map); });
        }
    } else {
        if (showPolyline) {
            if (importPositionHistory.length > 0) {
                importPL.setLatLngs(importPositionHistory.map(p => [p.lat, p.lon]));
                map.addLayer(importPL);
            }
        } else {
            importHistoryMarkers.forEach(m => { if (!map.hasLayer(m)) m.addTo(map); });
        }
    }

    // Update statistics for the active view
    updateStatistics();
}

// Visual Mode umschalten: Punkte <-> Linie
function toggleVisualMode() {
    showPolyline = !showPolyline;
    const btn = document.getElementById('toggle-visual-mode');
    const curHist = (activeView === 'live') ? livePositionHistory : importPositionHistory;
    const curMarkers = (activeView === 'live') ? liveHistoryMarkers : importHistoryMarkers;
    const curPolyline = (activeView === 'live') ? livePolyline : importPolyline;

    if (showPolyline) {
        // Zeige Polyline für die aktuelle Ansicht
        btn.innerHTML = '<i class="bi bi-circle"></i> Punkte anzeigen';
        curPolyline.setLatLngs(curHist.map(p => [p.lat, p.lon]));
        if (!map.hasLayer(curPolyline)) map.addLayer(curPolyline);
        // Blende Punkt-Marker aus
        curMarkers.forEach(m => { if (map.hasLayer(m)) map.removeLayer(m); });
    } else {
        // Zeige Punkte
        btn.innerHTML = '<i class="bi bi-vector-pen"></i> Linie anzeigen';
        if (map.hasLayer(curPolyline)) map.removeLayer(curPolyline);
        // Füge alle Punkt-Marker wieder hinzu
        curMarkers.forEach(m => { if (!map.hasLayer(m)) m.addTo(map); });
    }
}

// Begrenzungsmodus umschalten: aktiviert/deaktiviert Löschung älterer Punkte
function toggleLimitMode() {
    useLimit = !useLimit;
    const btn = document.getElementById('toggle-limit-mode');
    if (useLimit) {
        btn.innerHTML = '<i class="bi bi-filter-circle"></i> Begrenzen: Ein (' + maxPoints + ')';
        btn.className = 'btn btn-warning w-100 mb-2';
        // Falls aktuell bereits mehr Punkte vorhanden sind als erlaubt, trimmen
        const curHist = (activeView === 'live') ? livePositionHistory : importPositionHistory;
        const curMarkers = (activeView === 'live') ? liveHistoryMarkers : importHistoryMarkers;
        const curPolyline = (activeView === 'live') ? livePolyline : importPolyline;
        while (curHist.length > maxPoints) {
            curHist.shift();
            if (curMarkers.length > 0) {
                const old = curMarkers.shift();
                if (map.hasLayer(old)) map.removeLayer(old);
            }
        }
        if (showPolyline) curPolyline.setLatLngs(curHist.map(p => [p.lat, p.lon]));
    } else {
        btn.innerHTML = '<i class="bi bi-filter-circle"></i> Begrenzen: Aus';
        btn.className = 'btn btn-outline-warning w-100 mb-2';
    }
}

// Daten manuell aktualisieren
function refreshData() {
    updatePosition();
    updateTrackerStatus();
    
    // Feedback geben
    const button = event.target;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="bi bi-check-circle"></i> Aktualisiert!';
    button.className = 'btn btn-success w-100';
    
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.className = 'btn btn-outline-info w-100';
    }, 1500);
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    updatePosition();
    updateTrackerStatus();

    // Automatische Aktualisierung alle 5 Sekunden
    setInterval(() => {
        updatePosition();
        updateTrackerStatus();
    }, 5000);
    // Initiale UI-Synchronisation für Einstellungen-Modal
    // Visual-Mode Button
    const visBtn = document.getElementById('toggle-visual-mode');
    if (visBtn) {
        if (showPolyline) {
            visBtn.innerHTML = '<i class="bi bi-circle"></i> Punkte anzeigen';
            visBtn.className = 'btn btn-primary';
        } else {
            visBtn.innerHTML = '<i class="bi bi-vector-pen"></i> Linie anzeigen';
            visBtn.className = 'btn btn-outline-primary';
        }
    }

    // Limit-Mode Button und Input
    const limitBtn = document.getElementById('toggle-limit-mode');
    const maxInput = document.getElementById('max-points-input');
    if (maxInput) {
        maxInput.value = maxPoints;
        maxInput.addEventListener('change', (e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v > 0) {
                maxPoints = v;
                if (useLimit && limitBtn) {
                    limitBtn.innerHTML = '<i class="bi bi-filter-circle"></i> Begrenzen: Ein (' + maxPoints + ')';
                }
            }
        });
    }
    if (limitBtn) {
        if (useLimit) {
            limitBtn.innerHTML = '<i class="bi bi-filter-circle"></i> Begrenzen: Ein (' + maxPoints + ')';
            limitBtn.className = 'btn btn-warning';
        } else {
            limitBtn.innerHTML = '<i class="bi bi-filter-circle"></i> Begrenzen: Aus';
            limitBtn.className = 'btn btn-outline-warning';
        }
    }
    // Setup import UI after DOM ready
    setupImportUi();
    // Setze Standard-View
    switchView('live');
});
