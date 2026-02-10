import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export function useProfile(user) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        async function loadProfile() {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (!error) setProfile(data);
            setLoading(false);
        }

        loadProfile();
    }, [user]);

    return { profile, loading };
}
