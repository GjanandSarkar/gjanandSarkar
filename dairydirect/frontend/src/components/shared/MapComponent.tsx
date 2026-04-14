"use client";

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Leaf, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type MapComponentProps = {
  driverLocation?: Coordinates | null;
  farmLocation?: Coordinates | null;
  customerLocation?: Coordinates | null;
  onLocationChange?: (coords: Coordinates) => void;
  interactive?: boolean;
  height?: string;
  showCenterMarker?: boolean;
};

export default function MapComponent({ 
  driverLocation, 
  farmLocation, 
  customerLocation, 
  onLocationChange,
  interactive = false,
  height = '400px',
  showCenterMarker = false
}: MapComponentProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState('https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json');
  
  // Internal state to track map viewpoint
  const [viewState, setViewState] = useState({
    longitude: customerLocation?.lng || 79.0882,
    latitude: customerLocation?.lat || 21.1458,
    zoom: 15
  });

  // Sync internal viewState when customerLocation changes (e.g. from parent "Use Location" button)
  useEffect(() => {
    if (customerLocation) {
      const { lat, lng } = customerLocation;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        // Only update if the difference is significant to avoid jitter / loops
        const diffLat = Math.abs(viewState.latitude - lat);
        const diffLng = Math.abs(viewState.longitude - lng);
        
        if (diffLat > 0.0001 || diffLng > 0.0001) {
          setViewState(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
          
          // Also fly to the location if it's a forced update from parent
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [lng, lat],
              zoom: 16,
              duration: 2000,
              essential: true
            });
          }
        }
      }
    }
  }, [customerLocation]);

  const handleMove = (evt: any) => {
    const nextViewState = evt.viewState;
    setViewState(nextViewState);
    if (onLocationChange) {
      onLocationChange({ lat: nextViewState.latitude, lng: nextViewState.longitude });
    }
  };

  const toggleStyle = () => {
    const dark = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
    const light = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
    setMapStyle(mapStyle === light ? dark : light);
  };

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA";

  return (
    <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden' }} className="shadow-lg relative border-2 border-primary/10">
      <Map
        {...viewState}
        onMove={handleMove}
        ref={mapRef}
        mapStyle={mapStyle}
        scrollZoom={interactive}
        dragPan={interactive}
      >
        <NavigationControl position="top-right" />
        
        {/* Style Toggle Button */}
        <div className="absolute bottom-4 left-4 z-50">
           <button 
             type="button"
             onClick={(e) => { e.stopPropagation(); toggleStyle(); }}
             className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary shadow-lg border border-primary/20 hover:bg-surface transition-all active:scale-95"
           >
             {mapStyle.includes('dark') ? 'Light Map' : 'Dark Map'}
           </button>
        </div>

        {/* Center Pin Marker for Address Picking */}
        {showCenterMarker && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] pointer-events-none z-50">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center"
            >
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-2xl relative">
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 -z-10" />
              </div>
              <div className="w-1.5 h-4 bg-primary rounded-b-full shadow-lg" />
            </motion.div>
          </div>
        )}

        {farmLocation && (
          <Marker longitude={farmLocation.lng} latitude={farmLocation.lat} anchor="bottom">
            <div className="bg-white p-2 rounded-[14px] shadow-xl border-2 border-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
          </Marker>
        )}

        {customerLocation && !showCenterMarker && (
          <Marker longitude={customerLocation.lng} latitude={customerLocation.lat} anchor="bottom">
            <div className="relative flex items-center justify-center">
              <div className="w-5 h-5 bg-tertiary rounded-full shadow-[0_0_15px_rgba(255,200,87,0.8)] border-[3px] border-white z-10 relative" />
              <div className="absolute w-12 h-12 bg-tertiary rounded-full opacity-20 animate-ping" />
            </div>
          </Marker>
        )}

        {driverLocation && (
          <Marker longitude={driverLocation.lng} latitude={driverLocation.lat} anchor="bottom" className="z-20">
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1], 
                boxShadow: ["0 0 0 rgba(63,101,48,0)", "0 0 25px rgba(63,101,48,0.6)", "0 0 0 rgba(63,101,48,0)"] 
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="bg-primary text-white p-2.5 rounded-full border-[3px] border-white relative z-20"
            >
              <Truck className="w-6 h-6" />
            </motion.div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
