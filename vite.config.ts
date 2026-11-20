import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fg from 'fast-glob'
import MagicString from 'magic-string'
import { type DefaultTreeAdapterMap, parse } from 'parse5'
import { defineConfig, type Plugin } from 'vite'
import injectHTML from 'vite-plugin-html-inject'

const root = fileURLToPath(new URL('.', import.meta.url))

type HtmlNode = DefaultTreeAdapterMap['node']
type ElementLocation = NonNullable<
  DefaultTreeAdapterMap['element']['sourceCodeLocation']
>

interface StylesheetLink {
  href: string
  location: ElementLocation
}

const CSS_RE = /\.(?:css|scss|sass|less|styl|stylus|pcss)(?:[?#]|$)/i

function getStylesheetLinks(html: string): StylesheetLink[] {
  const links: StylesheetLink[] = []

  function visit(node: HtmlNode): void {
    if ('tagName' in node && node.tagName === 'link') {
      const attrs = Object.fromEntries(
        node.attrs.map(({ name, value }) => [name, value]),
      )

      if (
        attrs.rel?.toLowerCase().split(/\s+/).includes('stylesheet') &&
        attrs.href &&
        CSS_RE.test(attrs.href) &&
        !/^(?:[a-z][\w+.-]*:|\/\/)/i.test(attrs.href) &&
        node.sourceCodeLocation
      ) {
        links.push({
          href: attrs.href,
          location: node.sourceCodeLocation,
        })
      }
    }

    if ('childNodes' in node) {
      node.childNodes.forEach(visit)
    }

    if ('content' in node) {
      visit(node.content)
    }
  }

  visit(parse(html, { scriptingEnabled: false, sourceCodeLocationInfo: true }))

  return links
}

function resolveStylesheet(href: string): string {
  return path.resolve(root, href.split(/[?#]/)[0]!.replace(/^\//, ''))
}

async function getCssEntries(): Promise<Record<string, string>> {
  const htmlFiles = await fg(['index.html', '**/*.{html,htm}'], {
    cwd: root,
    absolute: true,
    ignore: ['node_modules/**', 'dist/**', 'public/**'],
  })

  const files = new Set<string>()

  for (const htmlFile of htmlFiles) {
    const html = readFileSync(htmlFile, 'utf8')

    for (const link of getStylesheetLinks(html)) {
      files.add(resolveStylesheet(link.href))
    }
  }

  return Object.fromEntries(
    [...files].map((file) => [`${crypto.randomUUID().split('-')[0]}`, file]),
  )
}

function preserveStylesheetLinks(): Plugin {
  return {
    name: 'preserve-stylesheet-links',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const result = new MagicString(html)

        for (const link of getStylesheetLinks(html)) {
          result.appendLeft(
            link.location.startOffset + 5,
            ' vite-ignore data-css-entry',
          )
        }

        return result.toString()
      },
    },
  }
}

function rewriteStylesheetLinks(): Plugin {
  let base = '/'

  return {
    name: 'rewrite-stylesheet-links',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!bundle) return html

        const outputs = new Map<string, string>()

        for (const asset of Object.values(bundle)) {
          if (asset.type !== 'asset') continue
          if (!asset.fileName.endsWith('.css')) continue

          for (const original of asset.originalFileNames ?? []) {
            outputs.set(path.resolve(root, original), asset.fileName)
          }
        }

        const result = new MagicString(html)

        for (const link of getStylesheetLinks(html)) {
          const { attrs } = link.location

          const marker = attrs?.['data-css-entry']
          const hrefLocation = attrs?.href

          if (!marker || !hrefLocation) continue

          const source = resolveStylesheet(link.href)
          const output = outputs.get(source)

          if (!output) {
            throw new Error(`Missing compiled stylesheet: ${source}`)
          }

          const prefix = base === '' || base === './' ? './' : base

          const url = `${prefix}${output}`
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')

          result.overwrite(
            hrefLocation.startOffset,
            hrefLocation.endOffset,
            `href="${url}"`,
          )

          result.remove(marker.startOffset, marker.endOffset)
        }

        return result.toString()
      },
    },
  }
}

export default defineConfig(async () => ({
  plugins: [injectHTML(), preserveStylesheetLinks(), rewriteStylesheetLinks()],
  build: {
    cssCodeSplit: true,
    rolldownOptions: {
      input: {
        index: path.join(root, 'index.html'),
        ...(await getCssEntries()),
      },
    },
  },
}))
