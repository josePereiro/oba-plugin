import ObAPlugin from "dev.src/main";
import { SequentialAsyncScheduler } from "src/tools-base/schedule-tools";


export let OBA: ObAPlugin = undefined;

export function setOba(_oba: ObAPlugin) {
    OBA = _oba;
}
