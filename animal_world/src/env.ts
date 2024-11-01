import { Player } from "./player";

export interface Event {
    name: string;
    info: string;
    species: string[];
    solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => void;
}

export interface Env {
    name: string;
    info: string;
    species: string[];
    events: Event[];
}

const envMap: { [key: string]: Env } = {};

envMap["池塘"] = {
    name: "池塘",
    info: "这是一个池塘",
    species: ["黑鱼", "白鱼", "乌龟"],
    events: [
        {
            name: "鱼咬了乌龟",
            info: "鱼咬了乌龟",
            species: ["黑鱼", "白鱼"],
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const fish = players[0];
                const turtle = players[1];

                seal.replyToSender(ctx, msg, `${fish.name}咬了${turtle.name}`);
            }
        }
    ]
}

export { envMap };