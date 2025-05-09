import { addObaCommand } from "src/oba-base/commands"
import { getObaSyncAllChannelsConfig } from "./obasync-base"

export function _obasync_dev_commands() {
    addObaCommand({
        commandName: "log channelsConfig",
        serviceName: ["ObaSync", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const channelsConfig = getObaSyncAllChannelsConfig({})
            console.log({channelsConfig})
        }
    })   
}