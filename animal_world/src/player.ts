import { Animal } from "./animal";

export class Player {
    public id: string;
    public name: string;
    public animal: Animal;
    public exp: number;
    public level: number;
    public score: number;
    public credits: number;
    public entrys: string[];

    constructor(id: string, name: string, animal: Animal) {
        this.id = id;
        this.name = name;
        this.animal = animal;
        this.exp = 0;
        this.level = 1;
        this.score = 0;
        this.credits = 0;
        this.entrys = [];
    }

    public revive(): void {}

    public survive(): void {}

    public multiply(): void {}

    public explore(): void {}

    public evolve(): void {}

}