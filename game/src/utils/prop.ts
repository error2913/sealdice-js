export interface PropInfo {
    type: string,
    count: number
}

export class Prop {
    name: string;
    info: PropInfo;
    reply: string;

    static parseInfo(data: any): PropInfo | undefined {
        if (typeof data!= 'object') {
            return undefined;
        }

        if (
            data.hasOwnProperty('type') && typeof data.type == 'string' &&
            data.hasOwnProperty('count') && typeof data.count == 'number'
        ) {
            return data;
        }

        return undefined;
    }
}