import http.server
import functools

RAIZ = "/Users/usuario/Desktop/calude/paginas wep/perfumes"
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=RAIZ)
http.server.ThreadingHTTPServer(("127.0.0.1", 8743), Handler).serve_forever()
