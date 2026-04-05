import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { mockSessions } from "../../../mocks/sessions";
import { formatDuration } from "../../../utils/utils";
import "./History.css";

export default function History() {
    const navigate = useNavigate();
    const location = useLocation();
    // Only used for preserving demo UI state in navigation
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const { patientId } = useParams();
    const basePath = patientId
        ? `/therapist/patients/${patientId}`
        : "/patient";

    useEffect(() => {
        async function loadHistory() {
            const { data: { user } } = await supabase.auth.getUser();

            if (mode === "demo" || mode === "guest") {
                setSessions(mockSessions);
                setLoading(false);
                return;
            }

            if (!user) {
                setSessions([]);
                setLoading(false);
                return;
            }

            const targetId = patientId || user.id;

            // console.log("MODE:", mode);
            // console.log("PATIENT ID:", patientId);
            const { data, error } = await supabase
                .from("sessions")
                .select(`
                    id,
                    started_at,
                    ended_at,
                    status,
                    exercises (name),
                    session_metrics!inner (duration_seconds)
                `)
                .eq("patient_id", targetId)
                .eq("status", "completed")
                .order("started_at", { ascending: false });

            if (error) {
                console.error("Failed to load sessions:", error);
                setSessions([]);
                setLoading(false);
                return;
            }

            const formatted = (data || []).map((s) => {
                const start = new Date(s.started_at);
                const end = s.ended_at ? new Date(s.ended_at) : null;
                const rawStatus = s.status || "unknown";
                const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
                // compute duration manually
                let duration = "-";
                const durationSeconds = s.session_metrics?.duration_seconds;

                if (end) {
                    const diffMs = end - start; // milliseconds
                    const diffMins = Math.floor(diffMs / (1000 * 60));

                    if (diffMins < 60) {
                        duration = `${diffMins} mins`;
                    } else {
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        duration = `${hours}h ${mins}m`;
                    }
                }

                return {
                    id: s.id,
                    name: s.exercises?.name || "Unknown Exercise",
                    date: start.toLocaleDateString(),
                    start: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    end: end
                        ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "-",
                    duration,
                    durationSeconds,
                    status
                };
            });
            setSessions(formatted);
            setLoading(false);
        }

        loadHistory();
    }, [patientId, mode]);

    /* Loading state */
    if (loading) {
        return (
            <div className="history-container">
                <h1>History</h1>
                <p>Loading sessions...</p>
            </div>
        );
    }

    /* Empty state (authenticated user, no sessions yet) */
    if (sessions.length === 0) {
        return (
            <div className="history-container">
                <h1>History</h1>
                <p>No therapy sessions yet.</p>
                <p>Your completed sessions will appear here once you start using GLOVR.</p>
            </div>
        );
    }

    /* Table view */
    return (
        <div className="history-container">
            <h1>History</h1>

            <div className="history-list">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className="session-card"
                        onClick={() =>
                            navigate(`${basePath}/history/${session.id}${modeParam}`)
                        }
                    >
                        <div className="session-title">
                            {session.name}
                        </div>

                        <div className="session-meta">
                            {session.date}
                        </div>

                        <div className="session-meta">
                            {session.start} - {session.end}
                        </div>

                        <div className="session-bottom">
                            <span>Duration: {formatDuration(session.durationSeconds)}</span>
                            <span>{session.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
