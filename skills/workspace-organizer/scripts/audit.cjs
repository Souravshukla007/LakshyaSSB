const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const STANDARDS = {
    move_to_tests: ['test-*.ts', 'test_*.ts', 'test-*.js', 'test_*.js'],
    move_to_scripts: ['generate_plates.js', 'check_users.ts', '*.bat'],
    evaluators_path: 'lib/evaluators',
    naming_convention: 'kebab-case'
};

function audit() {
    const issues = [];
    const rootFiles = fs.readdirSync(ROOT_DIR);

    // 1. Audit Root Directory
    rootFiles.forEach(file => {
        const filePath = path.join(ROOT_DIR, file);
        if (fs.statSync(filePath).isDirectory()) return;

        if (file.startsWith('test') && (file.endsWith('.ts') || file.endsWith('.js'))) {
            issues.push(`[ROOT] ${file} should be moved to /tests`);
        }
        if (file === 'generate_plates.js' || file === 'check_users.ts' || file.endsWith('.bat')) {
            issues.push(`[ROOT] ${file} should be moved to /scripts`);
        }
        if (file === 'proxy.ts') {
            issues.push(`[ROOT] proxy.ts should be renamed to middleware.ts or moved to /lib`);
        }
        if (file === 'tsc.log') {
            issues.push(`[ROOT] tsc.log is a build artifact and should be deleted`);
        }
    });

    // 2. Audit Evaluators
    const libPath = path.join(ROOT_DIR, 'lib');
    if (fs.existsSync(libPath)) {
        const libFiles = fs.readdirSync(libPath);
        libFiles.forEach(file => {
            if (file.toLowerCase().includes('evaluator') && !fs.statSync(path.join(libPath, file)).isDirectory()) {
                issues.push(`[LIB] ${file} should be moved to lib/evaluators/`);
            }
        });
    }

    // 3. Audit Naming (Snake Case Check)
    const scanDirs = ['app', 'components', 'lib', 'hooks'];
    scanDirs.forEach(dir => {
        const dirPath = path.join(ROOT_DIR, dir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath, { recursive: true });
            files.forEach(file => {
                if (file.includes('_')) {
                    issues.push(`[NAMING] ${file} uses snake_case; should be kebab-case`);
                }
            });
        }
    });

    if (issues.length === 0) {
        console.log('Success: Workspace is perfectly organized according to standards!');
    } else {
        console.log('Workspace Audit Findings:');
        issues.forEach(issue => console.log(`- ${issue}`));
        console.log('\nRecommendation: Run a batch cleanup to address these issues.');
    }
}

audit();
