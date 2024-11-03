//这里是一个玩家类，用于存储玩家的信息和行为

import { cache } from ".";
import { Animal, animalMap, getAnimal } from "./animal";
import { addEntries, getEntries } from "./entry";
import { envMap } from "./env";
import { playerList, savePlayerList } from "./playerManager";
import { AHurtB, BEscapeFromA, parseAnimal } from "./utils";

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
            species: "未知物种",
            info: "未知",
            env: "未知环境",
            evolve: "",
            age: [0, 999],
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
        const entries = getEntries(1);
        addEntries(player, entries);

        return player;
    }

    //TODO:随机ID，随机名字
    public static createRobot(species: string): Player {
        const player = new Player(`Robot`, `奇怪的${species}`);

        player.animal = getAnimal(species);
        const entries = getEntries(3);
        addEntries(player, entries);

        return player;
    }

    public static getRandomPlayer(species: string[]): Player {
        const players = Object.values(cache).filter(player => {
            if (species.length == 0) {
                return true;
            }

            return species.includes(player.animal.species)
        });

        if (players.length == 0) {
            return this.createRobot(species[Math.floor(Math.random() * species.length)]);
        }

        return players[Math.floor(Math.random() * players.length)];
    }

    public age(ctx: seal.MsgContext, msg: seal.Message): void {
        this.animal.age[0] += 1;

        if (this.animal.age[0] > this.animal.age[1]) {
            this.revive();

            seal.replyToSender(ctx, msg, `<${this.name}>老死了。转生成了新的动物: ${this.animal.species}`);
        }
    }

    public revive(): void {
        this.entries = [];

        this.animal = getAnimal();
        const entries = getEntries(1);
        addEntries(this, entries);
    }

    public survive(ctx: seal.MsgContext, msg: seal.Message, event: string): void {
        if (event == '觅食' || event == 'forage') {
            this.forage(ctx, msg);
            return;
        }

        if (!event || !this.animal.events.active.includes(event)) {
            seal.replyToSender(ctx, msg, `可选：觅食、${this.animal.events.active.join('、')}`);
            return;
        }

        if (!envMap[this.animal.env].events.hasOwnProperty(event)) {
            seal.replyToSender(ctx, msg, `错误，这个事件可能忘记写了:${event}`);
            return;
        }

        envMap[this.animal.env].events[event].solve(ctx, msg, [this]);
        this.age(ctx, msg);
    }

    public forage(ctx: seal.MsgContext, msg: seal.Message): void {
        const foods = this.animal.food;

        if (foods.length == 0) {
            seal.replyToSender(ctx, msg, `没有可以吃的`);
            this.age(ctx, msg);
            return;
        }

        const food = foods[Math.floor(Math.random() * foods.length)];

        if (!animalMap.hasOwnProperty(food)) {
            const entry = getEntries(1);
            addEntries(this, entry);

            seal.replyToSender(ctx, msg, `${this.animal.species}<${this.name}>吃掉了${food}，新的词条：${entry[0].name}`);
            this.age(ctx, msg);
        }

        const foodPlayer = Player.getRandomPlayer([food]);

        //尝试逃跑
        if (BEscapeFromA(this, foodPlayer)) {
            seal.replyToSender(ctx, msg, `${foodPlayer.animal.species}<${foodPlayer.name}>逃跑了`);
            this.age(ctx, msg);
            return;
        }

        const [damage, crit] = AHurtB(this, foodPlayer);

        let text = `<${this.name}>咬了<${foodPlayer.name}>，${crit ? `暴击了，` : ``}咬掉了${damage}血`

        //吃掉
        if (foodPlayer.animal.attr.hp <= 0) {
            const entry = getEntries(1);
            addEntries(this, entry);

            seal.replyToSender(ctx, msg, text + `\n<${this.name}>吃掉了<${foodPlayer.name}>，新的词条：${entry[0].name}`);
            foodPlayer.revive();
            return;
        }

        seal.replyToSender(ctx, msg, text);
        this.age(ctx, msg);
    }

    public explore(ctx: seal.MsgContext, msg: seal.Message): void {
        const events = this.animal.events.passive;

        if (Math.random() <= 0.5) {
            this.beAttacked(ctx, msg);
            return;
        }

        if (events.length == 0) {
            seal.replyToSender(ctx, msg, `没有可以探索的`);
            return;
        }

        const event = events[Math.floor(Math.random() * events.length)];

        if (!envMap[this.animal.env].events.hasOwnProperty(event)) {
            seal.replyToSender(ctx, msg, `错误，这个事件可能忘记写了:${event}`);
            return;
        }

        envMap[this.animal.env].events[event].solve(ctx, msg, [this]);
        this.age(ctx, msg);
    }

    public beAttacked(ctx: seal.MsgContext, msg: seal.Message): void {
        const enemys = this.animal.enemy;

        if (enemys.length == 0) {
            seal.replyToSender(ctx, msg, `什么都没有发生`);
            this.age(ctx, msg);
            return;
        }

        const enemy = enemys[Math.floor(Math.random() * enemys.length)];

        if (!animalMap.hasOwnProperty(enemy)) {
            seal.replyToSender(ctx, msg, `错误，这个敌人可能忘记写了:${enemy}`);
            return;
        }

        const enemyPlayer = Player.getRandomPlayer([enemy]);

        //尝试逃跑
        if (BEscapeFromA(enemyPlayer, this)) {
            seal.replyToSender(ctx, msg, `遭遇${enemyPlayer.animal.species}<${enemyPlayer.name}>袭击，你逃跑了`);
            this.age(ctx, msg);
            return;
        }

        const [damage, crit] = AHurtB(enemyPlayer, this);

        let text = `遭遇${enemyPlayer.animal.species}<${enemyPlayer.name}>袭击，${crit ? `暴击了，` : ``}被咬掉了${damage}血`

        //吃掉
        if (this.animal.attr.hp <= 0) {
            this.revive();
            seal.replyToSender(ctx, msg, text + `\n${this.animal.species}<${this.name}>被吃掉了，转生成了新的动物: ${this.animal.species}`);
            return;
        }

        seal.replyToSender(ctx, msg, text);
        this.age(ctx, msg);
    }


    public multiply(ctx: seal.MsgContext, msg: seal.Message): void {
        if (this.animal.age[0] < this.animal.age[1] * 0.15) {
            seal.replyToSender(ctx, msg, `繁衍失败，年龄不够`);
            return;
        }

        if (Math.random() * this.animal.attr.hp * (this.animal.age[1] - this.animal.age[0]) <= 10) {
            seal.replyToSender(ctx, msg, `繁衍失败`);
            this.age(ctx, msg);
            return;
        }

        const num = Math.floor(this.animal.attr.hp / 10);
        this.score += num;
        const entry = getEntries(1);
        addEntries(this, entry);

        seal.replyToSender(ctx, msg, `<${this.name}>繁衍了${num}个后代，积分加${num}。新的词条：${entry[0].name}`);
        this.age(ctx, msg);
        return;
    }

    public evolve(ctx: seal.MsgContext, msg: seal.Message): void {
        if (!this.animal.evolve) {
            seal.replyToSender(ctx, msg, `进化失败，没有进化路线`);
            return;
        }

        if (this.entries.length < 5) {
            seal.replyToSender(ctx, msg, `进化失败，词条不足`);
            return;
        }

        this.entries.splice(0, 5);
        this.animal = getAnimal(this.animal.evolve);
        const entries = getEntries(1);
        addEntries(this, entries);
        this.score += 5;

        seal.replyToSender(ctx, msg, `<${this.name}>进化了，进化为${this.animal.species}。得5分`);
    }

    /* TODO
    //遭遇其他玩家？
    public meet(ctx: seal.MsgContext, msg: seal.Message): void {}
    */
}