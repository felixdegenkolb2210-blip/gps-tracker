from flask import Flask, render_template, jsonify
from datetime import datetime
import random
import sys
import os
import csv

# When packaged by PyInstaller with --onefile, resources are extracted to
# a temporary folder available as sys._MEIPASS. Detect that and point Flask
# to the extracted `templates` and `static` folders so render_template works.
if getattr(sys, "frozen", False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.dirname(__file__)

app = Flask(__name__, template_folder=os.path.join(base_path, 'templates'), static_folder=os.path.join(base_path, 'static'))

# GPS-Daten aus CSV-Datei laden
def load_gps_data_from_csv():
    """Lädt GPS-Daten aus der CSV-Datei"""
    csv_path = r"c:\Users\felix\Desktop\Coding\Schule\GPS-Testdaten\testdaten Spieler .csv"
    positions = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter=';')
            header_found = False

            for row in reader:
                
                # Überspringe leere Zeilen
                if not row or not row[0].strip():
                    continue
                
                # Überspringe Header-Zeile
                if 'UTC-Time' in row[0]:
                    header_found = True
                    continue
                
                # Verarbeite Datenzeilen
                if header_found and len(row) >= 3:
                    try:
                        # Entferne Anführungszeichen und verarbeite Dezimalkommas
                        row = [cell.replace('|', ';') for cell in row]
                        time_str = row[0].strip().strip('"')
                        lat_str = row[1].strip().strip('"').replace(',', '.')
                        lon_str = row[2].strip().strip('"').replace(',', '.')
                        
                        lat = float(lat_str)
                        lon = float(lon_str)
                        
                        positions.append({
                            "lat": lat,
                            "lon": lon,
                            "location": "GPS-Testdaten",
                            "speed": 0,
                            "altitude": 0,
                            "timestamp": time_str
                        })
                    except (ValueError, IndexError):
                        continue
    except FileNotFoundError:
        print(f"CSV-Datei nicht gefunden: {csv_path}")
        return [
            {
                "lat": 51.33176012978327, 
                "lon": 12.610844615278952,
                "location": "Brandis, Deutschland",
                "speed": 0,
                "altitude": 34,
                "timestamp": datetime.now().isoformat()
            }
        ]
    
    return positions if positions else [
        {
            "lat": 51.33176012978327, 
            "lon": 12.610844615278952,
            "location": "Brandis, Deutschland",
            "speed": 0,
            "altitude": 34,
            "timestamp": datetime.now().isoformat()
        }
    ]

POSITION_HISTORY = load_gps_data_from_csv()
current_position = POSITION_HISTORY[0].copy() if POSITION_HISTORY else {
    "lat": 51.33176012978327, 
    "lon": 12.610844615278952,
    "location": "Brandis, Deutschland",
    "speed": 0,
    "altitude": 34,
    "timestamp": datetime.now().isoformat()
}


@app.route('/')
def index():
    """Hauptseite mit der Karte"""
    return render_template('index.html')


@app.route('/api/current-position')
def get_current_position():
    """API-Endpoint für die aktuelle GPS-Position"""
    # Simuliere kleine Bewegungen für Demo-Zwecke
    current_position['lat'] += random.uniform(-0.001, 0.001)
    current_position['lon'] += random.uniform(-0.001, 0.001)
    current_position['speed'] = random.randint(0, 60)
    current_position['timestamp'] = datetime.now().isoformat()
    
    return jsonify(current_position)


@app.route('/api/position-history')
def get_position_history():
    """API-Endpoint für die Positionshistorie"""
    # Placeholder für historische Daten
    history = []
    base_lat = 52.520008
    base_lon = 13.404954
    
    for i in range(10):
        history.append({
            "lat": base_lat + (i * 0.001),
            "lon": base_lon + (i * 0.001),
            "speed": random.randint(0, 80),
            "altitude": random.randint(30, 50),
            "timestamp": datetime.now().isoformat()
        })
    
    return jsonify(history)


@app.route('/api/tracker-status')
def get_tracker_status():
    """API-Endpoint für den Tracker-Status"""
    return jsonify({
        "online": True,
        "battery": random.randint(60, 100),
        "signal_strength": random.randint(70, 100),
        "last_update": datetime.now().isoformat(),
        "device_id": "GPS-TRACKER-001"
    })


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
