import { Link, Surface, Text } from '@cloudflare/kumo'
import type { ReactNode } from 'react'
import type { PageMeta } from '../meta'
import { SITE_NAME } from '../theme'
import { KumoStyles } from './KumoStyles'
import { MetaTags } from './MetaTags'

type LayoutProps = {
  title: string
  meta: PageMeta
  children: ReactNode
}

export function Layout({ title, meta, children }: LayoutProps) {
  return (
    <html lang="ja" data-mode="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={meta.description} />
        <title>{title}</title>
        <MetaTags meta={meta} />
        <KumoStyles />
      </head>
      <body className="isolate min-h-screen bg-kumo-base text-kumo-default antialiased">
        <Surface className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-9">
          <header className="mb-8 border-b border-kumo-line pb-4">
            <div className="m-0 font-semibold text-kumo-strong">
              <Text variant="heading" size="lg">
                <Link href="/" variant="plain">
                  {SITE_NAME}
                </Link>
              </Text>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-10 border-t border-kumo-line pt-4">
            <Text variant="secondary" size="sm">
              SSR with React and Kumo on Cloudflare Workers
            </Text>
          </footer>
        </Surface>
      </body>
    </html>
  )
}
