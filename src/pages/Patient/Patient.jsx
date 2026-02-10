import { useNavigate, useLocation } from "react-router-dom";
import "./Patient.css";

export default function Patient() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";

    return (
        <div className="patient-container">
            <h1>Patient Dashboard</h1>

            <div className="card-grid">
                <div
                    className="card"
                    onClick={() => navigate(`exercises${modeParam}`)}
                >
                    <h2>Exercises</h2>
                    <p>Start or continue rehab</p>
                </div>

                <div
                    className="card"
                    onClick={() => navigate(`progress${modeParam}`)}
                >
                    <h2>Progress</h2>
                    <p>View recovery stats</p>
                </div>

                <div
                    className="card"
                    onClick={() => navigate(`history${modeParam}`)}
                >
                    <h2>History</h2>
                    <p>Past sessions</p>
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
