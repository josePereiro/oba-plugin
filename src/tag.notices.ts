import { Notice, TFile } from 'obsidian';
import ObA from './main';

// TODO: Add checkout current file git cmd
export class TagNotices {

    constructor(private oba: ObA) {
        console.log("TagNotices:constructor");

         'changed'
        this.oba.registerEvent(
            this.oba.app.workspace.on('editor-change', (editor, info) => {
                const activeFile = this.oba.app.workspace.getActiveFile();
                if (activeFile) {
                    this.execNotices(activeFile, 'changed');
                    // console.log("Active file was edited:", activeFile.path);
                    // console.log("Change details:", info);
                }
            })
        );

        // 'file-open'
        this.oba.registerEvent(
            this.oba.app.workspace.on('file-open', (file: TFile) => {
                this.execNotices(file, 'file-open');
            })
        );
    }

    tagNoticesConfig() {
        return this.oba.configfile.getConfig("tag.notices", null)
    }

    execNotices(file: TFile, event0: string) {
        const noticeConfig = this.tagNoticesConfig();
        // console.log("noticeConfig: ", noticeConfig);
        if (!noticeConfig) return
        const filetags = this.oba.tools.getTags(file);
        
        for (const notice of noticeConfig) {
            // console.log(notice)
            if (notice?.["ignore"]) continue;
            const hasEvent = notice?.['where']?.some(event => event == event0)
            if (!hasEvent) continue;
            const msg = notice?.['msg'];
            
            const trigger = notice?.['trigger'];
            if (!trigger) continue;
            if (!msg) continue;
            const tagptn = notice?.['tag'];
            if (!tagptn) continue;
            const regex = new RegExp(tagptn)
            const hasTag = filetags?.some(obj => regex.test(obj.tag));
            if (trigger == "missing" && hasTag) continue;
            if (trigger == "present" && !hasTag) continue;
            new Notice(msg)
        }
    }

}