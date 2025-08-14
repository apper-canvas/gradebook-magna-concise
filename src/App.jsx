import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Layout from "@/components/organisms/Layout";
import StudentsPage from "@/components/pages/StudentsPage";
import ClassesPage from "@/components/pages/ClassesPage";
import ReportsPage from "@/components/pages/ReportsPage";
import SettingsPage from "@/components/pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<StudentsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          className="toast-container"
          style={{ zIndex: 9999 }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;