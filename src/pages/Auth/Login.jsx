import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Auth.css";

export default function Login() {
    const navigate = useNavigate();
    const storedEmail = localStorage.getItem("invited_email") || "";
    const [email, setEmail] = useState(storedEmail);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanedEmail = email.trim().toLowerCase();

        if (!cleanedEmail || !password) {
            alert("Please enter email and password");
            return;
        }

        setLoading(true);

        // 1. Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanedEmail,
            password,
        });

        if (error) {
            // alert(error.message);
            alert("Invalid email or password");
            setLoading(false);
            return;
        }

        const user = data.user;

        await supabase
            .from("profiles")
            .update({ last_active: new Date().toISOString() })
            .eq("id", user.id);

        // 2. Auto-link therapist if invite exists
        const { data: invite } = await supabase
            .from("therapist_invites")
            .select("*")
            .eq("patient_email", cleanedEmail)
            .eq("status", "pending")
            .maybeSingle();

        if (invite) {
            // Check if patient already has a therapist
            const { data: existing } = await supabase
                .from("therapist_patients")
                .select("*")
                .eq("patient_id", user.id)
                .maybeSingle();

            if (!existing) {
                // Create relationship
                await supabase.from("therapist_patients").insert({
                    therapist_id: invite.therapist_id,
                    patient_id: user.id
                });

                // Mark invite accepted
                await supabase
                    .from("therapist_invites")
                    .update({ status: "accepted" })
                    .eq("id", invite.id);

                alert("You’ve been connected to your therapist!");
            } else {
                console.log("Patient already linked — skipping invite");
            }
        }

        // 2. Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError) {
            alert("Could not load profile");
            setLoading(false);
            return;
        }

        // 3. Redirect based on role
        if (profile.role === "therapist") {
            localStorage.removeItem("invited_email");
            navigate("/therapist");
        } else {
            localStorage.removeItem("invited_email");
            navigate("/patient");
        }

        setLoading(false);
    };


    return (
        <div className="auth-page">
            <div className="auth-box">
                <h1>Log into your account</h1>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>Email:</label>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!!storedEmail}
                            required
                        />
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

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <span onClick={() => navigate("/signup")} className="link-text">
                        Sign up here
                    </span>
                </p>
            </div>
        </div>
    );
}
