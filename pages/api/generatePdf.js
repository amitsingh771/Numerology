import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

// ------------------- Utility Functions -------------------
function sumDigitsToRoot(num) {
  let n = Math.abs(num);
  while (n > 9) {
    n = n
      .toString()
      .split("")
      .reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  return n;
}

function computeDriverAndConductor(dob) {
  const [yyyy, mm, dd] = (dob || "").split("-").map((p) => parseInt(p, 10));
  if (!yyyy || !mm || !dd) return { driver: null, conductor: null };
  const driver = sumDigitsToRoot(dd);
  const allDigits = `${yyyy}${mm.toString().padStart(2, "0")}${dd
    .toString()
    .padStart(2, "0")}`;
  const conductor = sumDigitsToRoot(
    allDigits.split("").reduce((a, b) => a + parseInt(b, 10), 0)
  );
  return { driver, conductor };
}

function getCombinationFortune(driver, conductor) {
  try {
    const jsonPath = path.join(
      process.cwd(),
      "pages",
      "combination_fortune.json"
    );
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const arr = JSON.parse(raw);
    const key = `${driver}/${conductor}`;
    return arr.find((it) => it.combination === key) || null;
  } catch (e) {
    return null;
  }
}

function getOrdinalSuffix(n) {
  const j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) return "ST";
  if (j === 2 && k !== 12) return "ND";
  if (j === 3 && k !== 13) return "RD";
  return "TH";
}

function formatLongDate(dob) {
  const [yyyy, mm, dd] = (dob || "").split("-").map((p) => parseInt(p, 10));
  if (!yyyy || !mm || !dd) return dob || "";
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${dd}${getOrdinalSuffix(dd)} ${monthNames[mm - 1]} ${yyyy}`;
}

function buildAttributesByDriver(driver) {
  const planetByNum = {
    1: "Sun",
    2: "Moon",
    3: "Jupiter",
    4: "Rahu",
    5: "Mercury",
    6: "Venus",
    7: "Ketu",
    8: "Saturn",
    9: "Mars",
  };
  const defaults = {
    rulingPlanet: planetByNum[driver] || "-",
    contributingPlanet: "-",
    influencingNumbers: [driver].filter(Boolean),
    enemyNumbers: [],
    favourableDays: [],
    favourableColours: [],
    coloursToAvoid: [],
    favourableMetal: "-",
    favourableGemstone: "-",
    wonderLetters: [],
    direction: "-",
    notes: { mobileWallpaper: "" },
  };
  if (driver === 1) {
    return {
      ...defaults,
      rulingPlanet: "Sun",
      contributingPlanet: "Mars",
      influencingNumbers: [1, 5, 6, 9],
      enemyNumbers: [8],
      favourableDays: ["Sunday", "Tuesday", "Wednesday", "Friday"],
      favourableColours: ["Golden", "Yellow", "Blue", "Red"],
      coloursToAvoid: ["Black", "Brown"],
      favourableMetal: "Gold",
      favourableGemstone: "Ruby",
      wonderLetters: ["A", "I", "J", "Q", "Y"],
      direction: "North-East",
      notes: { mobileWallpaper: "Fathers Pic always" },
    };
  }
  return defaults;
}

// ------------------- API Handler -------------------

import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  try {
    const isLocal = !process.env.AWS_REGION; // Vercel sets AWS_REGION in lambda

    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: isLocal
        ? undefined // locally, puppeteer finds Chrome automatically
        : await chromium.executablePath, // in Vercel, use chrome-aws-lambda
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent("<h1>Hello PDF</h1>", { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=output.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate PDF");
  }
}
