import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./PatientSessionStatus.css";

function humanizeStatus(status) {
    switch (status) {
        case "pending":
            return "Connecting...";
        case "active":
            return "Active (recording)";
        case "stop_requested":
            return "Stop requested";
        case "completed":
            return "Completed";
        default:
            return "Ready";
    }
}

export default function PatientSessionStatus({ patientId: externalPatientId, role = "patient" }) {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    const [loading, setLoading] = useState(true);
    const [patientProfileId, setPatientProfileId] = useState(externalPatientId || null);

    const [sessionId, setSessionId] = useState(null);
    const [status, setStatus] = useState("ready");
    const [message, setMessage] = useState("");

    const timersRef = useRef([]);

    const rowChannelName = useMemo(() => {
        if (!sessionId) return null;
        return `patient-session-row-${sessionId}`;
    }, [sessionId]);

    useEffect(() => {
        timersRef.current = [];
        return () => {
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current = [];
        };
    }, []);

    useEffect(() => {
        async function init() {
            if (mode === "demo" || mode === "guest") {
                setLoading(false);
                return;
            }

            // If therapist passed patientId → use it
            if (externalPatientId) {
                setPatientProfileId(externalPatientId);
                setLoading(false);
                return;
            }

            // Otherwise fallback to logged-in patient
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();

            if (error || !user) {
                setLoading(false);
                return;
            }

            setPatientProfileId(user.id);
            setLoading(false);
        }

        init();
    }, [mode]);

    useEffect(() => {
        if (loading) return;
        if (mode === "demo" || mode === "guest") return;
        if (!patientProfileId) return;

        let insertChannel = null;

        async function loadLatestSession() {
            const { data: sessions, error } = await supabase
                .from("sessions")
                .select("id, status")
                .eq("patient_id", patientProfileId)
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

        // Subscribe to inserts so we can learn the session_id immediately.
        insertChannel = supabase
            .channel(`patient-session-insert-${patientProfileId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "sessions",
                    filter: `patient_id=eq.${patientProfileId}`,
                },
                (payload) => {
                    const nextId = payload?.new?.id;
                    const nextStatus = payload?.new?.status;
                    if (!nextId) return;

                    setSessionId(nextId);
                    setStatus(nextStatus || "pending");
                    setMessage("");
                }
            )
            .subscribe();

        return () => {
            if (insertChannel) {
                insertChannel.unsubscribe();
            }
        };
    }, [loading, mode, patientProfileId]);

    // Subscribe to status updates for the specific session row.
    useEffect(() => {
        if (mode === "demo" || mode === "guest") return;
        if (!sessionId || !rowChannelName) return;

        const channel = supabase
            .channel(rowChannelName)
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
    }, [mode, sessionId, rowChannelName]);

    if (loading) {
        return (
            <div className="patient-session-status-widget">
                <div className="status-label">Session Status</div>
                <div className="status-value">Loading...</div>
            </div>
        );
    }

    if (mode === "demo" || mode === "guest") {
        return (
            <div className="patient-session-status-widget">
                <div className="status-label">Session Status</div>
                <div className="status-value">Demo mode</div>
                <div className="status-subtitle">
                    Real-time session updates are disabled.
                </div>
            </div>
        );
    }

    return (
        <div className="patient-session-status-widget">
            <div className="status-top">
                <div className="status-label">Session Status</div>
                {message ? (
                    <p
                        className={
                            status === "completed"
                                ? "status-message status-success"
                                : "status-message"
                        }
                    >
                        {message}
                    </p>
                ) : null}
            </div>

            <div className="status-value">
                {status === "ready"
                    ? role === "therapist"
                        ? "No active session for this patient."
                        : "Waiting for your therapist to start a session."
                    : humanizeStatus(status)}
            </div>

            {status !== "ready" ? (
                <div className="status-subtitle">
                    You are being updated in real time.
                </div>
            ) : null}
        </div>
    );
}

