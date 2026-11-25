import { fetchAll, supabase } from './supabase.ts'
import { normalizeCatalogRow, parseFacet, type FacetRow, type PublicRecord } from './catalog.ts'

export type CatalogPayload = {
  rows: PublicRecord[]
  facets: FacetRow[] | null
  source: 'public_records'
}

const PUBLIC_COLUMNS =
  'id,category,category_label,subcategory,title,name,description,organization,country,city,city_region,language_community,website,source_url,details_link,source,published_date,status,priority,reliability,potential,partner_type,rating_score,audience_size,audience_source,language_group,language_group_label,nationality,platform,entity_type,date_added,last_updated,last_checked,synced_at,language_group_label_sk,relation_type,suggested_relation_type,relation_reason,best_channel,channel_reason,geo_scope'

export async function loadCatalogData(): Promise<CatalogPayload> {
  const raw = await fetchAll<Record<string, unknown>>((from, to) =>
    supabase.from('public_records').select(PUBLIC_COLUMNS).order('id', { ascending: true }).range(from, to),
  )
  const rows = raw.map(normalizeCatalogRow).filter((row): row is PublicRecord => row !== null)
  let facets: FacetRow[] | null = null
  const probe = await supabase.from('catalog_facets').select('language_group,platform,n').limit(1)
  if (!probe.error) {
    const facetRows = await fetchAll<Record<string, unknown>>((from, to) =>
      supabase
        .from('catalog_facets')
        .select('language_group,platform,n')
        .order('language_group', { ascending: true })
        .order('platform', { ascending: true })
        .range(from, to),
    )
    facets = facetRows.map(parseFacet).filter((row): row is FacetRow => row !== null)
  }
  return { rows, facets, source: 'public_records' }
}
