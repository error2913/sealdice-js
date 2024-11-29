import { Game } from "../game";
import { Player } from "./player";

export class Prop {
    name: string;
    desc: string;
    type: string;
    gameKey: string;
    reply: string;
    solve: (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, player: Player, game: Game) => void

    constructor(gk: string) {
        this.name = '';
        this.desc = '';
        this.type = '';
        this.gameKey = gk;
        this.reply = '';
        this.solve = (_, __, ___, ____, _____) => {
            return;
        }
    }

    static parse(data: any, gk: string): Prop {
        const prop = new Prop(gk);

        prop.name = data.name || '';
        prop.desc = data.desc || '';
        prop.type = data.type || '';
        prop.reply = data.reply || '';

        return prop;
    }
}