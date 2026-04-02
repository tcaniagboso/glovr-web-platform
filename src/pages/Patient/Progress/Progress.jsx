import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
} from "recharts";

import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { mockSessionDetails, mockProgressData } from "../../../mocks/sessions";
import "./Progress.css";

/* ---------- Helper functions ---------- */

function avg(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function transformProgress(sessions) {
    if (!sessions.length) {
        return {
            grip: [],
            flexion: [],
            consistency: [],
            symmetry: [],
            wrist: [],
            reps: [],
            duration: [],
        };
    }

    const sorted = [...sessions].sort(
        (a, b) => new Date(a.started_at) - new Date(b.started_at)
    );

    const grip = [];
    const flexion = [];
    const symmetry = [];
    const wristAll = [];
    const reps = [];
    const duration = [];
    const fingerBalance = [];
    const strengthVsFlexion = [];

    sorted.forEach((s, index) => {
        const m = s.session_metrics;
        if (!m) return;

        const label = `S${index + 1}`;

        const gripValue =
            (m.thumb_peak_force +
                m.index_peak_force +
                m.middle_peak_force +
                m.ring_peak_force +
                m.pinky_peak_force) / 5;

        const flexionValue =
            (m.thumb_rom +
                m.index_rom +
                m.middle_rom +
                m.ring_rom +
                m.pinky_rom) / 5;

        grip.push({ session: label, value: Math.round(gripValue) });
        flexion.push({ session: label, value: Math.round(flexionValue) });

        symmetry.push({ session: label, value: m.symmetry_score ?? 0 });

        wristAll.push({
            session: label,
            pitch: m.wrist_pitch_rom ?? 0,
            flexion: m.wrist_flexion ?? 0,
            extension: m.wrist_extension ?? 0,
            interior_roll: m.wrist_interior_roll ?? 0,
            exterior_roll: m.wrist_exterior_roll ?? 0,
        });

        reps.push({ session: label, value: m.repetitions_detected ?? 0 });

        duration.push({ session: label, value: m.duration_seconds ?? 0 });

        fingerBalance.push({
            session: label,
            thumb: m.thumb_peak_force ?? 0,
            index: m.index_peak_force ?? 0,
            middle: m.middle_peak_force ?? 0,
            ring: m.ring_peak_force ?? 0,
            pinky: m.pinky_peak_force ?? 0,
        });

        strengthVsFlexion.push({
            flexion: Math.round(flexionValue),
            grip: Math.round(gripValue),
        });
    });

    // --- Consistency (per week)
    const weeks = {};
    const firstDate = new Date(sorted[0].started_at);

    sorted.forEach((s) => {
        const date = new Date(s.started_at);
        date.setHours(0, 0, 0, 0);

        const diffMs = date - firstDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const weekNum = Math.floor(diffDays / 7) + 1;

        const week = `Week ${weekNum}`;

        if (!weeks[week]) weeks[week] = 0;
        weeks[week] += 1;
    });

    const consistency = Object.entries(weeks)
        .sort(([a], [b]) => {
            const numA = parseInt(a.replace("Week ", ""));
            const numB = parseInt(b.replace("Week ", ""));
            return numA - numB;
        })
        .map(([week, count]) => ({
            week,
            value: count,
        }));

    return {
        grip,
        flexion,
        consistency,
        symmetry,
        wristAll,
        reps,
        duration,
        fingerBalance,
        strengthVsFlexion,
    };
}

function computeInsights(data) {
    const insights = [];

    // --- Grip Trend
    if (data.grip.length >= 2) {
        const first = data.grip[0].value;
        const last = data.grip[data.grip.length - 1].value;
        const diff = last - first;

        const percent = ((diff / first) * 100).toFixed(1);

        if (diff > 0) {
            insights.push({
                text: `Grip strength increased by ${percent}%`,
                type: "positive",
            });
        } else if (diff < 0) {
            insights.push({
                text: `Grip strength decreased by ${Math.abs(percent)}%`,
                type: "negative",
            });
        }
    }

    // --- Best Session
    if (data.grip.length) {
        const best = data.grip.reduce((max, g) =>
            g.value > max.value ? g : max
        );

        insights.push({
            text: `Best session: ${best.session} (Grip ${best.value})`,
            type: "neutral",
        });
    }

    // --- Consistency
    if (data.consistency.length) {
        const avg =
            data.consistency.reduce((sum, w) => sum + w.value, 0) /
            data.consistency.length;

        insights.push({
            text: `Consistency: ${avg.toFixed(1)} sessions/week`,
            type: "neutral",
        });
    }

    // --- Imbalance Detection
    if (data.fingerBalance.length) {
        const latest = data.fingerBalance[data.fingerBalance.length - 1];
        const values = Object.entries(latest)
            .filter(([k, v]) => k !== "session" && typeof v === "number");

        const max = Math.max(...values.map(v => v[1]));
        const min = Math.min(...values.map(v => v[1]));

        if (max - min > 5) {
            const weakest = values.find(v => v[1] === min)?.[0];

            insights.push({
                text: `Imbalance detected (weakest: ${weakest})`,
                type: "negative",
            });
        }
    }

    // --- Mobility Score
    if (data.wristAll?.length) {
        const latest = data.wristAll[data.wristAll.length - 1];

        const values = Object.entries(latest)
            .filter(([k, v]) => k !== "session" && typeof v === "number")
            .map(v => v[1]);

        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        insights.push({
            text: `Mobility score: ${Math.round(avg)}`,
            type: "positive",
        });
    }

    // --- Overall Status
    if (data.grip.length >= 2 && data.symmetry.length >= 2) {
        const gripTrend =
            data.grip[data.grip.length - 1].value -
            data.grip[0].value;

        const symmetryTrend =
            data.symmetry[data.symmetry.length - 1].value -
            data.symmetry[0].value;

        let status = "stable";

        if (gripTrend > 0 && symmetryTrend >= 0) {
            status = "improving";
        } else if (gripTrend < 0 || symmetryTrend < 0) {
            status = "declining";
        }

        insights.unshift({
            text: `Overall status: ${status}`,
            type:
                status === "improving"
                    ? "positive"
                    : status === "declining"
                        ? "negative"
                        : "neutral",
        });
    }

    // --- Recovery Score
    if (data.grip.length && data.symmetry.length && data.wristAll?.length) {
        const latestGrip = data.grip[data.grip.length - 1].value;
        const latestSymmetry = data.symmetry[data.symmetry.length - 1].value;
        const latestWrist = data.wristAll[data.wristAll.length - 1];

        const wristValues = Object.entries(latestWrist)
            .filter(([k]) => k !== "session")
            .map(([_, v]) => v);

        const wristAvg =
            wristValues.reduce((a, b) => a + b, 0) / wristValues.length;

        // normalize (rough scaling — good enough for demo)
        const score =
            Math.min(100,
                (latestGrip * 1.5) +
                (latestSymmetry * 50) +
                (wristAvg)
            );

        insights.unshift({
            text: `Recovery score: ${Math.round(score)} / 100`,
            type: "positive",
        });
    }

    return insights;
}

/* ---------- Component ---------- */

export default function Progress() {
    const [data, setData] = useState(null);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const { patientId } = useParams();

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const [view, setView] = useState("overview");

    useEffect(() => {
        async function loadProgress() {
            const { data: { user } } = await supabase.auth.getUser();

            // Demo / Guest → mock data
            if (mode === "demo" || mode === "guest") {
                const mockSessionsArray = Object.values(mockSessionDetails).map(s => ({
                    started_at: s.started_at,
                    session_metrics: {
                        thumb_rom: s.metrics.rom.thumb,
                        index_rom: s.metrics.rom.index,
                        middle_rom: s.metrics.rom.middle,
                        ring_rom: s.metrics.rom.ring,
                        pinky_rom: s.metrics.rom.pinky,
                        thumb_peak_force: s.metrics.peak_force.thumb,
                        index_peak_force: s.metrics.peak_force.index,
                        middle_peak_force: s.metrics.peak_force.middle,
                        ring_peak_force: s.metrics.peak_force.ring,
                        pinky_peak_force: s.metrics.peak_force.pinky,
                        symmetry_score: s.metrics.symmetry_score,
                        wrist_pitch_rom: s.metrics.wrist_pitch_rom,
                        wrist_flexion: s.metrics.wrist.flexion,
                        wrist_extension: s.metrics.wrist.extension,
                        wrist_interior_roll: s.metrics.wrist.interior_roll,
                        wrist_exterior_roll: s.metrics.wrist.exterior_roll,
                        repetitions_detected: s.metrics.repetitions_detected,
                        duration_seconds: s.metrics.duration_seconds,
                    },
                }));

                const transformed = transformProgress(mockSessionsArray);
                const insights_data = computeInsights(transformed);
                setData(transformed);
                setInsights(insights_data);
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
                        pinky_peak_force,
                        symmetry_score,
                        wrist_pitch_rom,
                        repetitions_detected,
                        duration_seconds
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
            const insights_data = computeInsights(transformed);

            setData(transformed);
            setInsights(insights_data);
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

            <div className="insights-card">
                <h2>Performance Insights</h2>

                {insights.length ? (
                    <ul>
                        {insights.map((insight, i) => (
                            <li key={i} className={`insight-${insight.type}`}>
                                {insight.type === "positive" && "↑ "}
                                {insight.type === "negative" && "↓ "}
                                {insight.text}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No insights available yet.</p>
                )}
            </div>

            <div className="progress-tabs">
                {["overview", "strength", "mobility", "advanced"].map((v) => (
                    <button
                        key={v}
                        className={view === v ? "active-tab" : ""}
                        onClick={() => setView(v)}
                    >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>


            {/* ---------------- OVERVIEW ---------------- */}
            {view === "overview" && (
                <>
                    {/* Grip */}
                    <div className="graph-card">
                        <h2>Grip Strength</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.grip}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#6a5acd" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Flexion */}
                    <div className="graph-card">
                        <h2>Finger Flexion Range (°)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.flexion}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis domain={["dataMin - 10", "dataMax + 10"]} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#2e8b57" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Consistency */}
                    <div className="graph-card">
                        <h2>Session Consistency (per week)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.consistency}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="week"
                                    angle={-20}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis domain={[0, "dataMax + 1"]} allowDecimals={false} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#ff8c00" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            {/* ---------------- STRENGTH ---------------- */}
            {view === "strength" && (
                <>
                    <div className="graph-card">
                        <h2>Grip Strength</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.grip}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#6a5acd" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="graph-card">
                        <h2>Finger Strength Balance (All Fingers)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.fingerBalance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                                <Tooltip />
                                <Line dataKey="thumb" stroke="#ff7675" />
                                <Line dataKey="index" stroke="#74b9ff" />
                                <Line dataKey="middle" stroke="#55efc4" />
                                <Line dataKey="ring" stroke="#ffeaa7" />
                                <Line dataKey="pinky" stroke="#a29bfe" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            {/* ---------------- MOBILITY ---------------- */}
            {view === "mobility" && (
                <>
                    <div className="graph-card">
                        <h2>Finger Flexion Range (°)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.flexion}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis domain={["dataMin - 10", "dataMax + 10"]} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#2e8b57" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="graph-card">
                        <h2>Wrist Mobility (All Axes)</h2>

                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.wristAll}>
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />

                                <YAxis domain={["dataMin - 5", "dataMax + 5"]} />

                                <Tooltip />

                                <Line dataKey="pitch" stroke="#6a5acd" />
                                <Line dataKey="flexion" stroke="#00b894" />
                                <Line dataKey="extension" stroke="#ff7675" />
                                <Line dataKey="interior_roll" stroke="#fdcb6e" />
                                <Line dataKey="exterior_roll" stroke="#0984e3" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            {/* ---------------- ADVANCED ---------------- */}
            {view === "advanced" && (
                <>
                    <div className="graph-card">
                        <h2>Movement Symmetry</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.symmetry}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis domain={[0, 1]} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#ff4d6d" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="graph-card">
                        <h2>Repetitions</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.reps}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis domain={[0, "dataMax + 5"]} allowDecimals={false} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#0984e3" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="graph-card">
                        <h2>Session Duration (seconds)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.duration}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="session"
                                    angle={-30}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis domain={[0, "dataMax + 100"]} allowDecimals={false} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#fdcb6e" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="graph-card">
                        <h2>Strength vs Flexion</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="flexion" domain={["dataMin - 5", "dataMax + 5"]} name="Flexion (°)" />
                                <YAxis type="number" dataKey="grip" domain={["dataMin - 5", "dataMax + 5"]} name="Grip Strength" />
                                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                                <Scatter data={data.strengthVsFlexion} fill="#6c5ce7" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}   