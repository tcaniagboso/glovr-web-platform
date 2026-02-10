import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export function useSession() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial load
        supabase.auth.getSession().then(({ data }) => {
            console.log("Initial session:", data.session);
            setUser(data.session?.user ?? null);
            setLoading(false);
        });

        // Listen for login/logout
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("Auth changed:", session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return {
        user,
        loading,
        isAuthenticated: !!user,
    };
}
