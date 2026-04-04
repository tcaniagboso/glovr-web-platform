import pinchImg from "../assets/games/pinch.png";
import grabImg from "../assets/games/grab.png";
import wristImg from "../assets/games/wrist.png";
import freeRoamImg from "../assets/games/freeRoam.png";

export const games = [
    {
        id: "free-roam",
        name: "Free Roam",
        description: "Explore hand movement freely without guided tasks",
        image: freeRoamImg,
    },
    {
        id: "pinch-control",
        name: "Pinch Control",
        description: "Improve fine motor pinch strength",
        image: pinchImg,
    },
    {
        id: "grab-control",
        name: "Grab Control",
        description: "Develop grip strength and control",
        image: grabImg,
    },
    {
        id: "wrist-flexion-extension",
        name: "Wrist Flexion & Extension",
        description: "Improve wrist range of motion",
        image: wristImg,
    },
];