import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Demo from "./pages/Demo/Demo";
import Guest from "./pages/Guest/Guest";

/* Layouts */
import PatientLayout from "./pages/Patient/PatientLayout";
import TherapistLayout from "./pages/Therapist/TherapistLayout";

/* Patient Pages */
import PatientHome from "./pages/Patient/Patient";
import PatientExercises from "./pages/Patient/Exercises/Exercises";
import PatientProgress from "./pages/Patient/Progress/Progress";
import PatientHistory from "./pages/Patient/History/History";
import PatientProfile from "./pages/Patient/Profile/Profile";

/* Therapist Pages */
import TherapistHome from "./pages/Therapist/Therapist";
import TherapistProfile from "./pages/Therapist/Profile/Profile";
import TherapistPatients from "./pages/Therapist/Patients/Patients";

/* Dev (internal only) */
import DeviceTest from "./pages/Dev/DeviceTest";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/guest" element={<Guest />} />

      <Route path="/dev/device-test" element={<DeviceTest />} />

      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<PatientHome />} />
        <Route path="exercises" element={<PatientExercises />} />
        <Route path="progress" element={<PatientProgress />} />
        <Route path="history" element={<PatientHistory />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      <Route path="/therapist" element={<TherapistLayout />}>
        <Route index element={<TherapistHome />} />
        <Route path="patients" element={<TherapistPatients />} />
        <Route path="profile" element={<TherapistProfile />} />
      </Route>
    </Routes>
  );
}
