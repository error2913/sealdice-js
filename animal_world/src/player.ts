//这里是一个玩家类，用于存储玩家的信息和行为

import { Animal, getAnimal } from "./animal";
import { getEntries } from "./entry";
import { envMap } from "./env";

const cache: { [key: string]: Player } = {};

export class Player {
    public id: string;
    public name: string;
    public animal: Animal;
    public exp: number;
    public level: number;
    public score: number;
    public credits: number;
    public entries: string[];

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.animal = {
            species: "",
            info: "",
            env: "",
            enemy: [],
            food: [],
            events: [],
            attr: {
                hp: 0,
                atk: 0,
                def: 0,
                dex: 0,
                lck: 0,
            }
        };
        this.exp = 0;
        this.level = 1;
        this.score = 0;
        this.credits = 0;
        this.entries = [];
    }

    public static getData(ext: seal.ExtInfo, ctx: seal.MsgContext): Player {
        const id = ctx.player.userId;

        if (!cache.hasOwnProperty(id)) {
            let data = {};

            try {
                data = JSON.parse(ext.storageGet(`player_${id}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取player_${id}失败:`, error);
            }
        
            const player = this.parsePlayer(ctx, data);
        
            cache[id] = player;
        }
    
        return cache[id];
    }

    public static saveData(ext: seal.ExtInfo, ctx: seal.MsgContext): void {
        const id = ctx.player.userId;

        if (cache.hasOwnProperty(id)) {
            ext.storageSet(`player_${id}`, JSON.stringify(cache[id]));
        }
    }

    private static parsePlayer(ctx: seal.MsgContext, data: any): Player {
        const id = ctx.player.userId;

        const name = data.name || ctx.player.userId;
        const player = new Player(id, name);

        player.animal = data.animal || getAnimal(player);
        player.exp = data.exp || 0;
        player.level = data.level || 1;
        player.score = data.score || 0;
        player.credits = data.credits || 0;
        player.entries = data.entries || [];

        return player;
    }

    public revive(ctx: seal.MsgContext, msg: seal.Message): void {
        getAnimal(this);
        getEntries(this, 1);

        seal.replyToSender(ctx, msg, `${this.name}转生成了新的动物: ${this.animal.species}`);
    }

    public survive(ctx: seal.MsgContext, msg: seal.Message, event: string): void {
        const events = envMap[this.animal.env].events;
        if (!events.hasOwnProperty(event) || !events[event].active) {
            return;
        }

        envMap[this.animal.env].events[event].solve(ctx, msg, [this]);
    }

    /* TODO
    public explore(ctx: seal.MsgContext, msg: seal.Message): void {}

    public multiply(ctx: seal.MsgContext, msg: seal.Message): void {}

    public evolve(ctx: seal.MsgContext, msg: seal.Message): void {}
    */
}