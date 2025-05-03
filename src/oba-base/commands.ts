import { checkEnable } from "src/tools-base/oba-tools"
import { OBA } from "./globals"

/*
    TODO/ Add scheduling by default
        - Define a two step callback execution
        - One for capturing (non scheduled) the command call context
        - Another for executing the task once it is time
    

    TODO/ Add in scheduling a single use task interface
        - the task is deleted once executed...
        - Maybe ths should be de default
        - Add locking for registring
*/ 


function _defaultEnableKey(serviceName: string[]) {
    return serviceName.join(":").toLowerCase()
}

// TODO/TAI Maybe accept as a servise name an array
// This way I can deal with subservices
export function addObaCommand({
    commandName,
    serviceName,
    commandCallback,
    enableKey = _defaultEnableKey(serviceName)
}:{
    commandName: string,
    serviceName: string[],
    commandCallback: ({
        commandID, 
        commandFullName
    }:{
        commandID: string, 
        commandFullName: string
    }) => any,
    enableKey?: string
}) {

    const commandFullName = `${serviceName.join(": ")}: ${commandName}`

    const commandIDDig = commandFullName.split(":")
    const commandID = commandIDDig
        .join(":")
        .toLowerCase()
        .replace(/[^a-zA-Z0-1:\.]/g, '-')
        .trim()
    
    OBA.addCommand({
        id: commandID,
        name: commandFullName,
        callback: async () => {
            if (enableKey) checkEnable(enableKey, { notice: true, err: true })
            await commandCallback({commandID, commandFullName})
        }
    })
}

 