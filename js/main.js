const container = document.createElement('div')
container.width = '100vw'
container.height = '100vh'
container.position = 'relative'
document.body.appendChild(container)

function createLayer() {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height

	canvas.style.position = 'absolute'
	canvas.style.top = 0
	canvas.style.left = 0

	container.appendChild(canvas)

	const context = canvas.getContext('2d')
	return context
}

const width = window.innerWidth
const height = window.innerHeight

/*
canvas.style.overflow = 'hidden'
canvas.style.borderRadius = '1rem'*/

const layer1 = createLayer()

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

const layer2 = createLayer()

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

	layer2.clearRect(0, 0, width, height)

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
			layer2.font = '8pt Arial'
			layer2.fillStyle = '#FFFFFF'
			layer2.textAlign = 'center'
			layer2.fillText(`C${octave}`, x, height - 20)

			const text = note > 999 ? `${note / 1000}kHz` : `${note}Hz`

			layer2.font = '8pt Arial'
			layer2.fillStyle = '#FFFFFF'
			layer2.textAlign = 'center'
			layer2.fillText(text, x, height - 10)
			octave++
		}

		layer2.beginPath()

		layer2.moveTo(x, 0)
		layer2.lineTo(x, height)

		layer2.stroke()
	})
    */

	const pitchLineColor = '#FBBF24'

	const freq = (bufferLength / 24000) * ac

	const w = width / Math.log10(bufferLength)
	const x = Math.log10(freq) * w

	/*
	layer2.lineWidth = 2
	layer2.strokeStyle = pitchLineColor

	layer2.beginPath()

	layer2.moveTo(x, height - 32)
	layer2.lineTo(x, height)

	layer2.stroke()
*/
	/*

	layer2.beginPath()
	layer2.moveTo(x - 8, height - 24)
	layer2.lineTo(x, height - 32)
	layer2.lineTo(x + 8, height - 24)
	layer2.stroke()*/

	if (ac != -1) {
		layer2.font = '48pt Arial'
		layer2.fillStyle = '#FFFFFF'
		layer2.textAlign = 'center'
		layer2.textBaseline = 'middle'
		acr = Math.round(ac)
		layer2.fillText(
			noteStrings[noteFromPitch(ac) % 12],
			width / 2,
			height / 4 - 40
		)
		layer2.font = '16pt Arial'
		layer2.fillStyle = '#FFFFFF'
		layer2.textAlign = 'center'
		layer2.textBaseline = 'middle'
		acr = Math.round(ac)
		const hy = acr > 999 ? `${acr / 1000}kHz` : `${acr}Hz`
		layer2.fillText(`${hy}`, width / 2, height / 4)
	}

	layer2.lineWidth = 1
	layer2.strokeStyle = '#60A5FA'

	layer2.beginPath()

	layer2.moveTo(0, height)

	dataArray.map((item, index) => {
		let base = 10
		let w = width / (Math.log(bufferLength) / Math.log(base))
		let x = (Math.log(index) / Math.log(base)) * w
		let y = height - (height / 255) * item

		if (!index) {
			layer2.moveTo(x, y)
		} else {
			layer2.lineTo(x, y)
		}
	})

	layer2.lineTo(width, height)

	layer2.stroke()
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

		const amps = [20, 40, 60, 80]

		layer1.fillStyle = '#111827'
		layer1.fillRect(0, 0, width, height)

		/*
layer2.font = '24vw Arial'
layer2.fillStyle = '#1F293748'
layer2.textAlign = 'right'
layer2.textBaseline = 'bottom'
layer2.fillText('Sing4U', width - 20, height - 20)
*/

		amps.map((item) => {
			layer1.lineWidth = 1
			layer1.strokeStyle = '#1F2937'

			layer1.beginPath()

			const h = height / 90
			const y = h * item

			layer1.moveTo(0, y)
			layer1.lineTo(width, y)

			layer1.stroke()

			layer1.font = '8pt Arial'
			layer1.fillStyle = '#FFFFFF'
			layer1.textAlign = 'right'
			layer1.textBaseline = 'middle'
			layer1.fillText('-' + item + 'dB', width - 10, y)
		})

		const ranges = [32, 65, 130, 260, 520, 1000, 2000, 4000, 8000, 16000]

		ranges.map((item, index) => {
			layer1.lineWidth = 1
			layer1.strokeStyle = '#1F2937'

			/*
	layer1.beginPath()
	layer1.moveTo(100, 0)
	layer1.lineTo(100, height)
	layer1.stroke()
	*/

			console.log(bufferLength, item)

			const freq = (bufferLength / 24000) * item

			const w = width / Math.log10(bufferLength)
			const x = Math.log10(freq) * w

			layer1.beginPath()

			layer1.moveTo(x, 0)
			layer1.lineTo(x, height)

			layer1.stroke()
			layer1.font = '8pt Arial'
			layer1.fillStyle = '#FFFFFF'
			layer1.textAlign = 'center'
			layer1.fillText(`C${index + 1}`, x, height - 20)

			const text = item > 999 ? `${item / 1000}kHz` : `${item}Hz`

			layer1.font = '8pt Arial'
			layer1.fillStyle = '#FFFFFF'
			layer1.textAlign = 'center'
			layer1.fillText(text, x, height - 10)
		})

		draw()
	})
