export class Prop {
    name: string;
    desc: string;
    type: string;
    solve: (count: number, ...args: any[]) => void;

    constructor() {
        this.name = '';
        this.desc = '';
        this.type = '';
        this.solve = (_) => { };
    }

    showProp(): string {
        return `【${this.name}】
类型:${this.type}
描述:${this.desc}`;
    }
}