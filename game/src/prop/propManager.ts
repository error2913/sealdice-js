import { Game } from "../game/game";
import { Player } from "../player/player";
import { Prop } from "./prop";

export class PropManager {
    propMap: { [key: string]: Prop };

    constructor() {
        this.propMap = {};
    }

    clear() {
        this.propMap = {};
    }

    registerProp(prop: Prop) {
        const name = prop.name;
        this.propMap[name] = prop;
    }

    removeProp(name: string) {
        if (this.propMap.hasOwnProperty(name)) {
            delete this.propMap[name];
        }
    }

    getProp(name: string): Prop {
        if (!this.propMap.hasOwnProperty(name)) {
            return new Prop();
        }

        return this.propMap[name];
    }

    useProp(
        ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs,
        name: string,
        game: Game, player: Player, count: number
    ) {
        const prop = this.getProp(name);

        if (prop.name === '') {
            seal.replyToSender(ctx, msg, `【${name}】不知道有什么用`);
            return;
        }

        try {
            prop.solve(ctx, msg, cmdArgs, game, player, count);

            if (count === 1) {
                seal.replyToSender(ctx, msg, seal.format(ctx, prop.reply));
            }
        } catch (error) {
            seal.replyToSender(ctx, msg, `使用道具${name}时出现错误:${error}`);
            return;
        }
    }
}