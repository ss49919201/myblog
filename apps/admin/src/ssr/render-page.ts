import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'

export function renderPage(element: ReactElement): string {
  return `<!DOCTYPE html>${renderToString(element)}`
}
