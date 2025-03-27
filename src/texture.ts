function createCanvas2d() {
  const canvas = document.createElement("canvas");
  canvas.style.background = "transparent";
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) throw new Error("Failed to create canvas 2d context");
  return [canvas, ctx] as const;
}

let [imgCanvas, imgCtx] = createCanvas2d();

function resizeCtx(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  ctx: CanvasRenderingContext2D,
) {
  if (canvas.width === w && canvas.height === h) return ctx;

  canvas.width = w;
  canvas.height = h;

  const newCtx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!newCtx) throw new Error("2D context not available after resizing");

  return newCtx;
}

interface TextStyle {
  font?: string;
  fillStyle?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  backgroundColor?: string;
}

export function renderTextToImage(
  text: string,
  style: TextStyle = {},
): Promise<HTMLImageElement> {
  const font = style.font || "16px sans-serif";
  const fillStyle = style.fillStyle || "white";
  const textAlign: CanvasTextAlign = style.textAlign || "start";
  const textBaseline: CanvasTextBaseline = style.textBaseline || "top";
  const backgroundColor = style.backgroundColor;

  imgCtx.font = font;
  const metrics = imgCtx.measureText(text);
  const padding = 10;
  const textWidth = metrics.width + padding * 2;
  const fontSizeMatch = font.match(/(\d+)px/);
  const fontSize = fontSizeMatch ? Number.parseInt(fontSizeMatch[1], 10) : 16;
  const textHeight = fontSize + padding * 2;

  imgCtx = resizeCtx(imgCanvas, textWidth, textHeight, imgCtx);

  imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);

  if (backgroundColor) {
    imgCtx.fillStyle = backgroundColor;
    imgCtx.fillRect(0, 0, imgCanvas.width, imgCanvas.height);
  }

  imgCtx.font = font;
  imgCtx.fillStyle = fillStyle;
  imgCtx.textAlign = textAlign;
  imgCtx.textBaseline = textBaseline;

  let x: number;
  if (textAlign === "center") {
    x = imgCanvas.width / 2;
  } else if (textAlign === "right" || textAlign === "end") {
    x = imgCanvas.width - padding;
  } else {
    x = padding;
  }

  let y: number;
  if (textBaseline === "middle") {
    y = imgCanvas.height / 2;
  } else if (textBaseline === "bottom" || textBaseline === "ideographic") {
    y = imgCanvas.height - padding;
  } else {
    y = padding;
  }

  imgCtx.fillText(text, x, y);

  const image = new Image();

  return new Promise((res) => {
    image.onload = () => {
      res(image);
      imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);
    };
    image.src = imgCanvas.toDataURL("image/png");
  });
}

export function loadTextureAtlas(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    atlasCanvas,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}

const [atlasCanvas, atlasCtx] = createCanvas2d();

export type Atlas = {
  uvCoords: Float32Array;
  dimensions: { width: number; height: number }[];
};
type Node = { x: number; y: number; width: number };
type Placement = { x: number; y: number; width: number; height: number };

function findPositionForNode(
  skyline: Node[],
  nodeIndex: number,
  imgWidth: number,
  imgHeight: number,
): { x: number; y: number } | null {
  const node = skyline[nodeIndex];
  const x = node.x;
  const y = node.y;

  if (x + imgWidth > atlasCanvas.width) {
    return null;
  }

  let widthLeft = imgWidth;
  let i = nodeIndex;
  let maxY = y;

  while (widthLeft > 0) {
    if (i >= skyline.length) {
      return null;
    }
    maxY = Math.max(maxY, skyline[i].y);
    widthLeft -= skyline[i].width;
    i++;
  }

  let maxHeight = y;
  for (let k = nodeIndex; k < i; k++) {
    maxHeight = Math.max(maxHeight, skyline[k].y);
  }

  if (maxHeight + imgHeight > maxY + imgHeight) {
    return null;
  }

  return { x, y: maxY };
}

function addSkylineLevel(
  skyline: Node[],
  nodeIndex: number,
  x: number,
  y: number,
  imgWidth: number,
  imgHeight: number,
) {
  const newNode: Node = { x, y: y + imgHeight, width: imgWidth };
  skyline.splice(nodeIndex, 0, newNode);

  for (let i = nodeIndex + 1; i < skyline.length; i++) {
    const node = skyline[i];
    const prev = skyline[i - 1];
    if (node.x < prev.x + prev.width) {
      const overlap = prev.x + prev.width - node.x;
      skyline[i] = {
        x: node.x + overlap,
        y: node.y,
        width: node.width - overlap,
      };
      if (skyline[i].width <= 0) {
        skyline.splice(i, 1);
        i--;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  for (let i = 0; i < skyline.length - 1; i++) {
    if (skyline[i].y === skyline[i + 1].y) {
      skyline[i].width += skyline[i + 1].width;
      skyline.splice(i + 1, 1);
      i--;
    }
  }
}

function updateAtlasData(
  atlas: Atlas,
  placements: Placement[],
  images: HTMLImageElement[],
) {
  const uvCoords = new Float32Array(images.length * 4);
  const dimensions: { width: number; height: number }[] = new Array(
    images.length,
  );

  for (let i = 0; i < images.length; i++) {
    const p = placements[i];
    const u0 = p.x / atlasCanvas.width;
    const v0 = (p.y + p.height) / atlasCanvas.height; // Flip V correctly
    const u1 = (p.x + p.width) / atlasCanvas.width;
    const v1 = p.y / atlasCanvas.height; // Flip V correctly
    uvCoords.set([u0, v0, u1, v1], i * 4);
    dimensions[i] = { width: p.width, height: p.height };
  }

  atlas.uvCoords = uvCoords;
  atlas.dimensions = dimensions;
}

export function createTextureAtlas(images: HTMLImageElement[]): Atlas {
  const totalArea = images.reduce(
    (sum, img) => sum + img.width * img.height,
    0,
  );
  const maxImageWidth = Math.max(...images.map((img) => img.width));
  const estimatedWidth = Math.max(
    maxImageWidth,
    Math.ceil(Math.sqrt(totalArea)),
  );
  atlasCanvas.width = estimatedWidth;

  const skyline: Node[] = [{ x: 0, y: 0, width: atlasCanvas.width }];
  const placements: Placement[] = new Array(images.length);
  let atlasHeight = 0;

  const indices = images.map((_, i) => i);
  indices.sort((a, b) => images[b].height - images[a].height);

  for (const i of indices) {
    const img = images[i];
    let bestY = Number.POSITIVE_INFINITY;
    let bestX = 0;
    let bestNodeIndex = -1;
    let bestPos: { x: number; y: number } | null = null;

    for (let j = 0; j < skyline.length; j++) {
      const pos = findPositionForNode(skyline, j, img.width, img.height);
      if (pos !== null) {
        if (
          pos.y < bestY ||
          (pos.y === bestY &&
            skyline[j].width <
              (skyline[bestNodeIndex]?.width ?? Number.POSITIVE_INFINITY))
        ) {
          bestY = pos.y;
          bestX = pos.x;
          bestNodeIndex = j;
          bestPos = pos;
        }
      }
    }

    if (bestPos === null) {
      bestX = 0;
      bestY = atlasHeight;
      bestNodeIndex = skyline.length;
      bestPos = { x: bestX, y: bestY };
    }

    placements[i] = {
      x: bestX,
      y: bestY,
      width: img.width,
      height: img.height,
    };
    atlasHeight = Math.max(atlasHeight, bestY + img.height);
    addSkylineLevel(
      skyline,
      bestNodeIndex,
      bestX,
      bestY,
      img.width,
      img.height,
    );
  }

  atlasCanvas.height = atlasHeight;

  for (let i = 0; i < images.length; i++) {
    const p = placements[i];
    atlasCtx.drawImage(images[i], p.x, p.y, p.width, p.height);
  }

  const atlas: Atlas = {
    uvCoords: new Float32Array(0),
    dimensions: [],
  };

  updateAtlasData(atlas, placements, images);
  return atlas;
}
