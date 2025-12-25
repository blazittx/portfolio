import './HeroImageBox.css'

const IMAGE_URLS = {
  extra1: "https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724bc_minimalist-architecture-2.avif",
  extra2: "https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724cf_minimalist-architecture-4.avif",
  extra3: "https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724c5_minimalist-architecture-3.avif",
  main: "https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724b0_minimalist-architecture-1.avif"
}

function HeroImageBox() {
  return (
    <div className="hero-loader__box">
      <div className="hero-loader__box-inner">
        <div className="hero__growing-image">
          <div className="hero__growing-image-wrap">
            <img 
              className="hero__cover-image-extra is--1" 
              src={IMAGE_URLS.extra1} 
              loading="lazy" 
              alt="" 
            />
            <img 
              className="hero__cover-image-extra is--2" 
              src={IMAGE_URLS.extra2} 
              loading="lazy" 
              alt="" 
            />
            <img 
              className="hero__cover-image-extra is--3" 
              src={IMAGE_URLS.extra3} 
              loading="lazy" 
              alt="" 
            />
            <img 
              className="hero__cover-image" 
              src={IMAGE_URLS.main} 
              loading="lazy" 
              alt="" 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroImageBox

