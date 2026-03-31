import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./TherapistPatientOverview.css";
import { withMode } from "../../../utils/utils";
import PatientSessionStatus from "../../../components/PatientSessionStatus/PatientSessionStatus";

export default function TherapistPatientOverview() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    return (
        <div className="overview-container">
            <h1>Patient Overview</h1>

            <PatientSessionStatus patientId={patientId} role="therapist" />

            <div className="overview-cards">
                <div
                    className="card"
                    onClick={() =>
                        navigate(withMode(`/therapist/patients/${patientId}/history`, mode))
                    }
                >
                    <h2>History</h2>
                    <p>View past sessions</p>
                </div>

                <div
                    className="card"
                    onClick={() =>
                        navigate(withMode(`/therapist/patients/${patientId}/progress`, mode))
                    }
                >
                    <h2>Progress</h2>
                    <p>View recovery trends</p>
                </div>

                <div
                    className="card"
                    onClick={() =>
                        navigate(withMode(`/therapist/patients/${patientId}/games`, mode))
                    }
                >
                    <h2>Games</h2>
                    <p>Select a rehabilitation game</p>
                </div>
            </div>
        </div>
    );
}