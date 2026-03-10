import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Globe, Home, Search, PlusSquare, PlaySquare, ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customGlowIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customEventIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// A simple helper to map countries to rough coordinates, since we only have 'country' strings for most things
const countryCoordinates = {
  "USA": [37.0902, -95.7129],
  "UK": [55.3781, -3.4360],
  "Kenya": [-1.2921, 36.8219],
  "Nigeria": [-1.2921, 36.8219],
  "Brazil": [9.0820, 8.6753],
  "South Africa": [-14.2350, -51.9253],
  "Australia": [-30.5595, 22.9375],
  "Canada": [-25.2744, 133.7751],
  "India": [20.5937, 78.9629],
  "Philippines": [-12.2383, -38.9997],
  "Germany": [56.1304, -106.3468],
  "France": [46.2276, 2.2137],
  "Japan": [20.5937, 78.9629],
  "Mexico": [12.8797, 121.7740],
  "Global": [0, 0]
};

// Add some random jitter so markers in the same country don't overlap perfectly
const addJitter = (coord) => {
  return [coord[0] + (Math.random() - 0.5) * 5, coord[1] + (Math.random() - 0.5) * 5];
};

export default function GlobalReach() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
      }
    }
    checkAuth();
  }, []);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list()
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["allGroups"],
    queryFn: () => base44.entities.GlowGroup.list()
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["allEvents"],
    queryFn: () => base44.entities.GlowGroupEvent.list()
  });

  if (usersLoading || groupsLoading || eventsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  // Generate markers for users, groups, and events based on their country/location
  const userMarkers = users.map(u => {
    const coord = countryCoordinates[u.country] || addJitter([20, 0]); // Default somewhere
    return { ...u, type: 'user', position: addJitter(coord) };
  });

  const groupMarkers = groups.map(g => {
    const coord = countryCoordinates[g.country] || addJitter([10, 20]);
    return { ...g, type: 'group', position: addJitter(coord) };
  });

  const eventMarkers = events.map(e => {
    // Try to guess from location string, or just randomize around Europe/Africa for demo
    const pos = addJitter([30, 20]);
    return { ...e, type: 'event', position: pos };
  });

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-20 lg:pb-0 relative overflow-hidden font-['Inter']">
      <div className="max-w-6xl mx-auto min-h-screen relative z-10 bg-[#0B0F1A] grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar (Desktop) - Replicated from Feed */}
        <div className="hidden lg:flex flex-col gap-8 py-8 px-6 sticky top-[72px] h-[calc(100vh-72px)] border-r border-white/10">
           <Link to={createPageUrl("Feed")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><Home className="w-7 h-7" /> Home</Link>
           <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><Search className="w-7 h-7" /> Explore</Link>
           <Link to={createPageUrl("Dashboard")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><PlusSquare className="w-7 h-7" /> Dashboard</Link>
           <Link to={createPageUrl("Resources")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><PlaySquare className="w-7 h-7" /> Resources</Link>
           <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-4 text-xl font-bold text-[#00CFFF] transition"><Globe className="w-7 h-7" /> Global Reach</Link>
           <Link to={createPageUrl("Profile")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs uppercase font-bold text-white overflow-hidden">
               {user?.profile_picture_url ? <img src={user.profile_picture_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0) || "U"}
             </div>
             Profile
           </Link>
        </div>

        {/* Center Content */}
        <div className="lg:col-span-3 sm:border-x border-white/10 min-h-screen lg:border-none flex flex-col">
          
          <div className="p-6 border-b border-white/10 flex items-center gap-4 sticky top-0 z-20 bg-[#0B0F1A]/90 backdrop-blur-md lg:top-[72px]">
            <Link to={createPageUrl("Feed")} className="lg:hidden"><ArrowLeft className="w-6 h-6 text-gray-400" /></Link>
            <div>
              <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]">Global Reach</h1>
              <p className="text-gray-400 text-sm mt-1">Visualize the impact of Generation LightMode across the world.</p>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#121826] p-4 rounded-xl border border-white/10 text-center">
                <div className="text-3xl font-bold text-[#00CFFF]">{users.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Missionaries</div>
              </div>
              <div className="bg-[#121826] p-4 rounded-xl border border-[#FFD000]/30 text-center">
                <div className="text-3xl font-bold text-[#FFD000]">{groups.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">GlowGroups</div>
              </div>
              <div className="bg-[#121826] p-4 rounded-xl border border-[#8A5CFF]/30 text-center">
                <div className="text-3xl font-bold text-[#8A5CFF]">{events.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Active Events</div>
              </div>
            </div>

            <div className="flex-1 min-h-[500px] rounded-2xl overflow-hidden border border-white/10 relative z-0">
              <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%", background: "#0B0F1A" }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {/* Users */}
                {userMarkers.map(u => (
                  <Marker key={`u-${u.id}`} position={u.position}>
                    <Popup className="custom-popup">
                      <div className="font-bold">{u.full_name}</div>
                      <div className="text-xs text-gray-500">Missionary from {u.country || "Global"}</div>
                    </Popup>
                  </Marker>
                ))}

                {/* Groups */}
                {groupMarkers.map(g => (
                  <Marker key={`g-${g.id}`} position={g.position} icon={customGlowIcon}>
                    <Popup className="custom-popup">
                      <div className="font-bold text-[#FFD000]">{g.name}</div>
                      <div className="text-xs text-gray-500">GlowGroup in {g.country}</div>
                    </Popup>
                  </Marker>
                ))}

                {/* Events */}
                {eventMarkers.map(e => (
                  <Marker key={`e-${e.id}`} position={e.position} icon={customEventIcon}>
                    <Popup className="custom-popup">
                      <div className="font-bold text-[#8A5CFF]">{e.title}</div>
                      <div className="text-xs text-gray-500">Event on {new Date(e.date).toLocaleDateString()}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            
            <div className="flex gap-6 justify-center text-sm">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Missionaries</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FFD000]"></div> GlowGroups</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#8A5CFF]"></div> Events</div>
            </div>
          </div>
        </div>
        
        {/* Bottom Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A] border-t border-white/10 flex justify-around items-center py-3 px-6 z-50 pb-safe sm:max-w-xl sm:mx-auto sm:border-x lg:hidden">
          <Link to={createPageUrl("Feed")}><Home className="w-6 h-6 text-white" fill="none" /></Link>
          <Link to={createPageUrl("GlowGroups")}><Search className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Dashboard")}><PlusSquare className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Resources")}><PlaySquare className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("GlobalReach")}><Globe className="w-6 h-6 text-[#00CFFF]" /></Link>
          <Link to={createPageUrl("Profile")}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center text-[10px] uppercase font-bold text-white overflow-hidden">
              {user?.profile_picture_url ? <img src={user.profile_picture_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0) || "U"}
            </div>
          </Link>
        </div>
      </div>
      
      <style>{`
        .leaflet-container {
          font-family: 'Inter', sans-serif;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: #121826;
          color: white;
          border: 1px solid rgba(0, 207, 255, 0.2);
          border-radius: 12px;
        }
        .custom-popup .leaflet-popup-tip {
          background: #121826;
          border: 1px solid rgba(0, 207, 255, 0.2);
        }
      `}</style>
    </div>
  );
}