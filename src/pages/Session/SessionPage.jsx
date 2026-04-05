import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { games } from "../../data/games";
import { formatMovement } from "../../utils/utils";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
} from "recharts";
import "./SessionPage.css";

function humanizeStatus(status, isFreeRoam) {
    switch (status) {
        case "pending":
            return isFreeRoam
                ? "Connecting to glove..."
                : "Waiting for VR to start session...";
        case "active":
            return "Active (recording)";
        case "stop_requested":
            return "Stopping session...";
        case "completed":
            return "Completed";
        default:
            return "Ready";
    }
}

export default function PatientSession() {
    const { patientId, gameId } = useParams();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    const [status, setStatus] = useState("ready"); // ready | pending | active | stop_requested | completed
    const [sessionId, setSessionId] = useState(null);

    const [starting, setStarting] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [message, setMessage] = useState("");

    const [liveMetrics, setLiveMetrics] = useState(null);
    const lastReadingIdRef = useRef(null);
    const smoothedRef = useRef(null);
    const [liveHistory, setLiveHistory] = useState([]);

    const timersRef = useRef([]);

    const currentGame = games.find(g => g.id === gameId);
    const isFreeRoam = currentGame?.id === "free-roam";

    const isTherapist = !!patientId;

    const channelName = useMemo(() => {
        if (!sessionId) return null;
        return `session-status-${sessionId}`;
    }, [sessionId]);

    useEffect(() => {
        return () => {
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current = [];
        };
    }, []);

    // Subscribe to the specific session row (by id) and reflect status updates in real time.
    useEffect(() => {
        if (!sessionId || !channelName) return;

        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "sessions",
                    filter: `id=eq.${sessionId}`,
                },
                (payload) => {
                    const nextStatus = payload?.new?.status;
                    if (!nextStatus) return;

                    setStatus(nextStatus);

                    if (nextStatus === "completed") {
                        setMessage("Session completed successfully.");
                        const t = setTimeout(() => {
                            setSessionId(null);
                            setStatus("ready");
                            setMessage("");
                        }, 3000);
                        timersRef.current.push(t);
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [sessionId, channelName]);

    // If therapist refreshes mid-session, resume by loading the most recent row.
    useEffect(() => {
        if (mode === "demo" || mode === "guest") return;
        if (!patientId) return;

        async function loadLatestSession() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const targetPatientId = isTherapist ? patientId : user.id;

            const { data: sessions, error } = await supabase
                .from("sessions")
                .select("id, status")
                .eq("patient_id", targetPatientId)
                .order("created_at", { ascending: false })
                .limit(1);

            if (error) return;
            const latest = sessions?.[0];
            if (!latest) return;

            setSessionId(latest.id);
            setStatus(latest.status || "ready");

            if (latest.status === "completed") {
                setMessage("Session completed successfully.");
                const t = setTimeout(() => {
                    setSessionId(null);
                    setStatus("ready");
                    setMessage("");
                }, 3000);
                timersRef.current.push(t);
            }
        }

        loadLatestSession();
    }, [mode, patientId]);

    useEffect(() => {
        if (status === "ready") {
            setLiveHistory([]);
            smoothedRef.current = null;
        }
    }, [status]);

    useEffect(() => {
        if (!sessionId || status !== "active") return;

        const interval = setInterval(async () => {
            if (document.hidden) return;

            const { data, error } = await supabase
                .from("glove_readings")
                .select("*")
                .eq("session_id", sessionId)
                .order("recorded_at", { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                if (data.id !== lastReadingIdRef.current) {
                    lastReadingIdRef.current = data.id;
                    setLiveMetrics(data);
                }
            }
        }, 300);

        return () => clearInterval(interval);
    }, [sessionId, status]);

    const safe = (v) => (typeof v === "number" ? v : 0);
    const liveComputed = useMemo(() => {
        if (!liveMetrics) return null;

        const gripRaw =
            (safe(liveMetrics.thumb_force) +
                safe(liveMetrics.index_force) +
                safe(liveMetrics.middle_force) +
                safe(liveMetrics.ring_force) +
                safe(liveMetrics.pinky_force)) / 5;

        const flexionRaw =
            (safe(liveMetrics.thumb_flex) +
                safe(liveMetrics.index_flex) +
                safe(liveMetrics.middle_flex) +
                safe(liveMetrics.ring_flex) +
                safe(liveMetrics.pinky_flex)) / 5;

        const pitchRaw = safe(liveMetrics.hand_pitch);

        const alpha = 0.3; // smoothing factor

        if (!smoothedRef.current) {
            smoothedRef.current = {
                grip: gripRaw,
                flexion: flexionRaw,
                pitch: pitchRaw,
            };
        } else {
            smoothedRef.current = {
                grip: alpha * gripRaw + (1 - alpha) * smoothedRef.current.grip,
                flexion: alpha * flexionRaw + (1 - alpha) * smoothedRef.current.flexion,
                pitch: alpha * pitchRaw + (1 - alpha) * smoothedRef.current.pitch,
            };
        }

        const reps = liveHistory.length > 1
            ? Math.abs(
                liveHistory[liveHistory.length - 1].flexion -
                liveHistory[liveHistory.length - 2].flexion
            )
            : 0;

        return {
            grip: Math.round(smoothedRef.current.grip),
            flexion: Math.round(smoothedRef.current.flexion),
            pitch: Math.round(smoothedRef.current.pitch),
            reps,
        };
    }, [liveMetrics]);

    useEffect(() => {
        if (!liveComputed) return;

        setLiveHistory(prev => {
            const next = [
                ...prev,
                {
                    ...liveComputed,
                    // t: Date.now()
                    t: prev.length
                }
            ];

            // keep last 30 points
            if (next.length > 30) next.shift();

            return next;
        });
    }, [liveComputed]);

    async function handleStartSession() {
        setStarting(true);
        setMessage("");

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setMessage("You must be logged in.");
                return;
            }

            await supabase
                .from("profiles")
                .update({ last_active: new Date().toISOString() })
                .eq("id", user.id);

            // get exercise from DB
            const { data: exercise, error: exerciseError } = await supabase
                .from("exercises")
                .select("id")
                .eq("slug", gameId)
                .single();

            if (exerciseError || !exercise) {
                setMessage("Exercise not found.");
                return;
            }

            // create session
            const insertPayload = isTherapist
                ? {
                    patient_id: patientId,
                    therapist_id: user.id,
                    exercise_id: exercise.id,
                    status: "pending",
                }
                : {
                    patient_id: user.id,
                    exercise_id: exercise.id,
                    status: "pending",
                };

            const { data, error } = await supabase
                .from("sessions")
                .insert(insertPayload)
                .select("id, status")
                .single();

            if (error) {
                setMessage("Failed to start session.");
                return;
            }

            setSessionId(data.id);
            setStatus(data.status || "pending");

        } finally {
            setStarting(false);
        }
    }

    async function handleStopSession() {
        if (!sessionId) return;

        setStopping(true);
        setMessage("");

        try {
            // Demo / guest stays as-is (no DB)
            if (mode === "demo" || mode === "guest") {
                setStatus("stop_requested");

                const t1 = setTimeout(() => {
                    setStatus("completed");
                    setMessage("Session completed successfully.");

                    setTimeout(() => {
                        setSessionId(null);
                        setStatus("ready");
                        setMessage("");
                    }, 1200);
                }, 2000);

                timersRef.current.push(t1);
                return;
            }

            // Real DB flow
            if (status === "pending") {
                // No Python -> just complete immediately
                const { error } = await supabase
                    .from("sessions")
                    .update({
                        status: "completed",
                        ended_at: new Date().toISOString(),
                    })
                    .eq("id", sessionId);

                if (error) {
                    setMessage("Failed to stop session.");
                    return;
                }

                setStatus("completed");
                setMessage("Session completed successfully.");
            }

            else if (status === "active") {
                // Python running -> request stop
                const { error } = await supabase
                    .from("sessions")
                    .update({
                        status: "stop_requested",
                    })
                    .eq("id", sessionId);

                if (error) {
                    setMessage("Failed to request stop.");
                    return;
                }

                setStatus("stop_requested");
                setMessage("Stopping session...");
            }

        } finally {
            setStopping(false);
        }
    }

    const showStopButton =
        status === "pending" || status === "active";

    return (
        <div className="patient-session-container">
            <h1>
                {currentGame ? `${currentGame.name} Session` : "Session"}
            </h1>

            <div className="session-panel">
                <div className="session-status">
                    <div className="label">Current Status</div>
                    <div className="value">{humanizeStatus(status, isFreeRoam)}</div>
                </div>

                {message && (
                    <p
                        className={
                            status === "completed"
                                ? "status-message status-success"
                                : "status-message"
                        }
                    >
                        {message}
                    </p>
                )}

                <div className="session-actions">
                    <button
                        className="primary-btn"
                        onClick={handleStartSession}
                        disabled={starting || !!sessionId}
                    >
                        {starting
                            ? "Starting..."
                            : sessionId
                                ? "Session Started"
                                : "Start Session"}
                    </button>

                    {showStopButton && (
                        <button
                            className="danger-btn"
                            onClick={handleStopSession}
                            disabled={stopping}
                        >
                            {stopping ? "Stopping..." : "Stop Session"}
                        </button>
                    )}
                </div>
            </div>

            {status === "active" && !liveComputed && <p>Connecting to glove...</p>}

            {status === "active" && liveComputed && (
                <div className="live-panel">
                    <h2>Live Performance</h2>

                    <div className="live-grid">
                        <div className="live-box">
                            <p>Hand Strength</p>
                            <strong>{liveComputed.grip}</strong>
                        </div>

                        <div className="live-box">
                            <p>Flexion</p>
                            <strong>{liveComputed.flexion}</strong>
                        </div>

                        <div className="live-box">
                            <p>Wrist Orientation</p>
                            <strong>{liveComputed.pitch}</strong>
                        </div>

                        <div className="live-box">
                            <p>Movement Intensity</p>
                            <strong>{formatMovement(liveComputed.reps)}</strong>
                        </div>
                    </div>
                    <p className="live-note">
                        Values are updated in real time and represent approximate hand activity.
                        Final metrics are computed after the session ends.
                    </p>
                </div>
            )}

            {status === "active" && liveHistory.length > 0 && (
                <div className="live-panel">
                    <h2>Live Trend</h2>

                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={liveHistory}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                dataKey="t"
                                label={{ value: "Time (live)", position: "insideBottom", offset: -5 }}
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
                            <Line dataKey="grip" name="Hand Strength" stroke="#6a5acd" dot={false} />
                            <Line dataKey="flexion" name="Flexion" stroke="#2e8b57" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                    <p className="live-note">
                        Trends reflect recent activity and are smoothed for stability.
                    </p>
                </div>
            )}
        </div>
    );
}

