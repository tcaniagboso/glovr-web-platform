import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import DemoBanner from "../../components/DemoBanner";
import { handleSignOut } from "../../utils/auth/signOut";
import "./PatientLayout.css";

export default function PatientLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";

    return (
        <>
            {mode === "demo" && <DemoBanner />}

            <nav className="patient-nav">
                <NavLink to={`/patient${modeParam}`} end>
                    Dashboard
                </NavLink>
                <NavLink to={`/patient/exercises${modeParam}`}>
                    Exercises
                </NavLink>
                <NavLink to={`/patient/progress${modeParam}`}>
                    Progress
                </NavLink>
                <NavLink to={`/patient/history${modeParam}`}>
                    History
                </NavLink>
                <NavLink to={`/patient/profile${modeParam}`}>
                    Profile
                </NavLink>

                <button
                    className="signout-btn"
                    onClick={() => handleSignOut(navigate)}
                >
                    Sign out
                </button>
            </nav>

            <div className="patient-layout">
                <Outlet />
            </div>
        </>
    );
}
