# Матрица переноса настроек из живых кабинетов (guns.lol, btw.bio, mychar.gg, vaults.lol)

Сводная таблица соответствия настроек, изученных внутри авторизованных кабинетов четырёх платформ (25 ноября 2026), в единую версионированную схему `profile.v1` и редактор `/admin` проекта `bio`.

## 1. Принцип объединения

1. **Единые канонические токены вместо дублирования.** Например, `Profile Opacity` (`0..1`, `guns.lol`), `Card opacity` (`0..100%`, `btw.bio` / `mychar.gg`) и `Card opacity` (`vaults.lol`) сведены в `layout.cardOpacity` (`0..100`, %).
2. **Всё опционально (open-source first).** Счётчик просмотров, кликов, splash-экран, эффекты текста/фона/курсора, 3D-наклон, плеер, виджеты и блоки — независимые флаги без платных замков и без навязанного баннера платформы в футере.
3. **Учёт локальной автономности (self-hosted).** Все загруженные аватары, фоны, шрифты, курсоры и треки сохраняются на сервере; вместо тяжёлых GIF поверх ника используются лёгкие CSS/SVG-искры (с возможностью опционально загрузить свой оверлей).

---

## 2. Таблица переноса по разделам `/admin`

| Раздел `/admin` | Настройки в `guns.lol` / `btw.bio` / `mychar.gg` / `vaults.lol` | Поля в `profile.v1` |
|---|---|---|
| **Профиль (`identity`, `avatar`)** | Display name, `@username`, UID, Join date, Pronouns, Location, Status, Bio (Markdown/форматирование), Tags (`ptags`), Verified mark; Avatar (crop/position, shape `circle/rounded/square/hexagon`, size `64..200px`, blur `0..10px`, frame/ring, decoration overlay, expand on click, protect right-click), Banner + fade + `mask-image` вырез | `identity.*`, `avatar.*` |
| **Макет и карточка (`layout`)** | Page modes (`Card`, `Compact`, `Float`, `Bento/Grid`, `Cinematic Split`, `Sections`, `Terminal`, `Transparent/Cardless`, `Dock 952`), width `360..760px`, height `0..900px`, page scale `100..150%`, opacity `0..100%`, blur `0..50px`, radius `0..40px`, content fade `40..100%`, border width/style/animated borders, 3D tilt & strength `1..10`, 13 анимаций входа + `cardDelaySec`, 4-угловое размещение виджетов | `layout.*` |
| **Фон и эффекты (`effects`)** | 4-слойный фон: Solid / Linear (`0..360°`) / Radial + 8 пресетов, Image/Video upload + `poster` + video opacity `10..100%` + media blur `0..40px` + mute + dim `0..90%` + color wash `0..100%` + CSS filters (`blur`, `dots`, `grain`, `vignette`, `night`, `old-tv`), 12 particle canvas эффектов (`snow`, `rain`, `diagonal-rain`, `stars`, `embers`, `fireflies`, `matrix`, `sakura`, `bubbles`, `confetti`, `geometric`), Splash (`none`, `blur-curtain`, `radial-dark`, `slit-curtain`, text, countdown), Cursor (`custom`, size `50..250%`, 10 canvas trails + `oneko`, click SFX + volume) | `effects.background.*`, `effects.splash.*`, `effects.cursor.*` |
| **Типографика и цвета (`theme`, `effects`)** | 18 готовых пресетов тем/скинов, palette (`accent`, `text`, `background`, `cardColor`, `gradientColor`, `iconColor`, `fx1`, `fx2`) + авто-оттенки через `color-mix`, отдельные цвета текстовых слотов, встроенные + загружаемые шрифты (`.woff2/.ttf/.otf`), `fontSizeScale` `0.75..1.5x`, `usernameSize` `18..96px`, `usernameWeight`, 16 эффектов имени + 10 эффектов био, Typewriter (список фраз, скорость печати/удаления, стиль каретки, loop), animated `<title>` | `theme.*`, `effects.usernameEffect`, `effects.bioEffect`, `effects.typewriter.*` |
| **Ссылки (`links`)** | Предустановленные соцсети и криптокошельки + Custom URL с иконкой, режим `Link` / `Copy to clipboard`, pinned link, `18+` предупреждение, стиль кнопок (`icons`, `minimal`, `outline`, `cards`, `pills`), стиль иконок (`plain`, `soft`, `circle`, `outline`), размер `24..56px`, monochrome, glow + glow color, alignment, random order | `links.*` |
| **Аудио (`audio`)** | Мульти-трек плеер (загрузка/URL, обложка, shuffle, autoplay), стиль плеера (`corner`, `detached`, `inline`, `volume-only`, `hidden`), default volume `5..100%`, синхронизация видео и музыки + раздельная пауза, 3 визуализатора (`bars`, `waveform`, `ring` вокруг аватара), `beatShake`, `.lrc` лирика (`Karaoke`) | `audio.*` |
| **Блоки, виджеты и бейджи (`blocks`, `badges`)** | Badges (позиция, box-стиль, размер `60..200%`, monochrome/glow); Blocks: локальные часы по IANA timezone, My Setup (9 категорий + фото), Games, Discord card/fallback, Gallery, FAQ, Quote, Callout, Text, Divider | `badges.*`, `blocks[]` |
| **Приватность, аналитика и бэкап (`analytics`, `meta`)** | Опциональный серверный счётчик просмотров и кликов (`trackViews`, `showViewsBadge`, `trackClicks`), лайки профиля (`enableLikes`), SEO/OpenGraph (`seoTitle`, `seoDescription`, `seoImageUrl`, `faviconUrl`), `18+` gate, пароль на профиль, экспорт/импорт `profile.v1.json`, Undo/Redo, Simple/Advanced режим редактора | `analytics.*`, `meta.*` |
