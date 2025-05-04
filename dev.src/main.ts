import { Plugin } from 'obsidian';
import { OtherFileInterface } from './other.file';


export default class ObAPlugin extends Plugin {
	
	// MARK: onload
	async onload() {

		console.clear()
		console.log("ObAPlugin:onload")

		const fun = (bla: OtherFileInterface) => {

		}
		
	}

	onunload() {
		
	}
}

