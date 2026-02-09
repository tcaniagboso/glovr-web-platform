import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./Patients.css";

/* Mock data for demo / guest */
const mockPatients = [
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
    const location = useLocation();

    // Only used to preserve demo UI state in navigation
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPatients() {
            // 1. Check auth state
            const {
                data: { user },
            } = await supabase.auth.getUser();

            // 2. Guest / Demo → mock patients
            if (!user) {
                setPatients(mockPatients);
                setLoading(false);
                return;
            }

            // 3. Authenticated therapist → no data yet
            setPatients([]);
            setLoading(false);
        }

        loadPatients();
    }, []);

    /* Loading state */
    if (loading) {
        return (
            <div className="patients-container">
                <h1>Patients</h1>
                <p>Loading patients...</p>
            </div>
        );
    }

    /* Empty state for authenticated therapists */
    if (patients.length === 0) {
        return (
            <div className="patients-container">
                <h1>Patients</h1>
                <p>No patients assigned yet.</p>
                <p>Your patient list will appear once assignments are created.</p>
            </div>
        );
    }

    /* List view (demo / guest) */
    return (
        <div className="patients-container">
            <h1>Patients</h1>
            <p>Select a patient to view their progress and history.</p>

            <div className="patients-list">
                {patients.map((patient) => (
                    <div
                        key={patient.id}
                        className="patient-card"
                        onClick={() =>
                            navigate(`/therapist/patients/${patient.id}${modeParam}`)
                        }
                    >
                        <h3>{patient.name}</h3>
                        <p>Last Active: {patient.lastActive}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
