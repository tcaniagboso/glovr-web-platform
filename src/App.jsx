import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Demo from "./pages/Demo/Demo";
import Guest from "./pages/Guest/Guest";

/* Layouts */
import PatientLayout from "./pages/Patient/PatientLayout";
import TherapistLayout from "./pages/Therapist/TherapistLayout";

/* Shared Session Page */
import SessionPage from "./pages/Session/SessionPage";

/* Patient Pages */
import PatientHome from "./pages/Patient/Patient";
import PatientGames from "./pages/Patient/Games/Games";
import PatientProgress from "./pages/Patient/Progress/Progress";
import PatientHistory from "./pages/Patient/History/History";
import SessionDetail from "./pages/Patient/History/SessionDetail";
import PatientProfile from "./pages/Patient/Profile/Profile";

/* Therapist Pages */
import TherapistHome from "./pages/Therapist/Therapist";
import TherapistProfile from "./pages/Therapist/Profile/Profile";
import TherapistPatients from "./pages/Therapist/Patients/Patients";
import TherapistPatientOverview from "./pages/Therapist/PatientOverview/TherapistPatientOverview";
import TherapistGames from "./pages/Therapist/Games/Games";

import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/guest" element={<Guest />} />

      {/* ================= PATIENT ================= */}
      <Route
        path="/patient"
        element={
          <RequireAuth>
            <RequireRole role="patient">
              <PatientLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<PatientHome />} />
        <Route path="games" element={<PatientGames />} />
        <Route path="games/:gameId" element={<SessionPage />} />
        <Route path="progress" element={<PatientProgress />} />
        <Route path="history" element={<PatientHistory />} />
        <Route path="history/:sessionId" element={<SessionDetail />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      {/* ================= THERAPIST ================= */}
      <Route
        path="/therapist"
        element={
          <RequireAuth>
            <RequireRole role="therapist">
              <TherapistLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<TherapistHome />} />
        <Route path="patients" element={<TherapistPatients />} />

        <Route path="patients/:patientId">
          <Route index element={<TherapistPatientOverview />} />
          <Route path="games" element={<TherapistGames />} />
          <Route path="games/:gameId" element={<SessionPage />} />
          <Route path="progress" element={<PatientProgress />} />
          <Route path="history" element={<PatientHistory />} />
          <Route path="history/:sessionId" element={<SessionDetail />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>

        <Route path="profile" element={<TherapistProfile />} />
      </Route>
    </Routes>
  );
}