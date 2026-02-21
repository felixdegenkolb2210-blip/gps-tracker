# GPS Tracker — Einzel-EXE Startanleitung

Kurz: die fertige, einzelne EXE liegt in `dist\gps-tracker.exe`. Doppelklicke sie, um den lokalen Webserver zu starten und die Web-App im Browser zu öffnen.

Inhalt dieses Repos (relevante Dateien):
- `dist\gps-tracker.exe` — Einzel-EXE (Server + Browser-Launcher). Wenn vorhanden: `dist\start-gps.exe`, `dist\start-gps-launcher.exe` (ältere Varianten).
- `run_app.bat`, `run_app.ps1` — einfache Launcher-Skripte.
- `bundle.py` — das Startskript, das in der EXE gebündelt wurde.

Starten (Explorer)
---------------
1. Öffne den Ordner auf dem USB‑Stick oder dem PC, z. B. `D:\gps-tracker\dist`.
2. Doppelklicke `gps-tracker.exe`.
3. Der Standardbrowser sollte sich öffnen unter `http://127.0.0.1:5000`.

Starten (Terminal) — sichtbar mit Logs
-----------------------------------
1. Öffne PowerShell oder Eingabeaufforderung.
2. Wechsel in den `dist`-Ordner:
```
cd "C:\Users\felix\Desktop\Coding\Schule\gps-tracker\dist"
```
3. Starte die EXE, die Server-Logs zeigt (falls vorhanden):
```
.\start-gps.exe
# oder falls du die neue Einzel-EXE nutzt:
.\gps-tracker.exe
```
4. Im Browser: `http://127.0.0.1:5000`

Stoppen
-------
Option A — falls du das App-Fenster (Konsole) siehst:
- Drücke `Ctrl+C` im Terminal, in dem die EXE läuft.

Option B — über PowerShell (wenn EXE im Hintergrund läuft):
1. Finde heraus, welcher Prozess auf Port 5000 lauscht:
```powershell
netstat -ano | findstr ":5000"
```
2. Merke die PID (rechte Spalte) und beende sie:
```powershell
Stop-Process -Id <PID> -Force
```

Option C — Task-Manager
- Öffne Task-Manager (Strg+Shift+Esc) → Reiter "Details" → suche `gps-tracker.exe` oder `start-gps.exe` → Rechtsklick → "Task beenden".

Wichtiges zu Verteilung auf anderen PCs (USB-Stick)
-----------------------------------------------
- Kopiere den kompletten `dist`-Ordner oder mindestens die `gps-tracker.exe` auf den Stick.
- Die EXE ist für Windows 64-bit gebaut; sie läuft nicht auf Linux/macOS.
- Auf fremden Rechnern kann Windows-SmartScreen oder Antivirus beim ersten Start warnen — der Nutzer muss eventuell „Trotzdem ausführen“ erlauben.

Fehlerbehebung
--------------
- Wenn beim Start nichts passiert: starte `gps-tracker.exe` aus einer PowerShell, dann siehst du Fehlermeldungen.
- Wenn der Browser nur Quelltext anzeigt: vergewissere dich, dass du tatsächlich die URL `http://127.0.0.1:5000` im Browser nutzt, nicht die `index.html` per `file://`.

Kontakt/weitere Anpassungen
---------------------------
Wenn du möchtest, kann ich:
- ein Icon für die EXE setzen,
- die EXE minimiert starten,
- die App sicherer für Netzzugriff (Waitress + Firewall-Docs) bauen,
- oder ein ZIP mit der finalen `dist`-Struktur erzeugen.
# GPS Tracker Dashboard

Ein professionelles Web-Dashboard für GPS-Tracking mit Python Flask, Bootstrap 5 und OpenStreetMap.

## Features

- 🗺️ Live-Kartenansicht mit OpenStreetMap (Leaflet.js)
- 📍 Echtzeit-Positionsverfolgung
- 📊 Statistiken und Analysen
- 🔋 Batterie- und Signal-Status
- 📱 Responsive Design mit Bootstrap 5
- 🎨 Professionelles, modernes UI
- 🌍 Umschaltbare Kartenansichten (Standard/Satellit)
- 📈 Positionshistorie mit Routenanzeige

## Installation

### Voraussetzungen

- Python 3.8 oder höher
- pip (Python Package Manager)

### Schritte

1. **Repository klonen oder herunterladen**

2. **Python-Umgebung einrichten (optional, aber empfohlen)**

```powershell
python -m venv venv
.\venv\Scripts\Activate
```

3. **Dependencies installieren**

```powershell
pip install -r requirements.txt
```

## Verwendung

### Server starten

```powershell
python app.py
```

Der Server läuft dann auf: `http://localhost:5000`

### Im Browser öffnen

Öffnen Sie Ihren Browser und navigieren Sie zu `http://localhost:5000`

## Projektstruktur

```
gps-tracker/
│
├── app.py                      # Flask Server mit API-Endpoints
├── requirements.txt            # Python Dependencies
├── README.md                   # Diese Datei
│
├── templates/
│   └── index.html             # Haupt-HTML-Template
│
└── static/
    ├── css/
    │   └── style.css          # Custom CSS Styling
    └── js/
        └── app.js             # JavaScript für Karten-Integration
```

## API-Endpoints

### `GET /api/current-position`
Gibt die aktuelle GPS-Position zurück.

**Response:**
```json
{
  "lat": 52.520008,
  "lon": 13.404954,
  "location": "Berlin, Deutschland",
  "speed": 45,
  "altitude": 34,
  "timestamp": "2025-10-29T12:34:56"
}
```

### `GET /api/position-history`
Gibt die Positionshistorie zurück (letzte 10 Punkte).

### `GET /api/tracker-status`
Gibt den aktuellen Status des Trackers zurück.

**Response:**
```json
{
  "online": true,
  "battery": 85,
  "signal_strength": 92,
  "last_update": "2025-10-29T12:34:56",
  "device_id": "GPS-TRACKER-001"
}
```

## Integration mit echtem GPS-Tracker

Aktuell verwendet die Anwendung Placeholder-Daten. Um einen echten GPS-Tracker zu integrieren:

1. **Ersetzen Sie die Placeholder-Daten in `app.py`:**
   - Verbinden Sie sich mit Ihrem GPS-Tracker (z.B. über Serial, HTTP, MQTT)
   - Lesen Sie die echten GPS-Koordinaten aus
   - Aktualisieren Sie die API-Endpoints entsprechend

2. **Beispiel für Serial-Verbindung:**
```python
import serial
import pynmea2

def read_gps_data():
    ser = serial.Serial('COM3', 9600, timeout=1)
    line = ser.readline().decode('ascii', errors='replace')
    if line.startswith('$GPRMC'):
        msg = pynmea2.parse(line)
        return {
            'lat': msg.latitude,
            'lon': msg.longitude,
            'speed': msg.spd_over_grnd
        }
```

3. **Beispiel für HTTP/REST API:**
```python
import requests

def get_tracker_data():
    response = requests.get('http://your-tracker-api.com/position')
    return response.json()
```

## Anpassungen

### Kartenansicht ändern
Die Standardposition kann in `static/js/app.js` geändert werden:
```javascript
map = L.map('map').setView([52.520008, 13.404954], 13);
```

### Aktualisierungsintervall
Das automatische Update-Intervall kann in `static/js/app.js` angepasst werden:
```javascript
setInterval(() => {
    updatePosition();
    updateTrackerStatus();
}, 5000); // 5000ms = 5 Sekunden
```

### Styling
Passen Sie die Farben und Styles in `static/css/style.css` an.

## Technologien

- **Backend:** Python Flask
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **UI Framework:** Bootstrap 5
- **Karten:** Leaflet.js mit OpenStreetMap
- **Icons:** Bootstrap Icons

## Zukünftige Erweiterungen

- 🔐 Benutzer-Authentifizierung
- 📱 Mobile App (React Native/Flutter)
- 🗄️ Datenbank-Integration (PostgreSQL/MongoDB)
- 📧 E-Mail/SMS Benachrichtigungen
- 🚨 Geo-Fencing und Alarme
- 📊 Erweiterte Analytics und Reports
- 🌐 Multi-Tracker-Unterstützung

## Lizenz

Dieses Projekt ist für persönliche und kommerzielle Zwecke frei verwendbar.

## Entwickler

Erstellt mit ❤️ und Python

---

**Hinweis:** Dies ist eine Demonstration mit Placeholder-Daten. Für die Verwendung mit einem echten GPS-Tracker müssen die API-Endpoints entsprechend angepasst werden. 