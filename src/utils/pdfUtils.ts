/**
 * Utility functions to prepare cloned DOM elements for html2canvas and PDF generation.
 * Handles fixing SVG sizing, converting modern CSS color formats (oklch, oklab, color()) to standard RGB/RGBA/Hex
 * to prevent html2canvas parsing errors.
 */

function convertColorToRgb(colorStr: string, ctx: CanvasRenderingContext2D): string {
  if (!colorStr) return colorStr;
  if (
    !colorStr.includes('oklch') &&
    !colorStr.includes('oklab') &&
    !colorStr.includes('color(') &&
    !colorStr.includes('light-dark(')
  ) {
    return colorStr;
  }

  try {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#0f172a'; // dark slate fallback
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const alpha = (a / 255).toFixed(2);
    if (a < 255) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return '#0f172a';
  }
}

function convertOklchInString(str: string, ctx: CanvasRenderingContext2D): string {
  if (
    !str ||
    (!str.includes('oklch') &&
      !str.includes('oklab') &&
      !str.includes('color(') &&
      !str.includes('light-dark('))
  ) {
    return str;
  }

  let result = str;
  result = result.replace(/(?:oklch|oklab|color|light-dark)\([^)]+\)/gi, (match) => {
    return convertColorToRgb(match, ctx);
  });
  return result;
}

export function prepareClonedDocForPdf(clonedDoc: Document) {
  const canvas = clonedDoc.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // 1. Sanitize all <style> elements in the cloned document
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent) {
      styleTag.textContent = convertOklchInString(styleTag.textContent, ctx);
    }
  });

  // 2. Fix Recharts containers and SVGs explicitly for html2canvas rendering
  const rechartsContainers = clonedDoc.querySelectorAll('.recharts-responsive-container, .recharts-wrapper');
  rechartsContainers.forEach((container) => {
    const htmlContainer = container as HTMLElement;
    htmlContainer.style.width = '100%';
    htmlContainer.style.minHeight = '220px';
  });

  const svgs = clonedDoc.querySelectorAll('svg');
  svgs.forEach((svg) => {
    const w = svg.getAttribute('width');
    const h = svg.getAttribute('height');

    if (!w || w === '100%') {
      svg.setAttribute('width', '100%');
    }
    if (!h) {
      svg.setAttribute('height', '220');
    }

    // Convert oklch/oklab fill and stroke attributes on SVG paths/shapes
    const shapes = svg.querySelectorAll('path, rect, circle, text, g, line, polyline, polygon');
    shapes.forEach((shape) => {
      const fill = shape.getAttribute('fill');
      const stroke = shape.getAttribute('stroke');
      if (fill) {
        shape.setAttribute('fill', convertOklchInString(fill, ctx));
      }
      if (stroke) {
        shape.setAttribute('stroke', convertOklchInString(stroke, ctx));
      }
    });
  });

  // 3. Properties to inspect and convert on all DOM elements
  const propertiesToFix = [
    'color',
    'background-color',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'box-shadow',
    'text-shadow',
    'fill',
    'stroke',
    'stop-color',
    'flood-color',
    'lighting-color',
  ];

  const allElements = clonedDoc.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement | SVGElement;

    // Check inline style attribute
    const styleAttr = htmlEl.getAttribute('style');
    if (styleAttr) {
      htmlEl.setAttribute('style', convertOklchInString(styleAttr, ctx));
    }

    // Convert computed styles to inline RGB so html2canvas doesn't re-evaluate oklch rules
    if (clonedDoc.defaultView && htmlEl.style) {
      const computed = clonedDoc.defaultView.getComputedStyle(htmlEl);
      if (computed) {
        propertiesToFix.forEach((prop) => {
          const val = computed.getPropertyValue(prop);
          if (
            val &&
            (val.includes('oklch') ||
              val.includes('oklab') ||
              val.includes('color(') ||
              val.includes('light-dark('))
          ) {
            const converted = convertOklchInString(val, ctx);
            htmlEl.style.setProperty(prop, converted, 'important');
          }
        });
      }
    }
  });
}

