import { Routes, Route, Link } from "react-router-dom"
import TestPage from "./pages/testpage"
import AdminPage1 from "./pages/statuspage"
import AuthPage from "./pages/Authentication"
import PublicStatusPage from "./pages/PublicStatusPage"
import { Navigate } from "react-router-dom";
 function App() {
  return (
    <div className="p-4">
      

      <Routes>
        
         <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/" element={<AuthPage />} />
        <Route path="/:org_slug/" element={<PublicStatusPage />} />
        <Route path="/admin/dashboard" element={<AdminPage1 />} />
      </Routes>
    </div>
  )
}

export default App
