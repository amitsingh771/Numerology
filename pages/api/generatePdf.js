import puppeteer from 'puppeteer'
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
  // dob: YYYY-MM-DD
  const [yyyy, mm, dd] = (dob || '').split('-').map((p) => parseInt(p, 10))
  if (!yyyy || !mm || !dd) return { driver: null, conductor: null }
  const driver = sumDigitsToRoot(dd)
  const allDigits = `${yyyy}${mm.toString().padStart(2, '0')}${dd
    .toString()
    .padStart(2, '0')}`
  const conductor = sumDigitsToRoot(
    allDigits.split('').reduce((a, b) => a + parseInt(b, 10), 0)
  )
  return { driver, conductor }
}

function getCombinationFortune(driver, conductor) {
  try {
    const jsonPath = path.join(process.cwd(), 'pages', 'combination_fortune.json')
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const arr = JSON.parse(raw)
    const key = `${driver}/${conductor}`
    return arr.find((it) => it.combination === key) || null
  } catch (e) {
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
  // YYYY-MM-DD -> 19TH January 1991
  const [yyyy, mm, dd] = (dob || '').split('-').map((p) => parseInt(p, 10))
  if (!yyyy || !mm || !dd) return dob || ''
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  return `${dd}${getOrdinalSuffix(dd)} ${monthNames[mm - 1]} ${yyyy}`
}

function buildAttributesByDriver(driver) {
  const planetByNum = {
    1: 'Sun',
    2: 'Moon',
    3: 'Jupiter',
    4: 'Rahu',
    5: 'Mercury',
    6: 'Venus',
    7: 'Ketu',
    8: 'Saturn',
    9: 'Mars'
  }
  // Defaults fallback
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
    notes: {
      mobileWallpaper: ''
    }
  }
  if (driver === 1) {
    return {
      ...defaults,
      rulingPlanet: 'Sun',
      contributingPlanet: 'Mars',
      influencingNumbers: [1, 5, 6, 9],
      enemyNumbers: [8],
      favourableDays: ['Sunday', 'Tuesday', 'Wednesday', 'Friday'],
      favourableColours: ['Golden', 'Yellow', 'Blue', 'Red'],
      coloursToAvoid: ['Black', 'Brown'],
      favourableMetal: 'Gold',
      favourableGemstone: 'Ruby',
      wonderLetters: ['A', 'I', 'J', 'Q', 'Y'],
      direction: 'North- East',
      notes: { mobileWallpaper: 'Fathers Pic always' }
    }
  }
  return defaults
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['POST', 'GET'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const source = req.method === 'GET' ? req.query : req.body
    const { fullName, email, mobile, dob } = source || {}
    if (!fullName || !email || !mobile || !dob) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const styles = `
      <style>
        * { box-sizing: border-box; }
        :root { --bg: #ffffff; --fg: #0b132b; --primary: #1d4ed8; --accent: #f59e0b; --muted: #64748b; }
        body { font-family: Arial, Helvetica, sans-serif; color: var(--fg); padding: 48px; background: var(--bg); }
        h1 { margin: 0 0 12px; color: var(--primary); letter-spacing: 0.5px; }
        p { margin: 0 0 8px; }
        .muted { color: var(--muted); }
        .card { border: 2px solid var(--primary); border-radius: 12px; padding: 16px; background: rgba(29,78,216,0.04); }
        .border-frame { position: relative; padding: 24px; }
        .border-frame:before { content: ""; position: absolute; inset: 0; border: 4px double var(--accent); border-radius: 16px; pointer-events: none; }
        .border-frame:after { content: ""; position: absolute; inset: 10px; border: 2px dashed var(--primary); border-radius: 12px; pointer-events: none; }
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        .h2 { margin: 0 0 10px; font-size: 18px; color: var(--primary); }
        .center { text-align: center; }
        .title-main { font-size: 28px; font-weight: 800; }
        .title-sub { font-size: 18px; font-weight: 700; color: var(--accent); }
        .line { height: 2px; background: linear-gradient(90deg, var(--primary), var(--accent)); opacity: .25; margin: 12px 0; }
        .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .kv { display: grid; grid-template-columns: 180px 1fr; gap: 6px 12px; }
        .kv .k { font-weight: 700; color: var(--primary); }
        .kv .v { color: var(--fg); }
        .badge { display: inline-block; padding: 6px 10px; background: rgba(245,158,11,0.15); color: #8a5b02; border: 1px solid rgba(245,158,11,0.35); border-radius: 999px; font-weight: 700; }
      </style>
    `

    const { driver, conductor } = computeDriverAndConductor(dob)
    const combo = driver && conductor ? getCombinationFortune(driver, conductor) : null
    const today = new Date()
    const regDate = `${String(today.getDate()).padStart(2,'0')}/${String(
      today.getMonth() + 1
    ).padStart(2,'0')}/${today.getFullYear()}`
    const longDob = formatLongDate(dob)
    const attrs = buildAttributesByDriver(driver || 0)

    function listToCsv(list) {
      return Array.isArray(list) && list.length ? list.join(', ') : '—'
    }

    function buildFavourableDates(nums) {
      if (!Array.isArray(nums) || nums.length === 0) return '—'
      const base = []
      for (let d = 1; d <= 31; d++) {
        const root = sumDigitsToRoot(d)
        if (nums.includes(root)) base.push(d)
      }
      return base.join(', ')
    }

    const registrationNo = `NMR-${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Date.now()
      .toString()
      .slice(-6)}`
    const alsoFavourable = driver === 1 ? '4, 13, 22, 31' : '—'
    const datesToAvoid = driver === 1 ? '8, 17, 26' : '—'

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${styles}
        </head>
        <body>
          <!-- Page 1: Cover / Titles -->
          <section class="page">
            <div class="border-frame">
              <div class="center" style="margin-bottom: 16px">
                <div class="title-main">NUMEROLOGY REPORT</div>
                <div class="title-sub">YOUR NUMERO MAGIC REPORT</div>
              </div>
              <div class="center" style="margin: 16px 0; font-weight: 800; font-size: 18px">${fullName}</div>
              <div class="center" style="margin-bottom: 16px">${longDob}</div>
              <div class="line"></div>
              <div class="row" style="margin-bottom: 8px">
                <div>NUMERO MAGIC REPORT</div>
                <div><strong>Date:</strong> ${regDate}</div>
              </div>
              <div class="kv" style="margin-top: 8px">
                <div class="k">Registration No.</div><div class="v">${registrationNo}</div>
                <div class="k">Name</div><div class="v">${fullName}</div>
                <div class="k">Address</div><div class="v">&nbsp;</div>
                <div class="k">Mobile No.</div><div class="v">${mobile}</div>
                <div class="k">Email</div><div class="v">${email}</div>
                <div class="k">Date of Birth</div><div class="v">${longDob}</div>
              </div>
              <div style="margin-top:16px; font-size: 12px">
                <div style="white-space: pre-line">
DR RONIE  PINTO\nASTRO VASTU GUR,  STAR NUMEROLOGIST & PARANORMAL HEALER\n+91 8850899901\n\n003, C – 14, Sector 4, Shanti Nagar, Mira Road (E), Thane-401107
                </div>
              </div>
              <div class="line"></div>
              <p class="muted" style="font-size: 12px">__________________________________________________</p>
            </div>
          </section>
          <!-- Page 2: Introduction text -->
          <section class="page">
            <div class="border-frame">
              <div class="line" style="margin-bottom: 8px"></div>
              <p>Numerology is an index to the Encyclopaedia of Life. It is a study of numbers wherein every number has a different vibration. Numerology helps in finding out the niche for every individual. It offers the advantage of weeding out thorns or obstacles on the way & rather helps in providing short-cuts.</p>
              <p style="margin-top: 8px">This Reading is composed for you personally, ${fullName.split(' ')[0] || fullName} and is based on your date of birth.</p>
              <p style="margin-top: 8px">Date of Birth gives deep insights into the Life path, indicates skills one possesses as well as challenges one need to overcome. The day you were born bears great significance in understanding where you are going to head in life.</p>
              <p style="margin-top: 8px">Name is a powerful tool to describe the course of our life & Numerology is one of the most powerful & influential sciences widely used all over the world to set the course of our life in complete harmony.</p>
              <p style="margin-top: 8px">Numerology is the study of divine relation between numbers & coinciding events in life.</p>
              <p style="margin-top: 8px">We are happy to help you redesign your identity through:</p>
              <ul style="margin:8px 0 8px 20px; padding:0">
                <li>Your Favourable Numbers</li>
                <li>Your Favourable Colours</li>
                <li>Your Favourable Vibrations</li>
              </ul>
              <p>Gift yourself the best identification with the most favourable numbers & name for yourself & your business to stand out in the society.</p>
              <p style="margin-top: 8px">You have every right to attract abundance to live a harmonious & peaceful life.</p>
            </div>
          </section>
          <!-- Page 3: Attributes / Numbers -->
          <section class="page">
            <div class="border-frame">
              <h1>Numerology Details</h1>
              <p class="muted">Driver/Conductor: ${driver || '-'} / ${conductor || '-'}</p>
              <div class="card">
                <div class="kv">
                  <div class="k">Driver Number</div><div class="v">${driver || '—'}</div>
                  <div class="k">Conductor Number</div><div class="v">${conductor || '—'}</div>
                  <div class="k">Angel Number</div><div class="v">${conductor || '—'}</div>
                  <div class="k">Influencing Numbers</div><div class="v">${listToCsv(attrs.influencingNumbers)}</div>
                  <div class="k">Enemy Number</div><div class="v">${listToCsv(attrs.enemyNumbers)}</div>
                  <div class="k">Ruling Planet</div><div class="v">${attrs.rulingPlanet}</div>
                  <div class="k">Contributing Planet</div><div class="v">${attrs.contributingPlanet}</div>
                  <div class="k">Favourable Dates</div><div class="v">${buildFavourableDates(attrs.influencingNumbers)} are all favourable for starting any venture</div>
                  <div class="k">Also Favourable</div><div class="v">${alsoFavourable}</div>
                  <div class="k">Dates to Avoid</div><div class="v">${datesToAvoid} are unlucky dates, will bring lot of troubles, delays, failures & problems, so they are to be avoided.</div>
                  <div class="k">Favourable Days</div><div class="v">${listToCsv(attrs.favourableDays)}</div>
                  <div class="k">Favourable Colours</div><div class="v">${listToCsv(attrs.favourableColours)}</div>
                  <div class="k">Colours to Avoid</div><div class="v">${listToCsv(attrs.coloursToAvoid)}</div>
                  <div class="k">Favourable Metal</div><div class="v">${attrs.favourableMetal}</div>
                  <div class="k">Favourable Gemstone</div><div class="v">${attrs.favourableGemstone}</div>
                  <div class="k">Wonder Letters</div><div class="v">${listToCsv(attrs.wonderLetters)}</div>
                  <div class="k">Direction</div><div class="v">${attrs.direction}</div>
                  <div class="k">Compatible Person</div><div class="v">${listToCsv(attrs.influencingNumbers)}</div>
                  <div class="k">Mobile Wallpaper</div><div class="v">${attrs.notes.mobileWallpaper || '—'}</div>
                </div>
              </div>
            </div>
          </section>
          <!-- Page 4: Numerology Prediction + Combination Fortune -->
          <section class="page">
            <div class="border-frame">
              <h1>Numerology Prediction</h1>
              <div class="card">
                <p><strong>Ruled by Sun</strong></p>
                <p>This number represents Sun, King of all planets. Communication is very powerful, leadership qualities, progressive, Kings behaviour, won't work in pressure, doesn't like bossism, very ambitious. Will do anything to succeed in life, will not care for others sentiments n emotions. Bossy nature, Usually occupy high position in society. Strong determined, unwavering, with specific goal in life. They can & know how to turn dream into reality. Since Sun is considered as the source of energy for cycle of life to keep moving, similarly people born under ruling number ONE are considered important in society. People with ruling number ONE have leadership qualities & usually occupy high position in society. Strong, determined, unwavering & with specific purpose in life, they know how to turn dreams into reality. They enjoy all the comforts & luxuries of life. They lead are experts on matters like astrology, medicine & art related matters like painting, architecture & music. Poets, doctors, politicians, artists , Businessman come under the ambit of number One. But they do best in politics. They have good analytical knowledge & sharp intelligence by way of which they grasp things easily. Sun gives them power & fortune to rule. They are hardworking people & usually do not face hindrances in life. They usually face eyesight issues earlier than usual. Royalty is the essence of their being.</p>
                ${(() => {
                  const [yyyy, mm, dd] = (dob || '').split('-').map((p) => parseInt(p, 10))
                  if (dd === 19) {
                    return `<p style="margin-top:8px"><strong>19th of the Month</strong></p>
                    <p>People born on the 19th of the month are responsible, idealistic and ambitious. Their emotions can let them down at times because these emotions always win over logic. They are versatile and prefer to work with a little interference from others as possible. They work for long hours and are very energetic. They also have attitude, panja ladaynge. This number is backed by two numbers 1 & 9. These people may appear tender or soft natured in appearance but they are adamant and find it difficult to cooperate with people. They are resourceful & versatile. These people have a fiery temperament. They need to learn to make adjustments for a successful life. This number is regarded as fortunate and extremely favourable. It is a number promising happiness, success & honour.</p>
                    <p style=\"margin-top:8px\">1(Sun) & 9(Mars), the Sun makes fortunate and wise and Mars makes you bold, dashing, aggressive and hot tempered. This number faces matrimonial discord. The natives are full of energy, super active and on the go constantly. They are unethical in love affairs and are quarrelsome with their partners, often loosing the one real that really matters. They are positive and expressive, though more through writing than speaking. This number is the symbol of the ever turning “Wheel of Fortune”.</p>`
                  }
                  return ''
                })()}
              </div>
              <h1 style="margin-top:16px">Combination Fortune ${driver || '-'} / ${conductor || '-'}</h1>
              <div class="card">
                <p>${combo?.description || 'No description available for this combination.'}</p>
                <p class="h2" style="margin-top:12px">Roles/Profession</p>
                <p>${combo?.roles_profession || '—'}</p>
              </div>
            </div>
          </section>
        </body>
      </html>
    `

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="numerology-report.pdf"')
    res.setHeader('Content-Length', String(pdfBuffer.length))
    return res.end(pdfBuffer)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to generate PDF' })
  }
}


