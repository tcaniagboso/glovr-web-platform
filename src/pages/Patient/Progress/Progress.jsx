import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./Progress.css";

/* Mock data for demo / guest */
const mockData = {
    grip: [
        { week: "Week 1", value: 22 },
        { week: "Week 2", value: 25 },
        { week: "Week 3", value: 30 },
        { week: "Week 4", value: 35 },
    ],
    flexion: [
        { week: "Week 1", value: 40 },
        { week: "Week 2", value: 48 },
        { week: "Week 3", value: 55 },
        { week: "Week 4", value: 62 },
    ],
    consistency: [
        { week: "Week 1", value: 3 },
        { week: "Week 2", value: 4 },
        { week: "Week 3", value: 5 },
        { week: "Week 4", value: 6 },
    ],
};

export default function Progress() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProgress() {
            // 1. Check auth state
            const {
                data: { user },
            } = await supabase.auth.getUser();

            // 2. Guest / Demo → mock data
            if (!user) {
                setData(mockData);
                setLoading(false);
                return;
            }

            // 3. Authenticated → no data yet
            setData(null);
            setLoading(false);

            // const { data, error } = await supabase
            //     .from("progress_metrics")
            //     .select("*")
            //     .eq("user_id", user.id);

            // setData(transform(data));
        }

        loadProgress();
    }, []);

    /* Loading state */
    if (loading) {
        return (
            <div className="progress-container">
                <h1>Progress</h1>
                <p>Loading progress...</p>
            </div>
        );
    }

    /* Empty state for authenticated users */
    if (!data) {
        return (
            <div className="progress-container">
                <h1>Progress</h1>
                <p>No progress data available yet.</p>
                <p>Your recovery metrics will appear once you start therapy sessions.</p>
            </div>
        );
    }

    /* Demo / Guest charts */
    return (
        <div className="progress-container">
            <h1>Progress</h1>

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
