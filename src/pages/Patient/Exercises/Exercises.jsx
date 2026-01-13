import { useNavigate } from "react-router-dom";
import "./Exercises.css";

const allExercises = [
    {
        id: "hand-grip",
        name: "Hand Grip Strength",
        description: "Improve overall grip strength and endurance",
    },
    {
        id: "pinch-control",
        name: "Pinch Control",
        description: "Enhance thumb and finger coordination",
    },
    {
        id: "wrist-flexion",
        name: "Wrist Flexion",
        description: "Increase wrist bending control and strength",
    },
    {
        id: "wrist-extension",
        name: "Wrist Extension",
        description: "Improve wrist extension range of motion",
    },
    {
        id: "finger-isolation",
        name: "Finger Isolation",
        description: "Train individual finger movement and accuracy",
    },
    {
        id: "hand-rotation",
        name: "Hand Rotation",
        description: "Develop rotational control of the wrist and forearm",
    },
];


const recommendedExercises = [allExercises[0], allExercises[2], allExercises[4]];
const recentExercises = [allExercises[0], allExercises[1]];

export default function Exercises() {
    const navigate = useNavigate();

    const renderExerciseCards = (exercises) =>
        exercises.map((exercise) => (
            <div
                key={exercise.id}
                className="card"
                onClick={() =>
                    navigate(`/patient/exercises/${exercise.id}`)
                }
            >
                <h2>{exercise.name}</h2>
                <p>{exercise.description}</p>
            </div>
        ));

    return (
        <div className="exercises-container">
            <h1>Exercises</h1>

            <section>
                <h2>Recommended for You</h2>
                <div className="card-list">
                    {renderExerciseCards(recommendedExercises)}
                </div>
            </section>

            <section>
                <h2>Recently Completed</h2>
                <div className="card-list">
                    {renderExerciseCards(recentExercises)}
                </div>
            </section>

            <section>
                <h2>All Exercises</h2>
                <div className="card-list">
                    {renderExerciseCards(allExercises)}
                </div>
            </section>
        </div>
    );
}
