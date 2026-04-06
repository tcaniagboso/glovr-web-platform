import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { mockSessionDetails, mockReplayData } from "../../../mocks/sessions";
import { formatMovement, formatDuration } from "../../../utils/utils";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from "recharts";
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
    const [chartData, setChartData] = useState([]);

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
                    setChartData([]);
                    return 0;
                }
                return i + 1;
            });
        }, speed);

        return () => clearInterval(interval);
    }, [playing, replayData, speed]);

    useEffect(() => {
        if (!playing || !replayComputed) return;

        setChartData(prev => [
            ...prev,
            {
                t: replayIndex,
                grip: replayComputed.grip,
                flexion: replayComputed.flexion
            }
        ]);
    }, [replayIndex, playing]);

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
                <h2>Finger Flexion (Range)</h2>
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
                <h2>Peak Force (Relative)</h2>
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
            {/* Metrics Explanation */}
            <div className="card transparent-card">
                <h2>How Metrics Are Computed</h2>

                <details>
                    <summary>Finger Range of Motion</summary>
                    <p>
                        Calculated as the maximum flex value recorded for each finger across the session.
                    </p>
                    <p className="why">
                        Helps measure improvements in finger mobility and flexibility.
                    </p>
                </details>

                <details>
                    <summary>Peak Force (Per Finger)</summary>
                    <p>
                        Calculated as the peak force recorded for each finger during the session.
                    </p>
                    <p className="why">
                        Helps identify finger strength and detect weaker fingers.
                    </p>
                </details>

                <details>
                    <summary>Wrist Range of Motion</summary>
                    <p>
                        Computed from the difference between maximum and minimum wrist orientation values.
                    </p>
                    <p className="why">
                        Helps evaluate wrist mobility and control during movement.
                    </p>
                </details>

                <details>
                    <summary>Repetitions</summary>
                    <p>
                        Detected when both a finger and the thumb exceed a force threshold simultaneously,
                        followed by release.
                    </p>
                    <p className="why">
                        Helps quantify active engagement and exercise completion.
                    </p>
                </details>

                <details>
                    <summary>Symmetry Score</summary>
                    <p>
                        Calculated based on the balance between finger force values across the hand.
                    </p>
                    <p className="why">
                        Helps assess how evenly the hand is being used during movement.
                    </p>
                </details>

                <details>
                    <summary>Duration</summary>
                    <p>
                        Measured from when recording begins to when it ends.
                    </p>
                    <p className="why">
                        Helps track how long the user is actively engaged in therapy.
                    </p>
                </details>
            </div>

            {/* Replay */}
            {replayData.length > 0 && (
                <div className="card">
                    <h2>Replay Session</h2>

                    <button onClick={() => setPlaying(!playing)}>
                        {playing ? "Pause" : "Play"}
                    </button>

                    <div className="replay-metrics">
                        <p>Hand Strength (average force): {replayComputed?.grip ?? "-"}</p>
                        <p>Finger Flexion (range): {replayComputed?.flexion ?? "-"}</p>
                        <p>Wrist Orientation (hand pitch): {replayComputed?.pitch ?? "-"}</p>
                        <p>Movement Intensity: {formatMovement(movement)}</p>
                    </div>
                    <div className="replay-chart">
                        <h3>Replay Trend</h3>

                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="t"
                                    label={{ value: "Time (replay)", position: "insideBottom", offset: -5 }}
                                />

                                <YAxis
                                    label={{ value: "Sensor Value", angle: -90, position: "insideLeft" }}
                                    domain={["dataMin - 2", "dataMax + 2"]}
                                    allowDecimals={false}
                                />

                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    wrapperStyle={{
                                        fontSize: "0.9rem",
                                        fontWeight: 600
                                    }}
                                />

                                <Line
                                    dataKey="grip"
                                    name="Hand Strength"
                                    stroke="#6a5acd"
                                    dot={false}
                                />

                                <Line
                                    dataKey="flexion"
                                    name="Flexion"
                                    stroke="#2e8b57"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="replay-progress" style={{ width: "100%", background: "#eee", height: "6px" }}>
                        <div
                            style={{
                                width: `${percent}%`,
                                background: "#4caf50",
                                height: "100%",
                            }}
                        />
                    </div>
                    <div className="transparency-card">
                        <h2>Replay Metrics (Live Estimation)</h2>

                        <p>
                            During replay, metrics are estimated in real-time from individual sensor readings.
                        </p>

                        <ul>
                            <li><strong>Hand Strength (average force):</strong> Average force across all fingers at a given moment.</li>
                            <li><strong>Finger Flexion (range):</strong> Average finger bend at that moment.</li>
                            <li><strong>Wrist Orientation (hand pitch):</strong> Wrist orientation at that moment.</li>
                            <li><strong>Movement Intensity:</strong> Change in wrist position between frames.</li>
                        </ul>

                        <p style={{ fontSize: "0.9em", opacity: 0.7 }}>
                            These are approximate real-time values and may differ from final session metrics.
                        </p>
                    </div>
                </div>
            )}
            {/* Data Processing Explanation */}
            <div className="transparency-card">
                <h2>Data Processing</h2>

                <p>
                    Raw glove sensor data is smoothed using an exponential moving average (EMA)
                    to reduce noise and improve stability before computing metrics.
                </p>
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