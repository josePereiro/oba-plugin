import { FuzzySuggestModal, Notice } from "obsidian";
import { App, Modal, Setting } from "obsidian";
import * as levenshtein from "fast-levenshtein";
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

// MARK: SimilarityModal
export class SimilarityModal extends Modal {
    private input = "";
    private options: string[];
    private selectedOption: string | null = null;
    private onSubmit: (selectedOption: string) => void;

    constructor(private oba: ObA, 
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