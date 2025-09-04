// pages/api/generatePdf.js
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

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
  if (driver === 1) {
    return {
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
  return {
    rulingPlanet: "-",
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
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { fullName, email, mobile, dob } = req.query;
    if (!fullName || !email || !mobile || !dob) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { driver, conductor } = computeDriverAndConductor(dob);
    const combo =
      driver && conductor ? getCombinationFortune(driver, conductor) : null;
    const today = new Date();
    const regDate = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`;
    const longDob = formatLongDate(dob);
    const attrs = buildAttributesByDriver(driver || 0);
    const registrationNo = `NMR-${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Date.now()
      .toString()
      .slice(-6)}`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="numerology-report.pdf"'
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Page 1 - Cover
    doc.fontSize(22).text("NUMEROLOGY REPORT", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(fullName, { align: "center" });
    doc.text(longDob, { align: "center" });
    doc.moveDown();
    doc.text(`Registration No: ${registrationNo}`);
    doc.text(`Date: ${regDate}`);
    doc.text(`Mobile: ${mobile}`);
    doc.text(`Email: ${email}`);
    doc.addPage();

    // Page 2 - Intro
    doc.fontSize(18).text("Introduction", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(
      `Numerology is an index to the Encyclopaedia of Life. It is a study of numbers wherein every number has a different vibration. Numerology helps in finding out the niche for every individual. It offers the advantage of weeding out thorns or obstacles on the way & rather helps in providing short-cuts.

This Reading is composed for you personally, Sunny and is based on your date of birth.

Date of Birth gives deep insights into the Life path, indicates skills one possesses as well as challenges one need to overcome. The day you were born bears great significance in understanding who you are going to head in life.

Name is a powerful tool to describe the course of our life & Numerology is one of the most powerful & influential science widely used all over the world to set the course of our life in complete harmony.

Numerology is the study of divine relation between numbers & coinciding events in life.

We are happy to help your redesign your identity through:

• Your Favourable Numbers
• Your Favourable Colours
• Your Favourable Vibrations
Gift yourself the best identification with the most favourable numbers & name for yourself & your business to stand out in the society.

You have every right to attract abundance to live a harmonious & peaceful life.` // (shortened)
    );
    doc.addPage();

    // Page 3 - Attributes
    doc.fontSize(18).text("Numerology Details", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Driver Number: ${driver}`);
    doc.text(`Conductor Number: ${conductor}`);
    doc.text(`Ruling Planet: ${attrs.rulingPlanet}`);
    doc.text(`Contributing Planet: ${attrs.contributingPlanet}`);
    doc.text(`Favourable Days: ${attrs.favourableDays.join(", ")}`);
    doc.text(`Favourable Colours: ${attrs.favourableColours.join(", ")}`);
    doc.text(`Colours to Avoid: ${attrs.coloursToAvoid.join(", ")}`);
    doc.text(`Favourable Metal: ${attrs.favourableMetal}`);
    doc.text(`Favourable Gemstone: ${attrs.favourableGemstone}`);
    doc.addPage();

    // Page 4 - Predictions
    doc.fontSize(18).text("Numerology Prediction", { underline: true });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Ruled by ${attrs.rulingPlanet}. Leadership qualities, progressive, ambitious...`
      );
    doc.moveDown();
    doc.text(`Combination Fortune (${driver}/${conductor}):`);
    doc.text(combo?.description || "No description available");
    doc.moveDown();
    doc.text("Roles/Profession:");
    doc.text(combo?.roles_profession || "—");

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
}
