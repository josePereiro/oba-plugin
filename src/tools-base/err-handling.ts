export function errVersion({
        fun,
        err = false,
        msg = "Error, falsy value",
        fail = (val: any) => Boolean(val) === false,
    }: {
        fun: () => any;
        err?: boolean;
        msg?: string;
        fail?: (val: any) => boolean;
    }) {
        const val = fun();
        if (!err) { return val; }
        if (fail(val)) { throw {msg}; }
        return val; 
}