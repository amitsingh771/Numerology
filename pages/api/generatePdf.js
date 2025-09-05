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
      .reduce((acc, d) => acc + Number.parseInt(d, 10), 0);
  }
  return n;
}

function computeDriverAndConductor(dob) {
  const [yyyy, mm, dd] = (dob || "")
    .split("-")
    .map((p) => Number.parseInt(p, 10));
  if (!yyyy || !mm || !dd) return { driver: null, conductor: null };
  const driver = sumDigitsToRoot(dd);
  const allDigits = `${yyyy}${mm.toString().padStart(2, "0")}${dd
    .toString()
    .padStart(2, "0")}`;
  const conductor = sumDigitsToRoot(
    allDigits.split("").reduce((a, b) => a + Number.parseInt(b, 10), 0)
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
  const [yyyy, mm, dd] = (dob || "")
    .split("-")
    .map((p) => Number.parseInt(p, 10));
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

    const doc = new PDFDocument({
      margin: 60,
      size: "A4",
      bufferPages: true,
    });
    doc.pipe(res);

    // Define colors
    const colors = {
      primary: "#1e40af", // Deep blue
      secondary: "#059669", // Emerald
      accent: "#dc2626", // Red
      gold: "#f59e0b", // Amber
      text: "#1f2937", // Gray-800
      lightText: "#6b7280", // Gray-500
      background: "#f8fafc", // Slate-50
      white: "#ffffff",
    };

    // Helper functions for design
    function drawHeader(title, subtitle = null) {
      doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);
      doc
        .fillColor(colors.white)
        .fontSize(28)
        .font("Helvetica-Bold")
        .text(title, 60, 40, { align: "center" });

      if (subtitle) {
        doc
          .fontSize(14)
          .font("Helvetica")
          .text(subtitle, 60, 75, { align: "center" });
      }

      doc.fillColor(colors.text);
    }

    function drawSection(title, y = null) {
      if (y) doc.y = y;
      doc.moveDown(1);
      doc.rect(60, doc.y, doc.page.width - 120, 2).fill(colors.secondary);
      doc.moveDown(0.5);
      doc
        .fillColor(colors.primary)
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(title);
      doc.fillColor(colors.text).moveDown(0.5);
    }

    function drawInfoBox(items, bgColor = colors.background) {
      const startY = doc.y;
      const boxHeight = items.length * 25 + 20;

      doc
        .rect(60, startY, doc.page.width - 120, boxHeight)
        .fill(bgColor)
        .stroke(colors.secondary);

      doc.y = startY + 15;
      items.forEach((item) => {
        doc
          .fillColor(colors.text)
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(item.label + ":", 80, doc.y, { width: 150 });

        doc
          .fillColor(colors.lightText)
          .font("Helvetica")
          .text(item.value, 240, doc.y, { width: 250 });

        doc.y += 25;
      });
      doc.moveDown(1);
    }

    function drawNumberCircle(number, x, y, size = 60) {
      doc
        .circle(x, y, size / 2)
        .fill(colors.primary)
        .stroke(colors.secondary);

      doc
        .fillColor(colors.white)
        .fontSize(size / 2)
        .font("Helvetica-Bold")
        .text(number.toString(), x - size / 4, y - size / 4, {
          width: size / 2,
          align: "center",
        });
    }

    // Page 1 - Enhanced Cover Page
    drawHeader("NUMEROLOGY REPORT", "Personal Cosmic Blueprint");

    // Decorative elements
    doc.circle(100, 200, 3).fill(colors.gold);
    doc.circle(500, 180, 2).fill(colors.secondary);
    doc.circle(450, 220, 1.5).fill(colors.accent);

    doc.y = 160;
    doc
      .fillColor(colors.text)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(fullName, { align: "center" });

    doc
      .fontSize(16)
      .font("Helvetica")
      .fillColor(colors.lightText)
      .text(longDob, { align: "center" });

    // Driver and Conductor numbers display
    if (driver && conductor) {
      drawNumberCircle(driver, 200, 300);
      drawNumberCircle(conductor, 400, 300);

      doc
        .fillColor(colors.text)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Driver Number", 170, 370, { align: "center", width: 60 });

      doc.text("Conductor Number", 370, 370, { align: "center", width: 60 });
    }

    // Registration details box
    doc.y = 420;
    drawInfoBox([
      { label: "Registration No", value: registrationNo },
      { label: "Report Date", value: regDate },
      { label: "Mobile", value: mobile },
      { label: "Email", value: email },
    ]);

    // Footer decoration
    doc.rect(60, 700, doc.page.width - 120, 2).fill(colors.gold);

    doc.addPage();

    // Page 2 - Enhanced Introduction
    drawHeader("INTRODUCTION", "Understanding Your Cosmic Numbers");

    doc.y = 150;
    drawSection("What is Numerology?");

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(colors.text)
      .text(
        "Numerology is an ancient science that reveals the hidden meanings behind numbers in your life. It serves as your personal guide to understanding your destiny, personality traits, and life path.",
        {
          width: doc.page.width - 120,
          align: "justify",
          lineGap: 4,
        }
      );

    doc.moveDown(1);
    drawSection("Your Personal Reading");

    doc.text(
      `This comprehensive reading has been specially prepared for ${fullName}, based on your birth date of ${longDob}. Every calculation and interpretation is unique to your cosmic blueprint.`,
      {
        width: doc.page.width - 120,
        align: "justify",
        lineGap: 4,
      }
    );

    doc.moveDown(1);
    drawSection("What You'll Discover");

    const benefits = [
      "• Your core personality numbers and their meanings",
      "• Favorable colors, days, and gemstones for success",
      "• Career paths and life opportunities aligned with your numbers",
      "• Relationship compatibility and personal growth insights",
      "• Lucky directions and timing for important decisions",
    ];

    benefits.forEach((benefit) => {
      doc.fontSize(11).text(benefit, {
        width: doc.page.width - 120,
        lineGap: 6,
      });
    });

    doc.addPage();

    // Page 3 - Enhanced Numerology Details
    drawHeader("YOUR NUMBERS", "Core Numerological Profile");

    doc.y = 150;

    // Main numbers section
    drawSection("Primary Numbers");
    drawInfoBox([
      { label: "Driver Number", value: driver?.toString() || "N/A" },
      { label: "Conductor Number", value: conductor?.toString() || "N/A" },
      { label: "Ruling Planet", value: attrs.rulingPlanet },
      { label: "Contributing Planet", value: attrs.contributingPlanet },
    ]);

    drawSection("Favorable Elements");
    drawInfoBox(
      [
        {
          label: "Lucky Days",
          value: attrs.favourableDays.join(", ") || "N/A",
        },
        {
          label: "Power Colors",
          value: attrs.favourableColours.join(", ") || "N/A",
        },
        {
          label: "Avoid Colors",
          value: attrs.coloursToAvoid.join(", ") || "N/A",
        },
        { label: "Lucky Metal", value: attrs.favourableMetal },
        { label: "Power Gemstone", value: attrs.favourableGemstone },
        { label: "Favorable Direction", value: attrs.direction },
      ],
      colors.background
    );

    if (attrs.wonderLetters.length > 0) {
      drawSection("Wonder Letters");
      doc
        .fontSize(12)
        .text(`Your power letters: ${attrs.wonderLetters.join(", ")}`, {
          width: doc.page.width - 120,
        });
    }

    doc.addPage();

    // Page 4 - Enhanced Predictions
    drawHeader("PREDICTIONS & GUIDANCE", "Your Cosmic Roadmap");

    doc.y = 150;
    drawSection("Personality Profile");

    doc
      .fontSize(12)
      .text(
        `As someone ruled by ${attrs.rulingPlanet}, you possess natural leadership qualities and a progressive mindset. Your ambitious nature drives you toward success, while your innovative thinking sets you apart from others.`,
        {
          width: doc.page.width - 120,
          align: "justify",
          lineGap: 4,
        }
      );

    if (combo) {
      doc.moveDown(1);
      drawSection(`Combination Fortune (${driver}/${conductor})`);

      doc
        .fontSize(11)
        .text(
          combo.description ||
            "Your unique number combination reveals special insights into your life path and destiny.",
          {
            width: doc.page.width - 120,
            align: "justify",
            lineGap: 4,
          }
        );

      if (combo.roles_profession) {
        doc.moveDown(0.5);
        drawSection("Career & Professional Path");
        doc.fontSize(11).text(combo.roles_profession, {
          width: doc.page.width - 120,
          align: "justify",
          lineGap: 4,
        });
      }
    }

    // Special notes
    if (attrs.notes?.mobileWallpaper) {
      doc.moveDown(1);
      drawSection("Special Recommendations");
      drawInfoBox(
        [{ label: "Mobile Wallpaper", value: attrs.notes.mobileWallpaper }],
        "#fef3c7"
      ); // Light yellow background
    }

    // Footer with contact info
    doc.y = 650;
    doc.rect(60, doc.y, doc.page.width - 120, 2).fill(colors.gold);
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor(colors.lightText)
      .text(
        "This report is generated based on traditional numerological principles. Use this guidance as inspiration for your personal growth journey.",
        {
          align: "center",
          width: doc.page.width - 120,
        }
      );

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
}
