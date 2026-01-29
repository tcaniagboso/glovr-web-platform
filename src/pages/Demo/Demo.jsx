import { useNavigate } from "react-router-dom";
import "./Demo.css";

export default function Demo() {
    const navigate = useNavigate();

    return (
        <div className="demo-container">
            <h1 className="title">GLOVR</h1>
            <p className="subtitle">
                A Virtual Reality Hand Rehabilitation System
            </p>

            <div className="button-group">
                <button onClick={() => navigate("/patient?mode=demo")}>
                    Demo as Patient
                </button>
                <button onClick={() => navigate("/therapist?mode=demo")}>
                    Demo as Therapist
                </button>
            </div>
        </div>
    );
}
