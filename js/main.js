const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

let width = window.innerWidth
let height = window.innerHeight

canvas.width = width
canvas.height = height

window.addEventListener('resize', () => {
	width = window.innerWidth
	height = window.innerHeight
	canvas.width = width
	canvas.height = height
})
/*
canvas.style.overflow = 'hidden'
canvas.style.borderRadius = '1rem'*/

const canvasCtx = canvas.getContext('2d')

let analyser, bufferLength, dataArray, oscillator, audioCtx

/*
const freqSlider = document.createElement('input')
freqSlider.type = 'range'
freqSlider.min = '0'
freqSlider.max = '24000'
freqSlider.style.width = '400px'
freqSlider.value = '100'
document.body.appendChild(freqSlider)
*/

function autoCorrelate(buf) {
	const sampleRate = 48000
	// Implements the ACF2+ algorithm
	var SIZE = buf.length
	var rms = 0

	for (var i = 0; i < SIZE; i++) {
		var val = buf[i]
		rms += val * val
	}
	rms = Math.sqrt(rms / SIZE)
	if (rms < 0.01)
		// not enough signal
		return -1

	var r1 = 0,
		r2 = SIZE - 1,
		thres = 0.2
	for (var i = 0; i < SIZE / 2; i++)
		if (Math.abs(buf[i]) < thres) {
			r1 = i
			break
		}
	for (var i = 1; i < SIZE / 2; i++)
		if (Math.abs(buf[SIZE - i]) < thres) {
			r2 = SIZE - i
			break
		}

	buf = buf.slice(r1, r2)
	SIZE = buf.length

	var c = new Array(SIZE).fill(0)
	for (var i = 0; i < SIZE; i++)
		for (var j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i]

	var d = 0
	while (c[d] > c[d + 1]) d++
	var maxval = -1,
		maxpos = -1
	for (var i = d; i < SIZE; i++) {
		if (c[i] > maxval) {
			maxval = c[i]
			maxpos = i
		}
	}
	var T0 = maxpos

	var x1 = c[T0 - 1],
		x2 = c[T0],
		x3 = c[T0 + 1]
	a = (x1 + x3 - 2 * x2) / 2
	b = (x3 - x1) / 2
	if (a) T0 = T0 - b / (2 * a)

	return sampleRate / T0
}

let buf = new Float32Array(2048)

const amps = [20, 40, 60, 80]

canvasCtx.fillStyle = '#111827'
canvasCtx.fillRect(0, 0, width, height)

/*
canvasCtx.font = '24vw Arial'
canvasCtx.fillStyle = '#1F293748'
canvasCtx.textAlign = 'right'
canvasCtx.textBaseline = 'bottom'
canvasCtx.fillText('Sing4U', width - 20, height - 20)
*/

amps.map((item) => {
	canvasCtx.lineWidth = 1
	canvasCtx.strokeStyle = '#1F2937'

	canvasCtx.beginPath()

	const h = height / 90
	const y = h * item

	canvasCtx.moveTo(0, y)
	canvasCtx.lineTo(width, y)

	canvasCtx.stroke()

	canvasCtx.font = '8pt Arial'
	canvasCtx.fillStyle = '#FFFFFF'
	canvasCtx.textAlign = 'right'
	canvasCtx.textBaseline = 'middle'
	canvasCtx.fillText('-' + item + 'dB', width - 10, y)
})

const ranges = [32, 65, 130, 260, 520, 1000, 2000, 4000, 8000, 16000]

ranges.map((item, index) => {
	canvasCtx.lineWidth = 1
	canvasCtx.strokeStyle = '#1F2937'

	const freq = (bufferLength / 24000) * item

	const w = width / Math.log10(bufferLength)
	const x = Math.log10(freq) * w

	canvasCtx.beginPath()

	canvasCtx.moveTo(x, 0)
	canvasCtx.lineTo(x, height)

	canvasCtx.stroke()
	canvasCtx.font = '8pt Arial'
	canvasCtx.fillStyle = '#FFFFFF'
	canvasCtx.textAlign = 'center'
	canvasCtx.fillText(`C${index + 1}`, x, height - 20)

	const text = item > 999 ? `${item / 1000}kHz` : `${item}Hz`

	canvasCtx.font = '8pt Arial'
	canvasCtx.fillStyle = '#FFFFFF'
	canvasCtx.textAlign = 'center'
	canvasCtx.fillText(text, x, height - 10)
})

function noteFromPitch(frequency) {
	var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2))
	return Math.round(noteNum) + 69
}

function draw() {
	requestAnimationFrame(draw)

	/*
	oscillator.frequency.setValueAtTime(
		freqSlider.valueAsNumber,
		audioCtx.currentTime
	)
    */
	analyser.getByteFrequencyData(dataArray)

	analyser.getFloatTimeDomainData(buf)
	const ac = autoCorrelate(buf)

	canvasCtx.clearRect(0, 0, width, height)

	// const ranges = [
	// 	40,
	// 	100,
	// 	200,
	// 	400,
	// 	600,
	// 	1000,
	// 	2000,
	// 	4000,
	// 	6000,
	// 	10000,
	// 	20000,
	// ]

	var noteStrings = [
		'C',
		'C#',
		'D',
		'D#',
		'E',
		'F',
		'F#',
		'G',
		'G#',
		'A',
		'A#',
		'B',
	]
	/*

	const notes = []

	for (let i = 55 / 2; Math.round(i) <= 24000; i = i * Math.pow(2, 1 / 12)) {
		notes.push(i)
	}

	let octave = 1

	notes.map((note) => {
		const freq = (bufferLength / 24000) * note

		const w = width / Math.log10(bufferLength)
		const x = Math.log10(freq) * w

		if (noteFromPitch(note) === 'C') {
			canvasCtx.font = '8pt Arial'
			canvasCtx.fillStyle = '#FFFFFF'
			canvasCtx.textAlign = 'center'
			canvasCtx.fillText(`C${octave}`, x, height - 20)

			const text = note > 999 ? `${note / 1000}kHz` : `${note}Hz`

			canvasCtx.font = '8pt Arial'
			canvasCtx.fillStyle = '#FFFFFF'
			canvasCtx.textAlign = 'center'
			canvasCtx.fillText(text, x, height - 10)
			octave++
		}

		canvasCtx.beginPath()

		canvasCtx.moveTo(x, 0)
		canvasCtx.lineTo(x, height)

		canvasCtx.stroke()
	})
    */

	const pitchLineColor = '#FBBF24'

	const freq = (bufferLength / 24000) * ac

	const w = width / Math.log10(bufferLength)
	const x = Math.log10(freq) * w

	canvasCtx.lineWidth = 2
	canvasCtx.strokeStyle = pitchLineColor

	canvasCtx.beginPath()

	canvasCtx.moveTo(x, height - 32)
	canvasCtx.lineTo(x, height)

	canvasCtx.stroke()

	canvasCtx.beginPath()
	canvasCtx.moveTo(x - 8, height - 24)
	canvasCtx.lineTo(x, height - 32)
	canvasCtx.lineTo(x + 8, height - 24)
	canvasCtx.stroke()

	if (ac != -1) {
		canvasCtx.font = '48pt Arial'
		canvasCtx.fillStyle = '#FFFFFF'
		canvasCtx.textAlign = 'center'
		canvasCtx.textBaseline = 'middle'
		acr = Math.round(ac)
		canvasCtx.fillText(
			noteStrings[noteFromPitch(ac) % 12],
			width / 2,
			height / 4 - 40
		)
		canvasCtx.font = '16pt Arial'
		canvasCtx.fillStyle = '#FFFFFF'
		canvasCtx.textAlign = 'center'
		canvasCtx.textBaseline = 'middle'
		acr = Math.round(ac)
		const hy = acr > 999 ? `${acr / 1000}kHz` : `${acr}Hz`
		canvasCtx.fillText(`${hy}`, width / 2, height / 4)
	}

	canvasCtx.lineWidth = 1
	canvasCtx.strokeStyle = '#60A5FA'

	canvasCtx.beginPath()

	canvasCtx.moveTo(0, height)

	let max = []

	function getMaxOfArray(arr, count) {
		const x = [...arr]
		const z = []
		for (let i = 0; i < count; i++) {
			const inx = x.indexOf(Math.max(...x))
			z.push(inx)
			x.splice(inx, 1)
		}
		return z
	}

	let maxsIndex = getMaxOfArray(dataArray, 0)

	/*{
		amp: 0,
		freq: 0,
		x: 0,
		y: 0,
	}*/

	dataArray.map((item, index) => {
		let base = 10
		let w = width / (Math.log(bufferLength) / Math.log(base))
		let x = (Math.log(index) / Math.log(base)) * w
		let y = height - (height / 255) * item
		if ((24000 / bufferLength) * index > 20) {
			maxsIndex.map((val) => {
				if (val === index) {
					max.push({
						amp: item,
						freq: (24000 / bufferLength) * index,
						x,
						y,
					})
				}
			})
		}

		/*
		if (item > max.amp) {
			const freq = (24000 / bufferLength) * index
			max = {
				amp: item,
				freq,
				x,
				y,
			}
		}
        */

		if (!index) {
			canvasCtx.moveTo(x, y)
		} else {
			canvasCtx.lineTo(x, y)
		}
	})

	max.map((i, index) => {
		canvasCtx.font = '8pt Arial'
		canvasCtx.fillStyle = '#FFFFFF'
		canvasCtx.textAlign = 'center'
		canvasCtx.fillText(i.freq, i.x, i.y)
	})

	canvasCtx.lineTo(width, height)

	canvasCtx.stroke()
}

navigator.mediaDevices
	.getUserMedia({ audio: true, video: false })
	.then((stream) => {
		audioCtx = new (window.AudioContext || window.webkitAudioContext)()

		analyser = audioCtx.createAnalyser()

		/*
		oscillator = audioCtx.createOscillator()

		oscillator.type = 'sine'
		oscillator.connect(audioCtx.destination)
		oscillator.connect(analyser)
		oscillator.start()
*/
		analyser.fftSize = 2048

		analyser.smoothingTimeConstant = 0.8

		analyser.minDecibels = -90
		analyser.maxDecibels = 0

		bufferLength = analyser.frequencyBinCount
		dataArray = new Uint8Array(bufferLength)
		console.log(bufferLength)
		analyser.getByteFrequencyData(dataArray)

		const source = audioCtx.createMediaStreamSource(stream)

		source.connect(analyser)

		draw()
	})
