import 'katex/dist/katex.min.css'
import katex from 'katex'
import { FEATURES } from '../../lib/features'

/** Simple markdown: **bold** only; optional KaTeX via $...$ */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\$(?:\\.|[^$\\])+\$)/g)
  return (
    <span className="rich-text">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('$') && part.endsWith('$') && FEATURES.katex) {
          const latex = part.slice(1, -1)
          const html = katex.renderToString(latex, { throwOnError: false })
          return (
            <span key={i} dangerouslySetInnerHTML={{ __html: html }} aria-label={latex} />
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
