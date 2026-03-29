import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { mockProgressData } from "../../../mocks/sessions";
import "./Progress.css";

/* ---------- Helper functions ---------- */

function avg(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function getRelativeWeek(date, firstDate) {
    const diffMs = date - firstDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays / 7) + 1;
}

/* Transform sessions → chart data */
function transformProgress(sessions) {
    if (!sessions.length) return { grip: [], flexion: [], consistency: [] };

    // find first session date
    const sorted = [...sessions].sort(
        (a, b) => new Date(a.started_at) - new Date(b.started_at)
    );

    const firstDate = new Date(sorted[0].started_at);

    const weeks = {};

    sessions.forEach((s) => {
        const date = new Date(s.started_at);
        date.setHours(0, 0, 0, 0);
        const weekNum = getRelativeWeek(date, firstDate);
        const week = `Week ${weekNum}`;

        if (!weeks[week]) {
            weeks[week] = {
                grip: [],
                flexion: [],
                count: 0,
            };
        }

        const m = s.session_metrics;
        if (!m) return;

        const grip =
            (m.thumb_peak_force +
                m.index_peak_force +
                m.middle_peak_force +
                m.ring_peak_force +
                m.pinky_peak_force) / 5;

        const flexion =
            (m.thumb_rom +
                m.index_rom +
                m.middle_rom +
                m.ring_rom +
                m.pinky_rom) / 5;

        weeks[week].grip.push(grip);
        weeks[week].flexion.push(flexion);
        weeks[week].count += 1;
    });

    const grip = [];
    const flexion = [];
    const consistency = [];

    Object.entries(weeks).forEach(([week, values]) => {
        grip.push({ week, value: avg(values.grip) });
        flexion.push({ week, value: avg(values.flexion) });
        consistency.push({ week, value: values.count });
    });

    return { grip, flexion, consistency };
}

/* ---------- Component ---------- */

export default function Progress() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { patientId } = useParams();

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    useEffect(() => {
        async function loadProgress() {
            const { data: { user } } = await supabase.auth.getUser();

            // Demo / Guest → mock data
            if (mode === "demo" || mode === "guest") {
                setData(mockProgressData);
                setLoading(false);
                return;
            }

            if (!user) {
                setData(null);
                setLoading(false);
                return;
            }

            const targetId = patientId || user.id;

            // Fetch sessions + metrics
            const { data, error } = await supabase
                .from("sessions")
                .select(`
                    started_at,
                    session_metrics (
                        thumb_rom,
                        index_rom,
                        middle_rom,
                        ring_rom,
                        pinky_rom,
                        thumb_peak_force,
                        index_peak_force,
                        middle_peak_force,
                        ring_peak_force,
                        pinky_peak_force
                    )
                `)
                .eq("patient_id", targetId)

            if (error) {
                console.error("Progress fetch error:", error);
                setData(null);
                setLoading(false);
                return;
            }

            // Transform -> chart format
            const valid = (data || []).filter(s => s.session_metrics);
            const transformed = transformProgress(valid);

            setData(transformed);
            setLoading(false);
        }

        loadProgress();
    }, [patientId, mode]);

    /* ---------- Loading ---------- */
    if (loading) {
        return (
            <div className="progress-container">
                <h1>Progress</h1>
                <p>Loading progress...</p>
            </div>
        );
    }

    /* ---------- Empty ---------- */
    if (!data || data.grip.length === 0) {
        return (
            <div className="progress-container">
                <h1>Progress</h1>
                <p>No progress data available yet.</p>
                <p>Your recovery metrics will appear once you start therapy sessions.</p>
            </div>
        );
    }

    /* ---------- Charts ---------- */
    return (
        <div className="progress-container">
            <h1>Progress</h1>

            {/* Grip Strength */}
            <div className="graph-card">
                <h2>Grip Strength</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.grip}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#6a5acd"
                            strokeWidth={3}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Flexion */}
            <div className="graph-card">
                <h2>Finger Flexion Range (°)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.flexion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#2e8b57"
                            strokeWidth={3}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Consistency */}
            <div className="graph-card">
                <h2>Session Consistency (per week)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.consistency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#ff8c00"
                            strokeWidth={3}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}