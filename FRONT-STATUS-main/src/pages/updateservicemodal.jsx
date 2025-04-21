// components/EditServiceModal.jsx
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/clerk-react"
const SERVICE_STATUSES = [
    "Operational",
    "Degraded performance",
    "Full outage",
    "Partial outage",
    "Maintenance"
]
const API_URL = import.meta.env.VITE_API_URL;
export default function EditServiceModal({ open, onClose, service, onServiceUpdated }) {
  const [formData, setFormData] = useState({
    name: "",
    status: ""
  })
  const{getToken}=useAuth()
  // Pre-fill the form when the modal opens or service changes
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        status: service.status
      })
    }
  }, [service])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/services/${service.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json","Authorization": `Bearer ${await getToken()}`
        },
        body: JSON.stringify(formData)
      })

      const updated = await res.json()
      onServiceUpdated(updated)
      onClose()
    } catch (err) {
      console.error("Error updating service:", err)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name} onChange={handleChange} />
          </div>
          <div>
          <Label htmlFor="status">Status</Label>
            <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="p-2 border rounded-md w-full"
            >
            {SERVICE_STATUSES.map((status) => (
                <option key={status} value={status}>
                {status}
                </option>
            ))}
            </select>

          </div>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
