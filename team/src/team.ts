export interface Team {
    name: string;
    members: string[];
}

export interface MemberInfo {
    name:string;
    attr: {
        [key: string]: number;
    }
}