const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const pkg = require('../package.json');

const zipFileName = `reddit-content-extractor-v${pkg.version}.zip`;
const outputPath = path.join(__dirname, '../releases', zipFileName);

// Ensure the releases directory exists
if (!fs.existsSync(path.join(__dirname, '../releases'))) {
    fs.mkdirSync(path.join(__dirname, '../releases'), { recursive: true });
}

// Create a write stream for the zip file
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Set the compression level
});

// Listen for errors
archive.on('error', function (err) {
    throw err;
});

// Pipe the archive to the output file
archive.pipe(output);

// Add the dist folder to the archive
archive.directory(path.join(__dirname, '../dist/'), false);

// Finalize the archive
archive.finalize();

console.log(`Created extension zip: ${outputPath}`);