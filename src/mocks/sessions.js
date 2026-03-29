/* Mock session list */
export const mockSessions = [
    {
        id: 1,
        name: "Hand Grip Exercise",
        start: "14:32",
        end: "14:45",
        duration: "13 mins",
        date: "Jan 13, 2026",
        status: "Completed",
    },
    {
        id: 2,
        name: "Wrist Flexion Exercise",
        start: "10:15",
        end: "10:30",
        duration: "15 mins",
        date: "Jan 12, 2026",
        status: "Completed",
    },
    {
        id: 3,
        name: "Finger Isolation Exercise",
        start: "09:00",
        end: "09:20",
        duration: "20 mins",
        date: "Jan 10, 2026",
        status: "Completed",
    },
];

/* Mock session details */
export const mockSessionDetails = {
    1: {
        id: 1,
        name: "Hand Grip Exercise",
        date: "Jan 13, 2026",
        start: "14:32",
        end: "14:45",
        duration: "13 mins",
        metrics: {
            repetitions_detected: 18,
            symmetry_score: 0.82,
            rom: { thumb: 45, index: 50, middle: 48, ring: 44, pinky: 40 },
            peak_force: { thumb: 20, index: 25, middle: 23, ring: 21, pinky: 18 },
        },
    },
    2: {
        id: 2,
        name: "Wrist Flexion Exercise",
        date: "Jan 12, 2026",
        start: "10:15",
        end: "10:30",
        duration: "15 mins",
        metrics: {
            repetitions_detected: 22,
            symmetry_score: 0.76,
            rom: { thumb: 40, index: 47, middle: 45, ring: 42, pinky: 39 },
            peak_force: { thumb: 18, index: 22, middle: 20, ring: 19, pinky: 16 },
        },
    },
    3: {
        id: 3,
        name: "Finger Isolation Exercise",
        date: "Jan 10, 2026",
        start: "09:00",
        end: "09:20",
        duration: "20 mins",
        metrics: {
            repetitions_detected: 25,
            symmetry_score: 0.88,
            rom: { thumb: 48, index: 52, middle: 50, ring: 47, pinky: 44 },
            peak_force: { thumb: 22, index: 27, middle: 25, ring: 23, pinky: 20 },
        },
    },
};

export const mockProgressData = {
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