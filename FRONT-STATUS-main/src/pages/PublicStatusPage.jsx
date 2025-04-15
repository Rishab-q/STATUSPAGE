import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import WebSocketService from "./Websocket"
const statusColors = {
    Operational: "bg-green-100 text-green-700",
    "Degraded performance": "bg-yellow-100 text-yellow-800",
    "Full outage": "bg-red-100 text-red-700",
    "Partial outage": "bg-orange-100 text-orange-700",
    Maintenance: "bg-blue-100 text-blue-700",
  }
  const API_URL = import.meta.env.VITE_API_URL;
  const WS_URL= import.meta.env.VITE_WS_URL;
export default function PublicStatusPage() {
    const { org_slug } = useParams()
    const [services, setServices] = useState([])
    const [events,setEvents]=useState([])
    const fetchServices = async () => {
      try {
   
        // Fetch services with the token in the Authorization header
        const res = await fetch(`${API_URL}/services?org_slug=${org_slug}`);
        if (!res.ok) throw new Error("Failed to fetch services");
  
        const data = await res.json();
        setServices(data);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    };
  
    useEffect(() => {
      fetchServices();
    }, [org_slug]);
  
  
    const fetchEvents = async () => {
      try {
  
        // Fetch services with the token in the Authorization header
        const res = await fetch(`${API_URL}/events?org_slug=${org_slug}`);
  
        if (!res.ok) throw new Error("Failed to fetch services");
  
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    };
  
   useEffect(() => {
      fetchEvents()
    }, [org_slug])
  
    return (
      <div className="p-8 bg-gray-50 rounded-lg shadow-lg">
  <h1 className="text-4xl font-bold text-gray-800 mb-8">{org_slug} STATUS</h1>
  <WebSocketService url={`${WS_URL}/ws_update`} setServices={setServices} />

  {/* Services Section */}
  <div className="services-container w-full mb-8">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Services</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {services.length > 0 ? (
        services.map((service) => (
          <Card key={service.id} className="bg-gray-100 shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold text-white-800">{service.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="inline-block px-3 py-1 rounded-full text-sm font-medium text-gray-700 bg-gray-200">
                {service.status}
              </p>
            </CardContent>
          </Card>
        ))
      ) : (
        <p>No services available</p>
      )}
    </div>
  </div>

  {/* Events Section Split */}
  <div className="flex flex-col lg:flex-row gap-8 mt-8">
    {/* Left Column - Active & Upcoming Events */}
    <div className="w-full lg:w-1/2">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active & Upcoming Events</h2>
      {events
        .filter((event) => !event.end_time || new Date(event.end_time) > new Date())
        .map((event) => (
          <Card key={event.id} className="bg-white shadow rounded-lg p-6 mb-4">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white-800 flex flex-wrap justify-between items-center">
                {event.title}
                <div className="flex gap-2 flex-wrap">
                  {event.affected_services?.map((svc) => (
                    <span
                      key={svc.service.id}
                      className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 border"
                    >
                      {svc.service.name}
                    </span>
                  ))}
                </div>
              </CardTitle>
              <p className="text-sm text-yellow-500 mt-1">{event.type}</p>
              <p className="text-sm text-green-300 mt-1">
                {new Date(event.start_time).toLocaleString()} -{" "}
                {event.end_time ? new Date(event.end_time).toLocaleString() : "Ongoing"}
              </p>
            </CardHeader>
            <CardContent>
              {event.eventupdates?.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-white-600">
                  {event.eventupdates.map((update) => (
                    <li key={update.id}>
                      <strong>{update.status}</strong> – {update.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No updates yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
    </div>

   {/* Right Column - Past Events Timeline */}
<div className="w-full lg:w-1/2">
  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Events</h2>
  <div className="overflow-auto max-h-[70vh] space-y-4">
    {events
      .filter((event) => event.end_time && new Date(event.end_time) < new Date())
      .sort((a, b) => new Date(b.end_time) - new Date(a.end_time)) // Most recent first
      .map((event) => (
        <Card key={event.id} className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white-800 flex flex-wrap justify-between items-center">
              {event.title}
              <div className="flex gap-2 flex-wrap">
                {event.affected_services?.map((svc) => (
                  <span
                    key={svc.service.id}
                    className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 border"
                  >
                    {svc.service.name}
                  </span>
                ))}
              </div>
            </CardTitle>
            <p className="text-sm text-yellow-500 mt-1">{event.type}</p>
            <p className="text-sm text-red-400 mt-1">
              {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}
            </p>
          </CardHeader>

          <CardContent>
            {event.eventupdates?.length > 0 ? (
              <div className="mt-4 space-y-4">
                {event.eventupdates.map((update) => (
                  <div key={update.id} className="border-l-2 border-yellow-500 pl-4 relative">
                    <div className="absolute left-[-6px] top-1.5 w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <p className="text-sm text-white-700">
                      <strong>{update.status}</strong> - {update.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No updates for this event.</p>
            )}
          </CardContent>
        </Card>
      ))}
  </div>
</div>
</div>
</div>
      )
      
      
  }




