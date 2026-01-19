import { NavLink, Outlet, useLocation } from "react-router-dom";
import DemoBanner from "../../components/DemoBanner";
import "./TherapistLayout.css";

export default function TherapistLayout() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    return (
        <>
            {mode === "demo" && <DemoBanner />}

            <nav className="therapist-nav">
                <NavLink to={`/therapist?mode=${mode}`}>Dashboard</NavLink>
                <NavLink to={`/therapist/patients?mode=${mode}`}>Patients</NavLink>
                <NavLink to={`/therapist/profile?mode=${mode}`}>Profile</NavLink>
            </nav>

            <div className="therapist-layout">
                <Outlet />
            </div>
        </>
    );
}
