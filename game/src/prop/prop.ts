import { Player } from "../player/player";

export class Prop {
    name: string;
    desc: string;
    type: string;
    solve: (player: Player, count: number, ...args: any[]) => { result: any, err: string };

    constructor() {
        this.name = '';
        this.desc = '';
        this.type = '';
        this.solve = (_, __) => {
            return { result: null, err: '' };
        };
    }

    showProp(): string {
        return `【${this.name}】
类型:${this.type}
描述:${this.desc}`;
    }
}