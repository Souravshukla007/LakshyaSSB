const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'public', 'color-test');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const plates = [
    { num: "12", bgColors: ["#a1c181", "#619b8a"], fgColors: ["#e07a5f", "#d62828"] },
    { num: "8", bgColors: ["#dda15e", "#bc6c25"], fgColors: ["#606c38", "#283618"] },
    { num: "29", bgColors: ["#a8dadc", "#457b9d"], fgColors: ["#e63946", "#f1faee"] },
    { num: "5", bgColors: ["#ffb703", "#fb8500"], fgColors: ["#8ecae6", "#219ebc"] },
    { num: "3", bgColors: ["#d8f3dc", "#95d5b2"], fgColors: ["#2d6a4f", "#1b4332"] },
    { num: "15", bgColors: ["#2a9d8f", "#e9c46a"], fgColors: ["#f4a261", "#e76f51"] },
    { num: "74", bgColors: ["#edede9", "#d6ccc2"], fgColors: ["#d5bdaf", "#e3d5ca"] },
    { num: "6", bgColors: ["#cdb4db", "#ffc8dd"], fgColors: ["#a2d2ff", "#bde0fe"] }
];

plates.forEach((plate, i) => {
    // Generate an SVG plate with dots.
    let circles = '';
    
    // Draw background dots
    for (let r = 0; r < 200; r++) {
        const cx = Math.random() * 400;
        const cy = Math.random() * 400;
        const rad = 4 + Math.random() * 12;
        // Keep within a circle
        if (Math.hypot(cx - 200, cy - 200) < 180) {
            const color = plate.bgColors[Math.floor(Math.random() * plate.bgColors.length)];
            circles += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${color}" opacity="0.9" />\n`;
        }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#f8f9fa"/>
        <!-- Background Dots -->
        ${circles}
        <!-- The Number drawn using a text element with dashed stroke to look like dots -->
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Arial" font-size="200" font-weight="900" 
              fill="none" stroke="${plate.fgColors[0]}" stroke-width="25" stroke-dasharray="0 30" stroke-linecap="round">
            ${plate.num}
        </text>
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Arial" font-size="200" font-weight="900" 
              fill="none" stroke="${plate.fgColors[1]}" stroke-width="15" stroke-dasharray="0 25" stroke-linecap="round" opacity="0.8">
            ${plate.num}
        </text>
        <!-- Overlay label for user context -->
        <text x="200" y="385" font-family="sans-serif" font-size="12" fill="#999" text-anchor="middle">Placeholder Plate (Replace with real Ishihara)</text>
    </svg>`;

    fs.writeFileSync(path.join(outputDir, `plate${i + 1}.svg`), svg);
});
console.log('SVG plates generated successfully.');
