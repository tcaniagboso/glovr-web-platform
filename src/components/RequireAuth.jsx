import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../utils/auth/useSession";

export default function RequireAuth({ children }) {
    const { user, loading } = useSession();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    // Allow demo/guest always
    if (mode === "demo" || mode === "guest") return children;

    // Wait for session restore
    if (loading) return null;   // not loading UI, just pause routing

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
}
