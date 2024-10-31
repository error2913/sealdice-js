export interface Team {
    name: string;
    members: string[];
}

export interface member {
    name:string;
    attr: {
        [key: string]: number;
    }
}