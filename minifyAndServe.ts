import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import brotli from 'brotli';

const port: number = 3000;
const contentTypeMapping: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
};

const minifyAndServe = async (filePath: string): Promise<void> => {
  let extname: string = path.extname(filePath);
  let contentType: string = contentTypeMapping[extname] || 'text/html';
  let content: Buffer = await fs.promises.readFile(filePath);
  let gzip: Buffer = zlib.gzipSync(content);
  let brotliCompressed: Uint8Array = brotli.compress(content);

  if (extname === '.html') {
    content = Buffer.from(content.toString().replace(/\s+/g, ' '));
  }

  const server = http.createServer((req, res) => {
    let acceptEncoding: string | undefined = req.headers['accept-encoding'] as string;
    if (acceptEncoding && acceptEncoding.match(/\bgzip\b/)) {
      res.writeHead(200, { 'Content-Encoding': 'gzip', 'Content-Type': contentType });
      res.end(gzip);
    } else if (acceptEncoding && acceptEncoding.match(/\bbr\b/)) {
      res.writeHead(200, { 'Content-Encoding': 'br', 'Content-Type': contentType });
      res.end(brotliCompressed);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });

  await new Promise((resolve) => server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  }));
};

minifyAndServe(path.join(__dirname, 'public', 'index.html'));
