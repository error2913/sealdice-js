// 这里是不同动物的各种属性

export interface Animal {
    species: string;
    info: string;
    env: string;
    evolve: string;
    age: [number, number];//当前年龄和最大年龄
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
    age: [0, 10],
    enemy: ["白鱼", "大鱼", "鱼鹰"],
    food: ["乌龟", "小鱼", "蝌蚪"],
    events: {
        active: ["殴打乌龟"],
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
    age: [0, 20],
    enemy: ["黑鱼", "大鱼", "鱼鹰"],
    food: ["乌龟", "水草", "小鱼"],
    events: {
        active: ["殴打乌龟", "殴打水草"],
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
    age: [0, 100],
    enemy: ["黑鱼", "白鱼", "蛇", "鱼鹰"],
    food: ["水草"],
    events: {
        active: [],
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

animalMap["浮游植物"] = {
    species: "浮游植物",
    info: "池塘中的微小植物，提供氧气和养分",
    env: "池塘",
    evolve: "",
    age: [0, 2],
    enemy: ["浮游动物", "小鱼", "水虿", "蝌蚪"],
    food: [],
    events: {
        active: ["光合作用"],
        passive: ["死掉"]
    },
    attr: {
        hp: 1,
        atk: 0,
        def: 0,
        dex: 0,
        lck: 50,
    }
}

animalMap["浮游动物"] = {
    species: "浮游动物",
    info: "以浮游植物为食的微小动物，是许多池塘生物的食物",
    env: "池塘",
    evolve: "",
    age: [0, 2],
    enemy: ["小鱼", "水虿", "青蛙"],
    food: ["浮游植物"],
    events: {
        active: [],
        passive: ["死掉"]
    },
    attr: {
        hp: 2,
        atk: 1,
        def: 1,
        dex: 10,
        lck: 20,
    }
}

animalMap["水虿"] = {
    species: "水虿",
    info: "蜻蜓的幼虫，水中的小型捕食者",
    env: "池塘",
    evolve: "蜻蜓",
    age: [0, 5],
    enemy: ["青蛙", "鱼类", "蛇"],
    food: ["浮游动物", "蚊子幼虫", "蝌蚪"],
    events: {
        active: [],
        passive: ["死掉"]
    },
    attr: {
        hp: 10,
        atk: 5,
        def: 5,
        dex: 40,
        lck: 15,
    }
}

animalMap["小鱼"] = {
    species: "小鱼",
    info: "普普通通小小鱼",
    env: "池塘",
    evolve: "大鱼",
    age: [0, 7],
    enemy: ["青蛙", "鸟", "蛇", "鱼鹰"],
    food: ["浮游动物", "水虿", "蚊子幼虫", "蝌蚪"],
    events: {
        active: ["殴打乌龟", "殴打水草"],
        passive: ["死掉"]
    },
    attr: {
        hp: 15,
        atk: 5,
        def: 5,
        dex: 25,
        lck: 10,
    }
}

animalMap["蝌蚪"] = {
    species: "蝌蚪",
    info: "青蛙的幼体，水中的小型动物",
    env: "池塘",
    evolve: "青蛙",
    age: [0, 2],
    enemy: ["小鱼", "水虿"],
    food: ["浮游植物"],
    events: {
        active: ["殴打水草"],
        passive: ["死掉"]
    },
    attr: {
        hp: 5,
        atk: 1,
        def: 2,
        dex: 20,
        lck: 15,
    }
}

animalMap["青蛙"] = {
    species: "青蛙",
    info: "池塘中的捕食者，吃昆虫和小鱼",
    env: "池塘",
    evolve: "",
    age: [0, 6],
    enemy: ["鸟", "蛇", "鱼鹰"],
    food: ["浮游动物", "蚊子幼虫", "小鱼", "水虿"],
    events: {
        active: ["殴打乌龟", "殴打水草"],
        passive: ["死掉"]
    },
    attr: {
        hp: 30,
        atk: 10,
        def: 10,
        dex: 40,
        lck: 15,
    }
}

animalMap["鸭子"] = {
    species: "鸭子",
    info: "池塘中的鸟类，喜欢吃水草和小鱼",
    env: "池塘",
    evolve: "",
    age: [0, 10],
    enemy: ["蛇"],
    food: ["水草", "小鱼", "浮游动物"],
    events: {
        active: ["殴打乌龟"],
        passive: ["死掉"]
    },
    attr: {
        hp: 50,
        atk: 15,
        def: 20,
        dex: 30,
        lck: 25,
    }
}

animalMap["蛇"] = {
    species: "蛇",
    info: "池塘中的顶级捕食者，捕食青蛙和小型动物",
    env: "池塘",
    evolve: "",
    age: [0, 12],
    enemy: ["鸟", "大型鱼类", "鱼鹰"],
    food: ["青蛙", "小鱼", "乌龟", "鸭子"],
    events: {
        active: ["殴打乌龟"],
        passive: ["死掉"]
    },
    attr: {
        hp: 60,
        atk: 30,
        def: 20,
        dex: 45,
        lck: 10,
    }
}

animalMap["水草"] = {
    species: "水草",
    info: "水中的植物，提供食物和庇护",
    env: "池塘",
    evolve: "",
    age: [0, 3],
    enemy: ["乌龟", "鸭子", "鱼类"],
    food: [],
    events: {
        active: ["光合作用"],
        passive: ["死掉"]
    },
    attr: {
        hp: 20,
        atk: 0,
        def: 10,
        dex: 0,
        lck: 40,
    }
}

animalMap["蚊子幼虫"] = {
    species: "蚊子幼虫",
    info: "生活在水中的小型昆虫幼体",
    env: "池塘",
    evolve: "蚊子",
    age: [0, 1],
    enemy: ["小鱼", "水虿", "青蛙"],
    food: ["浮游植物"],
    events: {
        active: [],
        passive: ["死掉"]
    },
    attr: {
        hp: 2,
        atk: 1,
        def: 1,
        dex: 5,
        lck: 5,
    }
}

animalMap["蚊子"] = {
    species: "蚊子",
    info: "池塘上空的微小昆虫",
    env: "池塘",
    evolve: "",
    age: [0, 2],
    enemy: ["蜻蜓", "青蛙", "小鱼"],
    food: ["血"],
    events: {
        active: [],
        passive: ["死掉"]
    },
    attr: {
        hp: 1,
        atk: 1,
        def: 0,
        dex: 90,
        lck: 10,
    }
}

animalMap["小鸟"] = {
    species: "小鸟",
    info: "池塘周边的捕食者，捕捉青蛙、小鱼和蛇",
    env: "池塘",
    evolve: "",
    age: [0, 10],
    enemy: ["大型鱼类", "蛇"],
    food: ["青蛙", "蛇", "小鱼"],
    events: {
        active: ["殴打乌龟"],
        passive: ["死掉"]
    },
    attr: {
        hp: 40,
        atk: 25,
        def: 15,
        dex: 50,
        lck: 30,
    }
}

animalMap["鱼鹰"] = {
    species: "鱼鹰",
    info: "池塘上空的掠食者",
    env: "池塘上空",
    evolve: "",
    age: [0, 20],
    enemy: [],
    food: ["黑鱼", "白鱼", "小鱼", "蛇"],
    events: {
        active: ["殴打乌龟",],
        passive: ["死掉"]
    },
    attr: {
        hp: 100,
        atk: 80,
        def: 20,
        dex: 70,
        lck: 35,
    }
}

export { animalMap };