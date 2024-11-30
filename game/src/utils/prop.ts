import { Game } from "../game";
import { Player } from "./player";

export class Prop {
    name: string;
    desc: string;
    type: string;
    reply: string;
    solve: (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, player: Player, count: number, game?: Game) => void;

    constructor() {
        this.name = '';
        this.desc = '';
        this.type = '';
        this.reply = '';
        this.solve = (_, __, ___, ____, _____, ______) => {
            return;
        }
    }
}