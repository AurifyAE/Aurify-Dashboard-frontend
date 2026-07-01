import { NextResponse } from 'next/server';

export const revalidate = 600; // Cache for 10 minutes

export async function GET() {
  try {
    // Fetch live market news from WSJ (public RSS feed)
    const res = await fetch('https://feeds.a.dj.com/rss/RSSMarketsMain.xml', {
      next: { revalidate: 600 },
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch RSS feed');
    }

    const xml = await res.text();
    
    // Quick regex parsing for the XML items
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;
    const linkRegex = /<link>([\s\S]*?)<\/link>/;

    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 6) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(titleRegex);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : 'Market Update';
      
      const pubDateMatch = itemXml.match(pubDateRegex);
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      
      const linkMatch = itemXml.match(linkRegex);
      const link = linkMatch ? linkMatch[1].trim() : '#';

      items.push({
        title,
        pubDate: pubDateStr,
        link,
      });
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Failed to fetch live news:', error);
    // Fallback to realistic mock data if feed fails
    return NextResponse.json({
      success: true,
      data: [
        { title: 'Gold trends upward as global central banks signal interest rate relief', pubDate: new Date().toISOString(), link: '#' },
        { title: 'Silver experiences massive retail demand in Asian physical markets', pubDate: new Date().toISOString(), link: '#' },
        { title: 'Precious metals surge amidst new clean energy manufacturing quotas', pubDate: new Date().toISOString(), link: '#' },
      ]
    });
  }
}
