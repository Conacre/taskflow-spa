import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 5173);
const root = fileURLToPath(new URL(".", import.meta.url));

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
    try {
        const url = new URL(request.url, `http://localhost:${port}`);
        const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
        const filePath = normalize(join(root, requestedPath));

        if (!filePath.startsWith(normalize(root))) {
            response.writeHead(403);
            response.end("Forbidden");
            return;
        }

        const file = await readFile(filePath);
        response.writeHead(200, {
            "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
        });
        response.end(file);
    } catch (error) {
        response.writeHead(404);
        response.end("Not found");
    }
});

server.listen(port, () => {
    console.log(`Frontend server: http://localhost:${port}`);
});
