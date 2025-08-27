import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
  visibility: number;
}

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
}

const getWeatherIcon = (weathercode: number) => {
  // WMO Weather interpretation codes
  if (weathercode === 0) return Sun; // Clear sky
  if (weathercode <= 3) return Cloud; // Partly cloudy
  if (weathercode <= 67) return CloudRain; // Rain
  if (weathercode <= 77) return CloudSnow; // Snow
  return Wind; // Default
};

const getWeatherDescription = (weathercode: number) => {
  if (weathercode === 0) return 'Clear Sky';
  if (weathercode <= 3) return 'Partly Cloudy';
  if (weathercode <= 67) return 'Rainy';
  if (weathercode <= 77) return 'Snowy';
  return 'Windy';
};

const getWeatherAnimation = (weathercode: number) => {
  if (weathercode === 0) return 'animate-pulse'; // Clear sky
  if (weathercode <= 3) return 'animate-bounce'; // Partly cloudy
  if (weathercode <= 67) return 'animate-bounce'; // Rain
  if (weathercode <= 77) return 'animate-spin'; // Snow
  return 'animate-pulse'; // Default
};

export default function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeather();
    }
  }, [latitude, longitude]);

  const fetchWeather = async () => {
    if (!latitude || !longitude) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=visibility`
      );
      const data = await response.json();
      
      if (data.current_weather) {
        setWeather({
          temperature: data.current_weather.temperature,
          weathercode: data.current_weather.weathercode,
          windspeed: data.current_weather.windspeed,
          visibility: data.hourly?.visibility?.[0] || 10000
        });
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!latitude || !longitude || loading) {
    return (
      <Card className="premium-card">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading weather...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.weathercode);

  return (
    <Card className="premium-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-primary/10 ${getWeatherAnimation(weather.weathercode)}`}>
              <WeatherIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{getWeatherDescription(weather.weathercode)}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(weather.temperature)}°C
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Wind className="h-3 w-3 mr-1" />
              {weather.windspeed} km/h
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Eye className="h-3 w-3 mr-1" />
              {Math.round(weather.visibility / 1000)} km
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}