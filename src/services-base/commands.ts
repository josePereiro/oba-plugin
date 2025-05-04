import { obaconfig } from "src/oba-base/0-oba-modules";
import { addObaCommand } from "src/oba-base/commands";
import { runObaEventCallbacks } from "src/scheduler-base/event-callbacks";

/*
    General purpose commands.
    - The commands use callbacks so other servises can use them as entry point
    - Also it is useful for bundling commands 
*/
let NCOMMANDS: number;
    
export function onload() {
    console.log("Commands:onload");

    NCOMMANDS = obaconfig.getObaConfig("commands.defaults.num", 5)

    for (const i of getCommandRange()) {

        addObaCommand({
            commandName: getCommandName(i),
            serviceName: ["Commands"],
            async commandCallback({ commandID, commandFullName }) {
                const blockID = getCommandCallbackId(i);
                runObaEventCallbacks({ blockID, context: null })
            },
        })
    }
}

export function getCommandRange() {
    return Array.from({ length: NCOMMANDS }, (_, i) => i + 1);
}

export function getCommandId(i: number) { return `oba-command-${i}` }
export function getCommandIds(): string[] {
    const result: string[] = [];
    for (const i of getCommandRange()) {
        result.push(getCommandId(i));
    }
    return result;
}

export function getCommandName(i: number) { return `General Command ${i}` }
export function getCommandNames(): string[] {
    const result: string[] = [];
    for (const i of getCommandRange()) {
        result.push(getCommandName(i));
    }
    return result;
}

export function getCommandCallbackId(i: number) { return `callback.command.${i}` }
export function getCommandCallbackIds(): string[] {
    const result: string[] = [];
    for (const i of getCommandRange()) {
        result.push(getCommandCallbackId(i));
    }
    return result;
}
