# Раскраски и сохранённые работы

Выпуск `2026.10.23-colouring-2` использует сами сгенерированные контурные иллюстрации. Интерактивные области следуют их линиям: это не упрощённая перерисовка персонажей геометрическими фигурами.

Шесть личных сюжетов Амели: `dino-garden`, `cat-dojo`, `art-studio`, `paper-boat`, `bunny-picnic`, `space-friends`. Они доступны Амели и родителю, выбравшему её альбом. Демо и Песочница получают три общих сюжета: дом, питомцы и ночь. Сервер проверяет доступность рисунка при сохранении и импорте.

## Как устроен рисунок

- Цветные образцы: `assets/colouring/adventures.webp` и `familiar.webp`.
- Контурные мастера: `assets/colouring/ink/adventures.webp` и `familiar.webp`. Синий контур выводится непосредственно из этих файлов, поверх цвета. Белый фон смешивается с фактурой бумаги.
- `js/colouring/ink-regions.js`: точные замкнутые маски внутренних областей, полученные из оригинальных PNG-мастеров. Всего 346 отдельных деталей в девяти сюжетах. Полоски, пятнышки, лепестки, внутренние части ушей, лапки, пояс и клеточки пледа доступны отдельно.
- Свободное рисование сохраняет цвет конкретной детали (`piece…`). Английское задание закрашивает все детали названного предмета. Enter/Space на предмете делает то же самое. Текстура воскового штриха появляется только на закрашенных деталях.
- `scripts/trace-colouring.py original-adventures.png original-familiar.png` воспроизводит геометрию. Нужны Python, NumPy, SciPy, Pillow и contourpy; рабочему серверу они не нужны. Таблица в скрипте связывает области с существительными. При смене мастера эту таблицу нужно проверить заново. Исходные PNG сохраняются отдельно от приложения; браузер получает оптимизированные WebP.

Новые сохранения содержат `artVersion: "ink-v2"`. Сохранения без версии используют прежние SVG-контуры и прежние названия заливок. Обновление иллюстраций не перерисовывает уже готовые работы ребёнка. Идентификаторы картинок, старые записи, даты, звёзды и резервные копии сохраняются.

## Галерея и повторное сохранение

В галерее одинаковые композиции показываются одной карточкой с раскрываемым списком дат сохранения. Сравниваются сюжет, версия контуров и заливки с учётом порядка ключей. Исходные записи не удаляются; экспорт по-прежнему содержит все сохранения. Разные варианты цвета и разные версии рисунка не объединяются.

Пустую работу сохранить нельзя. Пока сохранение выполняется, кнопка заблокирована. Уже сохранённая композиция не создаёт новую запись и повторно не начисляет звёзды. После изменения цвета можно сохранить новый вариант. Проверки выполняются также после перехода на другую страницу и возвращения в рисунок.

Новые существительные не попадают в интервальное повторение автоматически: набор карточек выбирает взрослый. Русские подсказки для рисунков находятся в каталоге.

## Арт-дирекшн и промпт мастера

Образец направления — наивный рисунок с выразительными динозаврами, синим контуром и энергичным восковым штрихом. Цветной образец и раскраска должны узнаваемо изображать одних и тех же персонажей, включая пропорции, позы, мордочки и детали. Бумага и картон относятся к окружению интерфейса; в файле контурного мастера фон чистый, чтобы фактура и пользовательская заливка не конфликтовали с ним.

```text
EDIT THE PROVIDED COLOURED ILLUSTRATION SHEET into its beautiful, publishable,
uncoloured colouring-book master. Preserve the original scenes, proportions,
endearing CHARACTER DRAWINGS, expressive faces, poses, contours, arrangement
and small details. The SAME illustrator has prepared the SAME picture for
colouring. Do not simplify the drawing into geometric silhouettes or icons.

Preserve the kitten's paws, curled striped tail, kimono lapels and tied belt;
the dinosaur's plump organic silhouette and spots; the rabbit's floppy ears
and picnic blanket; the palette's paint blobs; the sailboat's portholes and
happy fish; the rocket's fins, circular window and ringed planet. Every scene
must remain recognisable beside its original colour study.

ART MATERIAL: rich cobalt-blue pencil/fineliner contours, subtly variable line
pressure, graceful organic curves, lively friendly faces and tiny human
imperfections. No generic vector clip art, no polygon redraw, no 3D, no gradients,
no glossy effects, no heavy black/brown contours. Preserve facial expressions.

Remove ALL coloured fills, painted shading and interior crosshatching. Keep
blue eyes and mouths crisp. All separately colourable parts must have clearly
CLOSED continuous outlines: spots, stripes, cheeks, ears, paws, petals, flower
centres, kimono panels, belt knot, ball panels, brush ferrule, bristles, pencil,
sketchbook pages, sails, hull, fish, carrot leaves, strawberry leaves, butterfly
wings, cup handle, rocket body/window/flame, planet ring. Do not fill these
areas with solid ink. Generous clear interiors, suitable for digital bucket
colouring and an eight-year-old child.

LAYOUT: preserve the exact scene order in the reference grid; six equal cells
in 3 columns by 2 rows for the adventure sheet, four in 2 columns by 2 rows
for the familiar sheet. Leave clear gutters and margins, no object may intrude
on its neighbour. No visible grid lines, no frames, no lettering or captions.

BACKGROUND AND OUTPUT: pure white interiors and pure white flat background
#ffffff, no paper grain, no shadows, no noise or painted texture. Blue linework
about 3–4 px at original sheet resolution. This file is the final visible
interactive colouring artwork, not a moodboard. Maximise beauty, legibility
and fidelity to the supplied generated illustrations.
```

Проверки: сохранение/импорт/перезапуск SQLite для старых и новых заливок; группировка без изменения исходных записей; серверные разрешения профилей; реальные нажатия в браузере, задания на цвета, клавиатура, защита пустого и повторного сохранения, мобильная ширина 320/390 px. Дополнительно перед публикацией просматриваются контурные и раскрашенные изображения в браузере.
