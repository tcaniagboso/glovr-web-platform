import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
    const navigate = useNavigate();
    // const location = useLocation();

    useEffect(() => {
        const fullUrl = window.location.href;

        // console.log("FULL URL:", fullUrl);

        const url = new URL(fullUrl);
        const email = url.searchParams.get("email");

        // console.log("Extracted email:", email);

        if (email) {
            localStorage.setItem("invited_email", email.toLowerCase());
        }
    }, []);

    return (
        <div className="landing-container">
            <h1 className="title">GLOVR</h1>
            <p className="subtitle">
                A Virtual Reality Hand Rehabilitation System
            </p>

            <div className="button-group">
                <button onClick={() => navigate("/login")}>
                    Log into your account
                </button>
                <button onClick={() => navigate("/signup")}>
                    Create an account
                </button>
                <button onClick={() => navigate("/guest")}>
                    Continue as Guest
                </button>
            </div>

            <div className="demo-top">
                <button onClick={() => navigate("/demo")}>
                    Demo the Website
                </button>
            </div>
        </div>
    );
}
