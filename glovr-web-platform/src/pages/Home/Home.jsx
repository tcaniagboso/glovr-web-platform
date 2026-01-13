import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <h1 className="title">GLOVR</h1>
            <p className="subtitle">
                A Virtual Reality Hand Rehabilitation System
            </p>

            <div className="button-group">
                <button onClick={() => navigate("/patient")}>
                    Patient
                </button>
                <button onClick={() => navigate("/therapist")}>
                    Therapist
                </button>
            </div>
        </div>
    );
}
