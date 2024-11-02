import { Deck } from "./deck";

const deckMap: { [key: string]: Deck } = {};

const cards = [
    '大王', '小王',
    '2', '2', '2', '2',
    'A', 'A', 'A', 'A',
    'K', 'K', 'K', 'K',
    'Q', 'Q', 'Q', 'Q',
    'J', 'J', 'J', 'J',
    '10', '10', '10', '10',
    '9', '9', '9', '9',
    '8', '8', '8', '8',
    '7', '7', '7', '7',
    '6', '6', '6', '6',
    '5', '5', '5', '5',
    '4', '4', '4', '4',
    '3', '3', '3', '3'
]

//注册主牌堆
const deckMain = new Deck();
deckMain.name = '主牌堆';
deckMain.type = 'public';
deckMain.cards = cards;
deckMap['主牌堆'] = deckMain;

//注册弃牌堆
const deckDiscard = new Deck();
deckDiscard.name = '弃牌堆';
deckDiscard.type = 'public';
deckDiscard.cards = [];
deckMap['弃牌堆'] = deckDiscard;

export { deckMap };