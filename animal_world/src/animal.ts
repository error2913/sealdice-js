// 这里是不同动物的各种属性

export interface Animal {
    species: string;
    info: string;
    env: string;
    enemy: string[];
    food: string[];
    events: string[];//这是被动事件
    entrys: string[];
    attr: {
        hp: number;
        atk: number;
        def: number;
        dex: number;
        lck: number;
    }
}

export function getAnimal(): Animal {
    return animalMap[Object.keys(animalMap)[Math.floor(Math.random() * Object.keys(animalMap).length)]];
}

const animalMap: { [key: string]: Animal } = {};

animalMap["黑鱼"] = {
    species: "黑鱼",
    info: "可怕的黑鱼",
    env: "池塘",
    enemy: ["白鱼"],
    food: ["黑鱼", "乌龟", "水草"],
    events: [],
    entrys: [],
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
    enemy: ["黑鱼"],
    food: ["黑鱼", "乌龟", "水草"],
    events: [],
    entrys: [],
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
    enemy: ["黑鱼", "白鱼"],
    food: ["水草"],
    events: [],
    entrys: [],
    attr: {
        hp: 100,
        atk: 1,
        def: 100,
        dex: 1,
        lck: 1,
    }
}

export { animalMap };