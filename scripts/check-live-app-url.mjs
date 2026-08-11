const html = await (await fetch("https://zynteksisv.vercel.app/login")).text();
const localhost = [...html.matchAll(/http:\/\/localhost:3000/g)].length;
const prod = [...html.matchAll(/https:\/\/zynteksisv\.vercel\.app/g)].length;
console.log(JSON.stringify({ localhost, prod }, null, 2));
