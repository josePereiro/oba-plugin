/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require("path")
const CProc = require('child_process');

// ------------------------------------------------------------------------
// Utils
function log_newsection(msg){
    console.log();
    console.log("------------------------------------------------------------------------");
    console.log(msg);    
}

// ------------------------------------------------------------------------
// iter
let iter_count = 0
const target_vaults = process.argv[2].split(',')
for (let target_vault of target_vaults) {

    // ------------------------------------------------------------------------
    log_newsection("Vault");
    target_vault = target_vault.trim()
    console.log("target_vault: ", target_vault)

    if (!target_vault) { throw {msg: "target vault path not defined"}; }
    if (!fs.existsSync(target_vault)) { throw {msg: "target vault path not found"}; }
    const src_plugin_dir = path.dirname(__filename)
    const src_plugin_dist_dir = path.join(src_plugin_dir, "dist")
    if (!fs.existsSync(src_plugin_dist_dir)) {
        fs.mkdirSync(src_plugin_dist_dir, { recursive: true })
    }
    const src_plugin_name = path.basename(src_plugin_dir)

    
    console.log("src_plugin_dir: ", src_plugin_dir)
    console.log("src_plugin_name: ", src_plugin_name)

    const obsidian_dotfolder = path.join(target_vault, ".obsidian")
    if (!fs.existsSync(obsidian_dotfolder))  { throw {msg: ".obsidian folder not found"}; }

    const obsidian_plugin_folder = path.join(obsidian_dotfolder, "plugins")
    const obsidian_target_plugin_folder = path.join(obsidian_plugin_folder, src_plugin_name)
    if (!fs.existsSync(obsidian_target_plugin_folder)) {
        fs.mkdirSync(obsidian_target_plugin_folder, { recursive: true })
    }
    console.log("obsidian_target_plugin_folder: ", obsidian_target_plugin_folder)

    // ============================================================================
    // compiling
    {
        if (iter_count==0) {
            log_newsection("compiling ts");
            CProc.execSync('npm run dev production', 
                { cwd: src_plugin_dir }, 
                function callback(error, stdout, stderr) {
                    if (error) throw error;
                    console.log(`stdout: ${stdout}`);
                }
            );
        }
    }
    
    // copying files
    {
        log_newsection("copying files");
        const tocopy = ["dist/main.js", "manifest.json"]
        tocopy.forEach(function (file, idx) {
            var src = path.join(src_plugin_dir, file)
            var dest = path.join(obsidian_target_plugin_folder, path.basename(file))
            fs.copyFileSync(src, dest)
            if (!fs.existsSync(dest)) { throw {msg: "copy failed!"}; }
            console.log(file, ' -> ', dest);
        });
    }

    // updating community-plugins.json
    {
        log_newsection("updating community-plugins.json");
        
        const obsidian_community_plugins_json = path.join(obsidian_dotfolder, "community-plugins.json")
        
        //read
        let filestr = fs.readFileSync(obsidian_community_plugins_json);
        let plugins = JSON.parse(filestr);   
        plugins.push(src_plugin_name)
        
        plugins = [...new Set(plugins)]
        
        //write
        filestr = JSON.stringify(plugins);
        fs.writeFileSync(obsidian_community_plugins_json, filestr);
        console.log(filestr);
    }

    iter_count = iter_count + 1
}