import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@clerk/clerk-react"
const SERVICE_STATUSES = [
    "Operational",
    "Degraded performance",
    "Full outage",
    "Partial outage",
    "Maintenance"
  ]
const API_URL = import.meta.env.VITE_API_URL
export default function CreateServiceModal({ open, onClose, onServiceCreated }) {
  const [form, setForm] = useState({ name: "", status: "Operational" })
  const{getToken}=useAuth()
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    
    const res = await fetch(`${API_URL}/admin/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" ,"Authorization": `Bearer ${await getToken()}` },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    onServiceCreated(data)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Service</DialogTitle></DialogHeader>
        <Label>Name</Label>
        <Input name="name" value={form.name} onChange={handleChange} />
        <Label>Status</Label>
        <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="p-2 border rounded-md w-full"
        >
        {SERVICE_STATUSES.map((status) => (
            <option key={status} value={status}>
            {status}
            </option>
        ))}
        </select>
        <Button onClick={handleSubmit}>Create</Button>
      </DialogContent>
    </Dialog>
  )
}
