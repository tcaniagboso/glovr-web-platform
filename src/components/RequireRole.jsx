import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../utils/auth/useSession";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function RequireRole({ role, children }) {
    const { user, loading } = useSession();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    const [profileRole, setProfileRole] = useState(null);
    const [checkingRole, setCheckingRole] = useState(true);

    // Demo & guest bypass
    if (mode === "demo" || mode === "guest") return children;

    useEffect(() => {
        if (!user) return;

        async function fetchRole() {
            const { data, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (!error) setProfileRole(data.role);

            setCheckingRole(false);
        }

        fetchRole();
    }, [user]);

    // Wait until auth + role are fully resolved
    if (loading || checkingRole) return <p>Loading...</p>;

    if (!user) return <Navigate to="/" replace />;

    if (profileRole !== role) return <Navigate to="/" replace />;

    return children;
}
