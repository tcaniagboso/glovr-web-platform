import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
    program: "Hand Rehabilitation",
    device: "VR Headset",
    last_active: "Jan 13, 2026",
};

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [invites, setInvites] = useState([]);
    const [therapistName, setTherapistName] = useState(null);

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            // DEMO / GUEST
            if (mode === "demo" || mode === "guest") {
                setProfile(mockProfile);
                setLoading(false);
                return;
            }

            // NO USER
            if (!user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            // REAL PROFILE
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error(error);
                setProfile(null);
            } else {
                setProfile(data);
            }

            setLoading(false);
        };

        loadProfile();
        loadInvites();
        loadTherapist();
    }, [mode]);

    // Load pending invites
    async function loadInvites() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data } = await supabase
            .from("therapist_invites")
            .select("*")
            .eq("patient_email", user.email)
            .eq("status", "pending");

        setInvites(data || []);
    }

    // 🔹 Accept invite
    async function acceptInvite(invite) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Create relationship
        await supabase.from("therapist_patients").insert({
            therapist_id: invite.therapist_id,
            patient_id: user.id
        });

        // Update invite
        await supabase
            .from("therapist_invites")
            .update({ status: "accepted" })
            .eq("id", invite.id);

        loadInvites();
        loadTherapist();
    }

    // 🔹 Decline invite
    async function declineInvite(inviteId) {
        await supabase
            .from("therapist_invites")
            .update({ status: "declined" })
            .eq("id", inviteId);

        loadInvites();
    }

    // Load therapist dynamically
    async function loadTherapist() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get therapist_id from relationship table
        const { data: relationship, error: relError } = await supabase
            .from("therapist_patients")
            .select("therapist_id")
            .eq("patient_id", user.id)
            .single();

        if (relError || !relationship) {
            console.error("Relationship error:", relError);
            setTherapistName(null);
            return;
        }

        // 2. Use therapist_id to get therapist profile
        const { data: therapist, error: therapistError } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", relationship.therapist_id)
            .single();

        if (therapistError || !therapist) {
            console.error("Therapist profile error:", therapistError);
            setTherapistName(null);
            return;
        }

        setTherapistName(`Dr. ${therapist.first_name} ${therapist.last_name}`);
    }

    // UI guards
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

                {/* Avatar */}
                <div className="profile-avatar">
                    <span>
                        {profile.first_name?.[0] ?? ""}
                        {profile.last_name?.[0] ?? ""}
                    </span>
                </div>

                {/* Identity */}
                <div className="profile-section">
                    <h2>Identity</h2>
                    <p><strong>Name:</strong> {fullName}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p>
                        <strong>Member Since:</strong>{" "}
                        {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                </div>

                {/* Personal */}
                <div className="profile-section">
                    <h2>Personal Information</h2>
                    <p>
                        <strong>Date of Birth:</strong>{" "}
                        {profile.date_of_birth ?? "Not set"}
                    </p>
                </div>

                {/* Care */}
                <div className="profile-section">
                    <h2>Care Information</h2>
                    <p>
                        <strong>Assigned Therapist:</strong>{" "}
                        {therapistName ?? "Not assigned"}
                    </p>
                    <p>
                        <strong>Program:</strong>{" "}
                        {profile.program ?? "Not assigned"}
                    </p>
                </div>

                {/*INVITES */}
                <div className="profile-section">
                    <h2>Pending Invitations</h2>

                    {invites.length === 0 ? (
                        <p>No pending invites</p>
                    ) : (
                        invites.map(invite => (
                            <div key={invite.id} className="invite-card">
                                <p>You have a therapist invitation</p>

                                <div className="invite-actions">
                                    <button onClick={() => acceptInvite(invite)}>
                                        Accept
                                    </button>

                                    <button onClick={() => declineInvite(invite.id)}>
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Actions */}
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