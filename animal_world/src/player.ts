//这里是一个玩家类，用于存储玩家的信息和行为

import { cache } from ".";
import { Animal, getAnimal } from "./animal";
import { addEntries, getEntries } from "./entry";
import { envMap } from "./env";
import { playerList, savePlayerList } from "./playerManager";
import { parseAnimal } from "./utils";

export class Player {
    public id: string;
    public name: string;
    public animal: Animal;
    public score: number;
    public entries: string[];//词条列表

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.animal = {
            species: "",
            info: "",
            env: "",
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
        };
        this.score = 0;
        this.entries = [];
    }

    public static getPlayer(ext: seal.ExtInfo, id: string, ctx: seal.MsgContext = undefined): Player {
        if (!cache.hasOwnProperty(id)) {
            let data: any;

            try {
                data = JSON.parse(ext.storageGet(`player_${id}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取player_${id}失败:`, error);
                data = {};
            }

            if (data && Object.keys(data).length > 0) {
                cache[id] = Player.parse(data);
            } else {
                cache[id] = Player.createPlayer(id, ctx.player.name || "未知玩家");
                playerList.push(id);
                savePlayerList(ext);
            }
        }

        return cache[id];
    }

    public static savePlayer(ext: seal.ExtInfo, player: Player): void {
        ext.storageSet(`player_${player.id}`, JSON.stringify(player));
    }

    public static parse(data: any): Player {
        let player: Player;

        try {
            player = new Player(data.id, data.name);

            player.animal = parseAnimal(data.animal);
            player.score = data.score;
            player.entries = data.entries;
        } catch (err) {
            console.error(`解析玩家失败:`, err);
            player = new Player('', '');
        }

        return player;
    }

    public static createPlayer(id: string, name: string): Player {
        const player = new Player(id, name);

        player.animal = getAnimal();
        const entries = getEntries(2);
        addEntries(player, entries);

        return player;
    }

    //TODO:随机ID，随机名字
    public static createRobot(species: string): Player {
        return Player.createPlayer(`Robot`, `奇怪的${species}`);
    }

    public static getRandomPlayer(species: string): Player {
        const players = Object.values(cache).filter(player => player.animal.species === species);

        if (players.length == 0) {
            return this.createRobot(species);
        }

        return players[Math.floor(Math.random() * players.length)];
    }

    public revive(): void {
        this.entries = [];

        this.animal = getAnimal();
        const entries = getEntries(2);
        addEntries(this, entries);
    }

    public survive(ctx: seal.MsgContext, msg: seal.Message, event: string): void {
        const events = envMap[this.animal.env].events;
        if (!events.hasOwnProperty(event) || !events[event].active) {
            return;
        }

        envMap[this.animal.env].events[event].solve(ctx, msg, [this]);
    }

    /* TODO
    public emergency(ctx: seal.MsgContext, msg: seal.Message): void {}

    public explore(ctx: seal.MsgContext, msg: seal.Message): void {}

    public multiply(ctx: seal.MsgContext, msg: seal.Message): void {}

    public evolve(ctx: seal.MsgContext, msg: seal.Message): void {}

    public meet(ctx: seal.MsgContext, msg: seal.Message): void {}
    */
}