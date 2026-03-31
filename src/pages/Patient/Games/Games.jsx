import { useNavigate, useLocation } from "react-router-dom";
import "./Games.css";
import { withMode } from "../../../utils/utils";

import GamesList from "../../../components/GamesList";
import { games } from "../../../data/games";

export default function PatientGames() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    return (
        <div className="games-container">
            <h1>Games</h1>

            <GamesList
                games={games}
                onGameClick={(game) =>
                    navigate(
                        withMode(`/patient/games/${game.id}`, mode)
                    )
                }
            />
        </div>
    );
}