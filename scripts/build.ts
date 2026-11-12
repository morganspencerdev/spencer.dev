import { rm } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

import type { BunPlugin } from 'bun'

const root = process.cwd()
const dist = resolve(root, 'dist')

await rm(dist, {
  recursive: true,
  force: true,
})

const fontAssetMap = new Map<string, string>()

await Bun.build({
  entrypoints: ['index.html'],
  outdir: 'dist',
  minify: true,
  check: true,
  plugins: [
    {
      name: 'external-fonts-workaround',
      setup(build) {
        build.onResolve({ filter: /\.(woff2?|ttf|eot|otf)$/ }, (args) => {
          const absPath = resolve(args.resolveDir, args.path)
          const fileName = basename(args.path)
          fontAssetMap.set(fileName, absPath)

          return { path: './' + fileName, external: true }
        })
      },
    },
  ],
})

for (const [fileName, sourcePath] of fontAssetMap) {
  await Bun.write(`dist/${fileName}`, Bun.file(sourcePath))
}
