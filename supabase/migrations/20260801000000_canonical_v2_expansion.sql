-- Migration: Canonical Serbia Baseline v2 (33 Promoted Expansion Records)
-- Work Package: WP-09

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '104', 'Through the Stone Gates (Vratna natural bridges)', 'Kroz kamena vrata (Vratnjanske prerasti)', 'Nature', 'Witness the magnificent natural limestone arches of Vratna, some of the highest stone bridges in Europe. Tucked away in a pristine forested valley, this destination offers a silent, deeply spiritual encounter with raw geology.', 'Witness the magnificent natural limestone arches of Vratna, some of the highest stone bridges in Europe. Tucked away in a pristine forested valley, this destination offers a silent, deeply spiritual encounter with raw geology.',
  'The Vratna natural stone gates are three massive limestone bridge-like structures (the Great, Little, and Dry gates) carved out by the Vratna River. Located next to the isolated 14th-century Vratna Monastery, these geological marvels tower up to 34 meters high. A quiet hike through the untouched forest leads travelers to the third gate, offering a profound sense of isolation and raw geological scale.', 'The Vratna natural stone gates are three massive limestone bridge-like structures (the Great, Little, and Dry gates) carved out by the Vratna River. Located next to the isolated 14th-century Vratna Monastery, these geological marvels tower up to 34 meters high. A quiet hike through the untouched forest leads travelers to the third gate, offering a profound sense of isolation and raw geological scale.', 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Prerast_u_kanjonu_Vratne_1.jpg', '3-4 hours', '4 hours',
  240, 'Near Negotin', 'Near Negotin', '€5 - €10', 'Car + Hike',
  44.383, 22.344, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '105', 'The Hidden Canyon Road (Jerma Gorge)', 'Put kroz skriveni kanjon (Kanjon Jerme)', 'Nature', 'A spectacular driving and hiking route winding through the narrow rock passages of the Jerma River. Bordered by towering cliffs, it leads to medieval monasteries hidden in deep mountain folds.', 'A spectacular driving and hiking route winding through the narrow rock passages of the Jerma River. Bordered by towering cliffs, it leads to medieval monasteries hidden in deep mountain folds.',
  'Jerma Gorge is one of the most visually stunning and narrowest river gorges in the Balkans, slicing through the limestone massifs of Vlaška and Greben mountains. The route once served as a narrow-gauge mining railway, and now offers a scenic driving experience flanked by near-vertical rock face walls. Hidden within the gorge are spiritual sanctuaries like the Poganovo Monastery, known for its preservation of rare 14th-century frescoes.', 'Jerma Gorge is one of the most visually stunning and narrowest river gorges in the Balkans, slicing through the limestone massifs of Vlaška and Greben mountains. The route once served as a narrow-gauge mining railway, and now offers a scenic driving experience flanked by near-vertical rock face walls. Hidden within the gorge are spiritual sanctuaries like the Poganovo Monastery, known for its preservation of rare 14th-century frescoes.', 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Reka_Jerma_-_kanjon.jpg', 'Full day', '4.5 hours',
  270, 'Near Dimitrovgrad', 'Near Dimitrovgrad', '€20 - €40', 'Car',
  42.983, 22.633, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '106', 'Serbia’s Layered Canyon (Rosomača Canyon)', 'Slojeviti kanjon Srbije (Kanjon Rosomače)', 'Nature', 'The ''Stara Planina''s Colorado'' features extraordinary layered limestone cliffs that resemble stacked pancakes or geological ribs. A short but visually breathtaking walk along a rushing mountain stream.', 'The ''Stara Planina''s Colorado'' features extraordinary layered limestone cliffs that resemble stacked pancakes or geological ribs. A short but visually breathtaking walk along a rushing mountain stream.',
  'Rosomača Canyon (locally known as Rosomački Lonci or Slavinjsko Grlo) is an unbelievable natural gorge in Stara Planina. The limestone rocks are formed in distinct parallel layers, creating a rocky throat that looks artificially carved. Over millions of years, the cold mountain water has carved out dynamic circular pools and bowls. It is a highly photogenic and unique geological monument of the Balkan mountain region.', 'Rosomača Canyon (locally known as Rosomački Lonci or Slavinjsko Grlo) is an unbelievable natural gorge in Stara Planina. The limestone rocks are formed in distinct parallel layers, creating a rocky throat that looks artificially carved. Over millions of years, the cold mountain water has carved out dynamic circular pools and bowls. It is a highly photogenic and unique geological monument of the Balkan mountain region.', '/src/assets/images/stara_planina_landscape_1778843454764.webp', '2-3 hours', '4.5 hours',
  270, 'Stara Planina', 'Stara Planina', 'Free', 'Car + Walk',
  43.149, 22.784, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '107', 'The Turquoise Spring Journey (Krupaj Spring + Eastern Serbia)', 'Putovanje do tirkiznog vrela (Krupajsko vrelo)', 'Nature', 'An ecological oasis of mystical, deep turquoise waters flowing from a karst cave in eastern Serbia. A refreshing and calming forest walk beneath a canopy of hanging trees and limestone cliffs.', 'An ecological oasis of mystical, deep turquoise waters flowing from a karst cave in eastern Serbia. A refreshing and calming forest walk beneath a canopy of hanging trees and limestone cliffs.',
  'Krupaj Spring is a stunning karst spring nestled in the Homolje region of eastern Serbia. The spring water flows from a deep, submerged cave, creating an amphitheater of dense forest and turquoise pools. Underneath the serene surface lies a maze of underwater channels attracting diving explorers. It represents the quiet, mystical side of Serbian nature, where water, stone, and ancient lore meet.', 'Krupaj Spring is a stunning karst spring nestled in the Homolje region of eastern Serbia. The spring water flows from a deep, submerged cave, creating an amphitheater of dense forest and turquoise pools. Underneath the serene surface lies a maze of underwater channels attracting diving explorers. It represents the quiet, mystical side of Serbian nature, where water, stone, and ancient lore meet.', 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Krupajsko_vrelo_01.jpg', '2-4 hours', '2.5 hours',
  150, 'Homolje Region', 'Homolje Region', '€5 - €20', 'Car',
  44.183, 21.603, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '108', 'The Clear River Escape (Gradac River Gorge)', 'Bekstvo na bistru reku (Kanjon reke Gradac)', 'Nature', 'Walk along Europe''s cleanest river, winding through an ecological corridor near Valjevo. Features clear water pools, traditional mills, and isolated karst caves.', 'Walk along Europe''s cleanest river, winding through an ecological corridor near Valjevo. Features clear water pools, traditional mills, and isolated karst caves.',
  'The Gradac River is celebrated as one of the cleanest and most ecologically pristine rivers in Southern Europe. Sourced from deep underground springs, its gorge is protected to preserve rare otters, wild trout, and unique water vegetation. Visitors can hike alongside the rushing waters, dine on freshly caught river trout near old watermills, and discover ancient cave hermitages.', 'The Gradac River is celebrated as one of the cleanest and most ecologically pristine rivers in Southern Europe. Sourced from deep underground springs, its gorge is protected to preserve rare otters, wild trout, and unique water vegetation. Visitors can hike alongside the rushing waters, dine on freshly caught river trout near old watermills, and discover ancient cave hermitages.', 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanjon_Reke_Gradac.jpg', 'Half day', '1.5 hours',
  90, 'Valjevo', 'Valjevo', '€10 - €25', 'Car + Hike',
  44.233, 19.883, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '110', 'Above the Meanders (Kablar Viewpoint Experience)', 'Iznad meandara (Vidikovac Kablar)', 'Nature', 'Stand on the newly designed glass-deck lookout perched atop Kablar Mountain. Offers a breathtaking vertical vista of the West Morava''s curved meanders and the surrounding valley.', 'Stand on the newly designed glass-deck lookout perched atop Kablar Mountain. Offers a breathtaking vertical vista of the West Morava''s curved meanders and the surrounding valley.',
  'The Kablar viewpoint stands at nearly 890 meters above sea level, offering a dramatic aerial look down onto the meanders of the West Morava River. The recently established glass platform provides a secure yet thrilling view over the gorge walls and the green hills of central Serbia. It is an ideal spot for photography, panorama watching, and admiring the scale of the Serbian mountain topography.', 'The Kablar viewpoint stands at nearly 890 meters above sea level, offering a dramatic aerial look down onto the meanders of the West Morava River. The recently established glass platform provides a secure yet thrilling view over the gorge walls and the green hills of central Serbia. It is an ideal spot for photography, panorama watching, and admiring the scale of the Serbian mountain topography.', '/src/assets/images/via_ferrata_kablar_climb_1778848271890.webp', '2-3 hours', '2 hours',
  120, 'Near Čačak', 'Near Čačak', 'Free', 'Car + Walk',
  43.91, 20.18, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '111', 'The Forested Interior (Golija Mountain Retreat)', 'Šumoviti mir unutrašnjosti (Planina Golija)', 'Nature', 'Journey into Serbia''s most forested UNESCO Biosphere Reserve. A haven of deep fir and spruce woods, cold rivers, and traditional highland villages where life moves slowly.', 'Journey into Serbia''s most forested UNESCO Biosphere Reserve. A haven of deep fir and spruce woods, cold rivers, and traditional highland villages where life moves slowly.',
  'Golija is a mountain massif of exceptional ecological value, designated as a UNESCO Biosphere Reserve due to its pristine, dense forests and rich water systems. The peak of Jankov Kamen reaches 1,833 meters, overlooking valleys of traditional wooden cottages and pastures. It is a slow-time mountain retreat perfect for escaping modern noise, collecting wild berries, and walking under old canopies.', 'Golija is a mountain massif of exceptional ecological value, designated as a UNESCO Biosphere Reserve due to its pristine, dense forests and rich water systems. The peak of Jankov Kamen reaches 1,833 meters, overlooking valleys of traditional wooden cottages and pastures. It is a slow-time mountain retreat perfect for escaping modern noise, collecting wild berries, and walking under old canopies.', '/src/assets/images/tara_national_park_forest_1778843961956.webp', 'Weekend', '4 hours',
  240, 'Golija Biosphere', 'Golija Biosphere', '€40 - €100', 'Car',
  43.341, 20.273, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '112', 'Serbia’s Unexpected Hills (Zagajička Hills)', 'Neočekivana brda Srbije (Zagajička brda)', 'Nature', 'Walk among the strange, wave-like grass hills of the Deliblato Sands. This ancient dune system looks like a rolling green carpet straight out of a dream.', 'Walk among the strange, wave-like grass hills of the Deliblato Sands. This ancient dune system looks like a rolling green carpet straight out of a dream.',
  'Zagajička Brda are a unique geological formation situated on the edge of the Deliblato Sands—Europe’s largest continental sandy terrain. These spherical, grass-covered dunes resemble emerald waves frozen in time. The area offers exceptional panoramas towards the Danube, the Vršac mountains, and southern Banat, providing a serene walking environment with zero urban noise.', 'Zagajička Brda are a unique geological formation situated on the edge of the Deliblato Sands—Europe’s largest continental sandy terrain. These spherical, grass-covered dunes resemble emerald waves frozen in time. The area offers exceptional panoramas towards the Danube, the Vršac mountains, and southern Banat, providing a serene walking environment with zero urban noise.', 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Zagajicka_brda.jpg', '4-5 hours', '1.5 hours',
  90, 'Deliblato Sands', 'Deliblato Sands', 'Free', 'Car + Hike',
  44.916, 21.183, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '114', 'The Wetlands Near Belgrade (Obedska Bara)', 'Močvare nadomak Beograda (Obedska bara)', 'Nature', 'One of Europe’s oldest protected reserves, located just an hour from Belgrade. A peaceful oxbow lake rich in oak forests, birds, and water lilies.', 'One of Europe’s oldest protected reserves, located just an hour from Belgrade. A peaceful oxbow lake rich in oak forests, birds, and water lilies.',
  'Obedska Bara is a vast swamp and forest area situated along the Sava River. First protected in 1874 by the Austro-Hungarian crown, it is one of the world''s oldest nature reserves. The oxbow lake structure contains rare water vegetation, while surrounding oak forests offer shade and quiet walking paths, ideal for a short ecological getaway from the capital.', 'Obedska Bara is a vast swamp and forest area situated along the Sava River. First protected in 1874 by the Austro-Hungarian crown, it is one of the world''s oldest nature reserves. The oxbow lake structure contains rare water vegetation, while surrounding oak forests offer shade and quiet walking paths, ideal for a short ecological getaway from the capital.', '/src/assets/images/zasavica_reserve_1778841114905.webp', 'Half day', '1 hour',
  60, 'Near Pećinci', 'Near Pećinci', '€5 - €10', 'Car',
  44.707, 20.083, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '115', 'The Fortress Above the Ibar (Maglič Landscape Journey)', 'Tvrđava nad Ibarom (Srednjovekovni Maglič)', 'Nature', 'Witness the ruins of Maglič Castle perched spectacularly on a rocky ridge high above the winding Ibar River. A dramatic medieval landscape full of history and wild peaks.', 'Witness the ruins of Maglič Castle perched spectacularly on a rocky ridge high above the winding Ibar River. A dramatic medieval landscape full of history and wild peaks.',
  'Maglič is a medieval fortress built in the 13th century to protect the surrounding monasteries and trading routes. Flanked on three sides by the rushing Ibar River, the stone ruins stand like a sentinel on a near-vertical cliff. Climbing to the top rewards travelers with panoramic mountain views and a deep, historical sense of wild Serbia.', 'Maglič is a medieval fortress built in the 13th century to protect the surrounding monasteries and trading routes. Flanked on three sides by the rushing Ibar River, the stone ruins stand like a sentinel on a near-vertical cliff. Climbing to the top rewards travelers with panoramic mountain views and a deep, historical sense of wild Serbia.', 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Maglic_01.jpg', '3-4 hours', '3 hours',
  180, 'Ibar Valley', 'Ibar Valley', 'Free', 'Car + Hike',
  43.613, 20.523, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '118', 'The Forgotten Fortress of Bač (Bač Fortress + Cultural Landscape)', 'Zaboravljena tvrđava Bača', 'History', 'Discover the remnants of Vojvodina''s most significant medieval fortress, dating back to the 14th century. Features a striking, preserved brick keep surrounded by historical plains.', 'Discover the remnants of Vojvodina''s most significant medieval fortress, dating back to the 14th century. Features a striking, preserved brick keep surrounded by historical plains.',
  'The Fortress of Bač represents the best-preserved medieval fortification in the Vojvodina plains. Built on a former island of the Mostonga River, its architectural layers span Hungarian kings, Ottoman garrisons, and Franciscan monasteries. Climbing the central tower offers dramatic views over the flat, agrarian landscape and the ancient trade routes that built Vojvodina.', 'The Fortress of Bač represents the best-preserved medieval fortification in the Vojvodina plains. Built on a former island of the Mostonga River, its architectural layers span Hungarian kings, Ottoman garrisons, and Franciscan monasteries. Climbing the central tower offers dramatic views over the flat, agrarian landscape and the ancient trade routes that built Vojvodina.', 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Tvr%C4%91ava_u_Ba%C4%8Du.jpg', 'Half day', '2 hours',
  120, 'Bač', 'Bač', '€5 - €10', 'Car',
  45.392, 19.237, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '119', 'Where Empires Met the Danube (Fetislam Fortress + Kladovo)', 'Gde su se carstva sretala na Dunavu (Fetislam i Kladovo)', 'History', 'A massive 16th-century Ottoman fortification on the banks of the Danube River in Kladovo. Blends military history with scenic river views at the border with Romania.', 'A massive 16th-century Ottoman fortification on the banks of the Danube River in Kladovo. Blends military history with scenic river views at the border with Romania.',
  'Fetislam (literally meaning ''Victory of Islam'') is an imposing fortress complex featuring a small inner fort and a larger outer bastion built to control the Danube trade. Recently restored, its gates and artillery bastions provide an evocative journey through Ottoman-Austrian border conflicts, while the tranquil town of Kladovo offers a relaxed riverine escape.', 'Fetislam (literally meaning ''Victory of Islam'') is an imposing fortress complex featuring a small inner fort and a larger outer bastion built to control the Danube trade. Recently restored, its gates and artillery bastions provide an evocative journey through Ottoman-Austrian border conflicts, while the tranquil town of Kladovo offers a relaxed riverine escape.', '/src/assets/images/golubac_fortress_danube_1778842880053.webp', 'Half day', '3.5 hours',
  210, 'Kladovo', 'Kladovo', '€5 - €15', 'Car',
  44.606, 22.61, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '120', 'A Danube Afternoon Beyond Belgrade (Smederevo Fortress + River Evening)', 'Dunavsko popodne izvan Beograda (Smederevska tvrđava)', 'History', 'Explore the colossal 15th-century Smederevo Fortress, one of Europe''s largest flatland fortifications. Walk atop its massive brick towers as the sun sets over the Danube.', 'Explore the colossal 15th-century Smederevo Fortress, one of Europe''s largest flatland fortifications. Walk atop its massive brick towers as the sun sets over the Danube.',
  'Smederevo Fortress was built by Despot Djuradj Brankovic to serve as the final medieval capital of Serbia before the Ottoman conquest. Built in a triangular shape at the confluence of the Jezava and Danube rivers, its twenty-five massive defensive towers still stand as a monument to medieval engineering. The quiet riverfront offers a classic setting for a peaceful evening walk.', 'Smederevo Fortress was built by Despot Djuradj Brankovic to serve as the final medieval capital of Serbia before the Ottoman conquest. Built in a triangular shape at the confluence of the Jezava and Danube rivers, its twenty-five massive defensive towers still stand as a monument to medieval engineering. The quiet riverfront offers a classic setting for a peaceful evening walk.', 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Smederevo_Fortress_Danube.jpg', 'Half day', '1 hour',
  60, 'Smederevo', 'Smederevo', '€5 - €10', 'Car',
  44.665, 20.93, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '121', 'The Valley of the Kings (Curated Medieval Serbia Journey)', 'Dolina kraljeva (Srednjovekovna Srbija)', 'History', 'A deep cultural pilgrimage tracing the foundations of the medieval Serbian state through royal monasteries hidden in mountain valleys.', 'A deep cultural pilgrimage tracing the foundations of the medieval Serbian state through royal monasteries hidden in mountain valleys.',
  'This curated route through the valley of the Ibar River guides travelers to monumental UNESCO-listed medieval foundations, specifically Studenica and Sopoćani monasteries. Famous for housing world-renowned Byzantine frescoes, marble vaults, and royal tombs, this experience represents a profound look into the visual, artistic, and administrative roots of the Nemanjić dynasty.', 'This curated route through the valley of the Ibar River guides travelers to monumental UNESCO-listed medieval foundations, specifically Studenica and Sopoćani monasteries. Famous for housing world-renowned Byzantine frescoes, marble vaults, and royal tombs, this experience represents a profound look into the visual, artistic, and administrative roots of the Nemanjić dynasty.', '/src/assets/images/manasija_monastery_1778841065960.webp', 'Weekend', '3.5 hours',
  210, 'Raška Region', 'Raška Region', '€30 - €80', 'Car',
  43.486, 20.531, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '122', 'The Foundations of Serbia (Old Ras + St Peter’s Church)', 'Temelji Srbije (Stari Ras i Petrova crkva)', 'History', 'Stand inside the oldest intact Christian church in Serbia, surrounded by the ruins of the medieval capital fortress of Ras.', 'Stand inside the oldest intact Christian church in Serbia, surrounded by the ruins of the medieval capital fortress of Ras.',
  'St. Peter’s Church (Petrova Crkva) in Novi Pazar dates back to the 9th century, built upon a prehistoric Illyrian burial mound. As a UNESCO World Heritage site, it hosted critical medieval assemblies of the Nemanjić state. Coupled with the nearby hilltop ruins of the fortress of Old Ras, this trip is an evocative journey to the physical cradle of Serbian history.', 'St. Peter’s Church (Petrova Crkva) in Novi Pazar dates back to the 9th century, built upon a prehistoric Illyrian burial mound. As a UNESCO World Heritage site, it hosted critical medieval assemblies of the Nemanjić state. Coupled with the nearby hilltop ruins of the fortress of Old Ras, this trip is an evocative journey to the physical cradle of Serbian history.', 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Petrova_crkva_Novi_Pazar.jpg', 'Half day', '4 hours',
  240, 'Novi Pazar', 'Novi Pazar', '€5 - €10', 'Car',
  43.161, 20.527, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '123', 'Where Serbia Meets the Orient (Novi Pazar Cultural Journey)', 'Gde se Srbija susreće sa Orijentom (Novi Pazar)', 'History', 'Immerse yourself in a lively, historic city blending Ottoman architecture, busy bazaars, traditional hammams, and authentic culinary specialties.', 'Immerse yourself in a lively, historic city blending Ottoman architecture, busy bazaars, traditional hammams, and authentic culinary specialties.',
  'Novi Pazar represents a unique cultural intersection in Serbia, where Ottoman mosques and Turkish baths stand alongside orthodox historical centers. The city’s ancient bazaar area (Altun-Alem Mosque and the old hammam) remains highly authentic, offering travelers a vibrant, bustling environment known for its traditional regional food (mantije, ćevapi) and rich craft traditions.', 'Novi Pazar represents a unique cultural intersection in Serbia, where Ottoman mosques and Turkish baths stand alongside orthodox historical centers. The city’s ancient bazaar area (Altun-Alem Mosque and the old hammam) remains highly authentic, offering travelers a vibrant, bustling environment known for its traditional regional food (mantije, ćevapi) and rich craft traditions.', 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Altun-alem_d%C5%BEamija.jpg', 'Full day', '4 hours',
  240, 'Novi Pazar', 'Novi Pazar', '€20 - €50', 'Car',
  43.136, 20.517, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '124', 'Serbia’s Art Nouveau North (Subotica Architecture + Synagogue)', 'Secesijski sever Srbije (Subotica i Sinagoga)', 'History', 'An architectural route through Subotica’s vibrant, colorful Secessionist facades and the beautifully restored Art Nouveau Synagogue.', 'An architectural route through Subotica’s vibrant, colorful Secessionist facades and the beautifully restored Art Nouveau Synagogue.',
  'Subotica is celebrated for its outstanding heritage of Hungarian Secessionist architecture (a localized branch of Art Nouveau). Highlights include the spectacular City Hall, Raichle Palace, and the Subotica Synagogue—one of Europe''s finest examples of its kind. Hand-painted Zsolnay ceramics, sweeping curved rooflines, and floral brick facades define this elegant, Central European northern gateway.', 'Subotica is celebrated for its outstanding heritage of Hungarian Secessionist architecture (a localized branch of Art Nouveau). Highlights include the spectacular City Hall, Raichle Palace, and the Subotica Synagogue—one of Europe''s finest examples of its kind. Hand-painted Zsolnay ceramics, sweeping curved rooflines, and floral brick facades define this elegant, Central European northern gateway.', '/src/assets/images/subotica_palic_lake_villa_1778843996440.webp', 'Full day', '2 hours',
  120, 'Subotica', 'Subotica', '€15 - €40', 'Car + Walk',
  46.099, 19.665, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '127', 'The Danube’s Ancient Frontier (Roman Heritage Journey)', 'Drevna dunavska granica (Rimska ruta)', 'History', 'Follow the ancient northern border of the Roman Empire along the Danube. Visited sites include Viminacium''s archaeological ruins and Trajan''s Bridge.', 'Follow the ancient northern border of the Roman Empire along the Danube. Visited sites include Viminacium''s archaeological ruins and Trajan''s Bridge.',
  'Viminacium was a vast Roman military camp and capital of the Upper Moesia province. This archaeological experience allows visitors to explore underground crypts, reconstructed imperial villas, and dinosaur remains. The journey continues along the Danube to Trajan''s Plaque (Tabula Traiana), built to commemorate the Roman road that connected Rome to Dacia.', 'Viminacium was a vast Roman military camp and capital of the Upper Moesia province. This archaeological experience allows visitors to explore underground crypts, reconstructed imperial villas, and dinosaur remains. The journey continues along the Danube to Trajan''s Plaque (Tabula Traiana), built to commemorate the Roman road that connected Rome to Dacia.', '/src/assets/images/viminacium_archaeology_1778841330074.webp', 'Full day', '2.5 hours',
  150, 'Danube Valley', 'Danube Valley', '€15 - €30', 'Car',
  44.717, 21.233, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '128', 'The Monasteries of Fruška Gora', 'Manastiri Fruške gore', 'History', 'A selected, non-exhaustive monastic route through Fruška Gora National Park, visiting historic orthodox sanctuaries nestled in forest folds.', 'A selected, non-exhaustive monastic route through Fruška Gora National Park, visiting historic orthodox sanctuaries nestled in forest folds.',
  'Often called the ''Serbian Holy Mountain,'' Fruška Gora was once home to over 30 medieval monasteries. This non-exhaustive route highlights Krušedol and Novo Hopovo monasteries, famous for their brickwork, baroque bell towers, and hidden frescoes. It offers a balanced, peaceful journey connecting natural silence with ancient literacy preservation.', 'Often called the ''Serbian Holy Mountain,'' Fruška Gora was once home to over 30 medieval monasteries. This non-exhaustive route highlights Krušedol and Novo Hopovo monasteries, famous for their brickwork, baroque bell towers, and hidden frescoes. It offers a balanced, peaceful journey connecting natural silence with ancient literacy preservation.', '/src/assets/images/fruska_gora_monastery_vineyard_1778842911981.webp', 'Half day', '1 hour',
  60, 'Fruška Gora', 'Fruška Gora', 'Free', 'Car + Walk',
  45.158, 19.791, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '130', 'The Architecture of Yugoslav Belgrade (Modernist Architecture Route)', 'Arhitektura jugoslovenskog Beograda (Modernizam)', 'History', 'Discover the colossal, bold concrete architecture of New Belgrade and Belgrade''s center, tracing socialist modernist and brutalist monuments.', 'Discover the colossal, bold concrete architecture of New Belgrade and Belgrade''s center, tracing socialist modernist and brutalist monuments.',
  'New Belgrade (Novi Beograd) is an architectural museum of mid-20th century urban planning. This architecture route takes design enthusiasts past iconic monumental sights, including the Western City Gate (Genex Tower), the Palace of Serbia (SIV), and the Sava Center. It represents a fascinating look at how Concrete, Ideology, and Modernist dreams combined to build Yugoslavia''s administrative core.', 'New Belgrade (Novi Beograd) is an architectural museum of mid-20th century urban planning. This architecture route takes design enthusiasts past iconic monumental sights, including the Western City Gate (Genex Tower), the Palace of Serbia (SIV), and the Sava Center. It represents a fascinating look at how Concrete, Ideology, and Modernist dreams combined to build Yugoslavia''s administrative core.', '/src/assets/images/bitef_theatre_belgrade_modern_1778847369770.webp', '3-4 hours', '0.2 hours',
  10, 'Belgrade', 'Belgrade', 'Free', 'Walk + Public Transit',
  44.821, 20.448, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '131', 'The City that Built Modern Serbia (Kragujevac Industrial-Modernist Story)', 'Grad koji je gradio modernu Srbiju (Kragujevac)', 'History', 'Uncover Kragujevac’s fascinating historical layers, from the 19th-century industrial complexes to the monumental memorial parks of the Yugoslav era.', 'Uncover Kragujevac’s fascinating historical layers, from the 19th-century industrial complexes to the monumental memorial parks of the Yugoslav era.',
  'As Serbia’s first industrial powerhouse, Kragujevac features the ''Knežev Arsenal''—a spectacular 19th-century red-brick military-industrial foundry. This is balanced by the Šumarice Memorial Park, home to the iconic ''Interrupted Flight'' modernist monument, presenting a profound, reflective narrative of industrialization and war memory.', 'As Serbia’s first industrial powerhouse, Kragujevac features the ''Knežev Arsenal''—a spectacular 19th-century red-brick military-industrial foundry. This is balanced by the Šumarice Memorial Park, home to the iconic ''Interrupted Flight'' modernist monument, presenting a profound, reflective narrative of industrialization and war memory.', 'https://upload.wikimedia.org/wikipedia/commons/6/66/Kragujevac_Prva_gimnazija.jpg', 'Half day', '1.5 hours',
  90, 'Kragujevac', 'Kragujevac', 'Free', 'Car',
  44.012, 20.916, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '133', 'The Other Stone Wine Village (Rogljevo)', 'Drugo kameno selo vina (Rogljevo)', 'Gastronomy', 'Rogljevo’s authentic, preserved limestone wine cellars offer an alternative, highly intimate tasting environment less crowded than Rajac.', 'Rogljevo’s authentic, preserved limestone wine cellars offer an alternative, highly intimate tasting environment less crowded than Rajac.',
  'Rogljevske Pimnice are the close neighbors to Rajac, featuring over 150 stone wine-cellars constructed with similar Ottoman and Central European design overlays. Selected because of its highly intimate, family-run micro-winery culture, Rogljevo allows visitors to talk directly with generational winemakers while enjoying traditional charcuterie under wooden arches.', 'Rogljevske Pimnice are the close neighbors to Rajac, featuring over 150 stone wine-cellars constructed with similar Ottoman and Central European design overlays. Selected because of its highly intimate, family-run micro-winery culture, Rogljevo allows visitors to talk directly with generational winemakers while enjoying traditional charcuterie under wooden arches.', 'https://upload.wikimedia.org/wikipedia/commons/5/54/Rogljeva%C4%8Dke_pivnice.jpg', '2-3 hours', '4 hours',
  240, 'Rogljevo Village', 'Rogljevo Village', '€20 - €40', 'Car',
  44.123, 22.565, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '134', 'Wine Behind Monastery Walls (Bukovo Monastery Winery)', 'Vino iza manastirskih zidina (Vinarija Bukovo)', 'Gastronomy', 'Taste elegant, local wines produced by orthodox monks within the serene courtyards of the historic Bukovo Monastery.', 'Taste elegant, local wines produced by orthodox monks within the serene courtyards of the historic Bukovo Monastery.',
  'Bukovo Monastery, founded in Negotin, has preserved winemaking traditions for centuries. Monks here have revived ''Crna Tamjanika'' (Black Tamjanika), an exceptionally rare, aromatic muscat grape. Tasting these premium, hand-crafted wines within the peaceful monastery gardens offers an evocative, deeply calming culinary experience.', 'Bukovo Monastery, founded in Negotin, has preserved winemaking traditions for centuries. Monks here have revived ''Crna Tamjanika'' (Black Tamjanika), an exceptionally rare, aromatic muscat grape. Tasting these premium, hand-crafted wines within the peaceful monastery gardens offers an evocative, deeply calming culinary experience.', '/src/assets/images/serbian_boutique_distillery_rakija_1778846500524.webp', '2 hours', '3.5 hours',
  210, 'Near Negotin', 'Near Negotin', '€15 - €30', 'Car',
  44.218, 22.483, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '135', 'The Bermet Afternoon (Sremski Karlovci)', 'Bermet popodne (Sremski Karlovci)', 'Gastronomy', 'Taste Bermet—the sweet, herbal wine once served on the Titanic—in the colorful, baroque wine estates of Sremski Karlovci.', 'Taste Bermet—the sweet, herbal wine once served on the Titanic—in the colorful, baroque wine estates of Sremski Karlovci.',
  'Sremski Karlovci is a beautiful, historic town on the Danube, serving as the cultural heartland of Vojvodina''s winemaking. Bermet is the town''s jewel: a sweet dessert wine infused with over 20 secret mountain herbs. Enjoy cellars run by generational families and walk through the historic town square, famous for its elegant, Austro-Hungarian design.', 'Sremski Karlovci is a beautiful, historic town on the Danube, serving as the cultural heartland of Vojvodina''s winemaking. Bermet is the town''s jewel: a sweet dessert wine infused with over 20 secret mountain herbs. Enjoy cellars run by generational families and walk through the historic town square, famous for its elegant, Austro-Hungarian design.', '/src/assets/images/sremski_karlovci_town_1778841131222.webp', '3-4 hours', '1 hour',
  60, 'Sremski Karlovci', 'Sremski Karlovci', '€15 - €35', 'Car + Train',
  45.203, 19.934, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '137', 'The Scent of Tamjanika (Župa Wine Country)', 'Miris Tamjanike (Župa aleksandrovačka)', 'Gastronomy', 'Immerse yourself in Župa, the historical home of Tamjanika. Taste floral white wines and rich Prokupac reds directly at the vineyards.', 'Immerse yourself in Župa, the historical home of Tamjanika. Taste floral white wines and rich Prokupac reds directly at the vineyards.',
  'Župa is often called the ''Serbian Champagne'' region, boasting a spectacular basin landscape surrounded by sun-soaked hills. Famous for Tamjanika—an intensely aromatic, native white grape carrying scent notes of wild thyme and elderflower—and the robust red Prokupac, this area provides visitors with highly traditional, generational family cellars and local food pairings.', 'Župa is often called the ''Serbian Champagne'' region, boasting a spectacular basin landscape surrounded by sun-soaked hills. Famous for Tamjanika—an intensely aromatic, native white grape carrying scent notes of wild thyme and elderflower—and the robust red Prokupac, this area provides visitors with highly traditional, generational family cellars and local food pairings.', '/src/assets/images/sumadija_wine_route_1778845927893.webp', 'Weekend', '3 hours',
  180, 'Aleksandrovac (Župa)', 'Aleksandrovac (Župa)', '€30 - €80', 'Car',
  43.456, 21.047, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '138', 'The Return of Prokupac (Toplica Wine Journey)', 'Povratak Prokupca (Topličko vinogorje)', 'Gastronomy', 'Discover Toplica, a emerging southern wine region focusing on organic, complex expressions of Serbia''s flagship native red grape, Prokupac.', 'Discover Toplica, a emerging southern wine region focusing on organic, complex expressions of Serbia''s flagship native red grape, Prokupac.',
  'Toplica features a rugged climate and volcanic soils perfect for cultivating deep, structure-heavy red wines. This tasting journey guides wine lovers through boutique family cellars committed to returning Prokupac to global tables, highlighting the region’s authentic culinary specialties and wild oak landscapes.', 'Toplica features a rugged climate and volcanic soils perfect for cultivating deep, structure-heavy red wines. This tasting journey guides wine lovers through boutique family cellars committed to returning Prokupac to global tables, highlighting the region’s authentic culinary specialties and wild oak landscapes.', '/src/assets/images/subotica_sand_wines_1778841182776.webp', 'Full day', '3 hours',
  180, 'Toplica Valley', 'Toplica Valley', '€20 - €50', 'Car',
  43.235, 21.587, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '139', 'The Village that Turns Red (Donja Lokošnica)', 'Selo koje pocrveni (Donja Lokošnica)', 'Gastronomy', 'Witness a spectacular, strictly seasonal autumn tradition where entire village houses are completely covered in hanging red pepper chains.', 'Witness a spectacular, strictly seasonal autumn tradition where entire village houses are completely covered in hanging red pepper chains.',
  'Donja Lokošnica is a small, southern village celebrated as the world capital of ground pepper. Every autumn, local farmers harvest millions of native ''nizača'' peppers, threading them manually into long chains. The facades of almost every single brick and plaster house are completely draped in deep red, creating a stunning visual and culinary monument to Balkan family agrarian life.', 'Donja Lokošnica is a small, southern village celebrated as the world capital of ground pepper. Every autumn, local farmers harvest millions of native ''nizača'' peppers, threading them manually into long chains. The facades of almost every single brick and plaster house are completely draped in deep red, creating a stunning visual and culinary monument to Balkan family agrarian life.', 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Donja_Lokosnica_paprika.jpg', '2-3 hours', '3 hours',
  180, 'Near Leskovac', 'Near Leskovac', 'Free', 'Car',
  43.072, 21.968, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '140', 'Pirot at the Table (Regional Food + Craft Journey)', 'Pirot za stolom (Gastro-zanatska ruta)', 'Gastronomy', 'Savor the unique gastronomy of southeastern Serbia. Highlights include ironed sausage (peglana), Sabor cheese, and handmade wool kilims (Pirot carpets).', 'Savor the unique gastronomy of southeastern Serbia. Highlights include ironed sausage (peglana), Sabor cheese, and handmade wool kilims (Pirot carpets).',
  'Pirot is situated beneath the slopes of Stara Planina, harboring exceptional living traditions. This culinary experience guides travelers into local makers'' tables to taste peglana kobasica (a specialized cured sausage flattened manually with a bottle) and Sjenica cheese. This is coupled with a visit to the Pirot Kilim weavers, who preserve complex, geometric symbols passed down for generations.', 'Pirot is situated beneath the slopes of Stara Planina, harboring exceptional living traditions. This culinary experience guides travelers into local makers'' tables to taste peglana kobasica (a specialized cured sausage flattened manually with a bottle) and Sjenica cheese. This is coupled with a visit to the Pirot Kilim weavers, who preserve complex, geometric symbols passed down for generations.', '/src/assets/images/pirot_gastronomy_cheese_1778845871088.webp', 'Full day', '3.5 hours',
  210, 'Pirot', 'Pirot', '€20 - €50', 'Car',
  43.155, 22.585, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '141', 'Breakfast on the Pešter Plateau (Sjenica Highland Food Experience)', 'Doručak na Pešterskoj visoravni (Sjenica)', 'Gastronomy', 'An authentic, hearty culinary morning on Serbia’s cold highland plateau. Savor Sjenica cheese, fresh clotted cream (kajmak), and traditional buckwheat pies.', 'An authentic, hearty culinary morning on Serbia’s cold highland plateau. Savor Sjenica cheese, fresh clotted cream (kajmak), and traditional buckwheat pies.',
  'The Pešter Plateau is a vast, cold highland region known for its harsh winters and spectacular, rolling grasslands. This traditional breakfast experience introduces travelers to local farms to taste authentic Sjenica sheep cheese (protected geographical status) and buckwheat pita baked under metal domes (sač), presenting a warm, rustic introduction to shepherd culture.', 'The Pešter Plateau is a vast, cold highland region known for its harsh winters and spectacular, rolling grasslands. This traditional breakfast experience introduces travelers to local farms to taste authentic Sjenica sheep cheese (protected geographical status) and buckwheat pita baked under metal domes (sač), presenting a warm, rustic introduction to shepherd culture.', 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Pester_plateau.jpg', '3 hours', '4 hours',
  240, 'Pešter Plateau', 'Pešter Plateau', '€10 - €25', 'Car',
  43.272, 19.998, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '142', 'Made of Earth and Fire (Zlakusa Pottery + Slow-Cooked Food)', 'Od zemlje i vatre (Lončarstvo Zlakuse)', 'Gastronomy', 'Discover the generation-old clay pottery village of Zlakusa. Watch potters shape pots manually, then dine on meat slow-cooked in these clay vessels.', 'Discover the generation-old clay pottery village of Zlakusa. Watch potters shape pots manually, then dine on meat slow-cooked in these clay vessels.',
  'Zlakusa is globally famous for its UNESCO-listed pottery tradition, where artisans mix local clay with ground calcite to produce exceptionally durable vessels. Visitors can participate in workshop forming and enjoy a traditional feast of cabbage or meat slow-cooked for over six hours in these fire-resistant pots, creating a rich, smoky culinary memory.', 'Zlakusa is globally famous for its UNESCO-listed pottery tradition, where artisans mix local clay with ground calcite to produce exceptionally durable vessels. Visitors can participate in workshop forming and enjoy a traditional feast of cabbage or meat slow-cooked for over six hours in these fire-resistant pots, creating a rich, smoky culinary memory.', '/src/assets/images/zlakusa_pottery_craft_1778841163739.webp', 'Half day', '2.5 hours',
  150, 'Zlakusa Village', 'Zlakusa Village', '€15 - €35', 'Car',
  43.805, 19.967, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '145', 'Gorge, Water and Thermal Rest (Ovčar Banja Combined with Ovčar-Kablar)', 'Klisura, voda i termalni odmor (Ovčar Banja)', 'Wellbeing', 'A slow, healing day in the green heart of Ovčar Gorge. Combine mild scenic hiking with peaceful thermal baths nestled beneath towering mountains.', 'A slow, healing day in the green heart of Ovčar Gorge. Combine mild scenic hiking with peaceful thermal baths nestled beneath towering mountains.',
  'Ovčar Banja is a small, historical thermal spring settlement nestled in the middle of the Ovčar-Kablar Gorge. Rich in mineral waters at a warm 38°C, the baths have provided wellness and relief since ancient Roman times. After a gentle walk along the West Morava riverbanks, travelers can submerge in warm pools, surrounded by dense forests and the silence of nearby monasteries.', 'Ovčar Banja is a small, historical thermal spring settlement nestled in the middle of the Ovčar-Kablar Gorge. Rich in mineral waters at a warm 38°C, the baths have provided wellness and relief since ancient Roman times. After a gentle walk along the West Morava riverbanks, travelers can submerge in warm pools, surrounded by dense forests and the silence of nearby monasteries.', '/src/assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp', 'Half day', '2 hours',
  120, 'Ovčar Banja', 'Ovčar Banja', '€15 - €35', 'Car',
  43.901, 20.192, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '146', 'A Weekend Above the Noise (Lukovska Banja Mountain Thermal Retreat)', 'Vikend iznad buke (Lukovska Banja)', 'Wellbeing', 'Relax in Serbia’s highest thermal resort, perched at 681m on the slopes of Kopaonik. Features hot spring pools surrounded by clean alpine air and snow.', 'Relax in Serbia’s highest thermal resort, perched at 681m on the slopes of Kopaonik. Features hot spring pools surrounded by clean alpine air and snow.',
  'Lukovska Banja represents the ultimate slow thermal retreat, located in an alpine mountain fold rich in mineral springs. Surrounded by dense pine forests, its thermal waters range up to 56°C, allowing hot outdoor baths even during freezing winters. It is a peaceful destination for mountain walks, clear air inhalation, and high-altitude relaxation.', 'Lukovska Banja represents the ultimate slow thermal retreat, located in an alpine mountain fold rich in mineral springs. Surrounded by dense pine forests, its thermal waters range up to 56°C, allowing hot outdoor baths even during freezing winters. It is a peaceful destination for mountain walks, clear air inhalation, and high-altitude relaxation.', '/src/assets/images/serbian_thermal_spa_tour_1778850947138.webp', 'Weekend', '4 hours',
  240, 'Kopaonik Slopes', 'Kopaonik Slopes', '€40 - €90', 'Car',
  43.167, 21.033, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO public.recommendations (
  source_id, title_en, title_sr, category, short_description_en, short_description_sr,
  long_description_en, long_description_sr, image_url, duration, travel_time,
  travel_time_minutes, location_en, location_sr, estimated_cost, preferred_transport,
  latitude, longitude, best_time_to_visit_en, insider_tip_en, is_published
) VALUES (
  '148', 'The Silver River Sanctuary (Silver Lake & Ram Fortress)', 'Srebrno jezero i tvrdjava Ram', 'Travel', 'A picturesque Danube lakeside escape featuring the magnificent 15th-century Ram Fortress perched atop steep river cliffs, offering unforgettable sunset views across the water.', 'A picturesque Danube lakeside escape featuring the magnificent 15th-century Ram Fortress perched atop steep river cliffs, offering unforgettable sunset views across the water.',
  'Located where the Danube reaches its widest expanse in Serbia, Silver Lake (Srebrno Jezero) and the nearby Ram Fortress represent a harmonious synthesis of medieval military heritage and serene water leisure. Ram Fortress, meticulously restored, stands dramatically over the river currents where Roman, Byzantine, and Ottoman fleets once navigated. A tranquil afternoon spent walking the ramparts followed by lakeside dining showcases the romantic charm of Eastern Serbia Danube corridor.', 'Located where the Danube reaches its widest expanse in Serbia, Silver Lake (Srebrno Jezero) and the nearby Ram Fortress represent a harmonious synthesis of medieval military heritage and serene water leisure. Ram Fortress, meticulously restored, stands dramatically over the river currents where Roman, Byzantine, and Ottoman fleets once navigated. A tranquil afternoon spent walking the ramparts followed by lakeside dining showcases the romantic charm of Eastern Serbia Danube corridor.', '/src/assets/images/golubac_fortress_danube_1778842880053.webp', 'Half day', '1.5 - 2 hours',
  100, 'Veliko Gradište & Ram', 'Veliko Gradište & Ram', '€15 - €35', 'Car + Walk',
  44.812, 21.332, '', '', true
) ON CONFLICT (source_id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  short_description_en = EXCLUDED.short_description_en,
  long_description_en = EXCLUDED.long_description_en,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published;
