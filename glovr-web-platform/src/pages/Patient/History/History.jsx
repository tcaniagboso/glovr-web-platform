import { useNavigate } from "react-router-dom";
import "./History.css";

const sessions = [
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
    {
        id: 4,
        name: "Pinch Control Exercise",
        start: "16:45",
        end: "17:00",
        duration: "15 mins",
        date: "Jan 08, 2026",
    },
];

export default function History() {
    const navigate = useNavigate();

    return (
        <div className="history-container">
            <h1>History</h1>
            <table className="history-table">
                <caption><h2>Past Therapy Sessions</h2></caption>

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
                            onClick={() => navigate(`/patient/history/${session.id}`)}
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
