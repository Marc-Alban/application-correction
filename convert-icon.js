const pngToIco = require('png-to-ico');
const fs = require('fs');

async function convertIcon() {
    try {
        const ico = await pngToIco('icon.png');
        fs.writeFileSync('build/icon.ico', ico);
        console.log('Icon converted successfully!');
    } catch (error) {
        console.error('Error converting icon:', error);
    }
}

convertIcon(); 