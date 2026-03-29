import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "./PatientSession.css";

function humanizeStatus(status) {
    switch (status) {
        case "pending":
            return "Pending (waiting for Python)";
        case "active":
            return "Active (recording)";
        case "stop_requested":
            return "Stop requested";
        case "completed":
            return "Completed";
        default:
            return status || "Ready";
    }
}

export default function PatientSession() {
    const { patientId } = useParams();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    const [status, setStatus] = useState("ready"); // ready | pending | active | stop_requested | completed
    const [sessionId, setSessionId] = useState(null);

    const [starting, setStarting] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [message, setMessage] = useState("");

    const timersRef = useRef([]);

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

    // Optional: if therapist refreshes mid-session, resume by loading the most recent row.
    useEffect(() => {
        if (mode === "demo" || mode === "guest") return;
        if (!patientId) return;

        async function loadLatestSession() {
            const { data: sessions, error } = await supabase
                .from("sessions")
                .select("id, status")
                .eq("patient_id", patientId)
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

    async function handleStartSession() {
        setStarting(true);
        setMessage("");

        try {
            if (mode === "demo" || mode === "guest") {
                // Demo simulation: pending -> active -> completed
                setStatus("pending");
                const t1 = setTimeout(() => {
                    setStatus("active");
                }, 1200);
                timersRef.current.push(t1);

                const t2 = setTimeout(() => {
                    setStatus("completed");
                    setMessage("Session completed successfully.");
                    setTimeout(() => {
                        setSessionId(null);
                        setStatus("ready");
                        setMessage("");
                    }, 1200);
                }, 4200);
                timersRef.current.push(t2);
                return;
            }

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setMessage("You must be logged in to start a session.");
                return;
            }

            const { data, error } = await supabase
                .from("sessions")
                .insert({
                    patient_id: patientId,
                    therapist_id: user.id,
                    status: "pending",
                })
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
            if (mode === "demo" || mode === "guest") {
                // Demo simulation: active -> stop_requested -> completed
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

            const { error } = await supabase
                .from("sessions")
                .update({ status: "stop_requested" })
                .eq("id", sessionId);

            if (error) {
                setMessage("Failed to request stop.");
                return;
            }

            setStatus("stop_requested");
        } finally {
            setStopping(false);
        }
    }

    const showStopButton = status === "active";
    const disableStart = starting || stopping || (sessionId && status !== "ready");

    return (
        <div className="patient-session-container">
            <h1>Patient Session</h1>

            <div className="session-panel">
                <div className="session-status">
                    <div className="label">Current Status</div>
                    <div className="value">{humanizeStatus(status)}</div>
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
                        disabled={disableStart}
                    >
                        {starting ? "Starting..." : "Start Session"}
                    </button>

                    {showStopButton && (
                        <button
                            className="danger-btn"
                            onClick={handleStopSession}
                            disabled={stopping}
                        >
                            {stopping ? "Requesting stop..." : "Stop Session"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

