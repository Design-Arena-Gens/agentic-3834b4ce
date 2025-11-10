import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const selfie = formData.get('selfie') as File;
    const description = formData.get('description') as string;
    const text = formData.get('text') as string;

    if (!selfie || !description) {
      return NextResponse.json(
        { error: 'Selfie and description are required' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await selfie.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Create a thumbnail using browser Canvas API
    const canvas = await createThumbnail(base64Image, description, text);

    return new NextResponse(canvas, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
}

async function createThumbnail(
  base64Image: string,
  description: string,
  overlayText: string
): Promise<ArrayBuffer> {
  // Analyze description for styling
  const descLower = description.toLowerCase();

  // Determine background style from description
  let bgColor1 = '#6366f1'; // indigo
  let bgColor2 = '#8b5cf6'; // purple

  if (descLower.includes('blue')) {
    bgColor1 = '#3b82f6';
    bgColor2 = '#06b6d4';
  } else if (descLower.includes('red')) {
    bgColor1 = '#ef4444';
    bgColor2 = '#f97316';
  } else if (descLower.includes('green')) {
    bgColor1 = '#10b981';
    bgColor2 = '#14b8a6';
  } else if (descLower.includes('yellow') || descLower.includes('gold')) {
    bgColor1 = '#f59e0b';
    bgColor2 = '#eab308';
  } else if (descLower.includes('dark') || descLower.includes('black')) {
    bgColor1 = '#1f2937';
    bgColor2 = '#374151';
  } else if (descLower.includes('professional') || descLower.includes('corporate')) {
    bgColor1 = '#1e40af';
    bgColor2 = '#7c3aed';
  }

  // Create SVG-based thumbnail
  const svgWidth = 1280;
  const svgHeight = 720;

  const svg = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${bgColor2};stop-opacity:1" />
        </linearGradient>
        <clipPath id="selfie-clip">
          <rect x="${svgWidth * 0.08}" y="${svgHeight * 0.1}" width="${svgWidth * 0.35}" height="${svgHeight * 0.8}" rx="20" ry="20"/>
        </clipPath>
      </defs>

      <rect width="100%" height="100%" fill="url(#bg)"/>

      ${descLower.includes('tech') || descLower.includes('digital') || descLower.includes('modern') ? `
        <g opacity="0.1" stroke="#ffffff" stroke-width="2" fill="none">
          ${Array.from({length: 20}, (_, i) => `<circle cx="${Math.random() * svgWidth}" cy="${Math.random() * svgHeight}" r="${Math.random() * 100}"/>`).join('')}
        </g>
      ` : ''}

      <image
        href="data:image/png;base64,${base64Image}"
        x="${svgWidth * 0.08}"
        y="${svgHeight * 0.1}"
        width="${svgWidth * 0.35}"
        height="${svgHeight * 0.8}"
        clip-path="url(#selfie-clip)"
        preserveAspectRatio="xMidYMid slice"
      />

      <rect
        x="${svgWidth * 0.08}"
        y="${svgHeight * 0.1}"
        width="${svgWidth * 0.35}"
        height="${svgHeight * 0.8}"
        rx="20" ry="20"
        fill="none"
        stroke="#ffffff"
        stroke-width="5"
      />

      ${overlayText ? `
        <text
          x="${svgWidth * 0.08 + svgWidth * 0.35 + 80}"
          y="${svgHeight / 2}"
          font-family="Arial, sans-serif"
          font-size="${overlayText.length > 50 ? '55' : overlayText.length > 30 ? '70' : '90'}"
          font-weight="bold"
          fill="#ffffff"
          text-anchor="start"
          dominant-baseline="middle"
        >
          ${wrapText(overlayText, overlayText.length > 50 ? 55 : overlayText.length > 30 ? 70 : 90, svgWidth * 0.47)}
        </text>
      ` : ''}
    </svg>
  `;

  // Convert SVG to PNG using browser APIs
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return await blob.arrayBuffer();
}

function wrapText(text: string, fontSize: number, maxWidth: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];
  const charWidth = fontSize * 0.6; // Approximate character width

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const lineWidth = testLine.length * charWidth;

    if (lineWidth < maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  return lines.map((line, i) =>
    `<tspan x="${1280 * 0.08 + 1280 * 0.35 + 80}" dy="${i === 0 ? -(lines.length - 1) * fontSize * 0.6 : fontSize * 1.2}">${line}</tspan>`
  ).join('');
}
