export async function generatePDFFromElement(element, filename) {
  const [{ default: jsPDF }, { toPng }] = await Promise.all([
    import('jspdf'),
    import('html-to-image'),
  ])

  const A4_W = 210, A4_H = 297
  const ML = 15, MR = 15, MT = 15, MB = 22
  const contentW = A4_W - ML - MR
  const contentH = A4_H - MT - MB

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  // Each .pdf-page child becomes its own page (split if taller than A4)
  const pageSections = element.querySelectorAll('.pdf-page')
  const sections = pageSections.length > 0 ? Array.from(pageSections) : [element]

  let pageIndex = 0

  function addFooter() {
    pdf.setDrawColor(208, 206, 199)
    pdf.setLineWidth(0.25)
    pdf.line(ML, A4_H - MB + 4, A4_W - MR, A4_H - MB + 4)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(158, 158, 142)
    pdf.text('Sagar Sirikonda  ·  Temporal Perception Study', ML, A4_H - MB + 9)
    pdf.text(`Page ${pageIndex}`, A4_W - MR, A4_H - MB + 9, { align: 'right' })
  }

  for (const section of sections) {
    const dataUrl = await toPng(section, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    })

    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = dataUrl
    })

    const elemW = image.width / 2
    const elemH = image.height / 2
    if (elemW < 50) continue

    const scale = contentW / elemW
    const totalMmH = elemH * scale
    const numSubPages = Math.ceil(totalMmH / contentH)

    for (let p = 0; p < numSubPages; p++) {
      if (pageIndex > 0) pdf.addPage()
      pageIndex++

      const skipPx = Math.round((p * contentH / scale) * 2)
      const takePx = Math.min(
        Math.round((contentH / scale) * 2),
        image.height - skipPx,
      )

      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = takePx
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, -skipPx)

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', ML, MT, contentW, (takePx / 2) * scale)
      addFooter()
    }
  }

  pdf.save(filename)
}
