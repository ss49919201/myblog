import kumoCss from '@cloudflare/kumo/styles/standalone?inline'

export function KumoStyles() {
  return <style dangerouslySetInnerHTML={{ __html: kumoCss }} />
}
