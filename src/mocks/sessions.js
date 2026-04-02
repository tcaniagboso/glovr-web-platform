export const mockSessions = [
    {
        id: 1,
        name: "Pinch Control",
        start: "14:32",
        end: "14:45",
        duration: "13 mins",
        date: "Jan 27, 2026",
        status: "Completed",
    },
    {
        id: 2,
        name: "Wrist Flexion & Extension",
        start: "10:15",
        end: "10:30",
        duration: "15 mins",
        date: "Jan 20, 2026",
        status: "Completed",
    },
    {
        id: 3,
        name: "Grab Control",
        start: "09:00",
        end: "09:20",
        duration: "20 mins",
        date: "Jan 13, 2026",
        status: "Completed",
    },
];

export const mockSessionDetails = {
    1: {
        id: 1,
        name: "Pinch Control",
        started_at: "2026-01-27T14:32:00Z",
        date: "Jan 27, 2026",
        start: "14:32",
        end: "14:45",
        duration: "13 mins",
        metrics: {
            repetitions_detected: 18,
            symmetry_score: 0.82,

            // Wrist
            wrist: {
                pitch: 30,
                flexion: 25,
                extension: 20,
                interior_roll: 15,
                exterior_roll: 18,

            },

            rom: { thumb: 45, index: 50, middle: 48, ring: 44, pinky: 40 },

            peak_force: { thumb: 20, index: 25, middle: 23, ring: 21, pinky: 18 },
            duration_seconds: 200,
        },
    },

    2: {
        id: 2,
        name: "Wrist Flexion & Extension",
        started_at: "2026-01-20T10:15:00Z",
        date: "Jan 20, 2026",
        start: "10:15",
        end: "10:30",
        duration: "15 mins",
        metrics: {
            repetitions_detected: 22,
            symmetry_score: 0.76,

            // Wrist
            wrist: {
                pitch: 32,
                flexion: 27,
                extension: 22,
                interior_roll: 18,
                exterior_roll: 20,
            },

            rom: { thumb: 40, index: 47, middle: 45, ring: 42, pinky: 39 },

            peak_force: { thumb: 18, index: 22, middle: 20, ring: 19, pinky: 16 },
            duration_seconds: 250,
        },
    },

    3: {
        id: 3,
        name: "Grab Control",
        started_at: "2026-01-13T09:00:00Z",
        date: "Jan 13, 2026",
        start: "09:00",
        end: "09:20",
        duration: "20 mins",
        metrics: {
            repetitions_detected: 25,
            symmetry_score: 0.88,

            // Wrist
            wrist: {
                pitch: 28,
                flexion: 22,
                extension: 18,
                interior_roll: 14,
                exterior_roll: 16,
            },

            rom: { thumb: 48, index: 52, middle: 50, ring: 47, pinky: 44 },

            peak_force: { thumb: 22, index: 27, middle: 25, ring: 23, pinky: 20 },
            duration_seconds: 300,
        },
    },
};

export const mockProgressData = {
    grip: [
        { session: "S1", value: 21 },
        { session: "S2", value: 23 },
        { session: "S3", value: 25 },
        { session: "S4", value: 28 },
        { session: "S5", value: 30 },
    ],
    flexion: [
        { session: "S1", value: 42 },
        { session: "S2", value: 46 },
        { session: "S3", value: 50 },
        { session: "S4", value: 54 },
        { session: "S5", value: 58 },
    ],
    consistency: [
        { week: "Week 1", value: 1 },
        { week: "Week 2", value: 3 },
        { week: "Week 3", value: 2 },
    ],
};