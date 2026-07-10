/* ============================================================
   SRS · data.js
   Synthetic — but internally consistent — dataset for
   NovaForge Manufacturing, a global maker of kitchen appliances,
   power tools, outdoor equipment and climate products.

   Anchors (referenced across all pages):
   · FY26 revenue plan ........ $2.43B
   · Current total REV ........ $113.8M (risk exposure value)
   · Mitigated YTD ............ $46.2M
   · Suppliers tracked ........ 30  (2 critical / 6 high risk)
   · Single-source materials .. 7
   · Active events ............ 9 open (2 critical)
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  const asOf = '2026-07-09';

  /* ---------------- Plants ---------------- */
  const plants = [
    { id: 'PL1', name: 'Columbus, USA',        region: 'NA',    focus: 'Kitchen Appliances' },
    { id: 'PL2', name: 'Monterrey, Mexico',    region: 'LATAM', focus: 'Power Tools' },
    { id: 'PL3', name: 'Gdańsk, Poland',       region: 'EU',    focus: 'Kitchen Appliances' },
    { id: 'PL4', name: 'Stuttgart, Germany',   region: 'EU',    focus: 'Climate Systems' },
    { id: 'PL5', name: 'Pune, India',          region: 'APAC',  focus: 'Motors & Assemblies' },
    { id: 'PL6', name: 'Ho Chi Minh City, Vietnam', region: 'APAC', focus: 'Small Appliances' },
    { id: 'PL7', name: 'Suzhou, China',        region: 'APAC',  focus: 'Power Tools & Electronics' }
  ];

  /* ---------------- Material categories ---------------- */
  const categories = [
    { key: 'metals',      name: 'Metals',               sub: ['Steel Coil', 'Aluminum Ingot', 'Copper Wire', 'Stainless Sheet'] },
    { key: 'polymers',    name: 'Polymers & Resins',    sub: ['ABS Resin', 'PP Resin', 'Engineering Plastics', 'Silicone'] },
    { key: 'electronics', name: 'Electronics',          sub: ['MCUs & Semiconductors', 'PCB Assemblies', 'Lithium Cells', 'Wiring & Harnesses', 'Sensors'] },
    { key: 'components',  name: 'Components',           sub: ['Electric Motors', 'Compressors', 'Bearings', 'Heating Elements', 'Fasteners', 'Switchgear'] },
    { key: 'packaging',   name: 'Packaging',            sub: ['Corrugated Cartons', 'Flexible Film', 'Molded Foam', 'Labels & Inserts'] },
    { key: 'chemicals',   name: 'Chemicals & Coatings', sub: ['Powder Coating', 'Adhesives', 'Refrigerants'] }
  ];
  const catName = k => (categories.find(c => c.key === k) || {}).name || k;

  /* ---------------- Suppliers ----------------
     row: [id, name, city, country, region, catKey, spend$M, score,
           {fin, geo, rel, qual, src}, otif%, defectPpm, leadDays, tier, rev$M] */
  const S = [
    ['S01', 'Mekong Flexible Films Co.',      'Ho Chi Minh City', 'Vietnam',     'APAC',  'packaging',   18.4, 4.18, { fin: 3.1, geo: 4.7, rel: 4.4, qual: 2.6, src: 4.9 }, 78.2, 410, 32, 1, 8.4],
    ['S02', 'Shenzhen Precision Electronics', 'Shenzhen',         'China',       'APAC',  'electronics', 84.2, 3.62, { fin: 2.2, geo: 4.3, rel: 3.6, qual: 2.4, src: 4.1 }, 88.5, 260, 41, 1, 12.8],
    ['S03', 'Rhein Metallwerke GmbH',         'Duisburg',         'Germany',     'EU',    'metals',      62.0, 2.12, { fin: 1.6, geo: 1.8, rel: 2.3, qual: 1.9, src: 2.7 }, 96.1, 120, 18, 1, 0.0],
    ['S04', 'Gulf Coast Polymers LLC',        'Houston',          'USA',         'NA',    'polymers',    41.5, 3.38, { fin: 4.6, geo: 2.9, rel: 3.3, qual: 2.2, src: 3.4 }, 84.7, 190, 21, 1, 9.6],
    ['S05', 'Monterrey Die Casting SA',       'Monterrey',        'Mexico',      'LATAM', 'metals',      28.7, 3.05, { fin: 2.4, geo: 2.7, rel: 3.9, qual: 2.8, src: 2.9 }, 81.3, 340, 12, 1, 4.8],
    ['S06', 'Pune Drives & Motors Pvt Ltd',   'Pune',             'India',       'APAC',  'components',  47.3, 2.86, { fin: 1.9, geo: 2.3, rel: 2.8, qual: 4.2, src: 2.6 }, 90.4, 780, 27, 1, 4.1],
    ['S07', 'Baltic Packaging Solutions',     'Gdańsk',           'Poland',      'EU',    'packaging',   12.9, 1.62, { fin: 1.4, geo: 1.7, rel: 1.6, qual: 1.5, src: 1.9 }, 97.2, 95,  9,  1, 0.0],
    ['S08', 'Kansai Compressor Corp',         'Osaka',            'Japan',       'APAC',  'components',  55.1, 2.31, { fin: 1.5, geo: 2.4, rel: 2.2, qual: 1.8, src: 3.6 }, 95.0, 85,  35, 1, 2.2],
    ['S09', 'Taichung Semiconductor Solutions','Taichung',        'Taiwan',      'APAC',  'electronics', 38.6, 3.94, { fin: 2.1, geo: 4.9, rel: 3.7, qual: 2.0, src: 4.8 }, 86.9, 60,  52, 1, 14.2],
    ['S10', 'Great Lakes Steel Processing',   'Cleveland',        'USA',         'NA',    'metals',      44.0, 1.85, { fin: 1.7, geo: 1.4, rel: 2.1, qual: 2.0, src: 2.1 }, 95.8, 150, 11, 1, 0.0],
    ['S11', 'Bavarian Sensor Technik GmbH',   'Munich',           'Germany',     'EU',    'electronics', 21.4, 2.05, { fin: 1.6, geo: 1.8, rel: 2.0, qual: 2.2, src: 2.6 }, 96.6, 70,  24, 1, 0.0],
    ['S12', 'Hanoi Circuit Assembly JSC',     'Hanoi',            'Vietnam',     'APAC',  'electronics', 33.8, 3.21, { fin: 2.6, geo: 3.4, rel: 3.2, qual: 2.7, src: 3.5 }, 87.1, 310, 38, 1, 5.4],
    ['S13', 'Guadalajara Wire & Harness',     'Guadalajara',      'Mexico',      'LATAM', 'electronics', 19.7, 2.44, { fin: 2.0, geo: 2.5, rel: 2.7, qual: 2.4, src: 2.5 }, 92.3, 220, 14, 1, 1.1],
    ['S14', 'Nordzee Chemie BV',              'Rotterdam',        'Netherlands', 'EU',    'chemicals',   16.2, 2.58, { fin: 1.8, geo: 2.2, rel: 3.4, qual: 1.9, src: 3.3 }, 89.5, 105, 16, 1, 3.1],
    ['S15', 'Apex Fastener Industries',       'Taipei',           'Taiwan',      'APAC',  'components',   8.9, 1.44, { fin: 1.3, geo: 2.2, rel: 1.3, qual: 1.2, src: 1.4 }, 98.1, 45,  19, 2, 0.0],
    ['S16', 'Silesia Motor Works',            'Katowice',         'Poland',      'EU',    'components',  26.5, 2.72, { fin: 2.9, geo: 2.4, rel: 2.9, qual: 2.5, src: 2.8 }, 90.8, 260, 22, 1, 1.6],
    ['S17', 'Chengdu Lithium Power Co.',      'Chengdu',          'China',       'APAC',  'electronics', 29.3, 3.71, { fin: 2.7, geo: 3.9, rel: 3.4, qual: 3.8, src: 4.6 }, 85.2, 380, 44, 1, 7.9],
    ['S18', 'Iberia Coil Coatings SA',        'Valencia',         'Spain',       'EU',    'chemicals',    9.8, 1.92, { fin: 1.7, geo: 1.6, rel: 2.2, qual: 1.8, src: 2.3 }, 94.9, 130, 13, 2, 0.0],
    ['S19', 'Carolina Corrugated Co.',        'Charlotte',        'USA',         'NA',    'packaging',   14.6, 1.51, { fin: 1.3, geo: 1.3, rel: 1.7, qual: 1.4, src: 1.8 }, 97.6, 60,  7,  1, 0.0],
    ['S20', 'Mumbai Alloy Foundry Ltd',       'Mumbai',           'India',       'APAC',  'metals',      17.2, 2.95, { fin: 2.5, geo: 3.3, rel: 3.2, qual: 2.6, src: 2.9 }, 83.9, 450, 25, 2, 2.4],
    ['S21', 'Torino Elettromeccanica SpA',    'Turin',            'Italy',       'EU',    'components',  22.8, 2.18, { fin: 2.1, geo: 1.9, rel: 2.3, qual: 2.1, src: 2.5 }, 94.2, 110, 20, 1, 0.0],
    ['S22', 'Busan Heavy Bearings Co.',       'Busan',            'South Korea', 'APAC',  'components',  13.4, 1.78, { fin: 1.5, geo: 2.0, rel: 1.8, qual: 1.6, src: 2.0 }, 96.8, 55,  28, 1, 0.0],
    ['S23', 'Delta Silicone Solutions',       'Penang',           'Malaysia',    'APAC',  'polymers',    11.1, 2.26, { fin: 1.9, geo: 2.3, rel: 2.4, qual: 2.1, src: 2.6 }, 93.4, 160, 30, 2, 0.0],
    ['S24', 'PolyChem Bratislava s.r.o.',     'Bratislava',       'Slovakia',    'EU',    'polymers',    15.8, 2.61, { fin: 2.3, geo: 2.1, rel: 2.7, qual: 2.3, src: 3.4 }, 91.7, 200, 17, 1, 1.9],
    ['S25', 'Yangtze Aluminum Group',         'Chongqing',        'China',       'APAC',  'metals',      36.9, 3.12, { fin: 2.3, geo: 4.1, rel: 3.0, qual: 2.2, src: 3.2 }, 89.1, 140, 39, 1, 6.3],
    ['S26', 'Andes Copper Refining SpA',      'Santiago',         'Chile',       'LATAM', 'metals',      24.1, 2.83, { fin: 2.2, geo: 3.1, rel: 3.3, qual: 1.9, src: 3.0 }, 87.8, 90,  46, 2, 2.9],
    ['S27', 'Ohio Thermal Systems Inc.',      'Dayton',           'USA',         'NA',    'components',  18.3, 1.67, { fin: 1.5, geo: 1.3, rel: 1.9, qual: 1.7, src: 1.9 }, 96.3, 105, 10, 1, 0.0],
    ['S28', 'Kraków Label & Print sp. z o.o.','Kraków',           'Poland',      'EU',    'packaging',    6.7, 1.38, { fin: 1.2, geo: 1.6, rel: 1.4, qual: 1.2, src: 1.5 }, 98.4, 40,  8,  2, 0.0],
    ['S29', 'Suzhou Switchgear Mfg Co.',      'Suzhou',           'China',       'APAC',  'components',  20.6, 2.49, { fin: 1.9, geo: 3.0, rel: 2.4, qual: 2.2, src: 2.7 }, 92.9, 175, 26, 1, 0.9],
    ['S30', 'Alsace Adhesives SARL',          'Strasbourg',       'France',      'EU',    'chemicals',    7.9, 1.55, { fin: 1.4, geo: 1.4, rel: 1.7, qual: 1.5, src: 1.7 }, 97.0, 80,  12, 2, 0.0]
  ];

  // 12-month risk-score trends (Jul 25 → Jun 26) for story suppliers; others get a flat-ish derived trend.
  const trendOverrides = {
    S01: [2.3, 2.4, 2.4, 2.6, 2.7, 2.8, 2.9, 3.0, 3.2, 3.5, 3.9, 4.18],
    S09: [3.1, 3.2, 3.3, 3.3, 3.4, 3.5, 3.5, 3.6, 3.7, 3.8, 3.9, 3.94],
    S04: [2.4, 2.5, 2.6, 2.8, 2.9, 3.0, 3.0, 3.1, 3.2, 3.3, 3.4, 3.38],
    S17: [2.9, 3.0, 3.1, 3.1, 3.2, 3.3, 3.4, 3.4, 3.5, 3.6, 3.7, 3.71],
    S06: [2.2, 2.2, 2.3, 2.3, 2.4, 2.4, 2.5, 2.6, 2.6, 2.7, 2.8, 2.86],
    S05: [2.6, 2.6, 2.7, 2.7, 2.8, 2.8, 2.9, 2.9, 3.0, 3.0, 3.1, 3.05]
  };

  const suppliers = S.map(r => {
    const [id, name, city, country, region, cat, spend, score, dims, otif, ppm, lead, tier, rev] = r;
    const rating = SRS.risk.ratingOf(score);
    let trend = trendOverrides[id];
    if (!trend) {
      trend = [];
      for (let i = 0; i < 12; i++) {
        const drift = (score - 0.25) + (i / 11) * 0.25;
        const wob = 0.12 * Math.sin(i * 2.1 + id.charCodeAt(2));
        trend.push(Math.max(0.4, Math.min(5, +(drift + wob).toFixed(2))));
      }
      trend[11] = score;
    }
    return { id, name, city, country, region, cat, catName: catName(cat), spend, score, rating, dims, otif, ppm, lead, tier, rev, trend };
  });

  /* ---------------- Materials ----------------
     row: [id, name, catKey, subcat, supplierIds, plantIds, stockDays, leadDays, score, rev$M, substitution] */
  const M = [
    ['M01', 'BOPP flexible film (print grade)',  'packaging',   'Flexible Film',        ['S01'],        ['PL3', 'PL6'], 11, 32, 4.18, 8.4, 'Low — print tooling requalification 3–4 wks'],
    ['M02', '32-bit control MCU (144-pin)',      'electronics', 'MCUs & Semiconductors',['S09'],        ['PL2', 'PL5', 'PL7'], 21, 52, 3.94, 14.2, 'Low — firmware port + EMC retest 8–10 wks'],
    ['M03', 'ABS resin (high-gloss)',            'polymers',    'ABS Resin',            ['S04', 'S24'], ['PL1', 'PL3', 'PL6'], 24, 21, 3.10, 6.1, 'Medium — dual-sourced, color match needed'],
    ['M04', 'Corrugated shipper cartons',        'packaging',   'Corrugated Cartons',   ['S19', 'S07'], ['PL1', 'PL2', 'PL3'], 18, 7,  1.48, 0.0, 'High — regional converters available'],
    ['M05', 'Lithium cells 21700 (5 Ah)',        'electronics', 'Lithium Cells',        ['S17'],        ['PL7'],        26, 44, 3.71, 7.9, 'Low — UN38.3 + pack redesign 10+ wks'],
    ['M06', 'Universal motor 1200 W',            'components',  'Electric Motors',      ['S06', 'S16'], ['PL2', 'PL7'], 19, 27, 2.86, 4.1, 'Medium — second source at 40% capacity'],
    ['M07', 'Rotary compressor (R290)',          'components',  'Compressors',          ['S08'],        ['PL4'],        30, 35, 2.31, 2.2, 'Low — single qualified source'],
    ['M08', 'Cold-rolled steel coil 1.2 mm',     'metals',      'Steel Coil',           ['S10', 'S03'], ['PL1', 'PL2'], 27, 14, 1.92, 0.0, 'High — commodity, multiple mills'],
    ['M09', 'Aluminum ingot A356',               'metals',      'Aluminum Ingot',       ['S25'],        ['PL2', 'PL5'], 22, 39, 3.12, 6.3, 'Medium — spot market available at premium'],
    ['M10', 'Copper winding wire 0.8 mm',        'metals',      'Copper Wire',          ['S26'],        ['PL5'],        17, 46, 2.83, 2.9, 'Medium — LME-linked, 2 alternates in audit'],
    ['M11', 'Main control PCBA',                 'electronics', 'PCB Assemblies',       ['S12', 'S02'], ['PL6', 'PL7'], 15, 38, 3.21, 5.4, 'Medium — dual EMS, capacity constrained'],
    ['M12', 'Wiring harness set',                'electronics', 'Wiring & Harnesses',   ['S13'],        ['PL2'],        20, 14, 2.44, 1.1, 'High — labor-intensive, movable tooling'],
    ['M13', 'Epoxy powder coating (RAL9016)',    'chemicals',   'Powder Coating',       ['S18'],        ['PL3', 'PL4'], 34, 13, 1.92, 0.0, 'High — several EU coaters qualified'],
    ['M14', 'PA66-GF30 engineering resin',       'polymers',    'Engineering Plastics', ['S24'],        ['PL4', 'PL7'], 16, 17, 2.61, 1.9, 'Low — UL-rated grade, requal 6 wks'],
    ['M15', 'NTC thermistor sensor pack',        'electronics', 'Sensors',              ['S11'],        ['PL4'],        29, 24, 2.05, 0.0, 'Medium — form-fit alternates exist'],
    ['M16', 'Tubular heating element 2 kW',      'components',  'Heating Elements',     ['S27'],        ['PL1'],        25, 10, 1.67, 0.0, 'High — domestic alternates'],
    ['M17', 'Deep-groove bearings 6202',         'components',  'Bearings',             ['S22'],        ['PL5', 'PL7'], 31, 28, 1.78, 0.0, 'High — catalogue part'],
    ['M18', 'Fastener kit (M4–M8, zinc)',        'components',  'Fasteners',            ['S15'],        ['PL1', 'PL2', 'PL3', 'PL7'], 40, 19, 1.44, 0.0, 'High — commodity'],
    ['M19', 'Molded EPE foam inserts',           'packaging',   'Molded Foam',          ['S07', 'S19'], ['PL1', 'PL3'], 21, 9,  1.55, 0.0, 'High — regional molders'],
    ['M20', 'Product labels & manuals',          'packaging',   'Labels & Inserts',     ['S28'],        ['PL3', 'PL4'], 23, 8,  1.38, 0.0, 'High — print brokers available'],
    ['M21', 'Silicone door gaskets',             'polymers',    'Silicone',             ['S23'],        ['PL4', 'PL6'], 19, 30, 2.26, 0.0, 'Medium — tooling transferable'],
    ['M22', 'Hot-melt adhesive (food-safe)',     'chemicals',   'Adhesives',            ['S30', 'S14'], ['PL1', 'PL6'], 28, 12, 1.72, 0.0, 'High — dual-sourced'],
    ['M23', 'R290 refrigerant (bulk)',           'chemicals',   'Refrigerants',         ['S14'],        ['PL4'],        14, 16, 2.58, 3.1, 'Low — hazmat logistics constraint'],
    ['M24', 'Stainless sheet 304 (0.8 mm)',      'metals',      'Stainless Sheet',      ['S03'],        ['PL1', 'PL3'], 26, 18, 2.12, 0.0, 'Medium — EU mills at premium'],
    ['M25', 'Rocker switch assemblies',          'components',  'Switchgear',           ['S29', 'S21'], ['PL1', 'PL6'], 22, 26, 2.35, 0.9, 'High — dual-sourced'],
    ['M26', 'Li-ion BMS protection board',       'electronics', 'PCB Assemblies',       ['S02', 'S12'], ['PL7'],        18, 41, 3.42, 4.6, 'Medium — firmware-locked, dual EMS']
  ];
  const materials = M.map(r => {
    const [id, name, cat, subcat, sup, pl, stockDays, leadDays, score, rev, substitution] = r;
    return {
      id, name, cat, catName: catName(cat), subcat,
      suppliers: sup, plants: pl, stockDays, leadDays, score,
      rating: SRS.risk.ratingOf(score), rev,
      singleSource: sup.length === 1, substitution
    };
  });

  /* ---------------- Products / SKUs ----------------
     row: [id, name, line, revenue$M, margin%, growth%, materialIds, plantIds] */
  const P = [
    ['P01', 'Stand Mixer Pro 5Q',        'Kitchen Appliances', 182, 34.2,  8.4, ['M03', 'M08', 'M16', 'M25', 'M04', 'M01'], ['PL1', 'PL3']],
    ['P02', 'Espresso Machine E9',       'Kitchen Appliances', 164, 38.6, 12.1, ['M03', 'M24', 'M15', 'M25', 'M22', 'M01'], ['PL3']],
    ['P03', 'Air Fryer 6L Smart',        'Kitchen Appliances', 158, 31.0, 16.8, ['M03', 'M16', 'M11', 'M25', 'M04', 'M01'], ['PL6', 'PL1']],
    ['P04', 'Blender X700',              'Kitchen Appliances', 121, 29.4,  4.2, ['M03', 'M06', 'M25', 'M04', 'M01'],        ['PL6', 'PL3']],
    ['P05', 'Induction Cooktop IC2',     'Kitchen Appliances', 155, 27.8,  9.6, ['M11', 'M24', 'M15', 'M22', 'M04'],        ['PL3']],
    ['P06', '20V Drill Driver DD200',    'Power Tools',        176, 33.5,  7.3, ['M02', 'M05', 'M06', 'M26', 'M18', 'M12'], ['PL2', 'PL7']],
    ['P07', 'Angle Grinder 850W',        'Power Tools',        118, 30.2,  3.1, ['M02', 'M06', 'M08', 'M17', 'M18'],        ['PL2']],
    ['P08', 'Circular Saw 190mm',        'Power Tools',        102, 28.7,  2.4, ['M02', 'M06', 'M08', 'M17', 'M18'],        ['PL2', 'PL7']],
    ['P09', '20V Impact Wrench IW450',   'Power Tools',        134, 35.1, 11.2, ['M02', 'M05', 'M26', 'M17', 'M12'],        ['PL7']],
    ['P10', 'Cordless Vacuum W20',       'Power Tools',        160, 32.8, 18.9, ['M02', 'M05', 'M26', 'M03', 'M21'],        ['PL7', 'PL6']],
    ['P11', 'Robotic Mower R400',        'Outdoor & Garden',   142, 36.4, 22.5, ['M02', 'M05', 'M26', 'M11', 'M21'],        ['PL7']],
    ['P12', 'Pressure Washer PW160',     'Outdoor & Garden',    98, 26.3,  5.8, ['M06', 'M03', 'M09', 'M18', 'M25'],        ['PL2']],
    ['P13', 'Hedge Trimmer HT55',        'Outdoor & Garden',    64, 27.9,  1.9, ['M02', 'M05', 'M06', 'M18'],               ['PL7']],
    ['P14', 'Chainsaw C40 Cordless',     'Outdoor & Garden',    88, 29.8,  6.7, ['M02', 'M05', 'M26', 'M09', 'M17'],        ['PL2', 'PL7']],
    ['P15', 'Leaf Blower B300',          'Outdoor & Garden',    71, 25.6,  3.4, ['M02', 'M05', 'M06', 'M03'],               ['PL7']],
    ['P16', 'Split AC 12K BTU',          'Climate Systems',    186, 24.9,  9.2, ['M07', 'M23', 'M10', 'M15', 'M09', 'M13'], ['PL4']],
    ['P17', 'Dehumidifier D25',          'Climate Systems',     79, 26.7,  7.5, ['M07', 'M23', 'M15', 'M03', 'M25'],        ['PL4']],
    ['P18', 'Heat Pump HP8 (residential)','Climate Systems',   148, 31.9, 26.4, ['M07', 'M23', 'M10', 'M15', 'M13', 'M24'], ['PL4']],
    ['P19', 'Air Purifier AP500',        'Climate Systems',     93, 30.5, 14.3, ['M11', 'M03', 'M15', 'M06', 'M20'],        ['PL6']],
    ['P20', 'Portable Heater PH2',       'Climate Systems',     54, 22.4, -2.1, ['M16', 'M03', 'M25', 'M04'],               ['PL1']]
  ];
  const products = P.map(r => {
    const [id, name, line, revenue, margin, growth, mats, pl] = r;
    // product risk = max linked material risk, discounted slightly
    const linked = mats.map(m => materials.find(x => x.id === m)).filter(Boolean);
    const maxRisk = Math.max(...linked.map(m => m.score));
    const score = +(maxRisk * 0.92).toFixed(2);
    const rev = +(linked.reduce((a, m) => a + (m.rev > 0 ? m.rev * (revenue / 2430) * 4.2 : 0), 0)).toFixed(1);
    return {
      id, name, line, revenue, margin, growth, materials: mats, plants: pl,
      score, rating: SRS.risk.ratingOf(score), rev
    };
  });

  /* ---------------- Events ---------------- */
  const events = [
    {
      id: 'EV-2618', title: 'Severe flooding across Mekong Delta industrial zones',
      type: 'Extreme Weather', criticality: 'Critical', status: 'Active',
      location: 'Ho Chi Minh City, Vietnam', region: 'APAC',
      start: '2026-07-02', lastUpdate: '2026-07-09', source: 'Global event feed',
      suppliers: ['S01'], materials: ['M01'], rev: 8.4,
      description: 'Tropical storm remnants brought 480 mm of rain in 72 hours across the Mekong Delta. The Binh Chanh industrial zone — home to Mekong Flexible Films\' primary extrusion plant — reports flooded access roads and a partial production halt. Packaging film for 18 SKUs across Gdańsk and Ho Chi Minh City plants is affected; current inventory cover is 11 days.',
      timeline: [
        ['2026-07-02', 'Event detected by Risk Sensing Agent from weather feed'],
        ['2026-07-03', 'Supplier site matched — Mekong Flexible Films, Binh Chanh plant'],
        ['2026-07-04', 'Impact assessed: 1 material, 18 SKUs, $8.4M REV'],
        ['2026-07-06', 'Supplier confirms partial halt; recovery ETA 3–4 weeks'],
        ['2026-07-08', 'Mitigation recommended: shift 40% volume to Baltic Packaging'],
        ['2026-07-09', 'Approval pending — Category Head, Planning Lead']
      ]
    },
    {
      id: 'EV-2617', title: 'Taiwan Strait naval exercises trigger export inspection delays',
      type: 'Geopolitical', criticality: 'Critical', status: 'Active',
      location: 'Taichung, Taiwan', region: 'APAC',
      start: '2026-06-28', lastUpdate: '2026-07-08', source: 'Geopolitical monitor',
      suppliers: ['S09', 'S15'], materials: ['M02'], rev: 14.2,
      description: 'Expanded naval exercises have led to enhanced customs inspection on semiconductor exports. Average outbound clearance for Taichung Semiconductor Solutions has moved from 3 to 9 days and freight forwarders flag continued congestion. The 32-bit control MCU is single-sourced and feeds three plants.',
      timeline: [
        ['2026-06-28', 'Geopolitical monitor flags exercise announcement'],
        ['2026-06-30', 'Lead-time variance breach: clearance 3d → 9d'],
        ['2026-07-03', 'Impact assessed: 11 SKUs across PL2/PL5/PL7, $14.2M REV'],
        ['2026-07-07', 'Scenario run: 30-day disruption → 7 SKUs at stockout risk'],
        ['2026-07-08', 'Alternate MCU qualification program accelerated (G2)']
      ]
    },
    {
      id: 'EV-2616', title: 'Gulf Coast hurricane watch — petrochemical pre-emptive shutdowns',
      type: 'Extreme Weather', criticality: 'High', status: 'Tracked',
      location: 'Houston, USA', region: 'NA',
      start: '2026-07-06', lastUpdate: '2026-07-09', source: 'Weather feed',
      suppliers: ['S04'], materials: ['M03'], rev: 6.2,
      description: 'NOAA hurricane watch for the upper Texas coast. Gulf Coast Polymers has announced a precautionary cracker shutdown protocol. ABS resin allocation risk if landfall occurs; dual source PolyChem Bratislava can absorb ~35% of volume on 2-week notice.',
      timeline: [
        ['2026-07-06', 'Hurricane watch issued — supplier site inside cone'],
        ['2026-07-07', 'Supplier confirms pre-emptive shutdown protocol'],
        ['2026-07-09', 'Tracking — landfall probability 46%, next update 6h']
      ]
    },
    {
      id: 'EV-2615', title: 'Gulf Coast Polymers credit rating downgraded to CCC+',
      type: 'Financial Distress', criticality: 'High', status: 'Mitigation in Progress',
      location: 'Houston, USA', region: 'NA',
      start: '2026-06-12', lastUpdate: '2026-07-05', source: 'Financial risk feed',
      suppliers: ['S04'], materials: ['M03'], rev: 9.6,
      description: 'S&P downgraded Gulf Coast Polymers to CCC+ citing liquidity stress and covenant pressure. Payment behavior deteriorated over 2 quarters (DPO +18 days). Financial risk dimension moved 3.1 → 4.6. Safety-stock build and volume hedge to PolyChem underway (program G3).',
      timeline: [
        ['2026-06-12', 'Rating action detected by financial risk feed'],
        ['2026-06-13', 'Financial dimension rescored 3.1 → 4.6'],
        ['2026-06-16', 'Mitigation approved: +3 wks safety stock, 25% volume hedge'],
        ['2026-07-05', 'Safety stock at 68% of target']
      ]
    },
    {
      id: 'EV-2614', title: 'Strike ballot announced at Mexican metal-casting union',
      type: 'Labor Disruption', criticality: 'High', status: 'Active',
      location: 'Monterrey, Mexico', region: 'LATAM',
      start: '2026-06-25', lastUpdate: '2026-07-08', source: 'News monitor',
      suppliers: ['S05'], materials: ['M09'], rev: 4.8,
      description: 'The national metalworkers union has called a strike ballot covering three Monterrey casting plants including Monterrey Die Casting. Ballot closes 18 Jul; a yes vote could halt die-cast housings feeding the Power Tools line within 12 days.',
      timeline: [
        ['2026-06-25', 'Strike ballot detected via news monitor'],
        ['2026-07-01', 'Reliability dimension rescored 3.2 → 3.9'],
        ['2026-07-08', 'Contingency: Pune foundry overtime + air freight costed']
      ]
    },
    {
      id: 'EV-2613', title: 'Rotterdam port congestion — berth waiting exceeds 6 days',
      type: 'Logistics', criticality: 'Medium', status: 'Active',
      location: 'Rotterdam, Netherlands', region: 'EU',
      start: '2026-06-20', lastUpdate: '2026-07-07', source: 'Logistics feed',
      suppliers: ['S14'], materials: ['M23', 'M22'], rev: 3.1,
      description: 'Berth congestion at Rotterdam driven by labor shortage and rerouted Red Sea traffic. Refrigerant and adhesive shipments to Stuttgart delayed ~8 days; R290 stock cover at PL4 is 14 days and falling.',
      timeline: [
        ['2026-06-20', 'Port dwell-time threshold breached'],
        ['2026-06-27', 'R290 shipments delayed — cover 19d → 14d'],
        ['2026-07-07', 'Rail reroute via Antwerp under evaluation']
      ]
    },
    {
      id: 'EV-2612', title: 'Quality escalation — winding insulation failures in motor lots',
      type: 'Quality', criticality: 'High', status: 'Mitigation in Progress',
      location: 'Pune, India', region: 'APAC',
      start: '2026-06-08', lastUpdate: '2026-07-06', source: 'Quality system (SPC)',
      suppliers: ['S06'], materials: ['M06'], rev: 4.1,
      description: 'Incoming inspection at Monterrey flagged insulation-resistance failures in three consecutive motor lots (defect rate 780 ppm vs 250 ppm control limit). 8D containment open with Pune Drives & Motors; rework line stood up; quality dimension moved 3.1 → 4.2.',
      timeline: [
        ['2026-06-08', 'SPC breach at incoming inspection (lot 4471)'],
        ['2026-06-10', '8D opened; containment: 100% screening'],
        ['2026-06-24', 'Root cause: varnish cure profile drift'],
        ['2026-07-06', 'Corrective action verified on 2 of 3 lines']
      ]
    },
    {
      id: 'EV-2611', title: 'Chengdu battery plant audit finds fire-safety violations',
      type: 'Regulatory', criticality: 'High', status: 'Active',
      location: 'Chengdu, China', region: 'APAC',
      start: '2026-06-15', lastUpdate: '2026-07-04', source: 'Compliance monitor',
      suppliers: ['S17'], materials: ['M05'], rev: 7.9,
      description: 'Provincial safety audit issued rectification orders to Chengdu Lithium Power covering electrolyte storage and fire suppression. A 30-day compliance window ends 15 Jul; failure could trigger a production suspension of 21700 cells — single-sourced for all cordless platforms.',
      timeline: [
        ['2026-06-15', 'Audit result detected by compliance monitor'],
        ['2026-06-18', 'Sourcing dimension rescored 4.1 → 4.6'],
        ['2026-06-26', 'Second-source program (Busan) accelerated — G5'],
        ['2026-07-04', 'Supplier reports 70% rectification complete']
      ]
    },
    {
      id: 'EV-2610', title: 'Ransomware incident disclosed by PCBA supplier',
      type: 'Cyber', criticality: 'Medium', status: 'Tracked',
      location: 'Hanoi, Vietnam', region: 'APAC',
      start: '2026-06-03', lastUpdate: '2026-06-30', source: 'Cyber intel feed',
      suppliers: ['S12'], materials: ['M11', 'M26'], rev: 5.4,
      description: 'Hanoi Circuit Assembly disclosed a ransomware incident affecting ERP and shipping systems. Production continued on manual processes; shipment visibility degraded for ~2 weeks. Monitoring for data-integrity issues in ASN feeds.',
      timeline: [
        ['2026-06-03', 'Disclosure detected via cyber intel feed'],
        ['2026-06-05', 'Supplier questionnaire issued by Communication Agent'],
        ['2026-06-30', 'Systems restored; monitoring for 30 days']
      ]
    },
    {
      id: 'EV-2609', title: 'New aluminum import tariffs announced (Section 232 expansion)',
      type: 'Trade Policy', criticality: 'Medium', status: 'Tracked',
      location: 'Chongqing, China', region: 'APAC',
      start: '2026-05-28', lastUpdate: '2026-06-20', source: 'Trade policy monitor',
      suppliers: ['S25'], materials: ['M09'], rev: 6.3,
      description: 'Announced tariff expansion adds 12% duty on A356 ingot imports into North America effective Q4 FY26. Landed-cost impact ~$3.1M annualized for Monterrey castings; Chilean and domestic alternates under commercial evaluation.',
      timeline: [
        ['2026-05-28', 'Tariff schedule change detected'],
        ['2026-06-06', 'Landed-cost model updated (+12% duty)'],
        ['2026-06-20', 'Alternate quotes requested — 2 responses in']
      ]
    },
    {
      id: 'EV-2608', title: 'Copper mine strikes spread across Atacama region',
      type: 'Labor Disruption', criticality: 'Medium', status: 'Mitigation in Progress',
      location: 'Santiago, Chile', region: 'LATAM',
      start: '2026-05-18', lastUpdate: '2026-06-28', source: 'News monitor',
      suppliers: ['S26'], materials: ['M10'], rev: 2.9,
      description: 'Rolling strikes at two Atacama mines have tightened cathode supply to Andes Copper Refining. Winding-wire lead time moved 46 → 61 days. Forward purchase of 8 weeks demand executed; LME hedge extended.',
      timeline: [
        ['2026-05-18', 'Strike action detected'],
        ['2026-05-30', 'Lead-time breach confirmed'],
        ['2026-06-10', 'Forward buy executed (8 wks)'],
        ['2026-06-28', 'Partial return-to-work at one mine']
      ]
    },
    {
      id: 'EV-2607', title: 'Monsoon flooding disrupts Mumbai industrial corridor',
      type: 'Extreme Weather', criticality: 'Medium', status: 'Resolved',
      location: 'Mumbai, India', region: 'APAC',
      start: '2026-05-06', lastUpdate: '2026-06-02', source: 'Weather feed',
      suppliers: ['S20'], materials: ['M09'], rev: 2.4,
      description: 'Early monsoon flooding halted Mumbai Alloy Foundry for 9 days. Buffer stock absorbed the gap; no line stoppage. Event resolved with $2.4M exposure avoided.',
      timeline: [
        ['2026-05-06', 'Flood alert matched to supplier site'],
        ['2026-05-09', 'Production halt confirmed (9 days)'],
        ['2026-06-02', 'Full recovery verified — event resolved']
      ]
    },
    {
      id: 'EV-2606', title: 'European energy price spike hits Silesian manufacturers',
      type: 'Energy', criticality: 'Medium', status: 'Resolved',
      location: 'Katowice, Poland', region: 'EU',
      start: '2026-04-21', lastUpdate: '2026-05-20', source: 'Energy market feed',
      suppliers: ['S16'], materials: ['M06'], rev: 1.8,
      description: 'Spot energy prices in Poland rose 62% in April, pressuring Silesia Motor Works margins and creating short-shipment risk. Price surcharge negotiated; volumes held.',
      timeline: [
        ['2026-04-21', 'Energy price threshold breached'],
        ['2026-05-02', 'Supplier flagged potential short shipments'],
        ['2026-05-20', 'Surcharge agreement signed — risk closed']
      ]
    },
    {
      id: 'EV-2605', title: 'Factory fire at fastener plating subcontractor',
      type: 'Fire', criticality: 'Low', status: 'Closed',
      location: 'Taipei, Taiwan', region: 'APAC',
      start: '2026-03-30', lastUpdate: '2026-04-25', source: 'News monitor',
      suppliers: ['S15'], materials: ['M18'], rev: 0.6,
      description: 'A fire at Apex Fastener\'s plating subcontractor destroyed one line. Apex requalified an alternate plater within 3 weeks; commodity buffer covered the gap.',
      timeline: [
        ['2026-03-30', 'Fire reported at tier-2 subcontractor'],
        ['2026-04-25', 'Alternate plater qualified — event closed']
      ]
    },
    {
      id: 'EV-2604', title: 'Red Sea rerouting extends Asia–EU transit by 11 days',
      type: 'Logistics', criticality: 'Medium', status: 'Active',
      location: 'Suez / Red Sea corridor', region: 'EU',
      start: '2026-04-02', lastUpdate: '2026-07-01', source: 'Logistics feed',
      suppliers: ['S02', 'S12', 'S17'], materials: ['M11', 'M26', 'M05'], rev: 4.6,
      description: 'Continued rerouting via the Cape of Good Hope adds ~11 days to Asia–EU lanes. Electronics shipments to Gdańsk and Stuttgart carry elevated in-transit inventory; premium air freight used for 3 expedites in June.',
      timeline: [
        ['2026-04-02', 'Routing advisory issued'],
        ['2026-05-14', 'In-transit buffer raised +9 days'],
        ['2026-07-01', 'Lane review — reroute continues through Q3']
      ]
    }
  ];

  /* ---------------- Monthly series (Jul 25 → Jun 26) ---------------- */
  const months = ['Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'];

  const monthly = {
    months,
    // new risk events detected per month, by criticality
    eventsBySeverity: {
      Low:      [6, 5, 7, 4, 6, 5, 7, 6, 5, 8, 6, 7],
      Medium:   [4, 3, 5, 4, 3, 4, 5, 4, 6, 5, 7, 6],
      High:     [1, 2, 1, 2, 1, 2, 2, 3, 2, 3, 3, 4],
      Critical: [0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 2]
    },
    // portfolio average supplier risk score
    avgRisk: [2.31, 2.34, 2.38, 2.36, 2.41, 2.43, 2.47, 2.52, 2.55, 2.61, 2.66, 2.71],
    // total open REV at month end ($M)
    revTrend: [96.2, 94.8, 99.1, 97.6, 101.4, 100.2, 103.8, 106.9, 105.1, 109.4, 111.6, 113.8],
    // cumulative mitigated exposure ($M) by lever — stacked area, sums to 46.2
    mitigatedCum: {
      'Volume shift':      [1.2, 2.8, 4.1, 5.6, 7.2, 8.8, 10.1, 11.9, 13.6, 15.4, 17.0, 18.4],
      'Expedite / freight':[0.4, 0.9, 1.6, 2.2, 2.9, 3.4, 4.2, 4.9, 5.7, 6.4, 7.2, 7.8],
      'Safety stock':      [0.8, 1.7, 2.6, 3.8, 4.9, 6.1, 7.0, 8.2, 9.4, 10.6, 11.8, 12.9],
      'Resequencing':      [0.3, 0.8, 1.3, 1.9, 2.4, 3.0, 3.6, 4.3, 4.9, 5.6, 6.4, 7.1]
    },
    // disruption index 0–10 by plant × month (heat map)
    plantHeat: {
      plants: plants.map(p => p.name.split(',')[0]),
      values: [ // rows follow plants order PL1..PL7
        [1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 3, 3],
        [2, 1, 2, 2, 1, 2, 2, 3, 3, 3, 4, 5],
        [1, 2, 1, 1, 2, 2, 1, 2, 2, 2, 3, 4],
        [1, 1, 1, 2, 2, 3, 2, 2, 3, 4, 4, 5],
        [2, 2, 3, 2, 2, 2, 3, 3, 4, 4, 5, 5],
        [2, 2, 2, 3, 2, 3, 3, 3, 4, 5, 6, 8],
        [3, 2, 3, 3, 4, 3, 4, 5, 5, 5, 6, 7]
      ]
    }
  };

  /* ---------------- Waterfalls ---------------- */
  // Exposure bridge: FY25 exit → today
  const revBridge = {
    title: 'Risk exposure bridge · FY25 exit → today',
    steps: [
      { label: 'FY25 exit REV', value: 96.2, type: 'total' },
      { label: 'New events', value: 58.6, type: 'up' },
      { label: 'Escalations', value: 24.1, type: 'up' },
      { label: 'Mitigated', value: -46.2, type: 'down' },
      { label: 'Resolved / expired', value: -18.9, type: 'down' },
      { label: 'Current REV', value: 113.8, type: 'total' }
    ]
  };
  // Revenue bridge FY25 → FY26 (plan)
  const revenueBridge = {
    title: 'Revenue bridge · FY25 → FY26 plan',
    steps: [
      { label: 'FY25 revenue', value: 2280, type: 'total' },
      { label: 'Price', value: 96, type: 'up' },
      { label: 'Volume', value: 147, type: 'up' },
      { label: 'Mix', value: -38, type: 'down' },
      { label: 'Disruption losses', value: -52, type: 'down' },
      { label: 'FY26 plan', value: 2433, type: 'total' }
    ]
  };

  /* ---------------- Mitigation funnel (FY26 YTD) ---------------- */
  const funnel = [
    { stage: 'Signals detected', value: 1284 },
    { stage: 'Qualified risks', value: 412 },
    { stage: 'Impact assessed', value: 268 },
    { stage: 'Mitigation proposed', value: 124 },
    { stage: 'Approved', value: 86 },
    { stage: 'Executed & closed', value: 71 }
  ];

  /* ---------------- Sankey · signal source → triage → outcome ---------------- */
  const sankey = {
    nodes: [
      'Weather feeds', 'Logistics feeds', 'Financial feeds', 'Geopolitical', 'Labor & news', 'Quality systems', 'Cyber intel',
      'Auto-triaged', 'Analyst review',
      'Mitigation launched', 'Monitoring', 'Escalated to exec', 'No action needed'
    ],
    links: [
      // source → triage
      ['Weather feeds', 'Auto-triaged', 52], ['Weather feeds', 'Analyst review', 16],
      ['Logistics feeds', 'Auto-triaged', 34], ['Logistics feeds', 'Analyst review', 8],
      ['Financial feeds', 'Auto-triaged', 18], ['Financial feeds', 'Analyst review', 13],
      ['Geopolitical', 'Auto-triaged', 14], ['Geopolitical', 'Analyst review', 10],
      ['Labor & news', 'Auto-triaged', 15], ['Labor & news', 'Analyst review', 7],
      ['Quality systems', 'Auto-triaged', 9], ['Quality systems', 'Analyst review', 6],
      ['Cyber intel', 'Auto-triaged', 10], ['Cyber intel', 'Analyst review', 2],
      // triage → outcome
      ['Auto-triaged', 'Monitoring', 78], ['Auto-triaged', 'No action needed', 46], ['Auto-triaged', 'Mitigation launched', 22], ['Auto-triaged', 'Escalated to exec', 6],
      ['Analyst review', 'Mitigation launched', 26], ['Analyst review', 'Monitoring', 18], ['Analyst review', 'Escalated to exec', 12], ['Analyst review', 'No action needed', 6]
    ]
  };

  /* ---------------- Mekko · spend by region × category ($M) ---------------- */
  const mekko = {
    regions: ['APAC', 'EU', 'NA', 'LATAM'],
    categories: categories.map(c => c.name),
    // spend $M by [region][category] following the categories order above
    values: {
      APAC:  { 'Metals': 54.1, 'Polymers & Resins': 11.1, 'Electronics': 186.0, 'Components': 77.4, 'Packaging': 18.4, 'Chemicals & Coatings': 0 },
      EU:    { 'Metals': 62.0, 'Polymers & Resins': 15.8, 'Electronics': 21.4, 'Components': 49.3, 'Packaging': 19.6, 'Chemicals & Coatings': 33.9 },
      NA:    { 'Metals': 44.0, 'Polymers & Resins': 41.5, 'Electronics': 0, 'Components': 18.3, 'Packaging': 14.6, 'Chemicals & Coatings': 0 },
      LATAM: { 'Metals': 52.8, 'Polymers & Resins': 0, 'Electronics': 19.7, 'Components': 0, 'Packaging': 0, 'Chemicals & Coatings': 0 }
    }
  };

  /* ---------------- Gantt · mitigation programs ---------------- */
  const gantt = [
    {
      id: 'G1', name: 'Film dual-sourcing — Baltic Packaging', owner: 'K. Nowak', linkedEvent: 'EV-2618', progress: 32,
      phases: [
        ['Assessment', '2026-06-29', '2026-07-08', 'done'],
        ['Design', '2026-07-08', '2026-07-22', 'active'],
        ['Build', '2026-07-22', '2026-08-19', 'planned'],
        ['Testing', '2026-08-19', '2026-09-05', 'planned'],
        ['Rollout', '2026-09-05', '2026-09-20', 'planned']
      ]
    },
    {
      id: 'G2', name: 'MCU alternate qualification (STM-class)', owner: 'A. Chen', linkedEvent: 'EV-2617', progress: 18,
      phases: [
        ['Assessment', '2026-06-15', '2026-07-01', 'done'],
        ['Design', '2026-07-01', '2026-07-28', 'active'],
        ['Build', '2026-07-28', '2026-09-08', 'planned'],
        ['Testing', '2026-09-08', '2026-10-10', 'planned'],
        ['Rollout', '2026-10-10', '2026-10-30', 'planned']
      ]
    },
    {
      id: 'G3', name: 'Resin safety-stock build & supplier hedge', owner: 'M. Alvarez', linkedEvent: 'EV-2615', progress: 68,
      phases: [
        ['Assessment', '2026-06-01', '2026-06-08', 'done'],
        ['Design', '2026-06-08', '2026-06-16', 'done'],
        ['Build', '2026-06-16', '2026-07-20', 'active'],
        ['Testing', '2026-07-20', '2026-08-01', 'planned'],
        ['Rollout', '2026-08-01', '2026-08-15', 'planned']
      ]
    },
    {
      id: 'G4', name: 'Motor quality containment & rework line', owner: 'R. Deshpande', linkedEvent: 'EV-2612', progress: 74,
      phases: [
        ['Assessment', '2026-06-08', '2026-06-12', 'done'],
        ['Design', '2026-06-12', '2026-06-20', 'done'],
        ['Build', '2026-06-20', '2026-07-12', 'active'],
        ['Testing', '2026-07-12', '2026-08-10', 'planned'],
        ['Rollout', '2026-08-10', '2026-08-30', 'planned']
      ]
    },
    {
      id: 'G5', name: 'Battery cell second source (Busan)', owner: 'J. Park', linkedEvent: 'EV-2611', progress: 12,
      phases: [
        ['Assessment', '2026-07-06', '2026-07-24', 'active'],
        ['Design', '2026-07-24', '2026-08-21', 'planned'],
        ['Build', '2026-08-21', '2026-09-30', 'planned'],
        ['Testing', '2026-09-30', '2026-10-28', 'planned'],
        ['Rollout', '2026-10-28', '2026-11-15', 'planned']
      ]
    }
  ];

  /* ---------------- Agentic layer ---------------- */
  const agents = [
    {
      key: 'sensing', name: 'Risk Sensing Agent', icon: 'radar', color: 1,
      role: 'Watches supplier, event, material and external data continuously',
      stats: { signalsToday: 214, matched: 38, escalated: 5 },
      statLabels: ['Signals today', 'Site-matched', 'Escalated']
    },
    {
      key: 'impact', name: 'Impact Intelligence Agent', icon: 'target', color: 5,
      role: 'Quantifies operational and commercial impact of each risk',
      stats: { assessments: 12, revComputed: 41.7, simsRun: 9 },
      statLabels: ['Assessments today', 'REV computed ($M)', 'Simulations run']
    },
    {
      key: 'mitigation', name: 'Mitigation Recommendation Agent', icon: 'route', color: 2,
      role: 'Proposes the best corrective action with cost / risk trade-off',
      stats: { openRecos: 5, accepted30d: 17, avgRiskCut: 58 },
      statLabels: ['Open recommendations', 'Accepted (30d)', 'Avg risk cut %']
    },
    {
      key: 'workflow', name: 'Workflow Execution Agent', icon: 'flow', color: 3,
      role: 'Turns approved actions into tickets, POs and notifications',
      stats: { ticketsOpen: 14, tasksDone30d: 92, integrations: 6 },
      statLabels: ['Open tickets', 'Completed (30d)', 'Connected systems']
    },
    {
      key: 'comms', name: 'Supplier Communication Agent', icon: 'mail', color: 7,
      role: 'Drafts supplier inquiries, chases ETAs and tracks responses',
      stats: { drafts: 7, awaiting: 4, responded48h: 81 },
      statLabels: ['Drafts today', 'Awaiting reply', 'Replied <48h %']
    },
    {
      key: 'scenario', name: 'Scenario Simulation Agent', icon: 'branch', color: 8,
      role: 'Answers what-if questions on outages, shifts and buffers',
      stats: { scenarios: 9, avgRuntime: 1.8, saved: 22 },
      statLabels: ['Scenarios today', 'Avg runtime (s)', 'Saved scenarios']
    }
  ];

  const feed = [
    { time: '06:42', agent: 'sensing', text: '<strong>EV-2618 update:</strong> flood gauge at Binh Chanh IZ still above warning level. Mekong Flexible Films inventory cover recalculated: <strong>11 days → 9 days</strong>.' },
    { time: '06:38', agent: 'impact', text: 'Re-ran 14-day disruption sim for <strong>MCU (M02)</strong>: 7 SKUs at stockout risk, $4.8M revenue exposure, fill-rate degradation in 3 regions.' },
    { time: '06:31', agent: 'mitigation', text: 'New recommendation for <strong>EV-2618</strong>: shift 40% film volume to Baltic Packaging for 3 weeks. Cost +3.2%, stockout risk −72%.' },
    { time: '06:24', agent: 'comms', text: 'Drafted recovery-plan request to <strong>Chengdu Lithium Power</strong> — production continuity, rectification status, revised ETA. Awaiting your review.' },
    { time: '06:10', agent: 'workflow', text: 'Created procurement ticket <strong>PR-88412</strong> (resin safety stock, lot 3 of 4) and notified planner M. Alvarez. ERP requisition triggered.' },
    { time: '05:58', agent: 'sensing', text: 'Detected <strong>lead-time variance breach</strong> at Andes Copper Refining: 46d → 61d confirmed on last 4 shipments.' },
    { time: '05:47', agent: 'scenario', text: 'Saved scenario <strong>"Monterrey strike 21d"</strong>: 4 SKUs affected, $3.9M exposure, best plan = Pune overtime + air freight ($0.6M cost).' },
    { time: '05:31', agent: 'impact', text: 'Decision memory: last film disruption (Nov 25) — volume shift to Baltic cut stockout risk 60%, freight cost +8%. Applied to current recommendation.' },
    { time: '05:16', agent: 'workflow', text: 'Mitigation G4 (motor rework line) phase update: Build 74% complete, on track for 12 Jul testing gate.' },
    { time: '04:52', agent: 'sensing', text: 'Hurricane watch probability for Gulf Coast raised to <strong>46%</strong>. Tracking window narrows at 12:00 UTC.' }
  ];

  const recommendations = [
    {
      id: 'R-101', linkedEvent: 'EV-2618', status: 'pending', agent: 'mitigation',
      title: 'Shift 40% of BOPP film volume to Baltic Packaging for 3 weeks',
      detail: 'Mekong Flexible Films flood recovery ETA is 3–4 weeks and stock cover is 9 days. Baltic Packaging has 62% free capacity and holds the print tooling from the Nov 25 disruption.',
      cost: '+3.2% material cost', riskCut: '−72% stockout risk', exposure: 8.4,
      approvers: 'Category Head · Planning Lead'
    },
    {
      id: 'R-102', linkedEvent: 'EV-2617', status: 'pending', agent: 'mitigation',
      title: 'Air-freight 6 weeks of MCU demand + release safety stock to PL2',
      detail: 'Customs clearance at Taichung is running 9 days. Air freight covers the gap while alternate qualification (G2) progresses; safety stock rebalance protects Monterrey first.',
      cost: '+$0.8M freight', riskCut: '−54% stockout risk', exposure: 14.2,
      approvers: 'Category Head · Logistics Director'
    },
    {
      id: 'R-103', linkedEvent: 'EV-2611', status: 'pending', agent: 'mitigation',
      title: 'Pull forward Busan cell qualification; buy 4 weeks buffer of 21700 cells',
      detail: 'If the compliance window closes without rectification, cell supply halts within 26 days. A buffer buy now costs $1.1M and de-risks the cordless platform launch window.',
      cost: '+$1.1M inventory', riskCut: '−61% supply-halt risk', exposure: 7.9,
      approvers: 'VP Supply Chain'
    },
    {
      id: 'R-104', linkedEvent: 'EV-2614', status: 'pending', agent: 'mitigation',
      title: 'Pre-book Pune foundry overtime + air lane ahead of strike ballot',
      detail: 'Ballot closes 18 Jul. Pre-booking secures capacity at standard overtime rates; cancellation costs are negligible if the ballot fails.',
      cost: '+$0.2M standby', riskCut: '−48% line-stop risk', exposure: 4.8,
      approvers: 'Plant Director PL2'
    },
    {
      id: 'R-105', linkedEvent: 'EV-2613', status: 'pending', agent: 'mitigation',
      title: 'Reroute R290 shipments via Antwerp rail corridor',
      detail: 'Rotterdam berth waiting exceeds 6 days. The Antwerp rail option adds 1 day of transit but restores schedule reliability for PL4; hazmat certification already in place.',
      cost: '+$40K / month', riskCut: '−35% delay risk', exposure: 3.1,
      approvers: 'Logistics Director'
    }
  ];

  const notifications = [
    { sev: 'critical', time: '06:42', text: '<strong>EV-2618</strong> — Mekong flood: film stock cover down to <strong>9 days</strong>. Approval for volume shift still pending.' },
    { sev: 'critical', time: '06:31', text: 'New recommendation <strong>R-101</strong> awaiting approval — $8.4M exposure, action window closes in 4 days.' },
    { sev: 'high', time: '05:58', text: 'Lead-time breach at <strong>Andes Copper Refining</strong> (46d → 61d). Impact assessment queued.' },
    { sev: 'high', time: '05:16', text: 'Mitigation <strong>G4</strong> Build phase 74% — testing gate 12 Jul.' },
    { sev: 'medium', time: '04:52', text: 'Gulf Coast hurricane landfall probability raised to <strong>46%</strong>.' },
    { sev: 'medium', time: 'Yesterday', text: 'Weekly risk digest generated — 14 new signals qualified, 3 recommendations accepted.' }
  ];

  /* ---------------- KPI headline set ---------------- */
  const kpis = {
    totalRev: 113.8,
    revDelta: +2.2,           // vs last month, $M
    highRiskSuppliers: 8,     // score >= 3.0
    highRiskDelta: +2,
    singleSource: materials.filter(m => m.singleSource && m.score >= 2.5).length, // at-risk single source
    singleSourceTotal: materials.filter(m => m.singleSource).length,
    activeEvents: events.filter(e => ['Active', 'Tracked', 'Mitigation in Progress'].includes(e.status)).length,
    criticalEvents: events.filter(e => e.criticality === 'Critical' && e.status !== 'Closed' && e.status !== 'Resolved').length,
    mitigatedYtd: 46.2,
    stockoutsPrevented: 17,
    detectionLeadDays: 12.4
  };

  /* ---------------- Lookup helpers ---------------- */
  const supplierById = id => suppliers.find(s => s.id === id);
  const materialById = id => materials.find(m => m.id === id);
  const productById = id => products.find(p => p.id === id);
  const eventById = id => events.find(e => e.id === id);
  const materialsOf = sid => materials.filter(m => m.suppliers.includes(sid));
  const productsUsing = mid => products.filter(p => p.materials.includes(mid));
  const productsOf = sid => {
    const mats = materialsOf(sid).map(m => m.id);
    return products.filter(p => p.materials.some(m => mats.includes(m)));
  };
  const eventsOf = sid => events.filter(e => e.suppliers.includes(sid));

  SRS.data = {
    asOf, company: 'NovaForge Manufacturing',
    plants, categories, catName,
    suppliers, materials, products, events,
    monthly, revBridge, revenueBridge, funnel, sankey, mekko, gantt,
    agents, feed, recommendations, notifications, kpis,
    supplierById, materialById, productById, eventById,
    materialsOf, productsUsing, productsOf, eventsOf
  };
})();
