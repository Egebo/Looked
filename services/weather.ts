import * as Location from 'expo-location';

export interface WeatherData {
    temperature: number;
    description: string;
    icon: string; // Weather icon or emoji
}

// Open-Meteo uses WMO Weather interpretation codes
const getWeatherDescription = (code: number): { text: string, icon: string } => {
    if (code === 0) return { text: "Açık", icon: "☀️" };
    if (code === 1) return { text: "Çoğunlukla Açık", icon: "🌤️" };
    if (code === 2) return { text: "Parçalı Bulutlu", icon: "⛅" };
    if (code === 3) return { text: "Çok Bulutlu", icon: "☁️" };
    if (code === 45 || code === 48) return { text: "Sisli", icon: "🌫️" };
    if (code >= 51 && code <= 55) return { text: "Çisenti", icon: "🌦️" };
    if (code >= 56 && code <= 57) return { text: "Dondurucu Çisenti", icon: "🌧️" };
    if (code >= 61 && code <= 65) return { text: "Yağmurlu", icon: "🌧️" };
    if (code >= 66 && code <= 67) return { text: "Dondurucu Yağmur", icon: "🌧️" };
    if (code >= 71 && code <= 77) return { text: "Karlı", icon: "❄️" };
    if (code >= 80 && code <= 82) return { text: "Sağanak Yağışlı", icon: "🌧️" };
    if (code >= 85 && code <= 86) return { text: "Kar Sağanağı", icon: "🌨️" };
    if (code >= 95 && code <= 99) return { text: "Fırtınalı", icon: "⛈️" };

    return { text: "Bilinmiyor", icon: "🌡️" };
};

export const getWeather = async (): Promise<WeatherData | null> => {
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Location permission denied');
            return null;
        }

        let location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;

        console.log(`Location fetched: Lat: ${lat}, Lon: ${lon}`);

        // Call Open-Meteo API (Free, no API key required)
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);

        if (!response.ok) {
            console.error('Failed to fetch weather data');
            return null;
        }

        const data = await response.json();
        const weatherCode = data.current_weather.weathercode;
        const temperature = data.current_weather.temperature;

        const interpretation = getWeatherDescription(weatherCode);

        return {
            temperature: Math.round(temperature),
            description: interpretation.text,
            icon: interpretation.icon
        };

    } catch (error) {
        console.error("Error fetching weather:", error);
        return null;
    }
};
