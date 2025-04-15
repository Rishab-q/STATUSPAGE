import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

function TestPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Hello from Test Page 🚀</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This is a working test route using React Router, Tailwind, and Shadcn UI.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default TestPage
