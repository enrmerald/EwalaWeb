"""
Genera los 3 carteles de proyectos europeos con IDÉNTICAS dimensiones en píxeles (1080×761).

Uso (manual, no forma parte del build; los originales viven en docs/assets-origen/carteles/):

    uv run --with pillow --with numpy python scripts/generar-carteles-recursos.py [--out DIR]

Sin --out escribe en public/recursos/. Los ficheros de salida llevan el tamaño en el nombre
(p. ej. ...-LUCIA-1080x761.webp): así un CDN/navegador con la versión antigua en caché no sirve una
imagen de otra proporción. Los originales (…-1080.webp) se conservan en docs/assets-origen/carteles/.

Qué hace con cada cartel (nunca escala con proporciones distintas ni recorta logos/texto):
- LIVET  (1080×761): ya tiene el tamaño objetivo; se copia byte a byte (sin recodificar).
- GRIAL  (1079×763): se elimina la franja blanca inferior que ya traía el original (la banda negra queda
  pegada al borde) y se reponen esas filas como blanco puro, a partes iguales arriba y justo encima de la
  banda, para llegar a 761 px de alto con los logos centrados; además se repite 1 columna del borde derecho.
- LUCIA  (1080×608): hay que ganar 153 px de alto. Se amplía la zona superior (blanco + foto) con 76 px
  arriba y 77 px abajo: la zona blanca se rellena con blanco puro y el panel de foto (un paralelogramo de
  bordes rectos) se prolonga reflejando sus filas extremas y desplazándolas para continuar el borde.
  La banda negra inferior y los logos quedan intactos (se comprueba al final). Único retoque: la última fila
  del original es un borde gris (120) que se sustituye por negro, igual que la fila de encima.
"""
import argparse
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "docs" / "assets-origen" / "carteles"
DEFAULT_OUT = ROOT / "public" / "recursos"

LUCIA = "DOC-0006-01-ELIAS-Cartel-LUCIA-1080.webp"
GRIAL = "IMG-0001-01-FIELD-Cartel-GRIAL-1080.webp"
LIVET = "IMG-0001-01-GUAR-Cartel-LIVET-1080.webp"

TARGET_W, TARGET_H = 1080, 761
WEBP_QUALITY = 95

# Geometría de LUCIA (medida sobre el original): la zona superior ocupa las filas 0..423; las filas 424
# (gris 250) y 425 (transición) ya forman parte del borde de la banda negra, que llega a la 607. El borde
# izquierdo del panel de foto es x = 775 - SLOPE*y.
LUCIA_TOP_ROWS = 424
GRIAL_BAND_TOP = 541  # primera fila de la banda negra (fila de transición); la banda llega hasta la 722
GRIAL_BAND_END = 722
LUCIA_PANEL_X0 = 700  # a la izquierda de esta columna solo hay blanco/logos (el panel empieza en x≥750)
SLOPE = 0.0617


def out_name(name: str) -> str:
    """DOC-…-LUCIA-1080.webp -> DOC-…-LUCIA-1080x761.webp"""
    return name.replace("-1080.webp", f"-{TARGET_W}x{TARGET_H}.webp")


def load(name: str) -> np.ndarray:
    return np.array(Image.open(SRC_DIR / name).convert("RGB"))


def shifted_row(row: np.ndarray, shift: float) -> np.ndarray:
    """Desplaza horizontalmente `row` (W×3) `shift` px con interpolación lineal (los bordes siguen suavizados)."""
    xs = np.arange(row.shape[0], dtype=float)
    out = np.empty_like(row, dtype=float)
    for c in range(3):
        out[:, c] = np.interp(xs - shift, xs, row[:, c].astype(float))
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def extend_lucia(src: np.ndarray) -> np.ndarray:
    h, w, _ = src.shape
    assert (w, h) == (1080, 608), f"LUCIA inesperada: {w}×{h}"
    add = TARGET_H - h
    top_add, bottom_add = add // 2, add - add // 2  # 76 y 77
    top, band = src[:LUCIA_TOP_ROWS], src[LUCIA_TOP_ROWS:]

    above = np.full((top_add, w, 3), 255, dtype=np.uint8)
    for d in range(1, top_add + 1):  # fila y = -d
        s = d - 1  # fila origen reflejada
        row = above[top_add - d]
        row[LUCIA_PANEL_X0:] = shifted_row(top[s, LUCIA_PANEL_X0:], SLOPE * (d + s))

    below = np.full((bottom_add, w, 3), 255, dtype=np.uint8)
    for d in range(1, bottom_add + 1):  # fila y = LUCIA_TOP_ROWS - 1 + d
        s = LUCIA_TOP_ROWS - d  # fila origen reflejada
        row = below[d - 1]
        row[LUCIA_PANEL_X0:] = shifted_row(top[s, LUCIA_PANEL_X0:], -SLOPE * (d + (LUCIA_TOP_ROWS - 1 - s)))

    out = np.concatenate([above, top, below, band])
    out[-1] = out[-2]  # el original acaba en una fila gris (120): borde artefacto, se iguala a la fila negra anterior
    # Invariantes: logos/blanco (x<700) y banda negra idénticos al original (salvo la última fila).
    assert out.shape == (TARGET_H, TARGET_W, 3)
    assert np.array_equal(out[top_add : top_add + LUCIA_TOP_ROWS, :LUCIA_PANEL_X0], top[:, :LUCIA_PANEL_X0])
    assert np.array_equal(out[top_add + LUCIA_TOP_ROWS + bottom_add : -1], band[:-1])
    assert (above[:, :LUCIA_PANEL_X0] == 255).all() and (below[:, :LUCIA_PANEL_X0] == 255).all()
    return out


def fit_grial(src: np.ndarray) -> np.ndarray:
    h, w, _ = src.shape
    assert (w, h) == (1079, 763), f"GRIAL inesperada: {w}×{h}"
    top, band = src[:GRIAL_BAND_TOP], src[GRIAL_BAND_TOP : GRIAL_BAND_END + 1]
    # El original acaba con 40 filas blancas bajo la banda (franja sobrante): se descartan.
    assert (src[GRIAL_BAND_END + 2 :] >= 253).all(), "la franja inferior de GRIAL ya no es blanca"  # WebP con pérdidas: ruido de ±1
    assert (top[:80] == 255).all() and (top[-30:] >= 250).all(), "los márgenes blancos de GRIAL han cambiado"

    add = TARGET_H - (top.shape[0] + band.shape[0])  # filas blancas que hay que reponer (38)
    top_add, mid_add = add // 2, add - add // 2
    white = lambda n: np.full((n, w, 3), 255, dtype=np.uint8)
    out = np.concatenate([white(top_add), top, white(mid_add), band])
    out[-1] = out[-2]  # la última fila de la banda es de transición (gris); se iguala a la negra de encima
    out = np.concatenate([out, out[:, -1:]], axis=1)  # +1 columna: repite el borde derecho

    # Invariantes: contenido y banda idénticos al original (salvo la última fila) y ancho/alto objetivo.
    assert out.shape == (TARGET_H, TARGET_W, 3)
    assert np.array_equal(out[top_add : top_add + top.shape[0], :w], top)
    assert np.array_equal(out[-band.shape[0] : -1, :w], band[:-1])
    assert (out[-1] < 8).all() or (out[-1, :w] == out[-2, :w]).all()
    return out


def copy_livet(out_dir: Path) -> None:
    src = SRC_DIR / LIVET
    assert load(LIVET).shape == (TARGET_H, TARGET_W, 3), f"LIVET inesperada: {load(LIVET).shape}"
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / out_name(LIVET)
    shutil.copyfile(src, dst)
    print(f"{dst.name}: {TARGET_W}×{TARGET_H}  {dst.stat().st_size / 1024:.0f} KB  (copia sin recodificar) -> {dst}")


def save(arr: np.ndarray, out_dir: Path, name: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / out_name(name)
    Image.fromarray(arr).save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    w, h = Image.open(path).size
    assert (w, h) == (TARGET_W, TARGET_H), f"{name}: {w}×{h}"
    print(f"{path.name}: {w}×{h}  {path.stat().st_size / 1024:.0f} KB  -> {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="carpeta de salida (por defecto public/recursos)")
    args = parser.parse_args()

    save(extend_lucia(load(LUCIA)), args.out, LUCIA)
    save(fit_grial(load(GRIAL)), args.out, GRIAL)
    copy_livet(args.out)
    print(f"OK: los 3 carteles miden {TARGET_W}×{TARGET_H}")


if __name__ == "__main__":
    main()
