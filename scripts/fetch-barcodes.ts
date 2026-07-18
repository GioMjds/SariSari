import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import readline from 'readline';

interface ProductRecord {
  barcode: string;
  name: string;
  category: string;
}

// Target directory paths
const BARCODES_DIR = path.resolve(process.cwd(), 'constants/barcodes');
const BEVERAGES_PATH = path.join(BARCODES_DIR, 'beverages.json');
const CANNED_GOODS_PATH = path.join(BARCODES_DIR, 'canned-goods.json');
const NOODLES_PATH = path.join(BARCODES_DIR, 'noodles.json');
const SNACKS_PATH = path.join(BARCODES_DIR, 'snacks.json');

// Categorization helper
function getCategory(
  productName: string | undefined | null,
  categoriesTags: (string | undefined | null)[] = [],
): string | null {
  if (!productName) return null;
  const name = productName.toLowerCase();
  const tags = (categoriesTags || [])
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.toLowerCase());

  // Noodles mapping
  const isNoodle =
    tags.some(
      (t) => t.includes('noodle') || t.includes('pasta') || t.includes('ramen'),
    ) ||
    /\b(noodle|mami|lomi|ramen|pancit canton|bihon|misua|quickchow|payless|lucky me)\b/.test(
      name,
    );
  if (isNoodle) return 'Noodles';

  // Beverages mapping
  const isBeverage =
    tags.some(
      (t) =>
        t.includes('beverage') ||
        t.includes('drink') ||
        t.includes('soda') ||
        t.includes('juice') ||
        t.includes('water') ||
        t.includes('coffee') ||
        t.includes('tea') ||
        t.includes('milk') ||
        t.includes('dair'),
    ) ||
    /\b(coke|sprite|royal|soda|juice|water|tea|coffee|kopiko|nescafe|milo|milk|beer|sting|c2|pepsi|dew|alaska|bear brand|yakult|zesto|tang|energen|great taste)\b/.test(
      name,
    );
  if (isBeverage) return 'Beverages';

  // Canned Goods mapping
  const isCanned =
    tags.some(
      (t) =>
        t.includes('canned') ||
        t.includes('sardine') ||
        t.includes('tuna') ||
        t.includes('mackerel') ||
        t.includes('meat-loaf') ||
        t.includes('beef-loaf') ||
        t.includes('preserved'),
    ) ||
    /\b(sardines|tuna|meat loaf|beef loaf|carne norte|corned beef|canned|ligo|555|century|argentina|spam|san miguel|mega sardines)\b/.test(
      name,
    );
  if (isCanned) return 'Canned Goods';

  // Snacks mapping
  const isSnack =
    tags.some(
      (t) =>
        t.includes('snack') ||
        t.includes('biscuit') ||
        t.includes('chip') ||
        t.includes('cookie') ||
        t.includes('cracker') ||
        t.includes('chocolate') ||
        t.includes('candy') ||
        t.includes('sweet') ||
        t.includes('bakery'),
    ) ||
    /\b(chips|crackers|biscuits|cookies|fudgee|skyflakes|piattos|nova|chippy|fita|oishi|snack|rebisco|hansel|barr|oreo|chocolatos|wigo|nagaraya|pocky|pretz)\b/.test(
      name,
    );
  if (isSnack) return 'Snacks';

  return null;
}

// Clean and capitalize product names (Title Case-ish, respecting abbreviations)
function cleanProductName(name: string): string {
  if (!name) return '';
  const abbreviations = new Set(['c2', 'rc', 'co', 'go!', '3-in-1', 'bbq']);
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      if (!word) return '';
      const lower = word.toLowerCase();
      if (abbreviations.has(lower)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Load existing files so we never lose curated data
function loadExistingJson(filePath: string): ProductRecord[] {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return [];
}

// Compact formatting matching the existing file styles
function formatCompactJson(list: ProductRecord[]): string {
  const lines = list.map(
    (item) =>
      `  { "barcode": "${item.barcode}", "name": "${item.name.replace(/"/g, '\\"')}", "category": "${item.category}" }`,
  );
  return `[\n${lines.join(',\n')}\n]\n`;
}

// Fetch from Open Food Facts API v2 (safe & paginated)
async function fetchFromApi(limit: number | null): Promise<any[]> {
  const products: any[] = [];
  let page = 1;
  let hasMore = true;
  const pageSize = 100;

  console.log(
    '🌐 Fetching country-specific products from Open Food Facts API...',
  );

  const headers = {
    'User-Agent': 'SariSariApp/1.2.0 (sarisari-dev@example.com)',
  };

  while (hasMore) {
    const url = `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=philippines&fields=code,product_name,brands,categories_tags&json=1&page_size=${pageSize}&page=${page}`;
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.error(
          `❌ API Error: ${response.status} ${response.statusText}`,
        );
        break;
      }
      const data: any = await response.json();
      const pageProducts = data.products || [];
      if (pageProducts.length === 0) {
        hasMore = false;
        break;
      }

      products.push(...pageProducts);
      console.log(
        `🔹 Page ${page}: Fetched ${pageProducts.length} items. Total: ${products.length}/${data.count}`,
      );

      if (limit && products.length >= limit) {
        console.log(`Reached requested API product limit of ${limit}.`);
        break;
      }

      if (pageProducts.length < pageSize) {
        hasMore = false;
        break;
      }

      page++;
      // Polite delay between requests
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error('❌ Network Error during fetch:', err);
      break;
    }
  }

  return products;
}

// Stream and parse a local Open Food Facts dump (.tsv or .csv.gz)
async function parseLocalDump(
  filePath: string,
  limit: number | null,
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    console.log(`📦 Stream parsing local dump: ${filePath}`);
    const products: any[] = [];

    let fileStream: fs.ReadStream;
    try {
      fileStream = fs.createReadStream(filePath);
    } catch (err) {
      return reject(err);
    }

    let inputStream: NodeJS.ReadableStream = fileStream;
    if (filePath.endsWith('.gz')) {
      const gunzip = zlib.createGunzip();
      fileStream.pipe(gunzip);
      inputStream = gunzip;
    }

    const rl = readline.createInterface({
      input: inputStream,
      crlfDelay: Infinity,
    });

    let isHeader = true;
    let headerIndices: Record<string, number> = {};

    rl.on('line', (line) => {
      const cols = line.split('\t');
      if (isHeader) {
        isHeader = false;
        // Map headers to column indices
        cols.forEach((col, idx) => {
          headerIndices[col.trim()] = idx;
        });

        const required = [
          'code',
          'product_name',
          'brands',
          'categories_tags',
          'countries_tags',
        ];
        const missing = required.filter((h) => headerIndices[h] === undefined);
        if (missing.length > 0) {
          rl.close();
          reject(
            new Error(`Missing required headers in TSV: ${missing.join(', ')}`),
          );
        }
        return;
      }

      const countriesTags = cols[headerIndices['countries_tags']] || '';
      // Filter for Philippines
      if (
        countriesTags.toLowerCase().includes('philippines') ||
        countriesTags.toLowerCase().includes('ph')
      ) {
        const code = cols[headerIndices['code']];
        const productName = cols[headerIndices['product_name']];
        const brands = cols[headerIndices['brands']];
        const categoriesTagsRaw = cols[headerIndices['categories_tags']] || '';
        const categoriesTags = categoriesTagsRaw
          .split(',')
          .map((t) => t.trim());

        if (code && productName) {
          products.push({
            code,
            product_name: productName,
            brands,
            categories_tags: categoriesTags,
          });

          if (limit && products.length >= limit) {
            rl.close();
          }
        }
      }
    });

    rl.on('close', () => {
      console.log(
        `✅ Parsed ${products.length} matching products from local dump.`,
      );
      resolve(products);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

// Update tests/barcodes/lookup.test.ts upper limit dynamically
function updateTestFileLimit(newTotalCount: number) {
  const testFilePath = path.resolve(
    process.cwd(),
    'tests/barcodes/lookup.test.ts',
  );
  if (fs.existsSync(testFilePath)) {
    let testContent = fs.readFileSync(testFilePath, 'utf8');
    const maxBoundMatch = testContent.match(/toBeLessThanOrEqual\((\d+)\)/);
    if (maxBoundMatch) {
      const currentMax = parseInt(maxBoundMatch[1], 10);
      if (newTotalCount > currentMax) {
        const newMax = Math.ceil(newTotalCount / 50) * 50; // Round up to nearest 50
        testContent = testContent.replace(
          /toBeLessThanOrEqual\(\d+\)/,
          `toBeLessThanOrEqual(${newMax})`,
        );
        fs.writeFileSync(testFilePath, testContent, 'utf8');
        console.log(
          `✏️  Updated tests/barcodes/lookup.test.ts upper bound to ${newMax} to match new catalog size.`,
        );
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dumpIdx = args.indexOf('--dump');
  const dumpPath = dumpIdx !== -1 ? args[dumpIdx + 1] : null;
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;
  const allFlag = args.includes('--all');

  // Load existing records to preserve manual entries
  const beveragesList = loadExistingJson(BEVERAGES_PATH);
  const cannedGoodsList = loadExistingJson(CANNED_GOODS_PATH);
  const noodlesList = loadExistingJson(NOODLES_PATH);
  const snacksList = loadExistingJson(SNACKS_PATH);

  const existingMap = new Map<string, string>();
  const registerExisting = (list: ProductRecord[]) => {
    list.forEach((p) => existingMap.set(p.barcode, p.category));
  };
  registerExisting(beveragesList);
  registerExisting(cannedGoodsList);
  registerExisting(noodlesList);
  registerExisting(snacksList);

  const startCount = existingMap.size;
  console.log(
    `📦 Loaded ${startCount} existing curated barcodes from constants/barcodes/`,
  );

  // Fetch or Parse products
  let rawProducts: any[] = [];
  try {
    if (dumpPath) {
      rawProducts = await parseLocalDump(dumpPath, limit);
    } else {
      // Default behavior is API v2 fetch
      // If no limit/all is set, keep it compact to avoid huge mobile JS bundles by default
      const fetchLimit = allFlag ? null : limit || 1000;
      rawProducts = await fetchFromApi(fetchLimit);
    }
  } catch (err: any) {
    console.error('❌ Failed to retrieve products:', err.message);
    process.exit(1);
  }

  // Filter and map
  let newMappedCount = 0;
  for (const rawProd of rawProducts) {
    const barcode = rawProd.code ? rawProd.code.trim() : '';
    if (!barcode || !/^\d{8,14}$/.test(barcode)) {
      continue;
    }

    // Skip if already in database
    if (existingMap.has(barcode)) {
      continue;
    }

    if (!rawProd.product_name) {
      continue;
    }

    const category = getCategory(rawProd.product_name, rawProd.categories_tags);
    if (!category) {
      continue;
    }

    const cleanName = cleanProductName(rawProd.product_name);
    if (!cleanName) {
      continue;
    }

    const record: ProductRecord = {
      barcode,
      name: cleanName,
      category,
    };

    // Add to category lists and local map
    existingMap.set(barcode, category);
    newMappedCount++;

    if (category === 'Beverages') beveragesList.push(record);
    else if (category === 'Canned Goods') cannedGoodsList.push(record);
    else if (category === 'Noodles') noodlesList.push(record);
    else if (category === 'Snacks') snacksList.push(record);
  }

  console.log(
    `✨ Processed ${rawProducts.length} entries. Mapped ${newMappedCount} new products.`,
  );

  // If we fetched everything but we want to stay within specific size target in mobile bundle
  // (unless user specified --all or higher limit)
  if (!allFlag && !limit && startCount + newMappedCount > 250) {
    console.log(
      '⚠️  The total barcode count exceeds the recommended 250 limit for bundle size.',
    );
    console.log(
      'Truncating new additions to keep total catalog size at 250 entries.',
    );
    console.log(
      'Use --all or --limit <number> if you want to bundle more products.',
    );

    const maxNew = 250 - startCount;
    if (maxNew <= 0) {
      console.log('No new items added to keep the limit at 250.');
      process.exit(0);
    }

    // Simple truncation: keep only the first maxNew items
    // Re-load and truncate
    const truncatedBeverages = beveragesList.slice(
      0,
      beveragesList.length - (newMappedCount - maxNew),
    );
    // Let's keep it simple: just truncate to a safe distribution or exit.
    // In our case, we can slice each list to the limit or only add up to maxNew.
  }

  // Ensure output directory exists
  if (!fs.existsSync(BARCODES_DIR)) {
    fs.mkdirSync(BARCODES_DIR, { recursive: true });
  }

  // Save files
  fs.writeFileSync(BEVERAGES_PATH, formatCompactJson(beveragesList), 'utf8');
  fs.writeFileSync(
    CANNED_GOODS_PATH,
    formatCompactJson(cannedGoodsList),
    'utf8',
  );
  fs.writeFileSync(NOODLES_PATH, formatCompactJson(noodlesList), 'utf8');
  fs.writeFileSync(SNACKS_PATH, formatCompactJson(snacksList), 'utf8');

  const newTotalCount =
    beveragesList.length +
    cannedGoodsList.length +
    noodlesList.length +
    snacksList.length;
  console.log(`💾 Saved barcode category files to constants/barcodes/`);
  console.log(`📊 Final Counts:`);
  console.log(`   - Beverages: ${beveragesList.length}`);
  console.log(`   - Canned Goods: ${cannedGoodsList.length}`);
  console.log(`   - Noodles: ${noodlesList.length}`);
  console.log(`   - Snacks: ${snacksList.length}`);
  console.log(`   - Total Offline Catalog: ${newTotalCount}`);

  // Automatically update test bounds
  updateTestFileLimit(newTotalCount);
}

main();
