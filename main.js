const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');
const superagent = require('superagent'); 

program
  .option('-h, --host <host>', 'адреса сервера', 'localhost')
  .option('-p, --port <port>', 'порт сервера', '3000')
  .option('-c, --cache <dir>', 'шлях до директорії для кешу', './cache');

program.parse(process.argv);
const options = program.opts();
const { host, port, cache } = options;

const cacheDir = path.resolve(cache);

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`Створено директорію для кешу: ${cacheDir}`);
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('');
    return;
  }

  const code = req.url.slice(1);
  const filePath = path.join(cacheDir, `${code}.jpg`);

  if (req.method === 'PUT') {
    const fileStream = fs.createWriteStream(filePath);
    req.pipe(fileStream);
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Файл ${code}.jpg збережено у кеші.`);
    });
    return;
  }

  if (req.method === 'DELETE') {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Файл ${code}.jpg видалено з кешу.`);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Файл ${code}.jpg не знайдено.`);
    }
    return;
  }

  if (req.method === 'GET') {
    if (fs.existsSync(filePath)) {
      const stream = fs.createReadStream(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      stream.pipe(res);
    } else {
      try {
        const response = await superagent.get(`https://http.cat/${code}`);
        if (response.status === 200) {
          await fs.promises.writeFile(filePath, response.body);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(response.body);
          console.log(`Файл ${code}.jpg завантажено з http.cat та збережено у кеш.`);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
        }
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found (немає картинки для коду ${code})`);
      }
    }
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method Not Allowed');
});

server.listen(port, host, () => {
  console.log(`Сервер запущено: http://${host}:${port}`);
});
