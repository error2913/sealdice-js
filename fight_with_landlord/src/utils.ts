export function getMsg(messageType: "group" | "private", senderId: string, groupId: string = ''): seal.Message {
    let msg = seal.newMessage();

    if (messageType == 'group') {
        msg.groupId = groupId;
        msg.guildId = '';
    }

    msg.messageType = messageType;
    msg.sender.userId = senderId;
    return msg;
}

export function getCtx(epId: string, msg: seal.Message): seal.MsgContext | undefined {
    const eps = seal.getEndPoints();

    for (let i = 0; i < eps.length; i++) {
        if (eps[i].userId === epId) {
            return seal.createTempCtx(eps[i], msg);
        }
    }

    return undefined;
}

export function getName(ctx: seal.MsgContext, id: string) {
    const mmsg = getMsg('group', id, ctx.group.groupId);
    const mctx = getCtx(ctx.endPoint.userId, mmsg);
    return mctx.player.name;
}

export function parseCards(s: string): string[] {
    const cards = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];
    const pattern = new RegExp(`^${cards.join('|^')}`);
    const result = [];

    while (true) { 
        const match = s.match(pattern);

        if (match) {
            result.push(match[0]);
            s = s.slice(match[0].length).trim();
        } else {
            break;
        }
    }

    result.sort((a, b) => {
        const indexA = cards.indexOf(a);
        const indexB = cards.indexOf(b);
        return indexA - indexB;
    });

    return result;
}

export function getType(cards: string[]): [string, number] {
    const rank = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];

    const map = {};

    cards.forEach(card => {
        map[card] = map[card] + 1 || 1;
    })

    const kinds = Object.keys(map);

    if (
        cards.length === 0 ||
        (kinds.includes('小王') && map['小王'] > 1) ||
        (kinds.includes('小王') && map['小王'] > 1)
    ) {
        return ['', 0];
    }

    if (cards.length === 1) {
        const index = rank.indexOf(cards[0]);
        return ['single', index];
    }

    if (cards.length === 2) {
        if (kinds.length !== 1) {
            return ['', 0];
        }

        const index = rank.indexOf(cards[0]);
        return ['pair', index];
    }

    if (cards.length === 3) {
        if (kinds.length!== 1) {
            return ['', 0];
        }

        const index = rank.indexOf(cards[0]);
        return ['triple', index];
    }

    if (cards.length === 4) {
        if (kinds.length !== 1) {
            for (let i = 0; i < kinds.length; i++) {
                if (map[kinds[i]] == 3) {
                    const index = rank.indexOf(kinds[i]);
                    return ['triple1', index];
                }
            }

            return ['', 0];
        }

        const index = rank.indexOf(cards[0]);
        return ['bomb', index];
    }

    if (cards.length === 5) {
        //三带对子
        //五顺
        //
    }

    if (cards.length === 6) {
        //四带两张单
        //六顺
        //三连对
        //飞机
    }

    if (cards.length === 7) {
        //
        //七顺
        //
    }

    if (cards.length === 8) {
        //四带两对子
        //八顺
        //四连对
        //飞机带单
    }

    //我草不想写了
}