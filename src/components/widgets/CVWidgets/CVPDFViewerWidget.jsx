import BaseWidget from '../BaseWidget'

/* eslint-disable react/prop-types */
export default function CVPDFViewerWidget() {
  const pdfUrl = '/CV.pdf#toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit'

  return (
    <BaseWidget padding="0" style={{ overflow: 'hidden' }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <iframe
          src={pdfUrl}
          type="application/pdf"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            flex: 1,
            minHeight: 0,
          }}
          title="CV PDF Viewer"
        />
      </div>
    </BaseWidget>
  )
}
