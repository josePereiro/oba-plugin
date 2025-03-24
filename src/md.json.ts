/*
    Allow parsing markdown sections as key/value 
    - Parse scope
        - for instance a section or a number of join lines
*/
export class MdJSON {

    constructor(private oba: ObA) {
        console.log("MdJSON:onload");
    }
    
    // MARK: parseKVOnelines
    _formatKey(key0: string) {
        return this.oba.tools.fixPoint(key0, keyi => {
            return keyi.trim().
                replace(/^-/, '').
                replace(/-$/, '').
                replace(/^\*/, '').
                replace(/\*$/, '').
                replace(/^_/, '').
                replace(/^_/, '').
                replace(/_$/, '').
                replace(/>_/, '')
        })
    }
    
    _formatValue(value: string) {
        return value.trim()
    }
    
    _parseKVOneline(line: string, kvs) {
        // Remove >
                
        // Split the line into key and value based on the first occurrence of '**'
        const splitIndex = line.indexOf(':');
        if (splitIndex !== -1) {
            const key = this._formatKey(
                line.substring(0, splitIndex)
            );
            if (!key) { return false; }
            const value = this._formatValue(
                line.substring(splitIndex + 1)
            );
            if (!value) { return false; }
            kvs[key] = value;
        }
        return true;
    }
    
    parseKVOnelines(text: string, filter = (line) => true) {
        const lines = text.split('\n'); // Split the text into lines
        const kv = {};
    
        lines.forEach(line => {
            if (!filter(line)) { return; } 
            this._parseKVOneline(line, kv)
        });
    
        return kv;
    }
}