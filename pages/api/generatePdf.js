import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import fs from 'fs'
import path from 'path'

function sumDigitsToRoot(num) {
  let n = Math.abs(num)
  while (n > 9) {
    n = n
      .toString()
      .split('')
      .reduce((acc, d) => acc + parseInt(d, 10), 0)
  }
  return n
}

function computeDriverAndConductor(dob) {
  const [yyyy, mm, dd] = (dob || '').split('-').map(Number)
  if (!yyyy || !mm || !dd) return { driver: null, conductor: null }
  const driver = sumDigitsToRoot(dd)
  const allDigits = `${yyyy}${mm.toString().padStart(2, '0')}${dd.toString().padStart(2, '0')}`
  const conductor = sumDigitsToRoot(allDigits.split('').reduce((a, b) => a + parseInt(b, 10), 0))
  return { driver, conductor }
}

function getCombinationFortune(driver, conductor) {
  try {
    const jsonPath = path.join(process.cwd(), 'pages', 'combination_fortune.json')
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const arr = JSON.parse(raw)
    const key = `${driver}/${conductor}`
    return arr.find((it) => it.combination === key) || null
  } catch {
    return null
  }
}

function getOrdinalSuffix(n) {
  const j = n % 10, k = n % 100
  if (j === 1 && k !== 11) return 'ST'
  if (j === 2 && k !== 12) return 'ND'
  if (j === 3 && k !== 13) return 'RD'
  return 'TH'
}

function formatLongDate(dob) {
  const [yyyy, mm, dd] = (dob || '').split('-').map(Number)
  if (!yyyy || !mm || !dd) return dob || ''
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  return `${dd}${getOrdinalSuffix(dd)} ${monthNames[mm - 1]} ${yyyy}`
}

function buildAttributesByDriver(driver) {
  const planetByNum = {1:'Sun',2:'Moon',3:'Jupiter',4:'Rahu',5:'Mercury',6:'Venus',7:'Ketu',8:'Saturn',9:'Mars'}
  const defaults = {
    rulingPlanet: planetByNum[driver] || '-',
    contributingPlanet: '-',
    influencingNumbers: [driver].filter(Boolean),
    enemyNumbers: [],
    favourableDays: [],
    favourableColours: [],
    coloursToAvoid: [],
    favourableMetal: '-',
    favourableGemstone: '-',
    wonderLetters: [],
    direction: '-',
    notes: { mobileWallpaper: '' }
  }
  if (driver === 1) {
    return {
      ...defaults,
      rulingPlanet: 'Sun',
      contributingPlanet: 'Mars',
      influencingNumbers: [1,5,6,9],
      enemyNumbers: [8],
      favourableDays: ['Sunday','Tuesday','Wednesday','Friday'],
      favourableColours: ['Golden','Yellow','Blue','Red'],
      coloursToAvoid: ['Black','Brown'],
      favourableMetal: 'Gold',
      favourableGemstone: 'Ruby',
      wonderLetters: ['A','I','J','Q','Y'],
      direction: 'North-East',
      notes: { mobileWallpaper: 'Fathers Pic always' }
    }
  }
  return defaults
}

export default async function handler(req, res) {
  if (!['POST','GET'].includes(req.method)) {
    res.setHeader('Allow',['POST','GET'])
    return res.status(405).json({ error:'Method Not Allowed' })
  }

  try {
    const source = req.method === 'GET' ? req.query : req.body
    const { fullName, email, mobile, dob } = source || {}
    if (!fullName || !email || !mobile || !dob) {
      return res.status(400).json({ error:'Missing required fields' })
    }

    const { driver, conductor } = computeDriverAndConductor(dob)
    const combo = driver && conductor ? getCombinationFortune(driver, conductor) : null
    const today = new Date()
    const regDate = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
    const longDob = formatLongDate(dob)
    const attrs = buildAttributesByDriver(driver || 0)

    const listToCsv = (list) => Array.isArray(list)&&list.length ? list.join(', ') : '—'
    const buildFavourableDates = (nums) => {
      if (!Array.isArray(nums)||!nums.length) return '—'
      const base = []
      for(let d=1; d<=31; d++){
        if(nums.includes(sumDigitsToRoot(d))) base.push(d)
      }
      return base.join(', ')
    }

    const registrationNo = `NMR-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${Date.now().toString().slice(-6)}`
    const alsoFavourable = driver===1?'4, 13, 22, 31':'—'
    const datesToAvoid = driver===1?'8, 17, 26':'—'

    // Minimal example HTML; you can keep your full HTML template here
    const html = `
      <!doctype html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <h1>Numerology Report for ${fullName}</h1>
          <p>DOB: ${longDob}</p>
          <p>Driver/Conductor: ${driver||'-'} / ${conductor||'-'}</p>
          <p>Registration No: ${registrationNo}</p>
        </body>
      </html>
    `

    // Launch Puppeteer using serverless-friendly Chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil:'networkidle0' })
    const pdfBuffer = await page.pdf({ format:'A4', printBackground:true })
    await browser.close()

    res.status(200)
    res.setHeader('Content-Type','application/pdf')
    res.setHeader('Content-Disposition','inline; filename="numerology-report.pdf"')
    res.setHeader('Content-Length', String(pdfBuffer.length))
    res.end(pdfBuffer)

  } catch(err) {
    console.error(err)
    res.status(500).json({ error:'Failed to generate PDF' })
  }
}
