import HeroImageBox from './HeroImageBox'
import './HeroTitle.css'

function HeroTitle() {
  const startLetters = ['D', 'o']
  const endLetters = ['r', 'u', 'k']

  return (
    <div className="hero__h1">
      <div className="hero__h1-start">
        {startLetters.map((letter, index) => (
          <span key={`start-${index}`} className="hero__letter">
            {letter}
          </span>
        ))}
      </div>
      <HeroImageBox />
      <div className="hero__h1-end">
        {endLetters.map((letter, index) => (
          <span key={`end-${index}`} className="hero__letter">
            {letter}
          </span>
        ))}
      </div>
    </div>
  )
}

export default HeroTitle

