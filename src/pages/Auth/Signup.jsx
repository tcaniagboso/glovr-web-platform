import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Auth.css";

export default function Signup() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanedEmail = email.trim().toLowerCase();
        const cleanedFirstName = firstName.trim();
        const cleanedMiddleName = middleName.trim() || null;
        const cleanedLastName = lastName.trim();

        if (!cleanedEmail || !cleanedFirstName || !cleanedLastName) {
            alert("Please fill in all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (!role) {
            alert("Please select a role");
            return;
        }

        setLoading(true);

        // 1. Create auth user
        const { data, error } = await supabase.auth.signUp({
            email: cleanedEmail,
            password,
        });

        if (error) {
            if (error.message.toLowerCase().includes("already")) {
                alert("An account with this email already exists.");
            } else {
                alert(error.message);
            }
            setLoading(false);
            return;
        }

        if (data?.user && !data.session) {
            alert("We sent a verification email. Please check your inbox and spam.");
            setLoading(false);
            return;
        }

        const user = data.user;

        // 2. Create profile
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                id: user.id,
                email: cleanedEmail,
                first_name: cleanedFirstName,
                middle_name: cleanedMiddleName,
                last_name: cleanedLastName,
                role,
            });

        if (profileError) {
            alert(profileError.message);
            setLoading(false);
            return;
        }

        // 3. Redirect
        navigate(role === "therapist" ? "/therapist" : "/patient");

        setLoading(false);
    };


    return (
        <div className="auth-page">
            <div className="auth-box">
                <h1>Create your account</h1>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>First Name:</label>
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label>Middle Name or Initial:</label>
                        <input
                            type="text"
                            placeholder="Middle Name or Initial"
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label>Email:</label>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label>Role:</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select your role
                            </option>
                            <option value="patient">Patient</option>
                            <option value="therapist">Therapist</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <label>Password:</label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label>Confirm Password:</label>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <span onClick={() => navigate("/login")} className="link-text">
                        Log in here
                    </span>
                </p>
            </div>
        </div>
    );
}
