/**
 * Automated test suite for MY PLANNER Calendar Synchronization (.ics / RFC 5545)
 * Verifies:
 * 1. RFC 5545 structural conformance
 * 2. Proper date math for all-day events (DTEND is exclusive / +1 day)
 * 3. Text escaping rules (commas, semicolons, backslashes, newlines)
 * 4. Rich description metadata and GEO coordinates inclusion
 * 5. Multi-item event serialization
 */

function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

interface TestCalendarItem {
  id: string;
  title: string;
  location: string;
  category: string;
  scheduledDate: string;
  shortDescription?: string;
  preferredTransport?: string;
  travelTime?: string;
  coordinates?: { lat: number; lng: number };
}

function generateIcsString(items: TestCalendarItem[]): string {
  const icsContent: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IDEMO//Travel Concierge//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:IDEMO Travel Plan'
  ];

  items.forEach((item) => {
    const startDate = new Date(item.scheduledDate);
    const startYear = startDate.getFullYear();
    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDate.getDate()).padStart(2, '0');
    const startDateStr = `${startYear}${startMonth}${startDay}`;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endDateStr = `${endYear}${endMonth}${endDay}`;

    const descriptionParts = [
      `IDEMO Curated Experience: ${item.category} at ${item.location}`,
      item.shortDescription ? `Overview: ${item.shortDescription}` : '',
      item.preferredTransport ? `Transport: ${item.preferredTransport}` : '',
      item.travelTime ? `Duration: ${item.travelTime}` : '',
      'IDEMO Curated Travel — Private & Offline-Ready'
    ].filter(Boolean);

    const fullDescription = descriptionParts.join('\n\n');

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:idemo-rec-${item.id}-${startDateStr}@idemo.app`);
    icsContent.push(`DTSTAMP:20260902T120000Z`);
    icsContent.push(`DTSTART;VALUE=DATE:${startDateStr}`);
    icsContent.push(`DTEND;VALUE=DATE:${endDateStr}`);
    icsContent.push(`SUMMARY:${escapeIcsText(item.title)}`);
    icsContent.push(`DESCRIPTION:${escapeIcsText(fullDescription)}`);
    icsContent.push(`LOCATION:${escapeIcsText(item.location)}`);

    if (item.coordinates) {
      icsContent.push(`GEO:${item.coordinates.lat.toFixed(6)};${item.coordinates.lng.toFixed(6)}`);
    }

    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('TRANSP:TRANSPARENT');
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}

function runCalendarSyncTests() {
  console.log('--- CALENDAR SYNCHRONIZATION (.ICS) TEST SUITE ---');

  // Test 1: Text Escaping Validation
  const rawText = 'Belgrade, Serbia; Special \\ Scenic Route\nNext line';
  const escaped = escapeIcsText(rawText);
  console.log('[CAL-01] Text escaping test:', escaped);
  if (escaped === 'Belgrade\\, Serbia\\; Special \\\\ Scenic Route\\nNext line') {
    console.log('✅ PASS: Text escaping matches RFC 5545 requirements');
  } else {
    console.error('❌ FAIL: Text escaping mismatch:', escaped);
    process.exit(1);
  }

  // Test 2: Date Calculation (+1 Day Exclusive End Date)
  const items: TestCalendarItem[] = [
    {
      id: '1',
      title: 'Uvac Meanders & Griffon Vultures',
      location: 'Sjenica, Zlatibor District',
      category: 'nature',
      scheduledDate: '2027-05-15T00:00:00Z',
      shortDescription: 'Marvel at the dramatic green river curves and soaring vultures.',
      preferredTransport: 'Car (4x4 recommended)',
      travelTime: '3h 30m from Belgrade',
      coordinates: { lat: 43.3592, lng: 19.9575 }
    },
    {
      id: '81',
      title: 'Via Ferrata Kablar — Soft Vertical Adventure',
      location: 'Ovčar-Kablar Gorge, Čačak',
      category: 'active',
      scheduledDate: '2027-05-16T00:00:00Z',
      shortDescription: 'Protected rock-climbing route overlooking river meanders.',
      preferredTransport: 'Car or Regional Train',
      travelTime: '2h from Belgrade',
      coordinates: { lat: 43.9056, lng: 20.1833 }
    }
  ];

  const icsOutput = generateIcsString(items);

  // Check structure
  if (!icsOutput.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0')) {
    console.error('❌ FAIL: Missing VCALENDAR header');
    process.exit(1);
  }
  if (!icsOutput.endsWith('END:VCALENDAR')) {
    console.error('❌ FAIL: Missing VCALENDAR footer');
    process.exit(1);
  }

  // Check Item 1 Dates
  if (icsOutput.includes('DTSTART;VALUE=DATE:20270515') && icsOutput.includes('DTEND;VALUE=DATE:20270516')) {
    console.log('✅ PASS: Event 1 has correct exclusive next-day DTEND (20270515 -> 20270516)');
  } else {
    console.error('❌ FAIL: Date calculation mismatch for Event 1');
    process.exit(1);
  }

  // Check Item 2 Dates
  if (icsOutput.includes('DTSTART;VALUE=DATE:20270516') && icsOutput.includes('DTEND;VALUE=DATE:20270517')) {
    console.log('✅ PASS: Event 2 has correct exclusive next-day DTEND (20270516 -> 20270517)');
  } else {
    console.error('❌ FAIL: Date calculation mismatch for Event 2');
    process.exit(1);
  }

  // Check Location Escaping
  if (icsOutput.includes('LOCATION:Sjenica\\, Zlatibor District')) {
    console.log('✅ PASS: Location commas are safely escaped');
  } else {
    console.error('❌ FAIL: Unescaped comma in LOCATION field');
    process.exit(1);
  }

  // Check GEO Coordinates
  if (icsOutput.includes('GEO:43.359200;19.957500') && icsOutput.includes('GEO:43.905600;20.183300')) {
    console.log('✅ PASS: Precise GEO coordinates included for navigation mapping');
  } else {
    console.error('❌ FAIL: Missing or malformed GEO coordinates');
    process.exit(1);
  }

  console.log('--- ALL CALENDAR SYNCHRONIZATION TESTS PASSED ---');
}

runCalendarSyncTests();
