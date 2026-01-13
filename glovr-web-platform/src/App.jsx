import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Patient from "./pages/Patient/Patient";
import Therapist from "./pages/Therapist/Therapist";
import Patient_Exercises from "./pages/Patient/Exercises/Exercises";
import Patient_Progress from "./pages/Patient/Progress/Progress";
import Patient_History from "./pages/Patient/History/History";
import Patient_Profile from "./pages/Patient/Profile/Profile";
import Therapist_Profile from "./pages/Therapist/Profile/Profile";
import Therapist_Patients from "./pages/Therapist/Patients/Patients";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/patient" element={<Patient />} />
      <Route path="/therapist" element={<Therapist />} />
      <Route path="/patient/exercises" element={<Patient_Exercises />} />
      <Route path="/patient/progress" element={<Patient_Progress />} />
      <Route path="/patient/history" element={<Patient_History />} />
      <Route path="/patient/profile" element={<Patient_Profile />} />
      <Route path="/therapist/profile" element={<Therapist_Profile />} />
      <Route path="/therapist/patients" element={<Therapist_Patients />} />
    </Routes>
  );
}
