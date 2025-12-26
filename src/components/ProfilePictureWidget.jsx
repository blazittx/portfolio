import BaseWidget from './BaseWidget'

/* eslint-disable react/prop-types */
export default function ProfilePictureWidget({ widget }) {

  const handleClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (widget?.onToggleExpand) {
      widget.onToggleExpand()
    }
  }

  const getImageStyle = () => {
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '4px',
      display: 'block',
      cursor: 'pointer',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }

  const getContainerStyle = () => {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      cursor: 'pointer'
    }
  }

  return (
    <BaseWidget padding="0.75rem">
      <div 
        style={getContainerStyle()}
        onClick={handleClick}
        onMouseDown={(e) => {
          // Prevent drag when clicking on the image
          e.stopPropagation()
        }}
      >
        <img 
          src="/profilePic.png" 
          alt="Profile Picture" 
          style={getImageStyle()}
          onClick={handleClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        />
      </div>
    </BaseWidget>
  )
}

