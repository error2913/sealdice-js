//这里是环境和环境内事件的定义

import { getEntries, addEntries } from "./entry";
import { Player } from "./player";
import { AHurtB, BEscapeFromA } from "./utils";

export interface Event {
    name: string;
    info: string;
    solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => void;//事件的具体实现
}

export interface Env {
    name: string;
    info: string;
    species: string[];//该环境内包含的物种，暂时没有用，跨环境事件可能用得到。
    events: {[key: string]: Event};//该环境内能触发的事件
}

const envMap: { [key: string]: Env } = {};

envMap["池塘"] = {
    name: "池塘",
    info: "这是一个池塘",
    species: ["黑鱼", "白鱼", "乌龟"],
    events: {
        "殴打水草": {
            name: "殴打水草",
            info: "和水草战斗",
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const player = players[0];

                if (Math.random() < 0.5) {
                    player.animal.attr.hp -= 1;

                    seal.replyToSender(ctx, msg, `${player.animal.species}<${player.name}>被水草缠住了，HP-1`);
                    return;
                }

                const entry = getEntries(1);
                addEntries(player, entry);

                seal.replyToSender(ctx, msg, `${player.animal.species}<${player.name}>战胜了水草，新的词条：${entry[0].name}`);
            }
        },
        "殴打乌龟": {
            name: "殴打乌龟",
            info: "咬乌龟！",
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const player = players[0];
                const turtle = Player.getRandomPlayer(["乌龟"]);

                //尝试逃跑
                if (BEscapeFromA(player, turtle)) {
                    seal.replyToSender(ctx, msg, `${turtle.animal.species}<${turtle.name}>逃跑了`);
                    return;
                }

                const [damage, crit] = AHurtB(player, turtle);

                let text = `${player.animal.species}<${player.name}>殴打了乌龟<${turtle.name}>，${crit ? `暴击了，` : ``}打掉了${damage}血`

                //吃掉
                if (turtle.animal.attr.hp <= 0) {
                    const entry = getEntries(1);
                    addEntries(player, entry);

                    seal.replyToSender(ctx, msg, text + `\n${player.animal.species}<${player.name}>打爆了<${turtle.name}>，新的词条：${entry[0].name}`);
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
        },
        "光合作用": {
            name: "光合作用",
            info: "光合作用",
            solve: (ctx: seal.MsgContext, msg: seal.Message, players: Player[]) => {
                const player = players[0];

                player.animal.attr.hp += 1;

                seal.replyToSender(ctx, msg, `${player.animal.species}<${player.name}>进行光合作用，HP+1`);
            }
        }
    }
}

export { envMap };