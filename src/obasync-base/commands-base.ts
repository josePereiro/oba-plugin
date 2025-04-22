import { OBA } from "src/oba-base/globals"
import { getCurrNotePath } from "src/tools-base/obsidian-tools"
import { DelayManager } from "src/tools-base/utils-tools"
import { _spawnModifiedFileSignal } from "./modifiedFileSignal-base"
import { resolveVaultSignalEvents } from "./signals-base"


const COMMAND_SPAWN_MOD_FILE_TIME = new DelayManager(1000, 100, 1000, -1)

export function _serviceCommands() {
    
    OBA.addCommand({
        id: "oba-obasync-_spawnModifiedFileSignal",
        name: "ObaSync _spawnModifiedFileSignal",
        callback: async () => {

            const flag = await COMMAND_SPAWN_MOD_FILE_TIME.manageTime()
            if (flag != 'go') { return; }

            console.clear()
            const vaultFile = getCurrNotePath()
            if (!vaultFile) { return; }
            await sleep(1000)
            await _spawnModifiedFileSignal({
                vaultFile, 
                checkPulledMTime: false,
                controlArgs: {
                    commitPushRepo: true,
                    commitVaultRepo: true, 
                    pushPushRepo: true,
                    notify: true
                },
            })
        }
    });

    OBA.addCommand({
        id: "oba-obasync-_pullAndRunSignalEventsCallback",
        name: "ObaSync _pullAndRunSignalEventsCallback",
        callback: async () => {
            console.clear()
            await resolveVaultSignalEvents({
                commitVaultDepo: true,
                pullVaultRepo: true,
                notify: true,
            })
        }
    });
}
