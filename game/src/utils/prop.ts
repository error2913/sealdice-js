import { Game } from "../game";
import { Player } from "./player";

export class Prop {
    name: string;
    desc: string;
    type: string;
    reply: string;
    solve: (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, player: Player, game: Game) => void
    gameKey: string;

    constructor(gk: string) {
        this.name = '';
        this.desc = '';
        this.type = '';
        this.reply = '';
        this.solve = (_, __, ___, ____, _____) => {
            return;
        }
        this.gameKey = gk;
    }
}