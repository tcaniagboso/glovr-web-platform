import { useNavigate, useLocation } from "react-router-dom";
import "./Therapist.css";

export default function Therapist() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";

    return (
        <div className="therapist-container">
            <h1>Therapist Dashboard</h1>

            <div className="card-grid">
                <div
                    className="card"
                    onClick={() => navigate(`patients${modeParam}`)}
                >
                    <h2>Patients</h2>
                    <p>View your patients</p>
                </div>

                <div
                    className="card"
                    onClick={() => navigate(`profile${modeParam}`)}
                >
                    <h2>Profile</h2>
                    <p>Your information</p>
                </div>
            </div>
        </div>
    );
}
