import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./History.css";

/* Mock data for demo / guest */
const mockSessions = [
    {
        id: 1,
        name: "Hand Grip Exercise",
        start: "14:32",
        end: "14:45",
        duration: "13 mins",
        date: "Jan 13, 2026",
    },
    {
        id: 2,
        name: "Wrist Flexion Exercise",
        start: "10:15",
        end: "10:30",
        duration: "15 mins",
        date: "Jan 12, 2026",
    },
    {
        id: 3,
        name: "Finger Isolation Exercise",
        start: "09:00",
        end: "09:20",
        duration: "20 mins",
        date: "Jan 10, 2026",
    },
];

export default function History() {
    const navigate = useNavigate();
    const location = useLocation();

    // Only used for preserving demo UI state in navigation
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            // 1. Check auth state
            const {
                data: { user },
            } = await supabase.auth.getUser();

            // 2. Guest / Demo → mock data
            if (!user) {
                setSessions(mockSessions);
                setLoading(false);
                return;
            }

            // 3. Authenticated → database
            const { data, error } = await supabase
                .from("sessions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to load sessions:", error);
                setSessions([]);
            } else {
                setSessions(data || []);
            }

            setLoading(false);
        }

        loadHistory();
    }, []);

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

            <table className="history-table">
                <caption>
                    <h2>Past Therapy Sessions</h2>
                </caption>

                <thead>
                    <tr>
                        <th>Exercise Name</th>
                        <th>Date</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                    </tr>
                </thead>

                <tbody>
                    {sessions.map((session) => (
                        <tr
                            key={session.id}
                            className="history-row"
                            onClick={() =>
                                navigate(
                                    `/patient/history/${session.id}${modeParam}`
                                )
                            }
                        >
                            <td>{session.name}</td>
                            <td>{session.date}</td>
                            <td>{session.start}</td>
                            <td>{session.end}</td>
                            <td>{session.duration}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
