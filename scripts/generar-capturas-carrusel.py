# Script manual (NO forma parte del build): convierte las capturas PNG originales de
# public/capturas-sentry/ en los WebP que usa el carrusel del hero (HeroScreenshotCarousel).
#
# Por cada captura e idioma genera dos ficheros en public/capturas-sentry/carrusel/:
#   - <nombre>-<es|en>.webp     → carrusel del hero: máx. 1600 px de ancho, calidad 82
#   - <nombre>-<es|en>-hd.webp  → vista ampliada: tamaño original, calidad 88 (nunca se amplía)
#
# Cuándo usarlo: tras sustituir o recortar un PNG de origen (ver FUENTES). Los nombres de salida
# son los que referencia messages/{es,en}.json → products.sentryn3t.hero.carousel.slides, así que
# si solo cambia la imagen no hay que tocar nada más. Después: pnpm build y subir out/.
#
# Uso (requiere uv: https://docs.astral.sh/uv/ — instala Pillow al vuelo, sin tocar el proyecto):
#   uv run --with pillow python scripts/generar-capturas-carrusel.py            # todas
#   uv run --with pillow python scripts/generar-capturas-carrusel.py login      # solo una

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / 'public' / 'capturas-sentry'
OUT_DIR = SRC_DIR / 'carrusel'

# nombre de salida → PNG de origen por idioma (en el orden en que aparecen en el carrusel)
FUENTES = {
    'login': {'es': 'cap-login-sentry-es.png', 'en': 'cap-login-sentry-en.png'},
    'panel-control': {'es': 'captura-sentry-español.png', 'en': 'captura-sentry-ingles.png'},
    'trafico-geolocalizacion': {'es': 'cap-dashboard-2-sentry-es.png', 'en': 'cap-dashboard-2-sentry-en.png'},
    'conexiones-red': {'es': 'cap-networks-sentry-es.png', 'en': 'cap-networks-sentry-en.png'},
}

ANCHO_CARRUSEL = 1600
CALIDAD_CARRUSEL = 82
CALIDAD_HD = 88


def guardar(img: Image.Image, destino: Path, calidad: int) -> None:
    img.save(destino, 'WEBP', quality=calidad, method=6)
    print(f'  {destino.relative_to(ROOT)}  {img.width}x{img.height}  {destino.stat().st_size // 1024} KB')


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')  # la consola de Windows usa cp1252 por defecto
    filtro = set(sys.argv[1:])
    desconocidos = filtro - FUENTES.keys()
    if desconocidos:
        sys.exit(f'Nombre desconocido: {", ".join(desconocidos)}. Opciones: {", ".join(FUENTES)}')

    OUT_DIR.mkdir(exist_ok=True)
    for nombre, por_idioma in FUENTES.items():
        if filtro and nombre not in filtro:
            continue
        for idioma, png in por_idioma.items():
            print(f'{nombre} [{idioma}] ← {png}')
            img = Image.open(SRC_DIR / png).convert('RGB')
            guardar(img, OUT_DIR / f'sentryn3t-{nombre}-{idioma}-hd.webp', CALIDAD_HD)
            if img.width > ANCHO_CARRUSEL:
                alto = round(img.height * ANCHO_CARRUSEL / img.width)
                img = img.resize((ANCHO_CARRUSEL, alto), Image.LANCZOS)
            guardar(img, OUT_DIR / f'sentryn3t-{nombre}-{idioma}.webp', CALIDAD_CARRUSEL)


if __name__ == '__main__':
    main()
