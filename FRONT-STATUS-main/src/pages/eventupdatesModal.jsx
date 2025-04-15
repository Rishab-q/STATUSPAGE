import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@clerk/clerk-react"
const STATUS_OPTIONS= [
  "Identified",
  "Monitoring",
  "Investigating",
  "Resolved",
  "open"
]
const SERVICE_STATUSES = [
  "Operational",
  "Degraded performance",
  "Full outage",
  "Partial outage",
  "Maintenance"
]
const API_URL = import.meta.env.VITE_API_URL
export default function EventUpdateModal({ open, onClose, event, onUpdateCreated }) {
  const [formData, setFormData] = useState({
    status: "",
    message: "",
    closed: false,
    serviceStatuses: {} // store updates for individual services
  })
  const{getToken}=useAuth()
  useEffect(() => {
    if (event) {
      const serviceStatuses = {};
      event.affected_services?.forEach((svc) => {
        serviceStatuses[svc.service.id] = svc.service.status;
      });
  
      setFormData((prev) => ({
        ...prev,
        status: event.status || "Operational", // default if event.status is missing
        serviceStatuses
      }));
    }
  }, [event]);

  const handleServiceStatusChange = (serviceId, newStatus) => {
    setFormData((prev) => ({
      ...prev,
      serviceStatuses: {
        ...prev.serviceStatuses,
        [serviceId]: newStatus
      }
    }))
  }

  const handleSubmit = async () => {
    const updateData = {
      event_id: event.id,
      status: formData.status,
      message: formData.message,
      closed: formData.closed,
      affected_services: Object.entries(formData.serviceStatuses).map(([service_id, new_status]) => ({
        service_id: parseInt(service_id),
        new_status
      }))
    }

    try {
      const res = await fetch(`${API_URL}/admin/event/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify(updateData),
      })
  
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`)
      }
  
      const data = await res.json()
      onUpdateCreated(data)
      onClose()
    } catch (err) {
      console.error("Error creating event update:", err)
    }
  }
  

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Event Update</DialogTitle>
        </DialogHeader>

        <Label>Status</Label>
        <select
          name="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="p-2 border rounded-md"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <Label>Message</Label>
        <Textarea
          name="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Enter the update message"
          rows={4}
        />

        <Label>
          <input
            type="checkbox"
            name="closed"
            checked={formData.closed}
            onChange={() => setFormData((prev) => ({ ...prev, closed: !prev.closed }))} // Toggle closed status
          />
          Closed
        </Label>

        {/* Affected Services List */}
        {event?.affected_services?.map((svc) => (
          <div key={svc.service.id}>
            <Label>{svc.service.name} </Label>
            <select
              value={formData.serviceStatuses[svc.service.id] || svc.service.status} // Default to current status
              onChange={(e) => handleServiceStatusChange(svc.service.id, e.target.value)}
              className="p-2 border rounded-md"
            >
              {SERVICE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ))}

        <Button className="mt-4 w-full" onClick={handleSubmit}>
          Add Update
        </Button>
      </DialogContent>
    </Dialog>
  )
}
