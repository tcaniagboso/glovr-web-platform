import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Auth.css";

export default function Signup() {
    const navigate = useNavigate();
    const [role, setRole] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Account creation coming soon. Redirecting to demo...");

        if (role === "therapist") navigate("/therapist?mode=demo");
        else navigate("/patient?mode=demo");
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h1>Create your account</h1>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>First Name:</label>
                        <input type="text" placeholder="First Name" required />
                    </div>

                    <div className="form-row">
                        <label>Middle Name or Initial:</label>
                        <input type="text" placeholder="Middle Name or Initial" />
                    </div>

                    <div className="form-row">
                        <label>Last Name:</label>
                        <input type="text" placeholder="Last Name" required />
                    </div>

                    <div className="form-row">
                        <label>Email:</label>
                        <input type="email" placeholder="Email" required />
                    </div>

                    <div className="form-row">
                        <label>Role:</label>
                        <select required>
                            <option value="" disabled>
                                Select your role
                            </option>
                            <option value="patient">Patient</option>
                            <option value="therapist">Therapist</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <label>Password:</label>
                        <input type="password" placeholder="Password" required />
                    </div>

                    <div className="form-row">
                        <label>Confirm Password:</label>
                        <input type="password" placeholder="Confirm Password" required />
                    </div>

                    <button type="submit">Create Account</button>
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
