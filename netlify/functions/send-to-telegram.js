export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME

  if (!botToken || !channelUsername) {
    return jsonResponse(500, {
      error: 'Environment variable TELEGRAM_BOT_TOKEN dan TELEGRAM_CHANNEL_USERNAME wajib diisi.'
    })
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type']

    if (!contentType || !contentType.includes('multipart/form-data')) {
      return jsonResponse(400, { error: 'Request harus multipart/form-data.' })
    }

    const incomingForm = await requestToFormData(event, contentType)
    const photo = incomingForm.get('photo')
    const title = incomingForm.get('title') || 'tanpa judul'
    const artist = incomingForm.get('artist') || 'anonim'

    if (!photo) {
      return jsonResponse(400, { error: 'File gambar tidak ditemukan.' })
    }

    const chatId = normalizeChannelUsername(channelUsername)
    const telegramForm = new FormData()
    telegramForm.append('chat_id', chatId)
    telegramForm.append('caption', `${title}\nby: ${artist}`)
    telegramForm.append('photo', photo, 'galih-drawing.png')

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: telegramForm
    })

    const telegramResult = await telegramResponse.json()

    if (!telegramResponse.ok || !telegramResult.ok) {
      const description = telegramResult.description || 'Telegram menolak request.'
      return jsonResponse(telegramResponse.status || 500, { error: description })
    }

    return jsonResponse(200, { ok: true })
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Gagal mengirim gambar ke Telegram.' })
  }
}

async function requestToFormData(event, contentType) {
  const bodyBuffer = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64')
    : Buffer.from(event.body || '')

  const request = new Request('http://localhost/upload', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: bodyBuffer
  })

  return request.formData()
}

function normalizeChannelUsername(value) {
  const trimmed = String(value).trim()
  if (trimmed.startsWith('@') || trimmed.startsWith('-100')) return trimmed
  return `@${trimmed}`
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }
}
