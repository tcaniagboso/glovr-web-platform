import "./Profile.css";

const patientProfile = {
    name: "John Doe",
    email: "john.doe@email.com",
    memberSince: "January 2026",
    dateOfBirth: "March 12, 1998",
    age: 27,
    therapist: "Dr. Sarah Kim",
    program: "Hand Rehabilitation",
    device: "VR Headset",
    lastActive: "Jan 13, 2026",
};

export default function Profile() {
    return (
        <div className="profile-container">
            <h1>Profile</h1>

            <div className="profile-card">
                <div className="profile-avatar">
                    <span>JD</span>
                </div>

                <div className="profile-section">
                    <h2>Identity</h2>
                    <p><strong>Name:</strong> {patientProfile.name}</p>
                    <p><strong>Email:</strong> {patientProfile.email}</p>
                    <p><strong>Member Since:</strong> {patientProfile.memberSince}</p>
                </div>

                <div className="profile-section">
                    <h2>Personal Information</h2>
                    <p><strong>Date of Birth:</strong> {patientProfile.dateOfBirth}</p>
                    <p><strong>Age:</strong> {patientProfile.age}</p>
                </div>

                <div className="profile-section">
                    <h2>Care Information</h2>
                    <p><strong>Assigned Therapist:</strong> {patientProfile.therapist}</p>
                    <p><strong>Program:</strong> {patientProfile.program}</p>
                </div>

                <div className="profile-section">
                    <h2>Account Details</h2>
                    <p><strong>Primary Device:</strong> {patientProfile.device}</p>
                    <p><strong>Last Active:</strong> {patientProfile.lastActive}</p>
                </div>

                <button className="profile-btn" disabled>
                    Edit Profile (Coming Soon)
                </button>
                <button className="delete-profile-btn" disabled>
                    Delete Profile (Coming Soon)
                </button>
            </div>
        </div>
    );
}
