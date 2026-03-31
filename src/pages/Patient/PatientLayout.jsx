import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import DemoBanner from "../../components/DemoBanner";
import { handleSignOut } from "../../utils/auth/signOut";
import "./PatientLayout.css";

export default function PatientLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { patientId } = useParams();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";

    // dynamic base path
    const basePath = patientId
        ? `/therapist/patients/${patientId}`
        : "/patient";

    return (
        <>
            {mode === "demo" && <DemoBanner />}

            <nav className="patient-nav">
                <NavLink to={`${basePath}${modeParam}`} end>
                    Dashboard
                </NavLink>

                <NavLink to={`${basePath}/games${modeParam}`}>
                    Games
                </NavLink>

                <NavLink to={`${basePath}/progress${modeParam}`}>
                    Progress
                </NavLink>

                <NavLink to={`${basePath}/history${modeParam}`}>
                    History
                </NavLink>

                <NavLink to={`${basePath}/profile${modeParam}`}>
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