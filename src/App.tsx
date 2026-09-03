/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Compass,
  Search,
  X,
  Moon,
  AlertTriangle,
  Umbrella,
  CheckCircle2,
  MapPin,
  Calendar,
  Sparkles,
  RefreshCw,
  Thermometer,
  Layers,
  Info
} from 'lucide-react';

interface GeoLocationItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
}

interface CurrentWeatherData {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
  time: string;
}

interface DailyWeatherData {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
}

interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: number | string;
  current_weather: CurrentWeatherData;
  daily: DailyWeatherData;
}

// Weather Code mapping helper for Open-Meteo WMO interpretation codes
interface WeatherInfo {
  label: string;
  iconName: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudFog' | 'CloudDrizzle' | 'CloudRain' | 'CloudSnow' | 'CloudLightning';
}

function getWeatherInfo(code: number): WeatherInfo {
  switch (code) {
    case 0:
      return { label: 'Clear Sky', iconName: 'Sun' };
    case 1:
      return { label: 'Mainly Clear', iconName: 'CloudSun' };
    case 2:
      return { label: 'Partly Cloudy', iconName: 'CloudSun' };
    case 3:
      return { label: 'Overcast', iconName: 'Cloud' };
    case 45:
    case 48:
      return { label: 'Fog & Rime', iconName: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { label: 'Drizzle', iconName: 'CloudDrizzle' };
    case 56:
    case 57:
      return { label: 'Freezing Drizzle', iconName: 'CloudDrizzle' };
    case 61:
      return { label: 'Light Rain', iconName: 'CloudRain' };
    case 63:
      return { label: 'Moderate Rain', iconName: 'CloudRain' };
    case 65:
      return { label: 'Heavy Rain', iconName: 'CloudRain' };
    case 66:
    case 67:
      return { label: 'Freezing Rain', iconName: 'CloudRain' };
    case 71:
    case 73:
    case 75:
      return { label: 'Snowfall', iconName: 'CloudSnow' };
    case 77:
      return { label: 'Snow Grains', iconName: 'CloudSnow' };
    case 80:
    case 81:
    case 82:
      return { label: 'Rain Showers', iconName: 'CloudRain' };
    case 85:
    case 86:
      return { label: 'Snow Showers', iconName: 'CloudSnow' };
    case 95:
      return { label: 'Thunderstorm', iconName: 'CloudLightning' };
    case 96:
    case 99:
      return { label: 'Thunderstorm with Hail', iconName: 'CloudLightning' };
    default:
      return { label: 'Partly Cloudy', iconName: 'CloudSun' };
  }
}

function WeatherIconComponent({
  iconName,
  className = 'w-6 h-6',
}: {
  iconName: WeatherInfo['iconName'];
  className?: string;
}) {
  switch (iconName) {
    case 'Sun':
      return <Sun className={`${className} text-amber-400`} />;
    case 'CloudSun':
      return <CloudSun className={`${className} text-sky-400`} />;
    case 'Cloud':
      return <Cloud className={`${className} text-slate-300`} />;
    case 'CloudFog':
      return <CloudFog className={`${className} text-slate-400`} />;
    case 'CloudDrizzle':
      return <CloudDrizzle className={`${className} text-sky-300`} />;
    case 'CloudRain':
      return <CloudRain className={`${className} text-sky-400`} />;
    case 'CloudSnow':
      return <CloudSnow className={`${className} text-indigo-200`} />;
    case 'CloudLightning':
      return <CloudLightning className={`${className} text-amber-400`} />;
    default:
      return <CloudSun className={`${className} text-sky-400`} />;
  }
}

// Format date helper: "Mon", "Tue", etc.
function formatForecastDay(dateStr: string, index: number) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return {
      dayOfWeek: dayNames[dateObj.getDay()],
      isToday: index === 0,
      formattedDate: `${monthNames[dateObj.getMonth()]} ${day}`,
    };
  } catch {
    return {
      dayOfWeek: 'Day',
      isToday: index === 0,
      formattedDate: dateStr,
    };
  }
}

const DEFAULT_CITY: GeoLocationItem = {
  id: 2643743,
  name: 'London',
  latitude: 51.50853,
  longitude: -0.12574,
  country: 'United Kingdom',
  admin1: 'England',
  country_code: 'GB',
  timezone: 'Europe/London',
};

const SUGGESTED_CITIES = ['London', 'Chennai', 'New York', 'Tokyo', 'Paris', 'Sydney'];

export default function App() {
  // Theme state: dark (corporate slate-navy) or light
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return true; // default to corporate slate-navy
  });

  // Temperature unit: celsius (°C) vs fahrenheit (°F)
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GeoLocationItem[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);

  // Selected city & Weather data
  const [selectedLocation, setSelectedLocation] = useState<GeoLocationItem>(DEFAULT_CITY);
  const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  // Error handling state
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [, startTransition] = useTransition();

  // Close suggestions when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial weather for default city
  useEffect(() => {
    fetchWeatherForLocation(DEFAULT_CITY);
  }, []);

  // Debounced geocoding autocomplete as user types
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setActiveSuggestionIndex(-1);

    if (searchError) {
      setSearchError(null);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearchingSuggestions(false);
      return;
    }

    setIsSearchingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          value.trim()
        )}&count=5&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch suggestions');
        const data = await res.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          setSuggestions(data.results);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch (err) {
        console.error('Error in geocoding suggestions:', err);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 280);
  };

  // Weather fetch function
  const fetchWeatherForLocation = async (location: GeoLocationItem) => {
    setIsLoadingWeather(true);
    setSearchError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Could not retrieve weather data');
      }
      const data: WeatherApiResponse = await res.json();
      startTransition(() => {
        setWeatherData(data);
        setSelectedLocation(location);
      });
    } catch (err) {
      console.error('Weather fetch error:', err);
      setSearchError(
        'Unable to load meteorological forecast data for this location. Please try again.'
      );
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // When user selects a suggestion from dropdown
  const handleSelectSuggestion = (item: GeoLocationItem) => {
    const formatted = formatLocationLabel(item);
    setSearchQuery(formatted);
    setShowDropdown(false);
    setSuggestions([]);
    fetchWeatherForLocation(item);
  };

  // Search by keyword submission (Enter key or search button)
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setShowDropdown(false);

    // If a suggestion was highlighted with arrow keys, select it
    if (
      activeSuggestionIndex >= 0 &&
      activeSuggestionIndex < suggestions.length
    ) {
      handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      return;
    }

    // If suggestions are currently available and top one is a match, select it
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }

    // Otherwise run direct search query against Geocoding API
    setIsSearchingSuggestions(true);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=5&language=en&format=json`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        const topResult = data.results[0];
        handleSelectSuggestion(topResult);
      } else {
        setSearchError('City not found. Please check your spelling and try again.');
      }
    } catch (err) {
      console.error('Direct search error:', err);
      setSearchError('City not found. Please check your spelling and try again.');
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < suggestions.length
      ) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Helper to format location label
  const formatLocationLabel = (item: GeoLocationItem): string => {
    const parts: string[] = [item.name];
    if (item.admin1 && item.admin1 !== item.name) {
      parts.push(item.admin1);
    }
    if (item.country) {
      parts.push(item.country);
    }
    return parts.join(', ');
  };

  // Quick search button click (e.g. London, Chennai, New York)
  const handleQuickCityClick = async (cityName: string) => {
    setSearchQuery(cityName);
    setIsSearchingSuggestions(true);
    setSearchError(null);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName
      )}&count=1&language=en&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        handleSelectSuggestion(data.results[0]);
      }
    } catch (err) {
      console.error('Quick city fetch failed:', err);
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  // Temperature display formatter
  const formatTemp = (celsius: number): string => {
    if (unit === 'F') {
      const fahrenheit = (celsius * 9) / 5 + 32;
      return `${Math.round(fahrenheit)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  // Computed planning advice triggers
  const currentTemp = weatherData?.current_weather?.temperature ?? 20;
  const currentCode = weatherData?.current_weather?.weathercode ?? 0;
  const currentWeatherInfo = getWeatherInfo(currentCode);

  // Precipitation check:
  // Checks if today or current forecast reports precipitation > 0mm
  const todayPrecipitation =
    weatherData?.daily?.precipitation_sum && weatherData.daily.precipitation_sum.length > 0
      ? weatherData.daily.precipitation_sum[0]
      : 0;

  const totalWeeklyPrecipitation =
    weatherData?.daily?.precipitation_sum?.reduce((acc, curr) => acc + (curr || 0), 0) ?? 0;

  const isRainyCondition =
    todayPrecipitation > 0 ||
    totalWeeklyPrecipitation > 0.2 ||
    [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(currentCode);

  const isHotWeather = currentTemp > 30;
  const isPleasantWeather = !isRainyCondition && currentTemp >= 15 && currentTemp <= 29;
  const isCoolWeather = !isRainyCondition && currentTemp < 15;

  return (
    <div
      id="weather-intelligence-root"
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Corporate Navigation Bar */}
      <header
        id="app-header"
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white/90 border-slate-200 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & App Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight">Weather Intelligence</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Open-Meteo
                </span>
              </div>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                } hidden md:block`}
              >
                Real-Time Atmospheric Analytics & Decision Engine
              </p>
            </div>
          </div>

          {/* Action Controls: Unit Toggle & Dark Mode */}
          <div className="flex items-center gap-2">
            {/* Unit Switcher */}
            <div
              id="unit-toggle"
              className={`flex items-center p-0.5 rounded-lg border text-xs font-medium ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-200/80 border-slate-300 text-slate-700'
              }`}
            >
              <button
                id="btn-unit-c"
                onClick={() => setUnit('C')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  unit === 'C'
                    ? 'bg-sky-500 text-white font-semibold shadow-sm'
                    : 'hover:text-sky-400'
                }`}
                title="Display in Celsius"
              >
                °C
              </button>
              <button
                id="btn-unit-f"
                onClick={() => setUnit('F')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  unit === 'F'
                    ? 'bg-sky-500 text-white font-semibold shadow-sm'
                    : 'hover:text-sky-400'
                }`}
                title="Display in Fahrenheit"
              >
                °F
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label="Toggle visual theme"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                  : 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search & Intelligence Autocomplete Bar */}
        <section id="search-section" className="relative">
          <div
            ref={searchContainerRef}
            className="max-w-3xl mx-auto relative"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <div
                className={`relative flex items-center rounded-2xl border transition-all duration-200 shadow-lg ${
                  isDarkMode
                    ? 'bg-slate-900/90 border-slate-700/80 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20'
                    : 'bg-white border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20'
                }`}
              >
                <div className="pl-4 text-sky-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Search city or location (e.g. London, Chennai, New York)..."
                  autoComplete="off"
                  className={`w-full py-4 px-3 bg-transparent text-base sm:text-lg focus:outline-none placeholder-slate-400 ${
                    isDarkMode ? 'text-slate-100' : 'text-slate-800'
                  }`}
                />

                {/* Loading indicator or clear button */}
                <div className="pr-3 flex items-center gap-2">
                  {isSearchingSuggestions && (
                    <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                  )}
                  {searchQuery && !isSearchingSuggestions && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                        setShowDropdown(false);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    id="search-submit-btn"
                    type="submit"
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-sky-500/20 active:scale-95"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>

            {/* Dynamic Autocomplete Floating Dropdown List */}
            {showDropdown && suggestions.length > 0 && (
              <div
                id="search-dropdown"
                className={`absolute left-0 right-0 mt-2 rounded-2xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl transition-all ${
                  isDarkMode
                    ? 'bg-slate-900/95 border-slate-700 divide-y divide-slate-800'
                    : 'bg-white/95 border-slate-200 divide-y divide-slate-100'
                }`}
              >
                <div
                  className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase ${
                    isDarkMode ? 'text-slate-400 bg-slate-800/40' : 'text-slate-500 bg-slate-50'
                  }`}
                >
                  Matching Locations
                </div>
                {suggestions.map((item, idx) => {
                  const isSelected = idx === activeSuggestionIndex;
                  return (
                    <button
                      key={item.id}
                      id={`suggestion-item-${item.id}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${
                        isSelected
                          ? isDarkMode
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-sky-50 text-sky-700'
                          : isDarkMode
                          ? 'hover:bg-slate-800 text-slate-200'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-sky-400' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-sm">
                            {item.name}
                            {item.admin1 && (
                              <span
                                className={`ml-1 text-xs font-normal ${
                                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                , {item.admin1}
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {item.country || 'Unknown Country'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            isDarkMode
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick-Pick Popular City Chips */}
          <div className="max-w-3xl mx-auto mt-3 flex items-center flex-wrap gap-1.5 text-xs">
            <span
              className={`font-medium ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Quick Exploration:
            </span>
            {SUGGESTED_CITIES.map((city) => (
              <button
                key={city}
                id={`quick-chip-${city.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => handleQuickCityClick(city)}
                className={`px-2.5 py-1 rounded-full border transition-all ${
                  selectedLocation.name.toLowerCase() === city.toLowerCase()
                    ? 'bg-sky-500 text-white border-sky-400 font-semibold'
                    : isDarkMode
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-sky-500/50 hover:text-sky-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </section>

        {/* Error Notification */}
        {searchError && (
          <div
            id="search-error-card"
            className="max-w-3xl mx-auto p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 shadow-lg animate-in fade-in duration-200"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-rose-200 text-base">Location Not Found</h3>
                <p className="text-sm text-rose-300/90 leading-relaxed">
                  {searchError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner for Weather */}
        {isLoadingWeather && (
          <div
            id="weather-loading-state"
            className="flex items-center justify-center py-12"
          >
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              <p
                className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Retrieving atmospheric telemetry for {selectedLocation.name}...
              </p>
            </div>
          </div>
        )}

        {/* Weather Intelligence Dashboard Content */}
        {!isLoadingWeather && weatherData && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Grid: Current Weather Card & Dynamic Planning Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Mandatory Feature 2: Current Weather Card */}
              <div
                id="current-weather-card"
                className={`lg:col-span-7 rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden transition-all ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Decorative Subtle Background Glow */}
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Location Title & Country */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-sky-400 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Live Weather Station</span>
                    </div>
                    <h1
                      id="current-city-name"
                      className="text-2xl sm:text-4xl font-bold tracking-tight"
                    >
                      {selectedLocation.name}
                    </h1>
                    <p
                      id="current-location-sub"
                      className={`text-sm sm:text-base mt-0.5 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {selectedLocation.admin1 ? `${selectedLocation.admin1}, ` : ''}
                      {selectedLocation.country || 'Global Location'}
                    </p>
                  </div>

                  {/* Refresh Button */}
                  <button
                    id="refresh-weather-btn"
                    onClick={() => fetchWeatherForLocation(selectedLocation)}
                    title="Refresh current meteorological data"
                    className={`p-2.5 rounded-xl border transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Temperature & Weather Icon Display */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-4 border-y border-dashed border-slate-700/50">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 shrink-0">
                      <WeatherIconComponent
                        iconName={currentWeatherInfo.iconName}
                        className="w-12 h-12 sm:w-16 sm:h-16"
                      />
                    </div>
                    <div>
                      <div
                        id="current-temperature-display"
                        className="text-4xl sm:text-6xl font-extrabold tracking-tight"
                      >
                        {formatTemp(currentTemp)}
                      </div>
                      <div
                        id="current-weather-label"
                        className="text-base sm:text-lg font-medium text-sky-400 mt-1 flex items-center gap-1.5"
                      >
                        <span>{currentWeatherInfo.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Wind Speed & Direction Display */}
                  <div
                    id="current-wind-display"
                    className={`p-4 rounded-2xl border flex flex-col justify-center gap-2 ${
                      isDarkMode
                        ? 'bg-slate-800/60 border-slate-700/80'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <Wind className="w-4 h-4 text-sky-400" />
                      <span>Wind Speed</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {weatherData.current_weather.windspeed}{' '}
                      <span className="text-xs font-normal text-slate-400">km/h</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Compass className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        Heading {weatherData.current_weather.winddirection}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weather Station Telemetry Footer */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-xs">
                  <div
                    className={`p-3 rounded-xl border ${
                      isDarkMode
                        ? 'bg-slate-800/40 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-slate-400 block mb-0.5">Coordinates</span>
                    <span className="font-semibold">
                      {weatherData.latitude.toFixed(2)}°N, {weatherData.longitude.toFixed(2)}°E
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isDarkMode
                        ? 'bg-slate-800/40 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-slate-400 block mb-0.5">Elevation</span>
                    <span className="font-semibold">
                      {weatherData.elevation ?? selectedLocation.elevation ?? 0} m ASL
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isDarkMode
                        ? 'bg-slate-800/40 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-slate-400 block mb-0.5">Today Rain</span>
                    <span className="font-semibold">
                      {todayPrecipitation.toFixed(1)} mm
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isDarkMode
                        ? 'bg-slate-800/40 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-slate-400 block mb-0.5">Timezone</span>
                    <span className="font-semibold truncate block" title={String(weatherData.timezone)}>
                      {String(weatherData.timezone)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mandatory Feature 4: Dynamic Planning Advice */}
              <div
                id="planning-advice-card"
                className={`lg:col-span-5 rounded-3xl p-6 sm:p-8 border shadow-xl flex flex-col justify-between transition-all ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-sky-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Atmospheric Intelligence</span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        isHotWeather
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : isRainyCondition
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      Real-Time Analysis
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">
                    Planning & Operations Advice
                  </h2>

                  {/* Primary Trigger Cards */}
                  <div className="space-y-4">
                    {/* Hot Weather Trigger: temp > 30°C */}
                    {isHotWeather && (
                      <div
                        id="advisory-hot-weather"
                        className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                              Temperature Alert: {formatTemp(currentTemp)}
                            </span>
                            <p className="font-semibold text-sm sm:text-base text-amber-200 leading-snug">
                              High Heat Advisory: Stay hydrated and avoid direct mid-day sun.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rainy / Precipitation Trigger: precipitation > 0mm */}
                    {isRainyCondition && (
                      <div
                        id="advisory-rainy-weather"
                        className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                            <Umbrella className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block mb-1">
                              Precipitation Detected: {todayPrecipitation.toFixed(1)} mm
                            </span>
                            <p className="font-semibold text-sm sm:text-base text-sky-200 leading-snug">
                              Rain predicted. Carry an umbrella and plan indoor activities.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pleasant Weather Trigger: no rain and temp between 15°C and 29°C */}
                    {isPleasantWeather && (
                      <div
                        id="advisory-pleasant-weather"
                        className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                              Optimal Meteorology: {formatTemp(currentTemp)}
                            </span>
                            <p className="font-semibold text-sm sm:text-base text-emerald-200 leading-snug">
                              Conditions are pleasant. Ideal for outdoor operations and travel!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cold Weather Condition: temp < 15°C and no rain */}
                    {isCoolWeather && (
                      <div
                        id="advisory-cool-weather"
                        className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                            <Thermometer className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                              Low Temperature: {formatTemp(currentTemp)}
                            </span>
                            <p className="font-semibold text-sm sm:text-base text-indigo-200 leading-snug">
                              Chilly conditions. A warm jacket and thermal layers are recommended for outdoor travel.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynamic Recommendation Summary Box */}
                <div
                  className={`mt-6 pt-4 border-t ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>
                      Synthesized from real-time barometric & precipitation models.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Feature 3: 7-Day Forecast Section */}
            <section id="forecast-section" className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      7-Day Atmospheric Forecast
                    </h2>
                    <p
                      className={`text-xs ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Upcoming weekly outlook with maximum/minimum temperature dynamics
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Precipitation sums calibrated in millimeters (mm)</span>
                </div>
              </div>

              {/* Responsive Row of 7 Cards */}
              <div
                id="forecast-grid"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4"
              >
                {weatherData.daily.time.slice(0, 7).map((dateStr, idx) => {
                  const dayInfo = formatForecastDay(dateStr, idx);
                  const maxTemp = weatherData.daily.temperature_2m_max[idx];
                  const minTemp = weatherData.daily.temperature_2m_min[idx];
                  const precipSum = weatherData.daily.precipitation_sum[idx] ?? 0;
                  const code = weatherData.daily.weathercode[idx];
                  const condition = getWeatherInfo(code);

                  return (
                    <div
                      key={dateStr}
                      id={`forecast-card-day-${idx}`}
                      className={`group rounded-2xl p-4 sm:p-5 border flex flex-col items-center justify-between text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        dayInfo.isToday
                          ? isDarkMode
                            ? 'bg-sky-950/40 border-sky-500/40 ring-1 ring-sky-500/30 shadow-sky-500/10'
                            : 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-400/30 shadow-sky-500/10'
                          : isDarkMode
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Day of the Week Header */}
                      <div className="w-full pb-2 border-b border-dashed border-slate-700/40">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`font-bold text-base sm:text-lg ${
                              dayInfo.isToday ? 'text-sky-400' : ''
                            }`}
                          >
                            {dayInfo.dayOfWeek}
                          </span>
                          {dayInfo.isToday && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400" />
                          )}
                        </div>
                        <span
                          className={`text-xs block ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {dayInfo.formattedDate}
                        </span>
                      </div>

                      {/* Weather Icon & Condition */}
                      <div className="my-4 flex flex-col items-center gap-2">
                        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 group-hover:scale-110 transition-transform duration-200">
                          <WeatherIconComponent
                            iconName={condition.iconName}
                            className="w-8 h-8 sm:w-10 sm:h-10"
                          />
                        </div>
                        <span
                          className={`text-xs font-medium line-clamp-1 max-w-[110px] ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                          title={condition.label}
                        >
                          {condition.label}
                        </span>
                      </div>

                      {/* Temperature Range (Max / Min) */}
                      <div className="w-full pt-2 border-t border-dashed border-slate-700/40 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold">
                        <span className="text-slate-100 dark:text-slate-100 light:text-slate-900">
                          {formatTemp(maxTemp)}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">/</span>
                        <span className="text-slate-400 text-xs sm:text-sm font-normal">
                          {formatTemp(minTemp)}
                        </span>
                      </div>

                      {/* Precipitation Sum (mm) */}
                      <div className="mt-2 text-xs flex items-center gap-1 font-medium">
                        <Droplets
                          className={`w-3.5 h-3.5 ${
                            precipSum > 0 ? 'text-sky-400' : 'text-slate-500'
                          }`}
                        />
                        <span
                          className={
                            precipSum > 0
                              ? 'text-sky-400 font-semibold'
                              : isDarkMode
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }
                        >
                          {precipSum.toFixed(1)} mm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Corporate Footer */}
      <footer
        id="app-footer"
        className={`mt-16 border-t py-6 transition-colors duration-300 ${
          isDarkMode
            ? 'border-slate-800 bg-slate-950/60 text-slate-400'
            : 'border-slate-200 bg-white/60 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-400">Weather Intelligence</span>
            <span>•</span>
            <span>Real-Time Free Meteorological Data powered by Open-Meteo</span>
          </div>
          <div className="flex items-center gap-4">
            <span>No API Keys Required</span>
            <span>•</span>
            <span>Auto-Geocoding Autocomplete</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
