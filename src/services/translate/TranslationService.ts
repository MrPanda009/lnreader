const GOOGLE_URL = 'https://translation.googleapis.com/language/translate/v2';

export async function translateChapterContent(
    html: string,
    targetLang: string,
    apiKey: string,
): Promise<string> {
    // Match every <p>...</p> block (including multiline content)
    const TAG_RE = /(<p(?:\s[^>]*)?>)([\s\S]*?)(<\/p>)/gi;
    const matches = [...html.matchAll(TAG_RE)];

    if (!matches.length) {
        // No <p> tags — translate as a plain block (rare fallback)
        const plain = stripTags(html);
        const result = await googleBatch([plain], targetLang, apiKey);
        return result[0];
    }

    // Pull out only the inner text of each <p>, preserving order
    const texts = matches.map(m => stripTags(m[2]).trim()).filter(Boolean);

    // Batch into ≤4500 char chunks (Google's soft limit per string)
    const batches = buildBatches(texts, 4500);

    // Translate all batches in parallel
    const translated = (
        await Promise.all(batches.map(b => googleBatch(b, targetLang, apiKey)))
    ).flat();

    // Reinsert translated text back into original <p> tags
    let i = 0;
    return html.replace(TAG_RE, (_, open, inner, close) => {
        const text = stripTags(inner).trim();
        if (!text) return `${open}${inner}${close}`; // empty <p>, leave as-is
        return `${open}${translated[i++] ?? inner}${close}`;
    });
}

async function googleBatch(
    texts: string[],
    targetLang: string,
    apiKey: string,
): Promise<string[]> {
    const res = await fetch(`${GOOGLE_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texts, target: targetLang, format: 'text' }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Google API error ${res.status}`);
    }
    const data = await res.json();
    return data.data.translations.map((t: any) => t.translatedText as string);
}

function buildBatches(texts: string[], maxChars: number): string[][] {
    const batches: string[][] = [];
    let current: string[] = [], count = 0;
    for (const t of texts) {
        if (count + t.length > maxChars && current.length) {
            batches.push(current);
            current = [];
            count = 0;
        }
        current.push(t);
        count += t.length;
    }
    if (current.length) batches.push(current);
    return batches;
}

function stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}