import { Banner, Button, Input, InputArea, Surface, Text } from '@cloudflare/kumo'
import { SITE_NAME } from '../theme'
import { KumoStyles } from './KumoStyles'

export type ComposePageProps = {
  title?: string
  bodyMd?: string
  errorMessage?: string
  publishedUrl?: string
}

export function ComposePage({
  title = '',
  bodyMd = '',
  errorMessage,
  publishedUrl,
}: ComposePageProps) {
  return (
    <html lang="ja" data-mode="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`新規入稿 | ${SITE_NAME}`}</title>
        <KumoStyles />
      </head>
      <body className="isolate min-h-screen bg-kumo-base text-kumo-default antialiased">
        <Surface className="mx-auto max-w-xl px-4 py-6">
          <header className="mb-6 border-b border-kumo-line pb-3">
            <div className="font-semibold">
              <Text variant="heading" size="lg">{SITE_NAME}</Text>
            </div>
          </header>
          <Surface className="rounded-lg border border-kumo-line bg-kumo-elevated p-4">
            {errorMessage ? (
              <Banner
                variant="error"
                title="入力エラー"
                description={errorMessage}
                className="mb-4"
              />
            ) : null}
            {publishedUrl ? (
              <Banner variant="default" title="公開しました。" className="mb-4">
                <a href={publishedUrl} className="break-all font-semibold underline">
                  {publishedUrl}
                </a>
              </Banner>
            ) : null}
            <form method="post" action="/" className="flex flex-col gap-4">
              <Input
                label="タイトル"
                name="title"
                type="text"
                required
                autoComplete="off"
                defaultValue={title}
              />
              <InputArea
                label="本文（Markdown）"
                name="body_md"
                required
                defaultValue={bodyMd}
                className="min-h-56"
              />
              <Button type="submit" variant="primary" className="w-full">
                公開する
              </Button>
            </form>
            <div className="mt-3">
              <Text variant="secondary" size="sm">
                slug は自動生成されます。公開日時は送信時刻です。
              </Text>
            </div>
          </Surface>
        </Surface>
      </body>
    </html>
  )
}
