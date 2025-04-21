import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatISO } from "date-fns"
import { useAuth } from "@clerk/clerk-react"
const SERVICE_STATUSES = [
  "Operational",
  "Degraded performance",
  "Full outage",
  "Partial outage",
  "Maintenance"
]

const EVENT_STATUSES = [
  "Identified",
  "Monitoring",
  "Investigating",
  "Resolved",
  "open",
]
const API_URL = import.meta.env.VITE_API_URL
const EVENT_TYPES = [
  { value: "Scheduled maintenance", label: "Scheduled Maintenance" },
  { value: "incident", label: "Incident" }
]

export default function CreateEventModal({ open, onClose, onEventCreated, services }) {
  const [formData, setFormData] = useState({
    title: "",
    start_time: "",
    end_time: null,
    type: "incident",
    affected_services: [],
    status:null,
  })
  const{getToken}=useAuth()
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleService = (serviceId) => {
    setFormData((prev) => {
      const exists = prev.affected_services.find(s => s.service_id === serviceId)
      if (exists) {
        return {
          ...prev,
          affected_services: prev.affected_services.filter(s => s.service_id !== serviceId)
        }
      } else {
        return {
          ...prev,
          affected_services: [...prev.affected_services, { service_id: serviceId, new_status: "Operational" }]
        }
      }
    })
  }

  const handleServiceStatusChange = (serviceId, status) => {
    setFormData((prev) => ({
      ...prev,
      affected_services: prev.affected_services.map(s =>
        s.service_id === serviceId ? { ...s, new_status: status } : s
      )
    }))
  }

  const handleSubmit = async () => {
    try {
      const token = await getToken();  // Ensure you're awaiting the token here
      const res = await fetch(`${API_URL}/admin/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
  
      if (!res.ok) {
        throw new Error("Failed to create event");
      }
  
      const data = await res.json();
      onEventCreated(data);  // Callback after successful event creation
      onClose();  // Close the modal after event creation
  
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };
  const isScheduledMaintenance = formData.type === "Scheduled maintenance"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <Label>Title</Label>
        <Input name="title" value={formData.title} onChange={handleChange} />

        <Label>Type</Label>
        <select name="type" value={formData.type} onChange={handleChange} className="p-2 border rounded-md">
          {EVENT_TYPES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>


        {!isScheduledMaintenance && (
          <><Label>Status</Label>
          <select name="type" value={formData.status} onChange={handleChange} className="p-2 border rounded-md">
            {EVENT_STATUSES.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select></>)}
        <Label>Start Time</Label>
        <Input name="start_time" type="datetime-local" onChange={(e) =>
          handleChange({ target: { name: "start_time", value: formatISO(new Date(e.target.value)) } })
        } />

        {isScheduledMaintenance && (
          <>
            <Label>End Time (required for scheduled maintenance)</Label>
            <Input name="end_time" type="datetime-local" required onChange={(e) =>
              handleChange({ target: { name: "end_time", value: formatISO(new Date(e.target.value)) } })
            } />
          </>
        )}

        {!isScheduledMaintenance && (
          <>
            <Label>End Time (optional for incident)</Label>
            <Input name="end_time" type="datetime-local" onChange={(e) =>
              handleChange({ target: { name: "end_time", value: formatISO(new Date(e.target.value)) } })
            } />
          </>
        )}

        <Label>Affected Services</Label>
        <div className="space-y-3">
          {services.map(service => {
            const selected = formData.affected_services.find(s => s.service_id === service.id)
            return (
              <div key={service.id} className="border p-3 rounded-md">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleService(service.id)}
                  />
                  {service.name}
                </label>
                {!isScheduledMaintenance && selected && (
                  <select
                    className="mt-2 p-1 border rounded-md"
                    value={selected.new_status}
                    onChange={(e) => handleServiceStatusChange(service.id, e.target.value)}
                  >
                    {SERVICE_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>

        <Button className="mt-4 w-full" onClick={handleSubmit}>
          Create Event
        </Button>
      </DialogContent>
    </Dialog>
  )
}
