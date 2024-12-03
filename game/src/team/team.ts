import { GameManager } from "../game/gameManager";
import { Player } from "../player/player";

export class Team {
    members: string[];

    constructor() {
        this.members = [];
    }

    static parse(data: any, members: string[]): Team {
        const team = new Team();

        if (data === null || typeof data!== 'object' || Array.isArray(data)) {
            data = {};
        }

        if (data.hasOwnProperty('members') && Array.isArray(data.members)) {
            team.members = data.members;
        } else {
            team.members = members || [];
        }

        return team;
    }

    addMember(uid: string) {
        if (!this.checkExists(uid)) {
            this.members.push(uid);
        }
    }

    removeMember(uid: string) {
        const index = this.members.indexOf(uid);
        if (index!== -1) {
            this.members.splice(index, 1);
        }
    }

    clear() {
        this.members = [];
    }

    len(): number {
        return this.members.length;
    }

    draw(n: number): string[] {
        if (n <= 0) {
            return [];
        }

        const result: string[] = [];
        const members = this.members.slice();

        for (let i = 0; i < n && i < this.members.length; i++) {
            const index = Math.floor(Math.random() * members.length);
            const uid = members[index];
            result.push(uid);
            members.splice(index, 1);
        }

        return result;
    }

    checkExists(uid: string): boolean {
        return this.members.includes(uid);
    }

    getPlayers(gm: GameManager): Player[] {
        const result: Player[] = [];

        for (let uid of this.members) {
            const player = gm.player.getPlayer(uid, '未知用户');
            result.push(player);
        }

        return result;
    }

    showTeam(gm: GameManager): string {
        if (this.members.length === 0) {
            return '队伍为空';
        }

        const players = this.getPlayers(gm);
        const names = players.map(player => `<${player.name}>`);

        return names.join('\n');
    }

    mergeTeam(team: Team) {
        for (let uid of team.members) {
            if (!this.checkExists(uid)) {
                this.addMember(uid);
            }
        }
    }

    removeTeam(team: Team) {
        for (let uid of team.members) {
            this.removeMember(uid);
        }
    }

    operationToAllMembers(gm: GameManager, func: (player: Player) => any): { player: Player, result: any }[]{
        const result: { player: Player, result: any }[] = [];

        for (let uid of this.members) {
            const player = gm.player.getPlayer(uid, '未知用户');
            try {
                result.push({
                    player: player,
                    result: func(player)
                });
            } catch (error) {
                console.error(`执行全队操作时出现错误:`, error);
            }
        }

        return result;
    }

    sort(gm: GameManager, func: (player: Player) => number, reverse: boolean = false): Team {
        const players = this.getPlayers(gm);

        players.sort((a, b) => {
            return func(a) - func(b);
        });

        if (reverse) {
            players.reverse();
        }

        this.members = players.map(player => player.uid);

        return this;
    }
}