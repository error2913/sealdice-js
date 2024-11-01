import { Deck } from "./deck";

const deckMap: { [key: string]: Deck } = {};

//注册主牌堆
const deckMain = new Deck();
deckMain.name = '主牌堆';
deckMain.type = 'public';
deckMain.cards = [];
deckMap['主牌堆'] = deckMain;

//注册弃牌堆
const deckDiscard = new Deck();
deckDiscard.name = '弃牌堆';
deckDiscard.type = 'public';
deckDiscard.cards = [];
deckMap['弃牌堆'] = deckDiscard;

export { deckMap };