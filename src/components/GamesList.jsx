export default function GamesList({ games, onGameClick }) {
    return (
        <div className="card-list">
            {games.map((game) => (
                <div
                    key={game.id}
                    className="card"
                    onClick={() => onGameClick(game)}
                >
                    <div className="game-image">
                        <img
                            src={game.image}
                            alt={game.name}
                            onError={(e) => {
                                e.target.style.display = "none";
                            }}
                        />
                    </div>
                    <h2>{game.name}</h2>
                    <p>{game.description}</p>
                </div>
            ))}
        </div>
    );
}