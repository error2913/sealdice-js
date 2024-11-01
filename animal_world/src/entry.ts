import { Player } from "./player";

export interface Entry {
    name: string;
    info: string;
    solve: (player: Player) => void;
}

const entryMap: { [key: string]: Entry } = {};

entryMap["坚韧"] = {
    name: "坚韧",
    info: "防御值提高10！",
    solve: (player: Player) => {
        player.animal.attr.def += 10;
    }
}

entryMap["迅捷"] = {
    name: "不是坚韧",
    info: "敏捷值提高10！",
    solve: (player: Player) => {
        player.animal.attr.dex += 10;
    }
}

entryMap["莫名其妙"] = {
    name: "啥也不是",
    info: "幸运值提高10！",
    solve: (player: Player) => {
        player.animal.attr.lck += 10;
    }
}

export { entryMap };