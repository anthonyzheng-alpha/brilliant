import { RichText } from '../common/RichText'
import './FactoringExpression.css'

type Props = {
  expression: string
}

export function FactoringExpression({ expression }: Props) {
  return (
    <div className="factoring-expression" aria-label={`Expression to factor: ${expression}`}>
      <RichText text={`$${expression}$`} />
    </div>
  )
}
