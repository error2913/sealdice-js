//这里是环境和环境内的定义

import { animalMap } from "./animal";
import { Player } from "./player";

export interface Event {
    name: string;
    info: string;
    species: string[];
    active: boolean;
    solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => void;
}

export interface Env {
    name: string;
    info: string;
    species: string[];
    events: {[key: string]: Event};
}

const envMap: { [key: string]: Env } = {};

envMap["池塘"] = {
    name: "池塘",
    info: "这是一个池塘",
    species: ["黑鱼", "白鱼", "乌龟"],
    events: {
        "吃草": {
            name: "吃草",
            info: "吃掉水草",
            species: ["白鱼", "乌龟"],
            active: true,
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const player = players[0];
                const animal = animalMap[player.animal.species];
                if (!animal.food.includes("水草")) {
                    seal.replyToSender(ctx, msg, `${player.name}不吃水草`);
                    return;
                }

                seal.replyToSender(ctx, msg, `${player.name}吃草`);
            }
        },
        "鱼咬龟": {
            name: "鱼咬龟",
            info: "鱼咬了乌龟",
            species: ["黑鱼", "白鱼"],
            active: true,
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const fish = players[0];
                const turtle = players[1];

                seal.replyToSender(ctx, msg, `${fish.name}咬了${turtle.name}`);
            }
        }
    }
}

export { envMap };