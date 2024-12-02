import { Game } from "../game/game";
import { Player } from "../player/player";

export class Prop {
    name: string;
    desc: string;
    type: string;
    reply: string;
    solve: (
        ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs,
        game: Game, player: Player, count: number
    ) => void;

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