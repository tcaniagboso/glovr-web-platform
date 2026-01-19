import { useNavigate } from "react-router-dom";
import "./Therapist.css";

export default function Therapist() {
    const navigate = useNavigate();

    return (
        <div className="therapist-container">
            <h1>Therapist Dashboard</h1>

            <div className="card-grid">
                <div className="card" onClick={() => navigate("patients")}>
                    <h2>Patients</h2>
                    <p>View your patients</p>
                </div>

                <div className="card" onClick={() => navigate("profile")}>
                    <h2>Profile</h2>
                    <p>Your information</p>
                </div>
            </div>
        </div>
    );
}
