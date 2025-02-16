// ------------------------------------------------------------------
// static Utils

const CHARACTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function randstring(p: string, length: number): string {
	if (length < 1) { length = 1; }
    let rand = '';
    const charactersLength = CHARACTERS.length;
    for ( let i = 0; i < length; i++ ) {
        const rinx = Math.floor(Math.random() * charactersLength)
        rand += CHARACTERS.charAt(rinx);
    }
	return `${p}${rand}`
}