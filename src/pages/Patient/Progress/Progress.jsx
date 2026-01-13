import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

import "./Progress.css";

const gripData = [
    { week: "Week 1", value: 22 },
    { week: "Week 2", value: 25 },
    { week: "Week 3", value: 30 },
    { week: "Week 4", value: 35 },
];

const flexionData = [
    { week: "Week 1", value: 40 },
    { week: "Week 2", value: 48 },
    { week: "Week 3", value: 55 },
    { week: "Week 4", value: 62 },
];

const consistencyData = [
    { week: "Week 1", value: 3 },
    { week: "Week 2", value: 4 },
    { week: "Week 3", value: 5 },
    { week: "Week 4", value: 6 },
];

export default function Progress() {
    return (
        <div className="progress-container">
            <h1>Progress</h1>

            <div className="graph-card">
                <h2>Grip Strength</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={gripData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#6a5acd" strokeWidth={3} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="graph-card">
                <h2>Finger Flexion Range (°)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={flexionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#2e8b57" strokeWidth={3} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="graph-card">
                <h2>Session Consistency (per week)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={consistencyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#ff8c00" strokeWidth={3} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
