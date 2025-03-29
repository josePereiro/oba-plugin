import { OBA } from "src/oba-base/globals";

export let STATUSBAR: HTMLElement

export function onload() {

    console.log("StatusBar:onload")

    STATUSBAR = OBA.addStatusBarItem();

    OBA.addCommand({
        id: "oba-statusbar-dev",
        name: "StatusBar dev",
        callback: async () => {
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

export async function clear() {
    await setText('')
}

export async function setText(txt: string, wt = 1) {
    STATUSBAR.setText(txt);
    await sleep(wt)
}

export function remove() {
    STATUSBAR.remove()
}