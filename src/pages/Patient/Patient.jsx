import { useNavigate, useLocation } from "react-router-dom";
import "./Patient.css";
import PatientSessionStatus from "../../components/PatientSessionStatus/PatientSessionStatus";

export default function Patient() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";

    return (
        <div className="patient-container">
            <h1>Patient Dashboard</h1>

            <PatientSessionStatus />

            <div className="card-grid">
                <div
                    className="card"
                    onClick={() => navigate(`games${modeParam}`)}
                >
                    <h2>Games</h2>
                    <p>Select a rehabilitation game</p>
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
