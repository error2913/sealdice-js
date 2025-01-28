import { ChartManager } from "./chart";
import { ConfigManager } from "./configManager";

function main() {
  // 注册扩展
  let ext = seal.ext.find('排行榜');
  if (!ext) {
    ext = seal.ext.new('排行榜', '错误', '1.1.0');
    seal.ext.register(ext);
  }

  const configManager = new ConfigManager(ext);
  configManager.register();
  const cm = ChartManager.getData(ext);

  ext.onCommandReceived = (ctx, _, cmdArgs) => {
    const command = cmdArgs.command;
    const cmds = seal.ext.getTemplateConfig(ext, '变量同步指令名');

    if (cmds.includes(command)) {
      setTimeout(() => {
        cm.updateVars(ext, ctx);
      }, 500)
    }
  }

  ext.onNotCommandReceived = (ctx, msg) => {
    const message = msg.message;
    const patterns = seal.ext.getTemplateConfig(ext, '变量同步正则表达式');

    if (
      patterns.some(item => {
        try {
          return new RegExp(item).test(message)
        } catch (error) {
          console.error('Error in RegExp:', error);
          return false;
        }
      })
    ) {
      setTimeout(() => {
        cm.updateVars(ext, ctx);
      }, 500)
    }
  }

  const cmd = seal.ext.newCmdItemInfo();
  cmd.name = 'chart';
  cmd.help = `帮助
【.chart <变量名称>】查看排行榜`;
  cmd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case '':
      case 'help': {
        const names = seal.ext.getTemplateConfig(ext, '变量对应名称');
        const s = cmd.help + `\n可选变量名称:${names.join(',')}`;
        seal.replyToSender(ctx, msg, s);
        return seal.ext.newCmdExecuteResult(true);
      }
      default: {
        const varName = configManager.getVarName(val);
        if (!varName) {
            const names = seal.ext.getTemplateConfig(ext, '变量对应名称');
            const s = `${val}排行榜不存在` + `\n可选变量名称:${names.join(',')}`;
            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }

        seal.replyToSender(ctx, msg, cm.showChart(val));
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };
  ext.cmdMap['chart'] = cmd;
  ext.cmdMap['排行榜'] = cmd;
}

main();
