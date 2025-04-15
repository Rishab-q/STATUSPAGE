import { useState ,useEffect, use} from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import CreateServiceModal from "./createservicemodal"
import EditServiceModal from "./updateservicemodal"
import CreateEventModal from "./CreateeventModal"
import EventUpdateModal from "./eventupdatesModal"
import { SignedIn,SignedOut,RedirectToSignIn } from "@clerk/clerk-react"
import { useAuth } from "@clerk/clerk-react"
import WebSocketService from "./Websocket"
const SERVICE_STATUSES = [
  "Operational",
  "Degraded performance",
  "Full outage",
  "Partial outage",
  "Maintenance"
]
const API_URL = import.meta.env.VITE_API_URL;
const WS_URL= import.meta.env.VITE_WS_URL
const EVENT_TYPES = [
  { value: "Scheduled maintenance", label: "Scheduled Maintenance" },
  { value: "incident", label: "Incident" }
]

export default function AdminPage1() {
  const{getToken}=useAuth()
  const [services, setServices] = useState([])
  const [events, setEvents] = useState([])
  const [openCreateService, setOpenCreateService] = useState(false)
  const [openEditService, setOpenEditService] = useState(false)
  const [openCreateEvent, setOpenCreateEvent] = useState(false)
  const [openEventUpdate, setOpenEventUpdate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const fetchServices = async () => {
    try {
      // Get the token from Clerk
      const token = await getToken();
      console.log(token)
      if (!token) {
        console.error("No token found!");
        return;
      }

      // Fetch services with the token in the Authorization header
      const res = await fetch(`${API_URL}/admin/services`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to the headers
        },
      });

      if (!res.ok) throw new Error("Failed to fetch services");

      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);


  const fetchEvents = async () => {
    try {
      // Get the token from Clerk
      const token = await getToken();
      
      if (!token) {
        console.error("No token found!");
        return;
      }

      // Fetch services with the token in the Authorization header
      const res = await fetch(`${API_URL}/admin/event`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to the headers
        },
      });

      if (!res.ok) throw new Error("Failed to fetch services");

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

 useEffect(() => {
    fetchEvents()
  }, [])
  const handleServiceCreated = (newService) => {
    setServices([...services, newService])
  }

  const handleServiceUpdated = (updatedService) => {
    setServices(services.map((service) => service.id === updatedService.id ? updatedService : service))
  }

  const handleEventCreated = (newEvent) => {
    setEvents([...events, newEvent])
  }

  const handleEventUpdateCreated = (newUpdate) => {
    setEvents((prevEvents) => prevEvents.map((event) =>
      event.id === newUpdate.id ? newUpdate : event
    ))
  }

  const handleCreateEvent = () => setOpenCreateEvent(true)

  const handleEventUpdateClick = (eventId) => {
    setSelectedEvent(events.find((event) => event.id === eventId))
    setOpenEventUpdate(true)
  }
  const deleteService = (id) => {
    setServices(services.filter(service => service.id !== id))
    //add a fetch call with delete method to delete the service from the backend
     fetch(`${API_URL}/${id}`, { method: 'DELETE' })
       .then(res => res.json())
       .then(() => {
         setServices(services.filter(service => service.id !== id))
       })
      .catch(err => console.error("Error deleting service:", err))
       setLoading(false)
     }
  

     return (
      
      <div className="p-8 bg-gray-50 rounded-lg shadow-lg">
  {/* Admin Dashboard Title */}
  <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
  <SignedIn>
  {/* Create Service Button */}
  <WebSocketService url={`${WS_URL}/ws_update`} setServices={setServices} />

  <Button
    variant="outline"
    onClick={() => setOpenCreateService(true)}
    className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white transition-all duration-300 mb-6"
  >
    + Create Service
  </Button>

  {/* Services Section */}
  <div className="services-container w-full mb-8">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Services</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {services.length > 0 ? (
        services.map((service) => (
          <Card key={service.id} className="bg-gray-100 shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold text-white-800">{service.name}</CardTitle>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedEvent(service); setOpenEditService(true); }}
                  className="text-blue-600 hover:bg-blue-100"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteService(service.id)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
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

  {/* Create Event Button */}
  <div className="mt-6">
    <Button
      variant="outline"
      onClick={handleCreateEvent}
      className="bg-green-600 text-white hover:bg-green-700 transition-all duration-300"
    >
      + Create Event
    </Button>
  </div>

  {/* Events Section */}
  <div className="events-container w-full mt-8">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Events</h2>
    <div className="overflow-auto max-h-[70vh]"> {/* Add scrollable area if the content overflows */}
      {events.length > 0 ? (
        events.map((event) => (
          <Card key={event.id} className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300 mb-4">
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
              <p className="text-sm text-green-300 mt-1">  {new Date(event.start_time).toLocaleString()} - {event.end_time ? new Date(event.end_time).toLocaleString() : "Ongoing"}</p>
            </CardHeader>

            <CardContent>
              {event.eventupdates?.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {event.eventupdates.map((update) => (
                    <div key={update.id} className="border-l-2 border-yellow-500 pl-4 relative">
                      <div className="absolute left-[-6px] top-1.5 w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-white-700"><strong>{update.status}</strong> - {update.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No updates yet.</p>
              )}

              <Button
                onClick={() => handleEventUpdateClick(event.id)}
                className="mt-4 bg-yellow-500 text-white hover:bg-yellow-600"
              >
                Add Update
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p>No events available</p>
      )}
    </div>
  </div>




    
        {/* Modals */}
        <CreateServiceModal open={openCreateService} onClose={() => setOpenCreateService(false)} onServiceCreated={handleServiceCreated} />
        <EditServiceModal open={openEditService} onClose={() => setOpenEditService(false)} service={selectedEvent} onServiceUpdated={handleServiceUpdated} />
        <CreateEventModal open={openCreateEvent} onClose={() => setOpenCreateEvent(false)} onEventCreated={handleEventCreated} services={services} />
        <EventUpdateModal open={openEventUpdate} onClose={() => setOpenEventUpdate(false)} event={selectedEvent} onUpdateCreated={handleEventUpdateCreated} />
      
    
    </SignedIn>
    <SignedOut>
        <RedirectToSignIn redirectUrl="/admin" />
    </SignedOut>
    </div>
     )
}
