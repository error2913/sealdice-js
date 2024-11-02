// 这里是不同动物的各种属性

export interface Animal {
    species: string;
    info: string;
    env: string;
    evolve: string;
    enemy: string[];//敌人和食物，用于在遭遇的时候判断
    food: string[];
    events: {
        active: string[],
        passive: string[]
    }
    attr: {
        hp: number;
        atk: number;
        def: number;
        dex: number;
        lck: number;
    }
}

export function getAnimal(species: string = ''): Animal {
    if (!animalMap.hasOwnProperty(species)) {
        const animals = Object.keys(animalMap);
        species = animals[Math.floor(Math.random() * animals.length)];
    }

    return JSON.parse(JSON.stringify(animalMap[species]));
}

const animalMap: { [key: string]: Animal } = {};

animalMap["黑鱼"] = {
    species: "黑鱼",
    info: "可怕的黑鱼",
    env: "池塘",
    evolve: "白鱼",
    enemy: ["白鱼"],
    food: ["黑鱼", "乌龟"],
    events: {
        active: ["咬乌龟"],
        passive: ["死掉"]
    },
    attr: {
        hp: 10,
        atk: 100,
        def: 10,
        dex: 100,
        lck: 1,
    }
}

animalMap["白鱼"] = {
    species: "白鱼",
    info: "可怕的白鱼",
    env: "池塘",
    evolve: "",
    enemy: ["黑鱼"],
    food: ["黑鱼", "乌龟", "水草"],
    events: {
        active: ["咬乌龟", "吃草"],
        passive: ["死掉"]
    },
    attr: {
        hp: 100,
        atk: 50,
        def: 10,
        dex: 60,
        lck: 50,
    }
}

animalMap["乌龟"] = {
    species: "乌龟",
    info: "可怕的乌龟",
    env: "池塘",
    evolve: "",
    enemy: ["黑鱼", "白鱼"],
    food: ["水草"],
    events: {
        active: ["吃草"],
        passive: ["死掉"]

    },
    attr: {
        hp: 100,
        atk: 1,
        def: 100,
        dex: 1,
        lck: 1,
    }
}

export { animalMap };