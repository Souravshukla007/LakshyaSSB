const fs = require('fs');

const filesToClean = [
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\terms\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\ssb-entry-navigator\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\ssb\\day-4\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\ssb\\day-5\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\ssb\\day-3\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\ssb\\day-2\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\ssb\\day-1\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\privacy\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\pricing\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\refund-policy\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\practice\\oir\\test\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\piq\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\practice\\oir\\result\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\piq\\form\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\olq-report\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\piq\\result\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\medical\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\leaderboard\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\dashboard\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\contact\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\daily-question\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\checkout\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\account\\page.tsx",
    "c:\\Users\\Hello\\OneDrive\\Documents\\LakshyaSSB\\app\\about\\page.tsx"
];

for (const filePath of filesToClean) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Strip Footer imports
        content = content.replace(/import\s+Footer\s+from\s+['"]@\/components\/Footer['"];?\n?/g, '');
        // Strip out Navbar imports just in case
        content = content.replace(/import\s+Navbar\s+from\s+['"]@\/components\/Navbar['"];?\n?/g, '');
        
        // Strip <Footer /> variations
        content = content.replace(/<Footer\s*\/>\n?/g, '');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Cleaned: ${filePath}`);
        } else {
            console.log(`Nothing to clean in: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
    }
}
console.log('Done cleaning footers.');
