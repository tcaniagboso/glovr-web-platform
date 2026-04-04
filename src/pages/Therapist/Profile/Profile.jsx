import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./Profile.css";

const demoTherapistProfile = {
    first_name: "Sarah",
    last_name: "Kim",
    email: "demo@glovr.app",
    role: "therapist",
    specialty: "Hand & Upper Limb Rehabilitation",
    patientsCount: 4,
    created_at: "2024-11-01",
};

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            // DEMO fallback
            if (!user) {
                setProfile(demoTherapistProfile);
                setLoading(false);
                return;
            }

            // 1. Get profile
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }

            // 2. Get patient count
            const { count, error: countError } = await supabase
                .from("therapist_patients")
                .select("*", { count: "exact", head: true })
                .eq("therapist_id", user.id);

            if (countError) {
                console.error(countError);
            }

            // 3. Merge into profile
            setProfile({
                ...data,
                patientsCount: count ?? 0,
            });

            setLoading(false);
        };

        fetchProfile();
    }, []);

    if (loading) return <p>Loading profile...</p>;

    const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`;

    return (
        <div className="profile-container">
            <h1>Profile</h1>

            <div className="profile-card">
                <div className="profile-avatar">
                    <span>{initials}</span>
                </div>

                <div className="profile-section">
                    <h2>Identity</h2>
                    <p>
                        <strong>Name:</strong>{" "}
                        {profile.first_name} {profile.middle_name || ""} {profile.last_name}
                    </p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Role:</strong> Therapist</p>
                    <p>
                        <strong>Member Since:</strong>{" "}
                        {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                </div>

                <div className="profile-section">
                    <h2>Professional Information</h2>
                    <p>
                        <strong>Specialty:</strong>{" "}
                        {profile.specialty || "Not set"}
                    </p>
                    <p>
                        <strong>Active Patients:</strong>{" "}
                        {profile.patientsCount ?? "—"}
                    </p>
                </div>

                <div className="profile-section">
                    <h2>Account Details</h2>
                    <p><strong>Last Active:</strong> Today</p>
                </div>

                <div className="profile-actions">
                    {/* TODO: Implement edit profile and delete profile features */}
                    <button className="edit-profile-btn" disabled>
                        Edit Profile
                    </button>
                    <button className="delete-profile-btn" disabled>
                        Delete Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

