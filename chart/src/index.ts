import { ConfigManager } from "./configManager";
import { getChart, getChartText, updateVars } from "./utils";

function main() {
  // 注册扩展
  let ext = seal.ext.find('排行榜');
  if (!ext) {
    ext = seal.ext.new('排行榜', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  const configManager = new ConfigManager(ext);
  configManager.register();
  let chart = getChart(ext);

  ext.onCommandReceived = (ctx, _, cmdArgs) => {
    const command = cmdArgs.command;
    const cmds = seal.ext.getTemplateConfig(ext, '变量同步指令名');

    if (cmds.includes(command)) {
      setTimeout(() => {
        chart = updateVars(ext, ctx, chart);
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
        chart = updateVars(ext, ctx, chart);
      }, 500)
    }
  }

  const cmd = seal.ext.newCmdItemInfo();
  cmd.name = 'chart';
  cmd.help = `帮助
【.chart <变量名称>】查看排行榜
【.chart show】查看已有的变量名`;
  cmd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case 'show': {
        const names = seal.ext.getTemplateConfig(ext, '变量对应名称');
        seal.replyToSender(ctx, msg, `可选变量名称:${names.join(',')}`);
        return seal.ext.newCmdExecuteResult(true);
      }
      default: {
        seal.replyToSender(ctx, msg, getChartText(val, chart, configManager));
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };
  ext.cmdMap['chart'] = cmd;
  ext.cmdMap['排行榜'] = cmd;
}

main();
