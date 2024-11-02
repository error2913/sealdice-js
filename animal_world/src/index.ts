import { envMap } from "./env";
import { Player } from "./player";
import { getPlayerList } from "./playerManager";
import { getScoreChart } from "./utils";

export const cache: { [key: string]: Player } = {};

function initPlayers(ext: seal.ExtInfo): void {
  const playerList = getPlayerList(ext);

  playerList.forEach(id => {
    Player.getPlayer(ext, id);
  })
}

function main() {
  // 注册扩展
  let ext = seal.ext.find('animalWorld');
  if (!ext) {
    ext = seal.ext.new('animalWorld', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  initPlayers(ext);

  const cmdAW = seal.ext.newCmdItemInfo();
  cmdAW.name = 'aw';
  cmdAW.help = 'TODO';
  cmdAW.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case 'info': {
        const player = Player.getPlayer(ext, ctx.player.userId, ctx);

        const text = `昵称:<${player.name}>
物种:${player.animal.species}
生命:${player.animal.attr.hp} | 防御:${player.animal.attr.def}
敏捷:${player.animal.attr.dex} | 幸运:${player.animal.attr.lck}
积分:${player.score}
词条:${player.entries.join('、')}`

        seal.replyToSender(ctx, msg, text);
        return seal.ext.newCmdExecuteResult(true);
      }
      case '排行榜':
      case 'chart': {
        const scoreChart = getScoreChart();
        if (scoreChart.length == 0) {
          seal.replyToSender(ctx, msg, '暂无记录。');
          return seal.ext.newCmdExecuteResult(true);
        }

        let text = `排行榜\n♚`
        for (let i = 0; i < 10; i++) {
          const player = scoreChart[i];
          text += `第${i + 1}名: <${player.name}>  ${player.score}\n`
        }

        seal.replyToSender(ctx, msg, text);
        return seal.ext.newCmdExecuteResult(true);
      }
      default: {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
    }
  };
  ext.cmdMap['aw'] = cmdAW;

  const cmdRevive = seal.ext.newCmdItemInfo();
  cmdRevive.name = 'revive';
  cmdRevive.help = '没有帮助';
  cmdRevive.solve = (ctx, msg, _) => {
    const player = Player.getPlayer(ext, ctx.player.userId, ctx);

    player.revive();
    seal.replyToSender(ctx, msg, `${player.name}转生成了新的动物: ${player.animal.species}`);

    Player.savePlayer(ext, player);
    return seal.ext.newCmdExecuteResult(true);
  };
  ext.cmdMap['revive'] = cmdRevive;
  ext.cmdMap['转生'] = cmdRevive;

  const cmdSurvive = seal.ext.newCmdItemInfo();
  cmdSurvive.name = 'survive';
  cmdSurvive.help = '没有帮助';
  cmdSurvive.solve = (ctx, msg, cmdArgs) => {
    const name = cmdArgs.getArgN(1);
    const player = Player.getPlayer(ext, ctx.player.userId, ctx);

    if (!name || !player.animal.events.active.includes(name)) {
      seal.replyToSender(ctx, msg, `可选：${player.animal.events.active.join('、')}`);
      return seal.ext.newCmdExecuteResult(true);
    }

    envMap[player.animal.env].events[name].solve(ctx, msg, [player]);
    
    Player.savePlayer(ext, player);
    return seal.ext.newCmdExecuteResult(true);
  };
  ext.cmdMap['survive'] = cmdSurvive;
  ext.cmdMap['生存'] = cmdSurvive;
}

main();