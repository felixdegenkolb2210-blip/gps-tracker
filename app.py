from flask import Flask, render_template, jsonify
from datetime import datetime
import random

app = Flask(__name__)

# Placeholder GPS-Daten
# Diese werden später durch echte Daten vom GPS-Tracker ersetzt
PLACEHOLDER_POSITIONS = [
    {
        "lat": 51.33176012978327, 
        "lon": 12.610844615278952,
        "location": "Brandis, Deutschland",
        "speed": 0,
        "altitude": 34,
        "timestamp": datetime.now().isoformat()
    }
]

current_position = PLACEHOLDER_POSITIONS[0].copy()


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
    app.run(debug=True, host='0.0.0.0', port=5000)
