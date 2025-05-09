/*
    Handle console logging so it is actually useful
*/ 

function _objKV(obj: any) {
    const kv = []
    for (const key in obj) {
        kv.push(`${key}: `)
        kv.push(obj[key])
    }
    return kv
}

export class TagLogger {

    constructor(
        private tags: string[] = []
    ) {}

    public log(...args: any[]) {
        console.log(
            this.tags.join(":"), ": ",
            ...args
        )
    }

    public loginit() {
        console.log("-----------------")
        this.log("init")
    }

    public error(...args: any[]) {
        console.error(
            this.tags.join(":"), ": ",
            ...args
        )
    }

    public warn(...args: any[]) {
        console.warn(
            this.tags.join(":"), ": ",
            ...args
        )
    }
}