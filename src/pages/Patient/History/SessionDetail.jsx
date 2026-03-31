import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { mockSessionDetails } from "../../../mocks/sessions";
import "./SessionDetail.css";

export default function SessionDetail() {
    const { sessionId, patientId } = useParams();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState("");
    const [role, setRole] = useState(null);

    async function handleSaveNotes() {
        const { error } = await supabase
            .from("sessions")
            .update({ notes })
            .eq("id", sessionId);

        if (error) {
            console.error("Failed to save notes:", error);
            alert("Failed to save notes");
        } else {
            alert("Notes saved!");
        }
    }

    useEffect(() => {
        async function loadSession() {
            const { data: { user } } = await supabase.auth.getUser();

            // Guest / Demo → mock data
            if (mode === "demo" || mode === "guest") {
                const mock = mockSessionDetails[Number(sessionId)];
                setSession(mock || mockSessionDetails[1]);
                setLoading(false);
                return;
            }

            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            setRole(profile?.role);

            const targetId = patientId || user.id;

            // Real DB fetch
            const { data, error } = await supabase
                .from("sessions")
                .select(`
                    id,
                    started_at,
                    ended_at,
                    status,
                    notes,
                    exercises (name),
                    session_metrics (
                        repetitions_detected,
                        duration_seconds,
                        symmetry_score,
                        thumb_rom,
                        index_rom,
                        middle_rom,
                        ring_rom,
                        pinky_rom,
                        wrist_pitch_rom,
                        thumb_peak_force,
                        index_peak_force,
                        middle_peak_force,
                        ring_peak_force,
                        pinky_peak_force
                    )
                `)
                .eq("id", sessionId)
                .eq("patient_id", targetId)
                .single();

            if (error) {
                console.error("Session fetch error:", error);
                setSession(null);
                setLoading(false);
                return;
            }

            // Transform DB → UI format
            const start = new Date(data.started_at);
            const end = data.ended_at ? new Date(data.ended_at) : null;

            let duration = "-";
            if (end) {
                const diffMs = end - start;
                const diffMins = Math.floor(diffMs / (1000 * 60));
                duration = `${diffMins} mins`;
            }

            const m = data.session_metrics || {};

            const formatted = {
                id: data.id,
                name: data.exercises?.name || "Unknown Exercise",
                date: start.toLocaleDateString(),
                start: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                end: end
                    ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "-",
                duration,
                status: data.status,
                notes: data.notes || "",
                metrics: {
                    repetitions_detected: m.repetitions_detected,
                    duration_seconds: m.duration_seconds,
                    symmetry_score: m.symmetry_score,

                    rom: {
                        thumb: m.thumb_rom,
                        index: m.index_rom,
                        middle: m.middle_rom,
                        ring: m.ring_rom,
                        pinky: m.pinky_rom,
                    },

                    wrist_pitch: m.wrist_pitch_rom,

                    peak_force: {
                        thumb: m.thumb_peak_force,
                        index: m.index_peak_force,
                        middle: m.middle_peak_force,
                        ring: m.ring_peak_force,
                        pinky: m.pinky_peak_force,
                    },
                },
            };

            setSession(formatted);
            setNotes(formatted.notes || "");
            setLoading(false);
        }

        loadSession();
    }, [sessionId, mode]);

    /* Loading */
    if (loading) return <p>Loading session...</p>;

    /* Not found */
    if (!session) return <p>Session not found.</p>;

    if (!role) return <p>Loading role...</p>;

    return (
        <div className="session-container">
            <h1>{session.name}</h1>

            {/* Overview */}
            <div className="card">
                <h2>Session Overview</h2>
                <p>Date: {session.date}</p>
                <p>Time: {session.start} - {session.end}</p>
                <p>Duration: {session.duration}</p>
            </div>

            {/* Performance */}
            <div className="card">
                <h2>Performance</h2>
                <p>Repetitions: {session.metrics?.repetitions_detected ?? "-"}</p>
                <p>Symmetry Score: {session.metrics?.symmetry_score ?? "-"}</p>
            </div>

            {/* ROM */}
            <div className="card">
                <h2>Finger Flexion</h2>
                <div className="grid">
                    {session.metrics?.rom &&
                        Object.entries(session.metrics.rom).map(([finger, value]) => (
                            <div key={finger} className="metric-box">
                                <p>{finger}</p>
                                <strong>{value ?? "-"}</strong>
                            </div>
                        ))}
                </div>
            </div>

            {/* Wrist ROM */}
            <div className="card">
                <h2>Wrist Range of Motion</h2>

                <div className="grid">
                    <div className="metric-box">
                        <p>Pitch</p>
                        <strong>{session.metrics?.wrist_pitch_rom ?? "-"}</strong>
                    </div>
                </div>
            </div>

            {/* Peak Force */}
            <div className="card">
                <h2>Peak Force</h2>
                <div className="grid">
                    {session.metrics?.peak_force &&
                        Object.entries(session.metrics.peak_force).map(([finger, value]) => (
                            <div key={finger} className="metric-box">
                                <p>{finger}</p>
                                <strong>{value ?? "-"}</strong>
                            </div>
                        ))}
                </div>
            </div>
            {/* Notes */}
            <div className="card">
                <h2>Therapist Notes</h2>

                {session.notes ? (
                    <p>{session.notes}</p>
                ) : (
                    <p>No notes added yet.</p>
                )}
            </div>
            {role === "therapist" && session.status === "completed" && (
                <div className="card">
                    <h2>Add Notes</h2>

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Write session notes..."
                        rows={4}
                        style={{ width: "100%", marginBottom: "10px" }}
                    />

                    <button onClick={handleSaveNotes}>
                        Save Notes
                    </button>
                </div>
            )}
        </div>
    );
}