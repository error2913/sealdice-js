import { getScoreChart } from "./chart";
import { Player } from "./player";

function main() {
  // 注册扩展
  let ext = seal.ext.find('animalWorld');
  if (!ext) {
    ext = seal.ext.new('animalWorld', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  const cmdAW = seal.ext.newCmdItemInfo();
  cmdAW.name = 'aw';
  cmdAW.help = '';
  cmdAW.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case 'info': {
        const player = Player.getData(ext, ctx);

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
        const scoreChart = getScoreChart(ext);

        let text = `排行榜\n♚`
        for (let i = 0; i < 10; i++) {
          const [_, name, score] = scoreChart[i];
          text += `第${i + 1}名: <${name}>  ${score}\n`
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
    const player = Player.getData(ext, ctx);

    player.revive(ctx, msg);
    Player.saveData(ext, ctx);
    return seal.ext.newCmdExecuteResult(true);
  };
  ext.cmdMap['revive'] = cmdRevive;
  ext.cmdMap['转生'] = cmdRevive;
}

main();