import { DelayManager } from "src/tools-base/utils-tools"

export let ANYMOVE_DELAY: DelayManager = new DelayManager(300, 100, -1, -1) // no delay
export let PUSH_DELAY: DelayManager = new DelayManager(3000, 100, 3000, -1)
