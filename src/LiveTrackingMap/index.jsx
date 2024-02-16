import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import markImg from "./trackerIcon.png";
import defaultMarkerIcon from "./location-pin.png";

// Set up the marker icon
const markerIcon = L.icon({
  iconUrl: markImg,
  iconSize: [40, 60],
  iconAnchor: [20, 60], // Adjust if necessary
});

const defaultIcon = L.icon({
  iconUrl: defaultMarkerIcon,
  iconSize: [40, 50],
  iconAnchor: [12, 41], // Default Leaflet anchor for markers
});

const Routing = ({ from, to }) => {
  const map = useMapEvents({});
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const movingMarkerRef = useRef(null);
  const animationIntervalRef = useRef(null);
  const animationIndexRef = useRef(0);

  useEffect(() => {
    // Remove previous routing control to prevent duplicates
    const routingControls = L.DomUtil.get('leaflet-routing-container');
    if (routingControls && routingControls.parentNode) {
      routingControls.parentNode.removeChild(routingControls);
    }

    // Define routing control and its events
    const routingControl = L.Routing.control({
      waypoints: [from, to],
      routeWhileDragging: false,
      addWaypoints: false,
      lineOptions: {
        styles: [{ color: "#6FA1EC", weight: 4 }],
      },
      createMarker: function(i, waypoint) {
        return L.marker(waypoint.latLng, {
          icon: i === 0 || i === 1 ? defaultIcon : markerIcon,
        });
      },
    }).addTo(map);

    // Listen for the route found event
    routingControl.on('routesfound', function (e) {
      const routes = e.routes;
      setRouteCoordinates(routes[0].coordinates);
      if (!movingMarkerRef.current) {
        movingMarkerRef.current = L.marker(routes[0].coordinates[0], {
          icon: markerIcon,
        }).addTo(map);
      }
    });

    // This cleans up the routing control when the component is unmounted
    return () => {
      map.removeControl(routingControl);
    };
  }, [map, from, to]);

  useEffect(() => {
    // Clean up any existing animation interval
    clearInterval(animationIntervalRef.current);

    // Start animation
    animationIntervalRef.current = setInterval(() => {
      if (animationIndexRef.current < routeCoordinates.length - 1) {
        const startPoint = routeCoordinates[animationIndexRef.current];
        const endPoint = routeCoordinates[animationIndexRef.current + 1];
        const distance = startPoint.distanceTo(endPoint);
        const duration = distance * 10; // Adjust speed as needed
        movingMarkerRef.current.setLatLng(endPoint);
        animationIndexRef.current += 1;
      } else {
        // End of animation
        clearInterval(animationIntervalRef.current);
      }
    }, 120); // Update marker position every 1 second

    return () => {
      // Clean up animation interval on component unmount
      clearInterval(animationIntervalRef.current);
    };
  }, [routeCoordinates]);

  return null;
};

const LiveTrackingMap = () => {
    const from = L.latLng(3.1390, 101.6869); // Kuala Lumpur
    const to = L.latLng(3.0738, 101.5183); // Shah Alam

  return (
    <MapContainer 
      center={from} 
      zoom={13} 
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {/* Marker with custom icon */}
      <Marker position={from} icon={defaultIcon} />
      <Marker position={to} icon={defaultIcon} />
      {/* Component responsible for routing */}
      <Routing from={from} to={to} />
    </MapContainer>
  );
};

export default LiveTrackingMap;
