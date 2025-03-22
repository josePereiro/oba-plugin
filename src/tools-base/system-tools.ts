export async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Text copied to clipboard:\n', text);
    } catch (err) {
        console.error('Failed to copy text:\n', err);
    }
}