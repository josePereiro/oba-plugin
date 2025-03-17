import { FuzzySuggestModal, Notice } from "obsidian";
import ObA from "./main";


/*
  A few modals utils
*/
export class SelectorModal extends FuzzySuggestModal<string> {
  items: string[] = [];

  // Explicit constructor
  constructor(private oba: ObA, items: string[]) {
    super(oba.app);
    this.items = items; // Initialize the items array
  }

  // Return all available items
  getItems(): string[] {
    return this.items;
  }

  // Define how each item is displayed
  getItemText(item: string): string {
    return item;
  }

  // Handle selected item
  onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
    new Notice(`Selected item: ${item}`);
  }
}