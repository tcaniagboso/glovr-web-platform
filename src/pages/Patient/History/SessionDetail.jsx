import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { mockSessionDetails, mockReplayData } from "../../../mocks/sessions";
import { formatMovement, formatDuration } from "../../../utils/utils";
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

    // Replay
    const [replayData, setReplayData] = useState([]);
    const [replayIndex, setReplayIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(500);

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
                setReplayData(mockReplayData[Number(sessionId)] || []);

                setRole(patientId ? "therapist" : "patient");
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
                        wrist_flexion,
                        wrist_extension,
                        wrist_interior_roll,
                        wrist_exterior_roll,
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

            // Replay data fetch
            const { data: readings } = await supabase
                .from("glove_readings")
                .select("*")
                .eq("session_id", sessionId)
                .order("recorded_at", { ascending: true });

            setReplayData(readings || []);

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

                    wrist: {
                        pitch: m.wrist_pitch_rom,
                        flexion: m.wrist_flexion,
                        extension: m.wrist_extension,
                        interior_roll: m.wrist_interior_roll,
                        exterior_roll: m.wrist_exterior_roll,
                    },

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

    useEffect(() => {
        if (!playing || replayData.length === 0) return;

        const interval = setInterval(() => {
            setReplayIndex((i) => {
                if (i >= replayData.length - 1) {
                    clearInterval(interval);

                    // reset state
                    setPlaying(false);
                    return 0;
                }
                return i + 1;
            });
        }, speed);

        return () => clearInterval(interval);
    }, [playing, replayData, speed]);

    const replayPoint = replayData[replayIndex];

    const safe = (v) => (typeof v === "number" ? v : 0);

    const replayComputed = replayPoint && {
        grip: Math.round(
            (safe(replayPoint.thumb_force) +
                safe(replayPoint.index_force) +
                safe(replayPoint.middle_force) +
                safe(replayPoint.ring_force) +
                safe(replayPoint.pinky_force)) / 5
        ),
        flexion: Math.round(
            (safe(replayPoint.thumb_flex) +
                safe(replayPoint.index_flex) +
                safe(replayPoint.middle_flex) +
                safe(replayPoint.ring_flex) +
                safe(replayPoint.pinky_flex)) / 5
        ),
        pitch: Math.round(safe(replayPoint.hand_pitch)),
    };

    const prevPoint = replayData[replayIndex - 1];

    const movement =
        replayPoint && prevPoint
            ? Math.abs(
                safe(replayPoint.hand_pitch) - safe(prevPoint.hand_pitch)
            )
            : 0;
    // const movementRounded = Math.round(movement * 10) / 10;

    const percent = replayData.length
        ? Math.round((replayIndex / replayData.length) * 100)
        : 0;

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
                <p>Duration: {formatDuration(session.metrics.duration_seconds)}</p>
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
                    {session.metrics?.wrist &&
                        Object.entries(session.metrics.wrist).map(([key, value]) => (
                            <div key={key} className="metric-box">
                                <p>{key.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                                <strong>{value ?? "-"}</strong>
                            </div>
                        ))}
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
            {/* Replay */}
            {replayData.length > 0 && (
                <div className="card">
                    <h2>Replay Session</h2>

                    <button onClick={() => setPlaying(!playing)}>
                        {playing ? "Pause" : "Play"}
                    </button>

                    <div style={{ marginTop: "10px" }}>
                        <p>Grip: {replayComputed?.grip ?? "-"}</p>
                        <p>Flexion: {replayComputed?.flexion ?? "-"}°</p>
                        <p>Pitch: {replayComputed?.pitch ?? "-"}</p>
                        <p>Movement Intensity (est): {formatMovement(movement)}</p>
                    </div>
                    <div style={{ width: "100%", background: "#eee", height: "6px" }}>
                        <div
                            style={{
                                width: `${percent}%`,
                                background: "#4caf50",
                                height: "100%",
                            }}
                        />
                    </div>
                </div>
            )}
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