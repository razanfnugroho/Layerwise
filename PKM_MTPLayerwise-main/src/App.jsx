import React, { useState, useEffect } from 'react';
import { AlertTriangle, Droplets, Wind, Thermometer, Cloud, Eye, TrendingUp, MapPin, RefreshCw, Gauge } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix untuk issue icon bawaan Leaflet di React menggunakan CDN agar aman saat di-build
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component for Weather Cards
const WeatherCardColorful = ({ icon, label, value, unit, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} p-5 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform duration-300`}>
    <div className="flex items-center gap-3 mb-3 opacity-90">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-black">{value}</span>
      <span className="text-sm font-medium opacity-80">{unit}</span>
    </div>
  </div>
);

// Helper component for Layerwise Analysis Bars
const LayerBarColorful = ({ label, score, weight, icon, gradient }) => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
        <span className={`p-1.5 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
          {icon}
        </span>
        {label}
      </div>
      <div className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-md">
        Bobot: {weight * 100}%
      </div>
    </div>
    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
        style={{ width: `${score}%` }}
      ></div>
    </div>
    <div className="mt-2 text-right text-xs font-bold text-gray-700">
      Skor: {score}/100
    </div>
  </div>
);

// Peta Interaktif Widget
const MapWidget = ({ lat, lon, floodLevel }) => {
  // Menentukan warna radius lingkaran berdasarkan level bahaya
  const circleColor = floodLevel === 'TINGGI' ? '#dc2626' : floodLevel === 'SEDANG' ? '#f97316' : '#10b981';
  const fillColor = floodLevel === 'TINGGI' ? '#f87171' : floodLevel === 'SEDANG' ? '#fdba74' : '#6ee7b7';

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-white/50 h-[350px] relative z-0">
      <MapContainer 
        center={[lat, lon]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lon]}>
          <Popup>
            <div className="text-center font-semibold">
              Titik Pantau Banjir<br/>Martapura
            </div>
          </Popup>
        </Marker>
        <Circle 
          center={[lat, lon]} 
          radius={2000} 
          pathOptions={{ 
            color: circleColor, 
            fillColor: fillColor, 
            fillOpacity: 0.3 
          }} 
        />
      </MapContainer>
    </div>
  );
};

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  // Dummy data
  const weatherData = {
    location: "Martapura, Kalimantan Selatan",
    lat: -3.4144,
    lon: 114.8544,
    current: {
      temp: 30.2,
      humidity: 88,
      wind_speed: 14.5,
      clouds: 85,
      rain_1h: 18.5,
      pressure: 1008,
      visibility: 7000
    },
    hourly: [
      { time: "00:00", rain: 0.5, temp: 26 },
      { time: "03:00", rain: 1.2, temp: 25 },
      { time: "06:00", rain: 4.5, temp: 26 },
      { time: "09:00", rain: 8.3, temp: 28 },
      { time: "12:00", rain: 15.8, temp: 31 },
      { time: "15:00", rain: 22.4, temp: 30 },
      { time: "18:00", rain: 12.5, temp: 28 },
      { time: "21:00", rain: 5.2, temp: 27 }
    ]
  };

  const calculateFloodRisk = () => {
    const rainfallScore = weatherData.current.rain_1h > 15 ? 100 : 
                         weatherData.current.rain_1h > 10 ? 75 :
                         weatherData.current.rain_1h > 5 ? 50 : 25;
    
    const humidityScore = weatherData.current.humidity > 85 ? 100 :
                         weatherData.current.humidity > 75 ? 75 :
                         weatherData.current.humidity > 65 ? 50 : 25;
    
    const cloudScore = weatherData.current.clouds > 80 ? 100 :
                      weatherData.current.clouds > 60 ? 75 :
                      weatherData.current.clouds > 40 ? 50 : 25;
    
    const windScore = weatherData.current.wind_speed > 20 ? 25 :
                     weatherData.current.wind_speed > 15 ? 50 :
                     weatherData.current.wind_speed > 10 ? 75 : 100;

    const totalScore = (rainfallScore * 0.4) + (humidityScore * 0.25) + 
                      (cloudScore * 0.2) + (windScore * 0.15);
    
    return {
      score: totalScore,
      level: totalScore > 75 ? 'TINGGI' : totalScore > 50 ? 'SEDANG' : 'RENDAH',
      color: totalScore > 75 ? '#dc2626' : totalScore > 50 ? '#f97316' : '#10b981',
      bgColor: totalScore > 75 ? '#fee2e2' : totalScore > 50 ? '#ffedd5' : '#dcfce7',
      layers: { rainfallScore, humidityScore, cloudScore, windScore }
    };
  };

  const floodRisk = calculateFloodRisk();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 border-b border-white/20 py-2 px-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-white">
            <span className="uppercase font-semibold">
              {currentTime.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-4">
              <span className="font-semibold">STANDAR WAKTU INDONESIA</span>
              <span className="font-mono font-bold bg-white/20 px-3 py-1 rounded">
                {currentTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
              </span>
              <span className="text-white/60">|</span>
              <span className="font-mono text-white/80">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false })} UTC
              </span>
            </div>
          </div>
        </div>

        <header className="bg-white/95 backdrop-blur-md shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 flex-shrink-0">
                  <img 
                    src="https://i.imgur.com/kwzGJub.png" 
                    alt="Layerwise Team Logo"
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                    Sistem Peringatan Dini
                  </div>
                  <div className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 font-bold uppercase">
                    Banjir Berbasis Layerwise
                  </div>
                </div>
              </div>
              
              <nav className="hidden lg:flex items-center gap-6 text-sm">
                <a href="#" className="text-gray-700 hover:text-cyan-600 font-medium transition-colors">Profil</a>
                <a href="#" className="text-gray-700 hover:text-cyan-600 font-medium transition-colors">Cuaca</a>
                <a href="#" className="text-gray-700 hover:text-cyan-600 font-medium transition-colors">Iklim</a>
                <a href="#" className="text-gray-700 hover:text-cyan-600 font-medium transition-colors">Kualitas Udara</a>
              </nav>

              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
              >
                <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />
                Perbarui
              </button>
            </div>
          </div>
        </header>

        <div className="bg-white/90 backdrop-blur-sm border-b border-white/30">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <a href="#" className="hover:text-cyan-600 font-medium">Beranda</a>
              <span className="text-gray-400">›</span>
              <a href="#" className="hover:text-cyan-600 font-medium">Cuaca Kalimantan Selatan</a>
              <span className="text-gray-400">›</span>
              <span className="text-gray-900 font-semibold">Martapura</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              Prakiraan Peringatan Banjir Martapura
            </h1>
            <p className="text-white/90 text-lg drop-shadow">
              Prakiraan peringatan banjir kecamatan di Martapura, Kalimantan Selatan
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border-2 border-white/50">
              <div 
                className="px-8 py-6 border-l-8"
                style={{ 
                  borderLeftColor: floodRisk.color,
                  backgroundColor: floodRisk.bgColor
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                      style={{ backgroundColor: floodRisk.color }}
                    >
                      <AlertTriangle size={40} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Status Peringatan Banjir
                      </h2>
                      <div className="text-5xl font-black tracking-tight" style={{ color: floodRisk.color }}>
                        {floodRisk.level}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div 
                      className="inline-block px-8 py-4 rounded-xl text-white font-bold text-xl shadow-xl" 
                      style={{ backgroundColor: floodRisk.color }}
                    >
                      {floodRisk.level === 'TINGGI' ? '⚠️ SIAGA' : 
                       floodRisk.level === 'SEDANG' ? '⚡ WASPADA' : '✓ AMAN'}
                    </div>
                    <p className="text-gray-700 font-semibold mt-3 text-lg">
                      Skor Risiko: <span style={{ color: floodRisk.color }}>{floodRisk.score.toFixed(1)}</span>/100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Grid untuk Info Lokasi & Peta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-white/50 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-gray-800 mb-6">
                  <MapPin size={24} className="text-cyan-600" />
                  <span className="font-semibold text-xl">Detail Lokasi Pantau</span>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="text-gray-500 text-sm uppercase mb-1 font-semibold">Kecamatan / Area</div>
                    <div className="font-bold text-gray-900 text-2xl">Martapura</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm uppercase mb-1 font-semibold">Titik Koordinat (Lat, Lon)</div>
                    <div className="font-mono text-cyan-700 bg-cyan-50 inline-block px-3 py-1 rounded-lg text-lg">
                      {weatherData.lat}°, {weatherData.lon}°
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm uppercase mb-1 font-semibold">Sinkronisasi Data Terakhir</div>
                    <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <RefreshCw size={16} className="text-green-500" />
                      {currentTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Widget Peta Terintegrasi */}
              <MapWidget lat={weatherData.lat} lon={weatherData.lon} floodLevel={floodRisk.level} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <WeatherCardColorful 
                icon={<Droplets />} 
                label="Curah Hujan"
                value={weatherData.current.rain_1h}
                unit="mm/jam"
                gradient="from-blue-500 to-cyan-400"
              />
              <WeatherCardColorful 
                icon={<Thermometer />} 
                label="Suhu Udara"
                value={weatherData.current.temp}
                unit="°C"
                gradient="from-orange-500 to-red-500"
              />
              <WeatherCardColorful 
                icon={<Wind />} 
                label="Kecepatan Angin"
                value={weatherData.current.wind_speed}
                unit="km/jam"
                gradient="from-teal-500 to-emerald-400"
              />
              <WeatherCardColorful 
                icon={<Cloud />} 
                label="Kelembaban"
                value={weatherData.current.humidity}
                unit="%"
                gradient="from-purple-500 to-pink-500"
              />
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-white/50">
              <div className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 border-b border-white/20">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gauge size={24} />
                  Analisis Metode Layerwise
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <LayerBarColorful 
                    label="Layer 1: Intensitas Curah Hujan"
                    score={floodRisk.layers.rainfallScore}
                    weight={0.4}
                    icon={<Droplets size={18} />}
                    gradient="from-blue-500 to-cyan-400"
                  />
                  <LayerBarColorful 
                    label="Layer 2: Kelembaban Udara"
                    score={floodRisk.layers.humidityScore}
                    weight={0.25}
                    icon={<Cloud size={18} />}
                    gradient="from-purple-500 to-pink-500"
                  />
                  <LayerBarColorful 
                    label="Layer 3: Tutupan Awan"
                    score={floodRisk.layers.cloudScore}
                    weight={0.2}
                    icon={<Eye size={18} />}
                    gradient="from-indigo-500 to-purple-500"
                  />
                  <LayerBarColorful 
                    label="Layer 4: Kecepatan Angin"
                    score={floodRisk.layers.windScore}
                    weight={0.15}
                    icon={<Wind size={18} />}
                    gradient="from-teal-500 to-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-white/50">
              <div className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 border-b border-white/20">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp size={24} />
                  Prakiraan Curah Hujan 24 Jam
                </h3>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-end justify-between gap-2 mb-5">
                  {weatherData.hourly.map((hour, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full group">
                        <div 
                          className="w-full bg-gradient-to-t from-cyan-600 to-blue-400 hover:from-cyan-500 hover:to-blue-300 rounded-t-lg transition-all cursor-pointer shadow-lg"
                          style={{ height: `${Math.max((hour.rain / 20) * 100, 8)}%` }}
                        >
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-xl">
                            {hour.rain} mm
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">{hour.time}</div>
                        <div className="text-xs text-gray-500">{hour.temp}°C</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
