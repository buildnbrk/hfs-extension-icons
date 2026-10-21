// SPDX-License-Identifier: MIT
// Copyright (c) 2026 buildnbrk
'use strict';{
    // extension-icons frontend
    // Draws a generic document icon carrying the file extension, coloured by type.
    // It decorates every entry the host gives it and steps aside for a file-specific
    // icon. There is deliberately no knowledge of previews, tiles-mode or other plugins
    // here: the ignoreExtensions setting is the only way an admin asks it to stand down
    // for particular types.

    const conf = HFS.getPluginConfig()

    const iconsOn = conf.enabled !== false
    const showText = conf.showText !== false
    const uppercase = conf.uppercase !== false
    const respectCustom = conf.respectCustom !== false
    // A colour is a hex value or a plain CSS colour name. The setting is admin-authored, but
    // validating it here keeps it on the same footing as the per-extension colours below and
    // stops anything but a colour from reaching the inline style.
    const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/
    const defaultColor = COLOR_RE.test(String(conf.defaultColor || '')) ? conf.defaultColor : '#78909c'
    const maxLength = Math.max(1, Math.min(5, +conf.maxLength || 4))
    // The SVG is drawn in em, so this scales HFS' own icon size for the current view (list rows,
    // tiles) rather than replacing it with a fixed pixel size.
    const iconScale = Math.max(25, Math.min(400, +conf.sizePercent || 100)) / 100
    const customColors = parseCustomColors(conf.customColors)
    const ignored = formatSet(conf.ignoreExtensions)
    const skipPreview = conf.skipPreview !== false
    const folderRules = buildRules(conf.ignoreFolders)

    // Colours grouped by category as [colour, "ext ext ext ..."]. Later groups win, so an
    // ambiguous extension keeps the meaning people expect (ts = TypeScript, not a transport stream).
    const FT_GROUPS = [
        // --- documents ---
        ['#e53935', 'pdf'],
        ['#2b579a', 'doc docx docm dot dotx dotm odt ott rtf pages wp wpd wps abw zabw'],
        ['#217346', 'xls xlsx xlsm xlsb xlt xltx ods ots csv tsv numbers et'],
        ['#d24726', 'ppt pptx pptm pps ppsx ppsm odp otp key dps'],
        ['#607d8b', 'txt text log nfo rst readme me ini cfg conf'],
        ['#1976d2', 'md markdown mdown mkdn'],
        ['#00838f', 'tex latex ltx bib'],
        ['#7b1fa2', 'epub mobi azw azw3 fb2 djvu chm lit prc pdb'],
        // --- web / markup / data ---
        ['#e44d26', 'html htm xhtml shtml hta'],
        ['#ff6f00', 'xml xsl xslt dtd rss atom opml'],
        ['#b28704', 'json json5 jsonc geojson'],
        ['#6d4c41', 'yaml yml toml'],
        ['#00758f', 'sql psql mysql'],
        ['#546e7a', 'db sqlite sqlite3 mdb accdb mdf ndf dbf odb'],
        // --- email / pim ---
        ['#5c6bc0', 'eml msg pst ost mbox emlx vcf ics ical'],
        // --- source code ---
        ['#c9a400', 'js mjs cjs jsx node'],
        ['#3178c6', 'ts tsx mts cts'],
        ['#41b883', 'vue'],
        ['#ff3e00', 'svelte'],
        ['#1572b6', 'css scss sass less styl stylus'],
        ['#3776ab', 'py pyw pyc ipynb'],
        ['#e76f00', 'java jar class jsp'],
        ['#7f52ff', 'kt kts gradle'],
        ['#dc322f', 'scala sc'],
        ['#4298b8', 'groovy gvy'],
        ['#555555', 'c h'],
        ['#00599c', 'cpp cc cxx hpp hh hxx'],
        ['#68217a', 'cs'],
        ['#00add8', 'go'],
        ['#b7410e', 'rs'],
        ['#cc342d', 'rb erb gemspec rake'],
        ['#777bb4', 'php phtml php3 php4 php5 phps'],
        ['#e9621a', 'swift'],
        ['#0175c2', 'dart'],
        ['#000080', 'lua'],
        ['#0298c3', 'pl pm pod'],
        ['#276dc3', 'r rdata rds'],
        ['#4eaa25', 'sh bash zsh ksh fish ash bat cmd'],
        ['#012456', 'ps1 psm1 psd1'],
        ['#6e4b3a', 'asm s'],
        ['#945db7', 'vbs vb bas frm'],
        ['#734f96', 'f f90 f95 for ftn'],
        ['#5d4f85', 'hs lhs'],
        ['#5881d8', 'clj cljs cljc edn'],
        ['#a90533', 'erl hrl'],
        ['#6e4a7e', 'ex exs'],
        ['#e37933', 'ml mli'],
        ['#b58a00', 'nim'],
        ['#c07a00', 'zig'],
        ['#363636', 'sol'],
        ['#005f8f', 'pas pp'],
        ['#ba5f17', 'd'],
        ['#e10098', 'graphql gql'],
        ['#9e9e9e', 'proto part crdownload download'],
        ['#2496ed', 'dockerfile'],
        // --- images ---
        ['#26a69a', 'jpg jpeg jpe jfif png gif bmp webp avif ico cur tif tiff heic heif jxl raw cr2 cr3 nef arw dng orf rw2 raf pef sr2 psd psb ai eps indd xcf'],
        ['#ffb300', 'svg svgz'],
        // --- audio ---
        ['#7e57c2', 'mp3 wav wave wma flac aac m4a m4b ogg oga opus aiff aif ape mid midi amr au ra ac3 dts'],
        // --- video ---
        ['#d81b60', 'mp4 m4v mkv avi mov qt wmv webm flv mpg mpeg mpe 3gp 3g2 m2ts mts vob ogv rm rmvb asf divx xvid'],
        // --- archives ---
        ['#f57f17', 'zip rar 7z tar gz tgz bz2 tbz tbz2 xz txz z lz lzma lzo tlz cab arj ace taz zst br'],
        ['#8d6e63', 'iso img dmg vhd vhdx vmdk qcow2 wim'],
        // --- executables / system ---
        ['#455a64', 'exe msi dll so dylib bin com apk app deb rpm pkg snap appimage out elf sys scr drv ocx cpl run'],
        // --- fonts ---
        ['#795548', 'ttf otf woff woff2 eot fon fnt pfb pfm ttc'],
        // --- certificates / keys ---
        ['#757575', 'crt cer pem der pfx p12 asc pgp gpg keystore jks ppk'],
        // --- links / shortcuts ---
        ['#1e88e5', 'lnk url webloc desktop menu'],
        // --- torrents ---
        ['#43a047', 'torrent'],
        // --- 3d / cad ---
        ['#6a1b9a', 'stl obj 3ds fbx blend dae step stp iges igs dwg dxf skp'],
    ]

    const FT_COLORS = {}
    for (const [colour, list] of FT_GROUPS)
        for (const ext of list.split(' '))
            FT_COLORS[ext] = colour

    // friendlier labels for some long extensions
    const FT_ALIAS = {
        docx: 'doc', docm: 'doc', dotx: 'dot', dotm: 'dot',
        xlsx: 'xls', xlsm: 'xls', xlsb: 'xls', xltx: 'xlt',
        pptx: 'ppt', pptm: 'ppt', ppsx: 'pps',
        jpeg: 'jpg', jpe: 'jpg', jfif: 'jpg', tiff: 'tif',
        markdown: 'md', mdown: 'md', mkdn: 'md',
        html: 'htm', xhtml: 'htm',
        yaml: 'yml', sqlite: 'db', sqlite3: 'db', mpeg: 'mpg',
    }

    // "psd=#b30000", ".myext = teal" -> { psd: '#b30000', myext: 'teal' }
    function parseCustomColors(text) {
        const ret = Object.create(null)
        String(text || '').split('\n').forEach(line => {
            const match = line.match(/^\s*\.?([a-z0-9+_-]+)\s*[:=]\s*(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)\s*$/)
            if (match)
                ret[match[1].toLowerCase()] = match[2]
        })
        return ret
    }

    // Comma or space separated extension list -> lowercase set without leading dots.
    function formatSet(value) {
        return new Set(String(value || '').split(/[,\s]+/)
            .map(x => x.trim().toLowerCase().replace(/^\./, '')).filter(Boolean))
    }

    // Look up a key on one of the lookup tables without falling through to Object.prototype.
    // A file may perfectly well be called "x.constructor" or "y.toString"; those must be treated
    // as unknown extensions, never as inherited members of the prototype.
    function own(map, key) {
        return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined
    }

    function isDotFile(name) {
        return Boolean(name) && name[0] === '.' && name.indexOf('.', 1) < 0
    }

    // Both sides of a folder comparison are normalised the same way: query and fragment dropped,
    // percent-encoding decoded, trailing slashes removed. That way a path HFS reports encoded still
    // matches the plain path entered in the settings.
    function normalFolder(uri) {
        let text = String(uri || '').split('?')[0].split('#')[0]
        try { text = decodeURIComponent(text) } catch {}
        return text.replace(/\/+$/, '')
    }

    // Folder rules, shaped exactly like the ones automatic-tiles uses: a base path plus the depth
    // from which it applies. They are compared against the folder an entry sits in, not the entry
    // itself, so every file below it is covered.
    function buildRules(list) {
        return (list || [])
            .map(x => {
                const base = normalFolder(x.path)
                return { base, prefix: base + '/', minDepth: x.minDepth || 0 }
            })
            .filter(rule => rule.base)
    }

    function matchesRule(rule, uri) {
        if (uri !== rule.base && !uri.startsWith(rule.prefix)) return false
        const rest = uri.slice(rule.base.length)
        const depth = rest ? rest.split('/').length - 1 : 0
        return depth >= rule.minDepth
    }

    // The folder an entry sits in: entry.uri is its full path, so everything before the last slash.
    // An entry without a uri falls back to the folder being browsed, so search results stay covered.
    function folderOf(entry) {
        const uri = normalFolder(entry.uri || (HFS.state && HFS.state.uri) || '')
        const cut = uri.lastIndexOf('/')
        return cut > 0 ? uri.slice(0, cut) : ''
    }

    function inIgnoredFolder(entry) {
        if (!folderRules.length) return false
        const folder = folderOf(entry)
        return Boolean(folder) && folderRules.some(rule => matchesRule(rule, folder))
    }

    function makeExtIcon(ext, colour) {
        let label = own(FT_ALIAS, ext) || ext
        if (uppercase) label = label.toUpperCase()
        if (label.length > maxLength) label = label.slice(0, maxLength)
        // fit the text inside the label (label interior is about 17 units wide)
        const fontSize = Math.min(11, 17 / (label.length * 0.6))
        const baseline = 21.25 + fontSize * 0.35
        return HFS.h('span', {
            className: 'icon ft-file-icon',
            'aria-hidden': true,
            'data-file-type': label,
        },
            HFS.h('svg', { viewBox: '0 0 32 32', width: iconScale + 'em', height: iconScale + 'em', focusable: 'false' },
                HFS.h('path', { className: 'ft-page', d: 'M9 2h10l8 8v19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z' }),
                HFS.h('path', { className: 'ft-fold', d: 'M19 2l8 8h-8z', style: { fill: colour } }),
                HFS.h('rect', { className: 'ft-label', x: 6.5, y: 15, width: 19, height: 12.5, rx: 2.2, style: { fill: colour } }),
                showText && HFS.h('text', {
                    className: 'ft-text', x: 16, y: baseline, textAnchor: 'middle',
                    style: { fontSize: fontSize + 'px', fill: '#fff' },
                }, label),
            ),
        )
    }

    // Registering on the :after pass means this runs once every normal entryIcon handler has had
    // its say, and `output` carries whatever they returned. A preview or icon drawn by another
    // plugin therefore suppresses the badge here, without this plugin knowing anything about that
    // plugin or its settings. The decision is per entry and per render, so it follows the other
    // plugin exactly: on where it draws, off where it does not.
    if (iconsOn)
        HFS.onEvent('entryIcon:after', ({ entry }, extra) => {
            if (skipPreview && extra?.output?.length) return // someone else already covers this entry
            if (!entry || entry.isFolder) return
            if (inIgnoredFolder(entry)) return // this folder keeps HFS' own icons
            // Keep the extension to the alphabet the settings already use. HFS.h builds nodes
            // safely, but the label also lands in an attribute and an SVG text node, so it is
            // never given more freedom than it needs.
            const ext = String(entry.ext || '').toLowerCase().replace(/^\./, '').replace(/[^a-z0-9+_-]/g, '')
            if (!ext || isDotFile(entry.name)) return
            if (ignored.has(ext)) return // the admin asked us to leave this type alone
            // entry.icon is sent by HFS only for a VFS entry that has its own configured icon: a
            // system icon name as a string, or true when it is an image file served by ?get=icon.
            // Ordinary files have no per-file icon, so this cannot affect them; use the ignore list
            // above for whole types.
            if (respectCustom && entry.icon) return
            return makeExtIcon(ext, own(customColors, ext) || own(FT_COLORS, ext) || defaultColor)
        })
}
