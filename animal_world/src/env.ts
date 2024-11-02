//这里是环境和环境内的定义

import { Player } from "./player";

export interface Event {
    name: string;
    info: string;
    solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => void;
}

export interface Env {
    name: string;
    info: string;
    species: string[];//该环境内包含的物种
    events: {[key: string]: Event};//该环境内能触发的事件
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
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const player = players[0];

                player.score += 1;

                seal.replyToSender(ctx, msg, `${player.name}吃草，得了1分`);
            }
        },
        "咬乌龟": {
            name: "鱼咬龟",
            info: "鱼咬了乌龟",
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const fish = players[0];
                const turtle = Player.getRandomPlayer("乌龟");

                //尝试逃跑
                if (turtle.animal.attr.dex * Math.random() > fish.animal.attr.dex * Math.random()) {
                    seal.replyToSender(ctx, msg, `${turtle.name}逃跑了`);
                    return;
                }

                const damage = fish.animal.attr.atk - turtle.animal.attr.def > 0? fish.animal.attr.atk - turtle.animal.attr.def : 0;

                turtle.animal.attr.hp -= damage;

                //吃掉
                if (turtle.animal.attr.hp <= 0) {
                    seal.replyToSender(ctx, msg, `${fish.name}吃掉了${turtle.name}`);
                    turtle.revive();
                    return;
                }

                seal.replyToSender(ctx, msg, `${fish.name}咬了${turtle.name}，${turtle.name}掉了${fish.animal.attr.atk - turtle.animal.attr.def}血`);
            }
        },
        "死掉": {
            name: "死掉",
            info: "死了",
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const player = players[0];

                player.score -= 1;
                player.revive();

                seal.replyToSender(ctx, msg, `${player.name}死了，扣了1分。转生成了新的动物: ${player.animal.species}`);
            }
        }
    }
}

export { envMap };