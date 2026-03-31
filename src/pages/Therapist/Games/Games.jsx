import { useNavigate, useParams, useLocation } from "react-router-dom";
import { withMode } from "../../../utils/utils";
import GamesList from "../../../components/GamesList";
import { games } from "../../../data/games";

export default function TherapistGames() {
    const navigate = useNavigate();
    const { patientId } = useParams();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    return (
        <div className="games-container">
            <h1>Select a Game</h1>

            <GamesList
                games={games}
                onGameClick={(game) =>
                    navigate(
                        withMode(
                            `/therapist/patients/${patientId}/games/${game.id}`,
                            mode
                        )
                    )
                }
            />
        </div>
    );
}