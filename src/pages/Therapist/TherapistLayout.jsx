import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import DemoBanner from "../../components/DemoBanner";
import { handleSignOut } from "../../utils/auth/signOut";
import "./TherapistLayout.css";

export default function TherapistLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    // Only append mode if it exists
    const modeParam = mode ? `?mode=${mode}` : "";

    return (
        <>
            {mode === "demo" && <DemoBanner />}

            <nav className="therapist-nav">
                <NavLink to={`/therapist${modeParam}`} end>
                    Dashboard
                </NavLink>
                <NavLink to={`/therapist/patients${modeParam}`}>
                    Patients
                </NavLink>
                <NavLink to={`/therapist/profile${modeParam}`}>
                    Profile
                </NavLink>

                <button
                    className="signout-btn"
                    onClick={() => handleSignOut(navigate)}
                >
                    Sign out
                </button>
            </nav>

            <div className="therapist-layout">
                <Outlet />
            </div>
        </>
    );
}
