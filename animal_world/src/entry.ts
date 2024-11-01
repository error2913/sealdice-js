import { Player } from "./player";

export interface Entry {
    name: string;
    info: string;
    solve: (player: Player) => void;
}

const entryMap: { [key: string]: Entry } = {};

entryMap["坚韧"] = {
    name: "坚韧",
    info: "生命值提高100！",
    solve: (player: Player) => {
        player.animal.attr.hp += 100;
    }
}

export { entryMap };