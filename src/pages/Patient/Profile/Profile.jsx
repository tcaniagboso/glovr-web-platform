import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./Profile.css";

const mockProfile = {
    first_name: "John",
    middle_name: null,
    last_name: "Doe",
    email: "guest@glovr.demo",
    role: "patient",
    created_at: "2026-01-01",
    date_of_birth: null,
    therapist: "Dr. Sarah Kim",
    program: "Hand Rehabilitation",
    device: "VR Headset",
    last_active: "Jan 13, 2026",
};

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            // 1️. Check auth session
            const {
                data: { user },
            } = await supabase.auth.getUser();

            // 2️. Guest / Demo → mock
            if (!user) {
                setProfile(mockProfile);
                setLoading(false);
                return;
            }

            // 3️. Authenticated → fetch profile
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error(error);
                setProfile(mockProfile); // safe fallback
            } else {
                setProfile(data);
            }

            setLoading(false);
        };

        loadProfile();
    }, []);

    if (loading) return <p>Loading profile...</p>;
    if (!profile) return <p>Profile not found.</p>;

    const fullName = [
        profile.first_name,
        profile.middle_name,
        profile.last_name,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className="profile-container">
            <h1>Profile</h1>

            <div className="profile-card">
                <div className="profile-avatar">
                    <span>
                        {profile.first_name[0]}
                        {profile.last_name[0]}
                    </span>
                </div>

                <div className="profile-section">
                    <h2>Identity</h2>
                    <p><strong>Name:</strong> {fullName}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p>
                        <strong>Member Since:</strong>{" "}
                        {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                </div>

                <div className="profile-section">
                    <h2>Personal Information</h2>
                    <p>
                        <strong>Date of Birth:</strong>{" "}
                        {profile.date_of_birth ?? "Not set"}
                    </p>
                </div>

                <div className="profile-section">
                    <h2>Care Information</h2>
                    <p>
                        <strong>Assigned Therapist:</strong>{" "}
                        {profile.therapist ?? "Not assigned"}
                    </p>
                    <p>
                        <strong>Program:</strong>{" "}
                        {profile.program ?? "Not assigned"}
                    </p>
                </div>

                <div className="profile-actions">
                    <button className="edit-profile-btn" disabled>
                        Edit Profile (Coming Soon)
                    </button>
                    <button className="delete-profile-btn" disabled>
                        Delete Profile (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
}