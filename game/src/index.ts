import { GameManager } from "./game";
import { VarsInfo, VarsManager } from "./utils/vars";

function main() {
  // 注册扩展
  let ext = seal.ext.find('game依赖');
  if (!ext) {
    ext = seal.ext.new('game依赖', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  function getNewGM(ext: seal.ExtInfo, gvi: VarsInfo, pvi: VarsInfo): GameManager {
    return new GameManager(ext, gvi, pvi);
  }

  globalThis.getNewGM = getNewGM;
  globalThis.varsManager = new VarsManager();
}

main();
