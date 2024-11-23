import { Backpack } from "./backpackManager";

export interface Player {
    id: string,
    [key: string]: string | number | Backpack
}

export class PlayerManager {
    structure: {
        [key: string]: ['string', string] | ['number', number] | ['Backpack', Backpack]
    }

    constructor() {
        
    }

    newPlayer() {

    }

    parse() {

    }

    getData() {

    }

    save() {

    }
}