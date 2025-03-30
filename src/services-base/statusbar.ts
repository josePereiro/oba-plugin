import { OBA } from "src/oba-base/globals";

let STATUSBAR: HTMLElement
let lastLoggedTime = Date.now();
let loggingPeriod = 100; // ms

export function onload() {

    console.log("StatusBar:onload")

    STATUSBAR = OBA.addStatusBarItem();

    OBA.addCommand({
        id: "oba-statusbar-dev",
        name: "StatusBar dev",
        callback: async () => {
            for (let i = 0; i < 10; i++) {
                await setText(`HI ${i}`)
                await sleep(500)
            }
            await setText('')
        },
    });
}

export function onunload() {
    remove();
}

function _setText(txt: string) {
    STATUSBAR.setText(txt);
}
export function setText(txt: string, force = false) {
    if (force) {
       _setText(txt)
        return
    } 
    const currTime = Date.now();
    if (currTime - lastLoggedTime > loggingPeriod) {
       _setText(txt)
        lastLoggedTime = currTime
        return
    }
}

export function clear() {
    _setText('')
}

export function remove() {
    STATUSBAR.remove()
}