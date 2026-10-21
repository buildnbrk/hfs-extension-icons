# Extension Icons for HFS

An [HFS](https://github.com/rejetto/hfs) plugin that gives every file a generic document icon carrying its extension, colour-coded by type (`doc`, `pdf`, `xls`, `mp4`, `zip`, ...).

## Features

- **Colour-coded by type** — documents, source code, images, audio, video, archives, executables, fonts, certificates and keys, shortcuts, torrents, and 3D/CAD files, across 200+ extensions.
- **Extension label** — the extension is printed on the coloured label, with friendly short forms for long ones (`docx` → `doc`, `markdown` → `md`). Text, casing, and label length are configurable.
- **Follows the current view** — the SVG is sized in `em`, so it tracks HFS' own icon size in both list and tiles views.
- **Plays well with others** — defers to icons configured on entries in HFS' virtual file system, and can step aside wherever another plugin already draws a preview or icon.
- **Per-extension colours** — override any type with your own hex value or CSS colour name.
- **Ignore rules** — leave whole extensions or whole folders (optionally from a chosen depth) to HFS' own icons.

## Requirements

- HFS with plugin API version 13 or newer (`exports.apiRequired = 13`).
- No dependencies, no build step, no network access at runtime.

## Installation

Install it the way you install any HFS plugin:

1. Point the HFS plugin manager at the repository `buildnbrk/hfs-extension-icons` (the `exports.repo` field in [`dist/plugin.js`](dist/plugin.js:11) references it), **or** copy the **contents** of the [`dist`](dist) folder into a folder of your HFS `plugins` directory and restart HFS.
2. Open the plugin's settings and confirm **Extension icons** is enabled (it is on by default).

Everything HFS installs lives in [`dist`](dist); that is the folder the plugin manager publishes, and the folder to copy when installing by hand. The plugin consists of three files plus the licence that must travel with them:

| File | Purpose |
| --- | --- |
| [`dist/plugin.js`](dist/plugin.js:1) | Plugin metadata and the settings form |
| [`dist/public/main.js`](dist/public/main.js:1) | Frontend behaviour; registers the `entryIcon:after` handler |
| [`dist/public/style.css`](dist/public/style.css:1) | Styling for the generated icon |
| [`dist/LICENSE`](dist/LICENSE:1) | MIT licence text, kept inside `dist` so every installed copy carries the notice |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| Extension icons | on | Master switch. Off leaves everything exactly as HFS drew it. |
| Show extension text | on | Draw the extension on the coloured label. Off leaves a plain colour-coded page icon. |
| Uppercase extension text | on | Render the label in capitals. |
| Extension characters | 4 (1–5) | How many characters the label may show. |
| Icon size | 100% (25–400) | Percentage of the size HFS uses for the icon in the current view. Values above 100 may overflow a tight list slot. |
| Keep icons set in HFS | on | Honour an icon configured on an entry in HFS' virtual file system. |
| Colour for unknown types | `#78909c` | Fallback colour for extensions not in the built-in table. |
| Custom extension colours | empty | Per-extension overrides, one per line. See below. |
| Skip where a preview is drawn | on | Don't draw an extension icon when another plugin already draws one for that entry. Off draws both. |
| Extensions to leave alone | empty | Comma- or space-separated extensions that keep HFS' own icon. |
| Folders to leave alone | empty | Folders where nothing is decorated. Each rule has a path and a minimum depth; `0` applies as soon as you enter the path, `1` only on its sub-folders, and so on. Takes precedence over the extension settings. |

### Custom extension colours

One entry per line, in the form `extension=colour`. `:` also works as the separator and a leading dot is optional:

```text
psd=#b30000
sketch=orange
myext=teal
```

Values may be hex (`#abc`, `#aabbcc`, or 8-digit hex) or a plain CSS colour name. Lines that don't match are ignored, so a stray line never breaks the icons.

## How it works

The plugin registers a handler on `entryIcon:after`, which runs once every normal `entryIcon` handler has had its say. That gives it three properties for free:

- It can see whether another plugin already produced an icon or preview for the entry, and step aside when **Skip where a preview is drawn** is on.
- It never needs to know which preview or tile plugin is installed.
- The decision is made per entry and per render, so it follows the other plugin exactly — on where that plugin draws, off where it does not.

Files with a per-entry icon configured in HFS are left untouched when **Keep icons set in HFS** is on. Dotfiles and files without an extension get no badge.

## Security

The plugin is deliberately small and has no privileged surface:

- **No server-side behaviour.** [`dist/plugin.js`](dist/plugin.js:1) only exports metadata and a declarative settings form; it registers no handlers, routes, or middleware, and never touches the filesystem or network.
- **No HTML sinks.** Icons are built as nodes with the host's `HFS.h` helper — no `innerHTML`, `document.write`, `eval`, or dynamic script loading.
- **Untrusted input is constrained.** The file extension is reduced to `[a-z0-9+_-]` before it is used in the label or attribute, and colour settings are validated against a hex-or-name pattern before reaching the inline style.
- **Prototype-safe lookups.** The extension and colour tables are read through own-property checks, so a file named `invoice.constructor` or `x.__proto__` is treated as an unknown type rather than resolving to an inherited `Object.prototype` member.

## Compatibility notes

- The plugin styles its own icon only (`.ft-file-icon` and its children); it does not modify page-wide styles.
- Extensions not in the built-in table use the fallback colour and still get a label.
- Ordering with other icon plugins is intentionally not hard-coded: use **Skip where a preview is drawn** and **Extensions to leave alone** to resolve overlaps.

## License

Released under the [MIT License](LICENSE). The same licence text is shipped inside [`dist/LICENSE`](dist/LICENSE:1), so it is part of every installation, not just the repository.

## Legal notes

- **Scope of the licence.** MIT covers the contents of this repository: the plugin metadata, the frontend script, the stylesheet, and the generated SVG icon. You may use, modify, and redistribute them, commercially or not, provided the copyright and permission notice stay with any copy or substantial portion.
- **HFS itself is not included and is not covered.** HFS is licensed under GPL-3.0. This plugin contains no HFS source code, bundles no HFS binaries, and only calls HFS' documented plugin API. MIT is one-way compatible with GPLv3, so this plugin can be combined with HFS and redistributed as part of a GPLv3 work; if you ship it *bundled* with HFS, the combined distribution must satisfy GPLv3 (source availability, licence text, notices).
- **No third-party code or assets.** There are no dependencies, no vendored libraries, no bundled fonts or icon sets. The document shape is original geometry, the colours are plain values, and the stylesheet only names generic font families rather than embedding font files. See [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- **Names and marks.** "HFS" is used descriptively to say which host the plugin runs under. This project is not affiliated with, sponsored by, or endorsed by the HFS author, and it uses no HFS logo or branding. Extension names such as `pdf`, `docx`, or `psd` are descriptive identifiers; no vendor logo is reproduced.
- **No data collection.** The plugin makes no network requests, collects no telemetry, and stores nothing beyond the settings HFS already keeps for every plugin, so there is no personal data for it to process.
- **No warranty.** As the MIT text states, the software is provided "as is", without warranty of any kind, and the author is not liable for damages arising from its use. Nothing here is legal advice.

Before publishing, confirm the `buildnbrk/hfs-extension-icons` repository is public and that the copyright holder name in [`LICENSE`](LICENSE:3) is the name or entity you want to enforce the licence as.
