import { useNavigate } from "react-router-dom";
import "./Patients.css";

const patients = [
    {
        id: 1,
        name: "John Doe",
        lastActive: "Jan 13, 2026",
    },
    {
        id: 2,
        name: "Alice Smith",
        lastActive: "Jan 12, 2026",
    },
    {
        id: 3,
        name: "Michael Chen",
        lastActive: "Jan 10, 2026",
    },
    {
        id: 4,
        name: "Sarah Johnson",
        lastActive: "Jan 08, 2026",
    },
];

export default function Patients() {
    const navigate = useNavigate();

    return (
        <div className="patients-container">
            <h1>Patients</h1>
            <p>Select a patient to view their progress and history.</p>

            <div className="patients-list">
                {patients.map((patient) => (
                    <div
                        key={patient.id}
                        className="patient-card"
                        onClick={() => navigate(`/therapist/patients/${patient.id}`)}
                    >
                        <h3>{patient.name}</h3>
                        <p>Last Active: {patient.lastActive}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
