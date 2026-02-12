/*
 * GOOGLE MAPS API KEY INSTRUCTIONS
 * ================================
 * 1. Go to the Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select an existing one.
 * 3. Navigate to "APIs & Services" > "Library".
 * 4. Search for "Maps JavaScript API" and click "Enable".
 * 5. Navigate to "APIs & Services" > "Credentials".
 * 6. Click "Create Credentials" > "API Key".
 * 7. Copy the generated API Key.
 * 8. Paste it into the `googleMapsApiKey` prop in the `LoadScript` component below.
 *    (Replace "YOUR_GOOGLE_MAPS_API_KEY")
 * 
 * Note: You may also need to enable "Billing" on the Google Cloud project for the Maps API to work 
 * (though there is a generous free tier).
 */

import { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Polygon, Marker } from '@react-google-maps/api';
import { X, MapPin, Navigation, Share2, Map as MapIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const containerStyle = {
    width: '100%',
    height: '100%'
};

// Ward 27 (Navi Peth - Parvati) Center
const center = {
    lat: 18.5011,
    lng: 73.8428
};

interface PlaceDetails {
    position: google.maps.LatLng | google.maps.LatLngLiteral;
    placeId?: string;
    title: string;
    address: string;
    category?: string;
    photoUrl?: string; // Street view or place photo
    url?: string; // Google Maps URL
}

const WardMap = () => {
    const { t } = useLanguage();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isTracing, setIsTracing] = useState(false);
    const [customBoundary, setCustomBoundary] = useState<{ lat: number; lng: number }[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
    const [isLoadingPlace, setIsLoadingPlace] = useState(false);

    // Official Boundary (Red) - Traced by User (Converted to Google Maps format)
    const officialBoundary = [
        { lat: 18.500915479427793, lng: 73.85857343673707 },
        { lat: 18.511455786342182, lng: 73.84511947631837 },
        { lat: 18.51213742477151, lng: 73.8438105583191 },
        { lat: 18.512819060485597, lng: 73.84384274482728 },
        { lat: 18.513653297515038, lng: 73.84302735328676 },
        { lat: 18.512025514170897, lng: 73.84136438369752 },
        { lat: 18.51014337037662, lng: 73.84001255035402 },
        { lat: 18.507599899930522, lng: 73.83735179901124 },
        { lat: 18.50609414761535, lng: 73.83654713630678 },
        { lat: 18.504568033780927, lng: 73.83655786514284 },
        { lat: 18.501851517495457, lng: 73.83684754371644 },
        { lat: 18.49928757494854, lng: 73.83618235588075 },
        { lat: 18.498158207123904, lng: 73.83549571037294 },
        { lat: 18.49752738581787, lng: 73.83632183074953 },
        { lat: 18.49752738581787, lng: 73.83838176727296 },
        { lat: 18.498585536365887, lng: 73.83867144584657 },
        { lat: 18.499145132570302, lng: 73.83905768394472 },
        { lat: 18.501027397292177, lng: 73.83916497230531 },
        { lat: 18.500935828135844, lng: 73.84222269058229 },
        { lat: 18.502695982230986, lng: 73.84374618530275 },
        { lat: 18.50284859589544, lng: 73.84523749351503 },
        { lat: 18.50111896639953, lng: 73.84564518928529 },
        { lat: 18.501037571639856, lng: 73.8476085662842 },
        { lat: 18.50051867913737, lng: 73.84913206100465 },
        { lat: 18.49949106385479, lng: 73.8505268096924 },
        { lat: 18.4983922208885, lng: 73.85017275810243 },
        { lat: 18.498117509045247, lng: 73.84966850280763 },
        { lat: 18.49632678400968, lng: 73.84929299354555 },
        { lat: 18.49601137027431, lng: 73.8490676879883 },
        { lat: 18.49623521233989, lng: 73.8480591773987 },
        { lat: 18.495177047270822, lng: 73.84736180305482 },
        { lat: 18.492663879032875, lng: 73.8480055332184 },
        { lat: 18.49258248025489, lng: 73.8498616218567 },
        { lat: 18.492378983140718, lng: 73.8577687740326 }
    ];

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);

        // Auto-fit to ward boundary
        if (officialBoundary.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            officialBoundary.forEach(coord => {
                bounds.extend(coord);
            });
            map.fitBounds(bounds);

            // Add a bit of padding (optional, fitBounds already takes padding in some versions but this is explicit)
            // map.setZoom(map.getZoom()! - 1); 
        }
    }, [officialBoundary]);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []); // Removed 'map' from dependencies

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (isTracing && e.latLng) {
            const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setCustomBoundary(prev => [...prev, newPoint]);
            setSelectedPlace(null);
        } else if (!isTracing && e.latLng && map) {
            // "Click to Identify" Logic
            const latLng = e.latLng;
            // Stop any other event if a placeId is present (handled by POI click usually, but this is backup)
            const placeId = (e as any).placeId;

            e.stop();
            setIsLoadingPlace(true);
            setSelectedPlace(null); // Clear previous

            if (placeId) {
                // POI Click - Use Places Service for full details
                const service = new google.maps.places.PlacesService(map);
                service.getDetails({
                    placeId: placeId,
                    fields: ['name', 'formatted_address', 'types', 'photos', 'url', 'geometry']
                }, (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {

                        // Get photo URL if available
                        let photoUrl = "";
                        if (place.photos && place.photos.length > 0) {
                            photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
                        } else {
                            // Fallback to Street View Image API
                            photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${place.geometry.location.lat()},${place.geometry.location.lng()}&fov=80&heading=70&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;
                        }

                        setSelectedPlace({
                            position: place.geometry.location,
                            placeId: placeId,
                            title: place.name || "Selected Place",
                            address: place.formatted_address || "Address unavailable",
                            category: place.types ? place.types[0].replace(/_/g, ' ') : undefined,
                            photoUrl: photoUrl,
                            url: place.url
                        });
                    }
                    setIsLoadingPlace(false);
                });
            } else {
                // General Lat/Lng Click - Geocode
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: latLng }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        // Use Street View Image API
                        const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${latLng.lat()},${latLng.lng()}&fov=80&heading=70&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;

                        setSelectedPlace({
                            position: latLng,
                            title: "Selected Location",
                            address: results[0].formatted_address,
                            photoUrl: svUrl,
                            url: `https://www.google.com/maps/search/?api=1&query=${latLng.lat()},${latLng.lng()}`
                        });
                    }
                    setIsLoadingPlace(false);
                });
            }
        }
    };

    const handleCopyCoordinates = () => {
        const json = JSON.stringify(customBoundary, null, 2);
        navigator.clipboard.writeText(json);
        alert("Coordinates copied to clipboard!");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-50">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <MapIcon className="w-8 h-8 text-brand-600" />
                    {t('ward_map.title') || 'Ward Map'}
                </h1>
                <p className="text-slate-500 mt-1">
                    {t('ward_map.subtitle') || 'View geographic details of the ward'}
                </p>
            </div>

            {/* Map Container */}
            <div className="flex-1 w-full relative rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
                    {/* <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
                        <div className="pointer-events-auto flex flex-col gap-2">
                            <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs transition-opacity duration-300">
                                <h2 className="font-bold text-lg mb-1">{t('ward_map.title') || 'Ward Map'}</h2>
                                <p className="text-sm text-gray-500 mb-2">Tap any building for details</p>

                                <div className="border-t pt-2 mt-1">
                                    <h3 className="font-semibold text-sm mb-1">Trace Tools</h3>
                                    {!isTracing ? (
                                        <button
                                            onClick={() => setIsTracing(true)}
                                            className="bg-blue-600 text-white w-full px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Start Manual Tracing
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <div className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200">
                                                Click map to add points.<br />Points: {customBoundary.length}
                                            </div>
                                            <button
                                                onClick={() => setIsTracing(false)}
                                                className="bg-green-600 text-white w-full px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors"
                                            >
                                                Stop Tracing
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setCustomBoundary(prev => prev.slice(0, -1))}
                                                    className="bg-red-100 text-red-600 flex-1 px-2 py-1 rounded text-xs hover:bg-red-200"
                                                >
                                                    Undo
                                                </button>
                                                <button
                                                    onClick={() => setCustomBoundary([])}
                                                    className="bg-red-600 text-white flex-1 px-2 py-1 rounded text-xs hover:bg-red-700"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleCopyCoordinates}
                                                className="bg-gray-800 text-white w-full px-3 py-1.5 rounded text-sm hover:bg-gray-900 transition-colors"
                                            >
                                                Copy Coords
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div> */}

                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={17} // Zoomed in a bit more initially
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={handleMapClick}
                        mapTypeId="hybrid"
                        options={{
                            mapTypeControl: true,
                            mapTypeControlOptions: {
                                position: 3, // TOP_RIGHT
                            },
                            streetViewControl: false,
                            fullscreenControl: false,
                            zoomControl: false, // Allow gesture only or add custom
                            clickableIcons: true, // IMPORTANT: Allows clicking POIs
                        }}
                    >
                        {/* Official Boundary (Red) */}
                        <Polygon
                            paths={officialBoundary}
                            options={{
                                strokeColor: "#FF0000",
                                strokeOpacity: 1.0,
                                strokeWeight: 3,
                                fillColor: "#FF0000",
                                fillOpacity: 0.1,
                                clickable: false
                            }}
                        />

                        {/* Custom Boundary (Blue Dashed) */}
                        {customBoundary.length > 0 && (
                            <>
                                <Polygon
                                    paths={customBoundary}
                                    options={{
                                        strokeColor: "#0000FF",
                                        strokeOpacity: 0.8,
                                        strokeWeight: 2,
                                        fillOpacity: 0,
                                        clickable: false
                                    }}
                                />
                                {customBoundary.map((pos, idx) => (
                                    <Marker key={idx} position={pos} label={(idx + 1).toString()} />
                                ))}
                            </>
                        )}

                        {/* Selected Place Marker */}
                        {selectedPlace && (
                            <Marker
                                position={selectedPlace.position}
                                animation={google.maps.Animation.DROP}
                            />
                        )}
                    </GoogleMap>

                    {/* Bottom Card UI - Google Maps Style */}
                    {(selectedPlace || isLoadingPlace) && (
                        <div className="absolute bottom-0 left-0 w-full z-[1000] p-4 flex justify-center pointer-events-none">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto animate-in slide-in-from-bottom duration-300">
                                {isLoadingPlace ? (
                                    <div className="p-4 flex items-center justify-center gap-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                        <span className="text-sm text-gray-500">Loading place details...</span>
                                    </div>
                                ) : selectedPlace && (
                                    <>
                                        {/* Place Image / Street View */}
                                        {selectedPlace.photoUrl && (
                                            <div className="h-32 w-full relative bg-gray-200">
                                                <img
                                                    src={selectedPlace.photoUrl}
                                                    alt="Place view"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                                                    Street View
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                        {selectedPlace.title}
                                                    </h3>
                                                    {selectedPlace.category && (
                                                        <span className="text-xs uppercase font-medium text-gray-500 mt-0.5 block">
                                                            {selectedPlace.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setSelectedPlace(null)}
                                                    className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            <div className="mt-3 flex items-start gap-2 text-gray-600">
                                                <MapPin size={16} className="mt-0.5 shrink-0" />
                                                <p className="text-sm leading-snug">{selectedPlace.address}</p>
                                            </div>

                                            <div className="mt-4 flex gap-3">
                                                <a
                                                    href={selectedPlace.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.address)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                                                >
                                                    <Navigation size={16} />
                                                    Directions
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(selectedPlace.address);
                                                        alert("Address copied!");
                                                    }}
                                                    className="flex-1 bg-gray-100 text-blue-600 py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition"
                                                >
                                                    <Share2 size={16} />
                                                    Share
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </LoadScript>
            </div>
        </div>
    );
};

export default WardMap;
