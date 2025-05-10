const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

rl.question('Enter the directory path: ', (folderPath) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err);
            rl.close();
            return;
        }

        const renameFile = (index) => {
            if (index >= files.length) {
                console.log('All files processed.');
                rl.close();
                return;
            }

            const oldPath = path.join(folderPath, files[index]);
            
            rl.question(`Enter a number to prefix ${files[index]} (or press Enter to skip): `, (number) => {
                if (number && !isNaN(number)) {
                    const ordinal = getOrdinal(parseInt(number, 10));
                    const newName = `${ordinal}-${files[index]}`;
                    const newPath = path.join(folderPath, newName);
                    fs.rename(oldPath, newPath, (err) => {
                        if (err) {
                            console.error('Error renaming file:', err);
                        } else {
                            console.log(`${files[index]} renamed to ${newName}`);
                        }
                        renameFile(index + 1);
                    });
                } else {
                    renameFile(index + 1);
                }
            });
        };

        renameFile(0);
    });
});
