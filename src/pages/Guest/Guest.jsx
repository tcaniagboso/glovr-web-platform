import { useNavigate } from "react-router-dom";
import "./Guest.css";

export default function Guest() {
    const navigate = useNavigate();

    return (
        <div className="guest-container">
            <h1>Explore GLOVR as a Guest</h1>
            <p>Your progress won’t be saved.</p>

            <button onClick={() => navigate("/patient?mode=guest")}>
                Continue as a Guest Patient
            </button>
        </div>
    );
}
