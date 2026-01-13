import { useNavigate } from "react-router-dom";
import "./Patient.css";

export default function Patient() {
    const navigate = useNavigate();

    return (
        <div className="patient-container">
            <h1>Patient Dashboard</h1>

            <div className="card-grid">
                <div
                    className="card"
                    onClick={() => navigate("/patient/exercises")}
                >
                    <h2>Exercises</h2>
                    <p>Start or continue rehab</p>
                </div>

                <div
                    className="card"
                    onClick={() => navigate("/patient/progress")}
                >
                    <h2>Progress</h2>
                    <p>View recovery stats</p>
                </div>

                <div
                    className="card"
                    onClick={() => navigate("/patient/history")}
                >
                    <h2>History</h2>
                    <p>Past sessions</p>
                </div>

                <div
                    className="card"
                    onClick={() => navigate("/patient/profile")}
                >
                    <h2>Profile</h2>
                    <p>Your information</p>
                </div>
            </div>
        </div>
    );
}
