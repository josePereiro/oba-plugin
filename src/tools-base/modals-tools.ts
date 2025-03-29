import { App, FuzzySuggestModal, Notice } from "obsidian";
import { Modal, Setting } from "obsidian";
import * as levenshtein from "fast-levenshtein";
import ObAPlugin from "../main";
import { OBA } from "src/oba-base/globals";


/*
  A few modals utils
*/
export class SelectorModalV1 extends FuzzySuggestModal<string> {
  items: string[] = [];

  // Explicit constructor
  constructor(private oba: ObAPlugin, items: string[]) {
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

// MARK: SimilarityModal
export class SimilarityModal extends Modal {
    private input = "";
    private options: string[];
    private selectedOption: string | null = null;
    private onSubmit: (selectedOption: string) => void;

    constructor(private oba: ObAPlugin, 
      options: string[],
      onSubmit: (selectedOption: string) => void
    ) {
        super(oba.app);
        this.onSubmit = onSubmit;
        this.options = options;
        console.log(options);
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl("h2", { text: "Enter your text and select an option" });

        // Input field for user text
        new Setting(contentEl)
            .setName("Input Text")
            .addText((text) =>
                text.onChange((value) => {
                    this.input = value;
                    this.updateOptions();
                })
            );

        // Display ranked options
        this.updateOptions();
    }

    updateOptions() {
        const { contentEl } = this;

        // Clear previous options
        contentEl.findAll(".option").forEach((el) => el.remove());

        // Rank options by similarity to input
        const rankedOptions = this.rankOptionsBySimilarity(this.input, this.options);

        // Display ranked options
        rankedOptions.forEach((option) => {
            new Setting(contentEl)
                .setName(option)
                .addButton((btn) =>
                    btn.setButtonText("Select").onClick(() => {
                        this.selectedOption = option;
                        this.close();
                    })
                )
                .setClass("option");
        });
    }

    rankOptionsBySimilarity(input: string, options: string[]): string[] {
      // Rank options based on Levenshtein distance
      return options
          .map((option) => ({
              option,
              distance: levenshtein.get(input.toLowerCase(), option.toLowerCase()),
          }))
          .sort((a, b) => a.distance - b.distance) // Sort by ascending distance (lower distance = more similar)
          .map((item) => item.option); // Extract the sorted options
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();

        if (this.selectedOption) {
            this.onSubmit(this.selectedOption);
        }
    }
}


// 
export class SelectorModalV2 extends FuzzySuggestModal<string> {
  private items: string[];
  private callback: (idx: number) => void | Promise<void>;
  private initialValue: string;

  constructor(
      items: string[], 
      placeholder = "Select an item", 
      initialValue = '',
      callback: (idx: number) => void | Promise<void> = () => {}
    ) {
    super(OBA.app);
    this.items = items;
    this.setPlaceholder(placeholder)
    this.initialValue = initialValue;
    this.callback = callback;
    this.setInstructions([{command: '↑↓', purpose: 'to navigate'},
      // {command: '↵', purpose: `to search ${this.query}`},
      {command: 'esc', purpose: 'to dismiss'}]);
  }

  onOpen(): void {
      super.onOpen();
      if (this.initialValue) {
        const inputEl = this.inputEl;
        console.log(inputEl)
        if (inputEl) {
          inputEl.value = this.initialValue;
          inputEl.dispatchEvent(new Event('input'));
          inputEl.select();
        }
      }
  }

  getItems(): string[] {
      return this.items;
  }

  getItemText(item: string): string {
      return item
  }

  async onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
      const selectedIndex = this.items.indexOf(item);
      await this.callback(selectedIndex);
  }

}
