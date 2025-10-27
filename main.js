const { program } = require('commander');
const http = require('http');
const fs = require('fs').promises; // 🟢 одразу promises-версія
const path = require('path');

program
  .option('-h, --host <host>', 'адреса сервера')
  .option('-p, --port <port>', 'порт сервера')
  .option('-c, --cache <dir>', 'шлях до директорії для кешу');

program.parse(process.argv);
const options = program.opts();

const host = options.host || 'localhost';
const port = options.port || 3000;
const cacheDir = options.cache || './cache';

// 🟢 створюємо теку кешу, якщо нема
(async () => {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
    console.log(`Кеш директорія: ${path.resolve(cacheDir)}`);
  } catch (err) {
    console.error('Помилка створення кеш-директорії:', err.message);
    process.exit(1);
  }
})();

const server = http.createServer(async (req, res) => {
  const id = req.url.slice(1); // наприклад: /200
  const filePath = path.join(cacheDir, `${id}.jpg`);

  try {
    if (req.method === 'PUT') {
      // 🟢 створюємо кеш якщо нема
      await fs.mkdir(cacheDir, { recursive: true });

      const data = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });

      await fs.writeFile(filePath, data);
      res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('201 Created — файл записано у кеш');
    }

    else if (req.method === 'GET') {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    }

    else if (req.method === 'DELETE') {
      await fs.unlink(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('200 OK — файл видалено');
    }

    else {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('405 Method Not Allowed');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found — файл не знайдено у кеші');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`500 Internal Server Error: ${err.message}`);
    }
  }
});

server.listen(port, host, () => {
  console.log(`Сервер запущено: http://${host}:${port}`);
});
