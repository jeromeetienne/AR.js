const fs = require('fs');
const obj = JSON.parse(fs.readFileSync('../data/cartigli.json', 'utf8'));

obj.forEach((element) => {
    if (element.fullname.indexOf('Giardini') !== -1 || element.fullname.indexOf('Giardino') !== -1
    || element.fullname.indexOf('Arboreto') !== -1 || element.fullname.indexOf('Orto') !== -1
    || element.fullname.indexOf('Parco') !== -1) {
        element.category = 'giardini';
        return;
    }

    if (element.fullname.indexOf('Canale') !== -1 || element.fullname.indexOf('Torrente') !== -1) {
        element.category = 'canali';
        return;
    }

    element.category = 'edifici';
});

const json = JSON.stringify(obj);
fs.writeFileSync('../data/cartigli.json', json, 'utf8');
