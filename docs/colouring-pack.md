# Личные раскраски Амели

Подборка `2026.10.23-colouring-1` добавляет шесть сюжетов: `dino-garden`, `cat-dojo`, `art-studio`, `paper-boat`, `bunny-picnic`, `space-friends`. Они доступны при детском входе Амели и родителю, выбравшему её альбом. Демо и Песочница сохраняют три базовые раскраски; прямой запрос сохранения личного рисунка в другой профиль отклоняет сервер.

Цветные эскизы созданы с референсом `assets/doodles/welcome.webp`, который продолжает направление исходного наивного плаката. Общий лист `assets/colouring/adventures.webp` содержит сетку 3 × 2, без надписей. Исходный PNG остаётся в рабочем каталоге генерации. На карточках и в раскрываемой подсказке используется цветной эскиз; интерактивный рисунок построен из крупных замкнутых SVG-областей по тем же сюжетам.

Три прежних сюжета также получили новые цветные эскизы в `assets/colouring/familiar.webp` (сетка 2 × 2: дом, питомцы, ночь, мотив альбома для ссылки на галерею). Для них используется то же направление синего карандашного контура и воскового штриха.

Контуры и данные находятся в `js/colouring/pictures.js`: общий каталог используется интерфейсом, галереей и серверной проверкой. Три прежних рисунка сохраняют `id`, названия областей и заливки из старых экспортов. Их вывод обновлён: немного неровный синий контур, штриховка и просветы бумаги в цвете. Существующие рисунки, звёзды и интервальные повторения не меняются.

Для новых предметов добавлены русские подсказки и английская озвучка в задании. Эти слова не добавляются автоматически в интервальное повторение: набор новых карточек по-прежнему выбирает взрослый. Каждый рисунок содержит 5–6 областей. Доступны свободная раскраска, задания «Colour the …», клавиши Enter/Space на области, сохранение в галерею и экспорт/импорт.

## Промпт цветных эскизов

```text
Create an original illustration sheet for an eight-year-old child's English colouring app, using the provided picture ONLY as a drawing-material and character-style reference. This is a new sheet of six different scenes, not a copy of the reference composition.

ART DIRECTION: lively naive editorial hand drawing, uneven cobalt-blue felt-tip contours (#126c9a), wax-crayon and coloured-pencil marks, spontaneous lightly angular asymmetry, short vigorous directional hatching with visible cream paper gaps. Emphasize the analogue pencil texture and searching double contours, as in a naive dinosaur poster; avoid polished baby clip art. Warm sunflower yellow, leaf green, mint, coral, orange, pale sky blue. Friendly small eyes and simple smiles. No glossy gradients, no 3D, no thick black/brown outlines, no smooth vector icons, no kawaii sparkle, no sticker border or shadows, no typography, no captions, no visible grid. Flat uniform warm ivory background #fbf7ed.

EXACT COMPOSITION: landscape canvas, precisely three equal square columns and two equal square rows, SIX wholly separate square scenes. Each scene has a clear 10 percent margin inside its own cell; no object crosses a cell boundary. Similar optical size throughout, few large subjects with closed silhouettes and generous space. Each scene will be redrawn as an interactive colouring page, so keep the objects clearly separated, simple and identifiable.

Top left: a friendly long-neck GREEN DINOSAUR in a garden, a fir tree on the left, smiling yellow sun upper right, one pale cloud upper left, one large coral flower lower right.
Top middle: an ORANGE KITTEN standing in a simple white AIKIDO KIMONO with yellow belt, on a mint rectangular mat, one blue ball lower right, one yellow star upper left; large calm smiling face.
Top right: an artist's still life with one large irregular wooden PALETTE with three paint dabs, one chunky paintbrush diagonally, one red pencil and an open sketchbook, small friendly sun above.
Bottom left: a RED SAILBOAT with a large yellow triangular sail on pale blue waves, a happy orange fish lower right, sun upper right and a single cloud upper left.
Bottom middle: a friendly RABBIT with long ears sitting at a picnic, orange carrot to its left, one large red strawberry to its right, simple mint cup below right, butterfly upper left, little patch of grass below.
Bottom right: a playful RED ROCKET with a yellow flame and circular pale blue window, a yellow crescent moon upper right, one smiling star upper left, and a ringed mint planet lower right.

The entire result should feel drawn by the same person with the same blue pencil and crayons on the same sheet of paper. Strong visual clarity at 160px per scene, not a busy storybook spread.
```
