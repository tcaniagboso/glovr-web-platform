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

import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { mockSessionDetails, mockProgressData } from "../../../mocks/sessions";
import { withMode, getRecoveryType } from "../../../utils/utils";
import "./Progress.css";

/* ---------- Helper functions ---------- */

function avg(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function CustomTooltip({ active, payload, role, patientId, mode }) {
    const navigate = useNavigate();

    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const label = data.session;

    // collect all lines
    const values = payload
        .map(p => ({
            name: p.name || p.dataKey,
            value: p.value,
            color: p.stroke || p.color,
        })).sort((a, b) => b.value - a.value);

    const handleClick = () => {
        if (!data.sessionId) return;

        if (role === "therapist") {
            navigate(
                withMode(
                    `/therapist/patients/${patientId}/history/${data.sessionId}`,
                    mode
                )
            );
        } else {
            navigate(
                withMode(
                    `/patient/history/${data.sessionId}`,
                    mode
                )
            );
        }
    };

    return (
        <div className="tooltip" onClick={(e) => e.stopPropagation()}>
            <p>{label}</p>

            {values.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: v.color,
                            display: "inline-block",
                        }}
                    />
                    <span>{v.name}: {v.value}</span>
                </div>
            ))}

            {data.sessionId && (
                <button onClick={handleClick}>
                    View Session
                </button>
            )}
        </div>
    );
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

        grip.push({ session: label, value: Math.round(gripValue), sessionId: s.id });
        flexion.push({ session: label, value: Math.round(flexionValue), sessionId: s.id });

        symmetry.push({ session: label, value: m.symmetry_score ?? 0, sessionId: s.id });

        wristAll.push({
            session: label,
            sessionId: s.id,
            pitch: m.wrist_pitch_rom ?? 0,
            flexion: m.wrist_flexion ?? 0,
            extension: m.wrist_extension ?? 0,
            interior_roll: m.wrist_interior_roll ?? 0,
            exterior_roll: m.wrist_exterior_roll ?? 0,
        });

        reps.push({ session: label, value: m.repetitions_detected ?? 0, sessionId: s.id });

        duration.push({ session: label, value: m.duration_seconds ?? 0, sessionId: s.id });

        fingerBalance.push({
            session: label,
            sessionId: s.id,
            thumb: m.thumb_peak_force ?? 0,
            index: m.index_peak_force ?? 0,
            middle: m.middle_peak_force ?? 0,
            ring: m.ring_peak_force ?? 0,
            pinky: m.pinky_peak_force ?? 0,
        });

        strengthVsFlexion.push({
            flexion: Math.round(flexionValue),
            grip: Math.round(gripValue),
            sessionId: s.id,
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

    const isValid = (v) => Number.isFinite(v);

    // --- Grip Trend
    if (data.grip.length >= 2) {
        const first = data.grip[0].value;
        const last = data.grip[data.grip.length - 1].value;
        const diff = last - first;

        let percent = null;
        if (first !== 0 && isValid(first)) {
            percent = ((diff / first) * 100);
        }

        if (percent !== null && isValid(percent)) {
            const formatted = Math.abs(percent).toFixed(1);

            if (diff > 0) {
                insights.push({
                    text: `Grip strength increased by ${formatted}%`,
                    type: "positive",
                });
            } else if (diff < 0) {
                insights.push({
                    text: `Grip strength decreased by ${formatted}%`,
                    type: "negative",
                });
            }
        } else {
            insights.push({
                text: "Grip trend unavailable",
                type: "neutral",
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

        if (isValid(avg)) {
            insights.push({
                text: `Consistency: ${avg.toFixed(1)} sessions/week`,
                type: "neutral",
            });
        }
    }

    // --- Imbalance Detection
    if (data.fingerBalance.length) {
        const latest = data.fingerBalance[data.fingerBalance.length - 1];

        const values = Object.entries(latest)
            .filter(([k, v]) =>
                ["thumb", "index", "middle", "ring", "pinky"].includes(k) &&
                isValid(v)
            );

        if (values.length > 0) {
            const max = Math.max(...values.map(v => v[1]));
            const min = Math.min(...values.map(v => v[1]));

            if (isValid(max) && isValid(min) && max - min > 5) {
                const weakestEntry = values.reduce((minEntry, curr) =>
                    curr[1] < minEntry[1] ? curr : minEntry
                );

                const weakest = weakestEntry[0];

                insights.push({
                    text: `Imbalance detected (weakest: ${weakest})`,
                    type: "negative",
                });
            }
        }
    }

    // --- Mobility Score
    if (data.wristAll?.length) {
        const latest = data.wristAll[data.wristAll.length - 1];

        const values = Object.entries(latest)
            .filter(([k, v]) => k !== "session" && isValid(v))
            .map(v => v[1]);

        if (values.length > 0) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            if (isValid(avg)) {
                insights.push({
                    text: `Mobility score: ${Math.round(avg)}`,
                    type: "positive",
                });
            }
        }
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
            .filter(([k, v]) => k !== "session" && isValid(v))
            .map(([_, v]) => v);

        if (wristValues.length > 0) {
            const wristAvg =
                wristValues.reduce((a, b) => a + b, 0) / wristValues.length;

            if (isValid(latestGrip) && isValid(latestSymmetry) && isValid(wristAvg)) {

                // --- Normalize
                const gripScore = latestGrip > 0
                    ? Math.min(100, (latestGrip / 2000) * 100)
                    : 0;

                const symmetryScore = latestSymmetry * 100;

                const wristScore = wristAvg > 0
                    ? Math.min(100, (wristAvg / 90) * 100)
                    : 0;

                // --- Combine
                const score =
                    0.4 * gripScore +
                    0.3 * symmetryScore +
                    0.3 * wristScore;

                const rounded = Math.round(score);

                insights.unshift({
                    text: `Recovery score: ${rounded} / 100`,
                    type: getRecoveryType(rounded),
                });

            } else {
                insights.unshift({
                    text: "Recovery score: Insufficient data",
                    type: "neutral",
                });
            }
        }
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
    const [userId, setUserId] = useState(null);
    const role = patientId ? "therapist" : "patient";
    const [view, setView] = useState("overview");

    useEffect(() => {
        async function loadProgress() {
            // Demo / Guest → mock data
            if (mode === "demo" || mode === "guest") {
                const mockSessionsArray = Object.values(mockSessionDetails).map(s => ({
                    id: s.id,
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

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setData(null);
                    setLoading(false);
                    return;
                } else {
                    setUserId(user.id);
                }

                const targetId = patientId || user.id;

                // Fetch sessions + metrics
                const { data: sessionsData, error } = await supabase
                    .from("sessions")
                    .select(`
                    id,
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
                        wrist_flexion,
                        wrist_extension,
                        wrist_interior_roll,
                        wrist_exterior_roll,
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
                const valid = (sessionsData || []).filter(s => s.session_metrics);
                const transformed = transformProgress(valid);
                const insights_data = computeInsights(transformed);

                setData(transformed);
                setInsights(insights_data);
            } catch (err) {
                console.error("Unexpected error:", err);
                setData(null);
            } finally {
                setLoading(false);
            }
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
    if (!data || !data.grip || data.grip.length === 0) {
        return (
            <div className="progress-container">
                <h1>Progress</h1>
                <p>No progress data available yet.</p>
                <p>Your recovery metrics will appear once you start therapy sessions.</p>
            </div>
        );
    }

    const targetId = patientId || userId;

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
                                {insight.type === "neutral" && "= "}
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
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />
                                <Line dataKey="value" stroke="#6a5acd" strokeWidth={3} dot={{ r: 5 }} />
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
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />
                                <Line dataKey="value" stroke="#2e8b57" strokeWidth={3} dot={{ r: 5 }} />
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
                                <Line dataKey="value" stroke="#ff8c00" strokeWidth={3} dot={{ r: 5 }} />
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
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />
                                <Line dataKey="value" stroke="#6a5acd" strokeWidth={3} dot={{ r: 5 }} />
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
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />
                                <Line dataKey="thumb" name="Thumb" stroke="#ff7675" dot={{ r: 5 }} />
                                <Line dataKey="index" name="Index" stroke="#74b9ff" dot={{ r: 5 }} />
                                <Line dataKey="middle" name="Middle" stroke="#55efc4" dot={{ r: 5 }} />
                                <Line dataKey="ring" name="Ring" stroke="#ffeaa7" dot={{ r: 5 }} />
                                <Line dataKey="pinky" name="Pinky" stroke="#a29bfe" dot={{ r: 5 }} />
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
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />
                                <Line dataKey="value" stroke="#2e8b57" strokeWidth={3} dot={{ r: 5 }} />
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

                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />

                                <Line dataKey="pitch" name="Pitch" stroke="#6a5acd" dot={{ r: 5 }} />
                                <Line dataKey="flexion" name="Flexion" stroke="#00b894" dot={{ r: 5 }} />
                                <Line dataKey="extension" name="Extension" stroke="#ff7675" dot={{ r: 5 }} />
                                <Line dataKey="interior_roll" name="Interior Roll" stroke="#fdcb6e" dot={{ r: 5 }} />
                                <Line dataKey="exterior_roll" name="Exterior Roll" stroke="#0984e3" dot={{ r: 5 }} />
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
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />
                                <Line dataKey="value" stroke="#ff4d6d" strokeWidth={3} dot={{ r: 5 }} />
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
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />
                                <Line dataKey="value" stroke="#0984e3" strokeWidth={3} dot={{ r: 5 }} />
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
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            role={role}
                                            patientId={targetId}
                                            mode={mode}
                                        />
                                    }
                                    cursor={{ stroke: "#ccc" }}
                                    isAnimationActive={false}
                                    wrapperStyle={{ pointerEvents: "auto" }}
                                />
                                <Line dataKey="value" stroke="#fdcb6e" strokeWidth={3} dot={{ r: 5 }} />
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
                                <Scatter data={data.strengthVsFlexion} fill="#6c5ce7" dot={{ r: 5 }} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}   