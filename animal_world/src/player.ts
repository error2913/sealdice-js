import { Animal } from "./animal";

export interface player {
    id: string;
    name: string;
    animal: Animal;
    exp: number;
    level: number;
    gold: number;
    items: string[];
}

export class Player {
    private player: player;
    constructor(id: string, name: string, animal: Animal) {
        this.player = {
            id: id,
            name: name,
            animal: animal,
            exp: 0,
            level: 1,
            gold: 0,
            items: []
        }
    }
}