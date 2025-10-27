const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');

program
  .option('-i, --input <file>', 'шлях до вхідного файлу')
  .option('-h, --host <host>', 'адреса сервера')
  .option('-p, --port <port>', 'порт сервера')
  .option('-c, --cache <dir>', 'шлях до директорії для кешу');

program.parse(process.argv);

const options = program.opts();
const { host, port, cache } = options;

if (input) {
  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Cannot find input file "${inputPath}"`);
    process.exit(1);
  }
}

if (!fs.existsSync(cache)) {
  fs.mkdirSync(cache, { recursive: true });
  console.log(`Створено директорію для кешу: ${cache}`);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Сервер працює!\nХост: ${host}\nПорт: ${port}\nКеш: ${cache}`);
});

server.listen(port, host, () => {
  console.log(`Сервер запущено: http://${host}:${port}`);
});
