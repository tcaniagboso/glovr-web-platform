import "./Profile.css";

const therapistProfile = {
    name: "Dr. Sarah Kim",
    email: "sarah.kim@clinic.com",
    role: "Licensed Hand Therapist",
    memberSince: "November 2024",
    patientsCount: 12,
    specialty: "Hand & Upper Limb Rehabilitation",
    lastActive: "Jan 13, 2026",
};

export default function Profile() {
    return (
        <div className="profile-container">
            <h1>Profile</h1>

            <div className="profile-card">
                <div className="profile-avatar">
                    <span>SK</span>
                </div>

                <div className="profile-section">
                    <h2>Identity</h2>
                    <p><strong>Name:</strong> {therapistProfile.name}</p>
                    <p><strong>Email:</strong> {therapistProfile.email}</p>
                    <p><strong>Role:</strong> {therapistProfile.role}</p>
                    <p><strong>Member Since:</strong> {therapistProfile.memberSince}</p>
                </div>

                <div className="profile-section">
                    <h2>Professional Information</h2>
                    <p><strong>Specialty:</strong> {therapistProfile.specialty}</p>
                    <p><strong>Active Patients:</strong> {therapistProfile.patientsCount}</p>
                </div>

                <div className="profile-section">
                    <h2>Account Details</h2>
                    <p><strong>Last Active:</strong> {therapistProfile.lastActive}</p>
                </div>

                <button className="edit-profile-btn" disabled>
                    Edit Profile (Coming Soon)
                </button>

                <button className="delete-profile-btn" disabled>
                    Delete Profile (Coming Soon)
                </button>
            </div>
        </div>
    );
}
