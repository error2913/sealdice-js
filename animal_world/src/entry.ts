//这里是词条的定义

import { Player } from "./player";

export interface Entry {
    name: string;
    info: string;
    solve: (player: Player) => void;//获取词条后发生的变化
}

export function getEntries(player: Player, n: number): void {
    const entries = Object.keys(entryMap);

    for (let i = 0; i < n && i < entries.length; i++) {
        const index = Math.floor(Math.random() * entries.length);

        player.entries.push(entries[index]);
        entryMap[entries[index]].solve(player);

        entries.splice(index, 1);
    }
}

const entryMap: { [key: string]: Entry } = {};

entryMap["『坚韧』"] = {
    name: "坚韧",
    info: "防御值提高10！",
    solve: (player: Player) => {
        player.animal.attr.def += 10;
    }
}

entryMap["『迅捷』"] = {
    name: "不坚韧",
    info: "敏捷值提高10！",
    solve: (player: Player) => {
        player.animal.attr.dex += 10;
    }
}

entryMap["『胖胖』"] = {
    name: "胖胖！胖胖！",
    info: "生命值提高10！",
    solve: (player: Player) => {
        player.animal.attr.hp += 10;
    }
}

entryMap["『莫名其妙』"] = {
    name: "啥也不是",
    info: "幸运值提高10！",
    solve: (player: Player) => {
        player.animal.attr.lck += 10;
    }
}

export { entryMap };