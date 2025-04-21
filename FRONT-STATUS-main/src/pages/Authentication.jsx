import { SignIn } from "@clerk/clerk-react"

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <SignIn afterSignInUrl="/admin/dashboard" />
    </div>
  )
}
