import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Login system coming soon. Redirecting to demo...");
        navigate("/demo"); // or demo route
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h1>Log into your account</h1>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>Email:</label>
                        <input type="email" placeholder="Email" required />
                    </div>
                    <div className="form-row">
                        <label>Password:</label>
                        <input type="password" placeholder="Password" required />
                    </div>

                    <button type="submit">Log In</button>
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
