import { NavLink, Outlet, useLocation } from "react-router-dom";
import DemoBanner from "../../components/DemoBanner";
import "./PatientLayout.css";

export default function PatientLayout() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    return (
        <>
            {mode === "demo" && <DemoBanner />}

            <nav className="patient-nav">
                <NavLink to={`/patient?mode=${mode}`}>Dashboard</NavLink>
                <NavLink to={`/patient/exercises?mode=${mode}`}>Exercises</NavLink>
                <NavLink to={`/patient/progress?mode=${mode}`}>Progress</NavLink>
                <NavLink to={`/patient/history?mode=${mode}`}>History</NavLink>
                <NavLink to={`/patient/profile?mode=${mode}`}>Profile</NavLink>
            </nav>

            <div className="patient-layout">
                <Outlet />
            </div>
        </>
    );
}
