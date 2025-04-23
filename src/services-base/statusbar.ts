import { OBA } from "src/oba-base/globals";
import { checkEnable } from "src/tools-base/oba-tools";
import { TriggerManager } from "src/tools-base/schedule-tools";

let STATUSBAR: HTMLElement
// let lastLoggedTime = Date.now();
// let loggingPeriod = 100; // ms
const SETTEXT_DELAY = 
    new TriggerManager({
        delayTime: -1,
        ignoreTime: 100,
        sleepTime: 51,
    })

export function onload() {

    console.log("StatusBar:onload")

    STATUSBAR = OBA.addStatusBarItem();

    OBA.addCommand({
        id: "oba-statusbar-dev",
        name: "StatusBar dev",
        callback: async () => {
            checkEnable("statusbar", {err: true, notice: true})
            for (let i = 0; i < 10; i++) {
                setText(`HI ${i}`)
                await sleep(500)
            }
            setText('')
        },
    });
}

export function onunload() {
    remove();
}

function _setText(
    txt: string
) {
    STATUSBAR.setText(txt);
}

export function setText(
    txt: string, 
    force = false
) {
    if (force) { _setText(txt); return  } 
    SETTEXT_DELAY.manage({
        ongo() {
            _setText(txt) 
        },
    })
}

export function clear() {
    _setText('')
    _setText('')
}

export function remove() {
    STATUSBAR.remove()
}