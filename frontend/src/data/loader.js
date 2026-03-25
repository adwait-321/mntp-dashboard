// Builds an in-memory index from the raw compact JSON
// records format: [Year, Product, Country, Category, Qty, Val]

export function buildIndex(raw) {
  const byProduct = {}
  const byCountry = {}

  for (const r of raw.records) {
    const [year, product, country, category, qty, val] = r

    if (!byProduct[product]) byProduct[product] = []
    byProduct[product].push({ year, country, category, qty, val })

    if (!byCountry[country]) byCountry[country] = []
    byCountry[country].push({ year, product, category, qty, val })
  }

  return {
    meta: raw.meta,
    byProduct,
    byCountry,
    raw: raw.records,
  }
}

export async function loadData() {
  // In Vite, JSON imports are supported natively via dynamic import
  const raw = await import('./apeda_compact.json')
  return buildIndex(raw.default ?? raw)
}