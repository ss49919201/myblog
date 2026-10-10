import type { FC } from 'hono/jsx'
import type { PageMeta } from '../meta'
import { ogImage } from '../theme'

type MetaTagsProps = {
  meta: PageMeta
}

export const MetaTags: FC<MetaTagsProps> = ({ meta }) => (
  <>
    <meta property="og:title" content={meta.title} />
    <meta property="og:description" content={meta.description} />
    <meta property="og:type" content={meta.type} />
    <meta property="og:url" content={meta.url} />
    <meta property="og:image" content={meta.image} />
    <meta property="og:image:width" content={String(ogImage.width)} />
    <meta property="og:image:height" content={String(ogImage.height)} />
    <meta property="og:image:alt" content={meta.imageAlt} />
    <meta name="twitter:card" content="summary_large_image" />
  </>
)
