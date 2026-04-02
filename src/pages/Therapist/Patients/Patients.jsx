import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./Patients.css";
import { withMode, formatLastActive } from "../../../utils/utils";

/* Mock data for demo / guest */
const mockPatients = [
    { id: 1, name: "John Doe", lastActive: "10 hrs ago" },
    { id: 2, name: "Alice Smith", lastActive: "3 days ago" },
    { id: 3, name: "Michael Chen", lastActive: "Recently" },
    { id: 4, name: "Sarah Johnson", lastActive: "Just now" },
];

export default function Patients() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");

    async function sendInvite() {
        setSending(true);
        setMessage("");

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error("User not logged in");
            return;
        }

        const { error } = await supabase
            .from("therapist_invites")
            .insert({
                therapist_id: user.id,
                patient_email: email.toLowerCase()
            });

        if (error) {
            if (error.code === "23505") {
                setMessage("Invite already sent.");
            } else {
                setMessage("Error sending invite.");
            }
            setSending(false);
            return;
        }

        // UI feedback
        setMessage("Invite sent!");
        setEmail("");

        // background email
        supabase.functions
            .invoke("send-invite-email", { body: { email } })
            .then(({ error }) => {
                if (error) console.error("Email failed:", error);
            });

        setSending(false);
    }

    useEffect(() => {
        async function loadPatients() {
            const { data: { user } } = await supabase.auth.getUser();

            // Demo / Guest
            if (mode === "demo" || mode === "guest") {
                setPatients(mockPatients);
                setLoading(false);
                return;
            }

            if (!user) {
                setPatients([]);
                setLoading(false);
                return;
            }

            try {
                // 1 Get all patient_ids for this therapist
                const { data: relationships, error: relError } = await supabase
                    .from("therapist_patients")
                    .select("patient_id")
                    .eq("therapist_id", user.id);

                if (relError) {
                    console.error("Relationship error:", relError);
                    setPatients([]);
                    setLoading(false);
                    return;
                }

                if (!relationships || relationships.length === 0) {
                    setPatients([]);
                    setLoading(false);
                    return;
                }

                const patientIds = relationships.map(r => r.patient_id);

                // 2 Fetch profiles
                const { data: profiles, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, first_name, last_name, last_active")
                    .in("id", patientIds);

                if (profileError) {
                    console.error("Profile error:", profileError);
                    setPatients([]);
                    setLoading(false);
                    return;
                }

                // 3 Format for UI
                const formatted = profiles.map(p => ({
                    id: p.id,
                    name: `${p.first_name} ${p.last_name}`,
                    lastActive: formatLastActive(p.last_active),
                }));

                setPatients(formatted);
            } catch (err) {
                console.error("Unexpected error:", err);
                setPatients([]);
            }

            setLoading(false);
        }

        loadPatients();
    }, [mode]);

    if (loading) {
        return (
            <div className="patients-container">
                <h1>Patients</h1>
                <p>Loading patients...</p>
            </div>
        );
    }

    return (
        <div className="patients-container">
            <h1>Patients</h1>

            {/* Invite box ALWAYS visible */}
            <div className="invite-box">
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Patient email"
                />

                <button onClick={sendInvite} disabled={sending}>
                    {sending ? "Sending..." : "Send Invite"}
                </button>

                {/* Message display */}
                {message && <p className="status-message">{message}</p>}
            </div>

            {/* Empty state */}
            {patients.length === 0 ? (
                <>
                    <p>No patients assigned yet.</p>
                    <p>Your patient list will appear once assignments are created.</p>
                </>
            ) : (
                <div className="patients-list">
                    {patients.map((patient) => (
                        <div
                            key={patient.id}
                            className="patient-card"
                            onClick={() =>
                                navigate(withMode(`/therapist/patients/${patient.id}`, mode))
                            }
                        >
                            <h3>{patient.name}</h3>
                            <p>Last Active: {patient.lastActive}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}