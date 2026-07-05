<template>
  <main class="page">
    <section class="card">
      <div class="header">
        <div>
          <p class="eyebrow">Corat-Coret Bebas (galihjkCCB)</p>
          <h1>Gambar & kirim ke Telegram</h1>
        </div>
        <span class="badge">@galihjkdev</span>
      </div>

      <form class="meta" @submit.prevent>
        <label>
          Judul
          <input v-model.trim="title" type="text" placeholder="tanpa judul" />
        </label>
        <label>
          Penggambar
          <input v-model.trim="artist" type="text" placeholder="anonim" />
        </label>
      </form>

      <div class="toolbar">
        <label class="tool-control">
          Ukuran brush
          <div class="range-row">
            <input v-model.number="brushSize" type="range" min="2" max="70" />
            <strong>{{ brushSize }}px</strong>
          </div>
        </label>

        <label class="tool-control color-control">
          Warna
          <input v-model="brushColor" type="color" />
        </label>

        <div class="brush-preview" :style="brushPreviewStyle" title="Preview brush"></div>

        <button type="button" class="secondary" :disabled="!canUndo" @click="undoCanvas">Undo</button>
        <button type="button" class="secondary" :disabled="!canRedo" @click="redoCanvas">Redo</button>
        <button type="button" class="secondary" @click="clearCanvas">Bersihkan</button>
      </div>

      <div class="canvas-wrap">
        <canvas
          ref="canvasRef"
          class="drawing-canvas"
          :width="canvasWidth"
          :height="canvasHeight"
          @pointerdown="startDrawing"
          @pointermove="draw"
          @pointerup="stopDrawing"
          @pointerleave="stopDrawing"
          @pointercancel="stopDrawing"
        ></canvas>
      </div>

      <div class="actions">
        <p class="hint">Footer otomatis ikut menjadi bagian dari gambar saat dikirim.</p>
        <button type="button" class="submit" :disabled="isSubmitting" @click="submitDrawing">
          {{ isSubmitting ? 'Mengirim...' : 'Submit ke Telegram' }}
        </button>
      </div>

      <p v-if="message" :class="['message', messageType]">{{ message }}</p>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const title = ref('')
const artist = ref('')
const brushSize = ref(14)
const brushColor = ref('#111111')
const canvasRef = ref(null)
const isDrawing = ref(false)
const isSubmitting = ref(false)
const message = ref('')
const messageType = ref('success')

const canvasWidth = 900
const canvasHeight = 560
const footerHeight = 86

let ctx = null
let lastPoint = null
let history = []
let historyIndex = -1
const maxHistory = 60

const safeTitle = computed(() => title.value || 'tanpa judul')
const safeArtist = computed(() => artist.value || 'anonim')

const brushPreviewStyle = computed(() => ({
  width: `${Math.max(brushSize.value, 12)}px`,
  height: `${Math.max(brushSize.value, 12)}px`,
  backgroundColor: brushColor.value
}))

const canUndo = ref(false)
const canRedo = ref(false)

onMounted(async () => {
  await nextTick()
  setupCanvas()
  window.addEventListener('keydown', handleKeyboardShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardShortcut)
})

function setupCanvas() {
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  saveHistory()
}

function getPointerPosition(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  }
}

function startDrawing(event) {
  canvasRef.value.setPointerCapture(event.pointerId)
  isDrawing.value = true
  lastPoint = getPointerPosition(event)

  ctx.beginPath()
  ctx.fillStyle = brushColor.value
  ctx.arc(lastPoint.x, lastPoint.y, brushSize.value / 2, 0, Math.PI * 2)
  ctx.fill()
}

function draw(event) {
  if (!isDrawing.value || !lastPoint) return

  const currentPoint = getPointerPosition(event)
  ctx.strokeStyle = brushColor.value
  ctx.lineWidth = brushSize.value
  ctx.beginPath()
  ctx.moveTo(lastPoint.x, lastPoint.y)
  ctx.lineTo(currentPoint.x, currentPoint.y)
  ctx.stroke()

  lastPoint = currentPoint
}

function stopDrawing(event) {
  if (!isDrawing.value) return
  if (event?.pointerId && canvasRef.value.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId)
  }
  isDrawing.value = false
  lastPoint = null
  saveHistory()
}

function clearCanvas() {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  saveHistory()
  message.value = ''
}

function saveHistory() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return

  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1)
  }

  history.push(ctx.getImageData(0, 0, canvas.width, canvas.height))

  if (history.length > maxHistory) {
    history.shift()
  } else {
    historyIndex += 1
  }

  updateHistoryButtons()
}

function restoreHistory(index) {
  const snapshot = history[index]
  if (!snapshot || !ctx) return

  ctx.putImageData(snapshot, 0, 0)
  historyIndex = index
  message.value = ''
  updateHistoryButtons()
}

function undoCanvas() {
  if (historyIndex <= 0) return
  restoreHistory(historyIndex - 1)
}

function redoCanvas() {
  if (historyIndex >= history.length - 1) return
  restoreHistory(historyIndex + 1)
}

function updateHistoryButtons() {
  canUndo.value = historyIndex > 0
  canRedo.value = historyIndex < history.length - 1
}

function handleKeyboardShortcut(event) {
  const key = event.key.toLowerCase()
  const isUndo = (event.ctrlKey || event.metaKey) && key === 'z' && !event.shiftKey
  const isRedo = (event.ctrlKey || event.metaKey) && (key === 'y' || (key === 'z' && event.shiftKey))

  if (isUndo || isRedo) {
    event.preventDefault()
    if (isUndo) undoCanvas()
    if (isRedo) redoCanvas()
  }
}

function createFinalImageCanvas() {
  const source = canvasRef.value
  const output = document.createElement('canvas')
  output.width = source.width
  output.height = source.height + footerHeight

  const outputCtx = output.getContext('2d')
  outputCtx.fillStyle = '#ffffff'
  outputCtx.fillRect(0, 0, output.width, output.height)
  outputCtx.drawImage(source, 0, 0)

  outputCtx.fillStyle = '#f7f7f7'
  outputCtx.fillRect(0, source.height, output.width, footerHeight)

  outputCtx.strokeStyle = '#e7e7e7'
  outputCtx.lineWidth = 2
  outputCtx.beginPath()
  outputCtx.moveTo(0, source.height + 1)
  outputCtx.lineTo(output.width, source.height + 1)
  outputCtx.stroke()

  outputCtx.fillStyle = '#111111'
  outputCtx.textBaseline = 'top'
  outputCtx.font = '700 26px Arial, sans-serif'
  outputCtx.fillText(truncateText(outputCtx, safeTitle.value, 520), 28, source.height + 18)

  outputCtx.fillStyle = '#555555'
  outputCtx.font = '500 19px Arial, sans-serif'
  outputCtx.fillText(`by: ${truncateText(outputCtx, safeArtist.value, 480)}`, 28, source.height + 51)

  outputCtx.fillStyle = '#111111'
  outputCtx.textAlign = 'right'
  outputCtx.font = '700 24px Arial, sans-serif'
  outputCtx.fillText('@galihjkdev', output.width - 28, source.height + 46)

  return output
}

function truncateText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text

  let result = text
  while (result.length > 0 && context.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1)
  }
  return `${result}...`
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Gagal membuat file gambar.'))
    }, 'image/png')
  })
}

async function submitDrawing() {
  isSubmitting.value = true
  message.value = ''

  try {
    const finalCanvas = createFinalImageCanvas()
    const blob = await canvasToBlob(finalCanvas)
    const formData = new FormData()
    formData.append('photo', blob, 'galih-drawing.png')
    formData.append('title', safeTitle.value)
    formData.append('artist', safeArtist.value)

    const response = await fetch('/.netlify/functions/send-to-telegram', {
      method: 'POST',
      body: formData
    })

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(result.error || 'Gagal mengirim gambar ke Telegram.')
    }

    messageType.value = 'success'
    message.value = 'Berhasil dikirim ke channel Telegram.'
  } catch (error) {
    messageType.value = 'error'
    message.value = error.message || 'Terjadi kesalahan.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
