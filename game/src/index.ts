import { GameManager } from "./game/gameManager";
import { VarsInfo, VarsManager } from "./vars/varsManager";

function main() {
  // 注册扩展
  let ext = seal.ext.find('game依赖');
  if (!ext) {
    ext = seal.ext.new('game依赖', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  function getNewGameManager(ext: seal.ExtInfo, gvi: VarsInfo, pvi: VarsInfo): GameManager {
    return new GameManager(ext, gvi, pvi);
  }

  globalThis.getNewGameManager = getNewGameManager;
  globalThis.varsManager = new VarsManager();
}

main();
