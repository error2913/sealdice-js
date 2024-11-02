//这里是环境和环境内的定义

import { getEntries, addEntries } from "./entry";
import { Player } from "./player";
import { AHurtB } from "./utils";

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

                const entry = getEntries(1);
                addEntries(player, entry);

                seal.replyToSender(ctx, msg, `<${player.name}>吃掉了水草，新的词条：${entry[0].name}`);
            }
        },
        "咬乌龟": {
            name: "鱼咬龟",
            info: "鱼咬了乌龟",
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const fish = players[0];
                const turtle = Player.getRandomPlayer(["乌龟"]);

                //尝试逃跑
                if (turtle.animal.attr.dex * Math.random() > fish.animal.attr.dex * Math.random()) {
                    seal.replyToSender(ctx, msg, `<${turtle.name}>逃跑了`);
                    return;
                }

                const [damage, crit] = AHurtB(fish, turtle);

                let text = `<${fish.name}>咬了<${turtle.name}>，${crit ? `暴击了，` : ``}咬掉了${damage}血`

                //吃掉
                if (turtle.animal.attr.hp <= 0) {
                    const entry = getEntries(1);
                    addEntries(fish, entry);

                    seal.replyToSender(ctx, msg, text + `\n<${fish.name}>吃掉了<${turtle.name}>，新的词条：${entry[0].name}`);
                    turtle.revive();
                    return;
                }

                seal.replyToSender(ctx, msg, text);
            }
        },
        "死掉": {
            name: "死掉",
            info: "死了",
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const player = players[0];

                player.revive();

                seal.replyToSender(ctx, msg, `<${player.name}>死了。转生成了新的动物: ${player.animal.species}`);
            }
        }
    }
}

export { envMap };