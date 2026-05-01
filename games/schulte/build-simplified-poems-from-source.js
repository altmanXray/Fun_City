const fs = require('fs');
const path = require('path');
const opencc = require('opencc-js');

const converter = opencc.Converter({ from: 'tw', to: 'cn' });
const sourceReferencePath = path.join(__dirname, 'poems-tang300.json');
const outputPath = path.join(__dirname, 'poems-tang300-simplified.json');
const repoApiUrl = 'https://api.github.com/repos/chinese-poetry/chinese-poetry-zhCN/contents/poetry?ref=master';

function buildExactKey(poem) {
    return [
        poem.author || '',
        poem.title || '',
        Array.isArray(poem.paragraphs) ? poem.paragraphs.join('') : ''
    ].join('||');
}

function buildNormalizedKey(poem) {
    return [
        (poem.author || '').replace(/\s+/g, ''),
        (poem.title || '').replace(/\s+/g, ''),
        (Array.isArray(poem.paragraphs) ? poem.paragraphs.join('') : '').replace(/\s+/g, '')
    ].join('||');
}

function convertTraditionalReference(poem) {
    return {
        ...poem,
        author: converter(poem.author || ''),
        paragraphs: Array.isArray(poem.paragraphs) ? poem.paragraphs.map(line => converter(line)) : [],
        title: converter(poem.title || '')
    };
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'LittleGame-Schulte-Build'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.json();
}

async function main() {
    const traditionalPoems = JSON.parse(fs.readFileSync(sourceReferencePath, 'utf8'));
    const convertedReferences = traditionalPoems.map(convertTraditionalReference);

    const directoryListing = await fetchJson(repoApiUrl);
    const tangFileUrls = directoryListing
        .filter(item => item.name.startsWith('poet.tang.') && item.name.endsWith('.json'))
        .map(item => item.download_url)
        .sort((a, b) => a.localeCompare(b, 'en'));

    const simplifiedPoems = [];

    for (const url of tangFileUrls) {
        const poems = await fetchJson(url);
        simplifiedPoems.push(...poems);
    }

    const exactMap = new Map();
    const normalizedMap = new Map();

    simplifiedPoems.forEach(poem => {
        exactMap.set(buildExactKey(poem), poem);
        normalizedMap.set(buildNormalizedKey(poem), poem);
    });

    const extracted = [];
    const unmatched = [];

    traditionalPoems.forEach((traditionalPoem, index) => {
        const convertedReference = convertedReferences[index];
        const exactMatch = exactMap.get(buildExactKey(convertedReference));
        const normalizedMatch = normalizedMap.get(buildNormalizedKey(convertedReference));
        const match = exactMatch || normalizedMatch;

        if (!match) {
            unmatched.push({
                author: traditionalPoem.author,
                title: traditionalPoem.title
            });
            return;
        }

        extracted.push({
            author: match.author,
            id: traditionalPoem.id || `${traditionalPoem.title}-${traditionalPoem.author}-${index}`,
            paragraphs: match.paragraphs,
            pinyin: traditionalPoem.pinyin || '',
            tags: match.tags || traditionalPoem.tags || [],
            title: match.title
        });
    });

    if (unmatched.length > 0) {
        console.error(`unmatched=${unmatched.length}`);
        console.error(JSON.stringify(unmatched.slice(0, 20), null, 2));
        process.exit(1);
    }

    fs.writeFileSync(outputPath, JSON.stringify(extracted, null, 2));
    console.log(`generated=${extracted.length}`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
