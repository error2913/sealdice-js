import { cache } from ".";
import { Animal } from "./animal";
import { Player } from "./player";

export function getMsg(messageType: "group" | "private", senderId: string, groupId: string = ''): seal.Message {
    let msg = seal.newMessage();

    if (messageType == 'group') {
        msg.groupId = groupId;
        msg.guildId = '';
    }

    msg.messageType = messageType;
    msg.sender.userId = senderId;
    return msg;
}

export function getCtx(epId: string, msg: seal.Message): seal.MsgContext | undefined {
    const eps = seal.getEndPoints();

    for (let i = 0; i < eps.length; i++) {
        if (eps[i].userId === epId) {
            return seal.createTempCtx(eps[i], msg);
        }
    }

    return undefined;
}

export function parseAnimal(data: any): Animal {
    let animal: Animal;

    try {
        animal = {
            species: data.species,
            info: data.info,
            env: data.env,
            evolve: data.evolve,
            enemy: data.enemy,
            food: data.food,
            events: {
                active: data.events.active,
                passive: data.events.passive
            },
            attr: {
                hp: data.attr.hp,
                atk: data.attr.atk,
                def: data.attr.def,
                dex: data.attr.dex,
                lck: data.attr.lck,
            }
        }
    } catch (err) {
        console.error(`解析动物失败:`, err);
        animal = {
            species: "未知物种",
            info: "未知",
            env: "未知环境",
            evolve: "",
            enemy: [],
            food: [],
            events: {
                active: [],
                passive: []
            },
            attr: {
                hp: 0,
                atk: 0,
                def: 0,
                dex: 0,
                lck: 0,
            }
        }
    }

    return animal;
}

export function getScoreChart(): Player[] {
    const scoreChart = Object.values(cache);

    scoreChart.sort((a, b) => b.score - a.score);

    scoreChart.splice(10);

    return scoreChart;
}

export function AHurtB(playerA: Player, playerB: Player): [number, boolean] {
    const [lck1, lck2] = [playerA.animal.attr.lck, playerB.animal.attr.lck];

    let crit = false;
    let rate = 0;
    if (lck1 * Math.random() > lck2 * Math.random()) {
        crit = true;
        rate = lck1 / (lck1 + lck2);
    }

    const baseDamage = playerA.animal.attr.atk - playerB.animal.attr.def > 0 ? playerA.animal.attr.atk - playerB.animal.attr.def : 1;
    const damage = Math.floor(baseDamage * (1 + rate));

    playerB.animal.attr.hp -= damage;

    return [damage, crit];
}