import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Auth.css";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
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
            navigate("/therapist");
        } else {
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
