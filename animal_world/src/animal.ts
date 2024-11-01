export interface Animal {
    species: string;
    info: string;
    env: string;
    enemy: string[];
    food: string[];
    events: string[];
    attr: {
        hp: number;
        atk: number;
        def: number;
        dex: number;
        lck: number;
    }
}

const animalMap: { [key: string]: Animal } = {};

animalMap["黑鱼"] = {
    species: "黑鱼",
    info: "",
    enemy: [""],
    food: [""],
    events: [""],
    env: "forest",
    attr: {
        hp: 100,
        atk: 100,
        def: 100,
        dex: 100,
        lck: 100,
    }
}

export { animalMap };