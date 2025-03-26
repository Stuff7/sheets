interface TextStyle {
  font?: string;
  fillStyle?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  backgroundColor?: string;
}

const canvas = document.createElement("canvas");
canvas.style.background = "transparent";
let ctx2 = canvas.getContext("2d") as CanvasRenderingContext2D;

if (!ctx2) throw new Error("Failed to create canvas 2d context");

export function renderTextToImage(
  text: string,
  style: TextStyle = {},
): Promise<HTMLImageElement> {
  const font = style.font || "16px sans-serif";
  const fillStyle = style.fillStyle || "black";
  const textAlign: CanvasTextAlign = style.textAlign || "start";
  const textBaseline: CanvasTextBaseline = style.textBaseline || "top";
  const backgroundColor = style.backgroundColor;

  ctx2.font = font;
  const metrics = ctx2.measureText(text);
  const padding = 10;
  const textWidth = metrics.width + padding * 2;
  const fontSizeMatch = font.match(/(\d+)px/);
  const fontSize = fontSizeMatch ? Number.parseInt(fontSizeMatch[1], 10) : 16;
  const textHeight = fontSize + padding * 2;

  if (canvas.width !== textWidth || canvas.height !== textHeight) {
    canvas.width = textWidth;
    canvas.height = textHeight;

    ctx2 = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx2) throw new Error("2D context not available after resizing");
  }

  ctx2.clearRect(0, 0, canvas.width, canvas.height);
  ctx2.globalCompositeOperation = "destination-over";

  if (backgroundColor) {
    ctx2.fillStyle = backgroundColor;
    ctx2.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx2.font = font;
  ctx2.fillStyle = fillStyle;
  ctx2.textAlign = textAlign;
  ctx2.textBaseline = textBaseline;

  let x: number;
  if (textAlign === "center") {
    x = canvas.width / 2;
  } else if (textAlign === "right" || textAlign === "end") {
    x = canvas.width - padding;
  } else {
    x = padding;
  }

  let y: number;
  if (textBaseline === "middle") {
    y = canvas.height / 2;
  } else if (textBaseline === "bottom" || textBaseline === "ideographic") {
    y = canvas.height - padding;
  } else {
    y = padding;
  }

  ctx2.fillText(text, x, y);

  const image = new Image();

  return new Promise((res) => {
    image.onload = () => res(image);
    image.src = canvas.toDataURL("image/png");
  });
}

export function loadTexture(
  gl: WebGL2RenderingContext,
  image: HTMLImageElement,
) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.generateMipmap(gl.TEXTURE_2D);

  return texture;
}
