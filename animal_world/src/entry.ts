//这里是词条的定义

import { Player } from "./player";

export interface Entry {
    name: string;
    info: string;
    solve: (player: Player) => void;//获取词条后发生的变化
}

/** 这是不放回抽取 */
export function getEntries(n: number, name: string = ''): Entry[] {
    const entries = Object.keys(entryMap);
    const result = [];

    for (let i = 0; i < n; i++) {
        if (entries.includes(name)) {
            result.push(entryMap[name])
        } else {
            const index = Math.floor(Math.random() * entries.length);
            const name = entries[index];

            result.push(entryMap[name]);

            entries.splice(index, 1);
        }
    }

    return result;
}

export function addEntries(player: Player, entries: Entry[]): void {
    entries.forEach(entry => {
        player.entries.push(entry.name);
        entry.solve(player);
    })
}

const entryMap: { [key: string]: Entry } = {};

entryMap["『坚韧』"] = {
    name: "『坚韧』",
    info: "防御值提高10！",
    solve: (player: Player) => {
        player.animal.attr.def += 10;
    }
}

entryMap["『迅捷』"] = {
    name: "『迅捷』",
    info: "敏捷值提高10！",
    solve: (player: Player) => {
        player.animal.attr.dex += 10;
    }
}

entryMap["『胖胖』"] = {
    name: "『胖胖』",
    info: "生命值提高10！",
    solve: (player: Player) => {
        player.animal.attr.hp += 10;
    }
}

entryMap["『莫名其妙』"] = {
    name: "『莫名其妙』",
    info: "幸运值提高10！",
    solve: (player: Player) => {
        player.animal.attr.lck += 10;
    }
}

export { entryMap };