/**
 * ย่อรูปก่อนเก็บ — localStorage มีพื้นที่จำกัด (~5 MB) จึงย่อด้านยาวไม่เกิน maxSize px และบีบอัดเป็น JPEG
 */
export async function resizeImageToDataUrl(file: File, maxSize = 720, quality = 0.72): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('ไฟล์ต้องเป็นรูปภาพ')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('เปิดรูปนี้ไม่ได้ ลองรูปอื่น'))
      el.src = url
    })
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('เบราว์เซอร์นี้ย่อรูปไม่ได้')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
