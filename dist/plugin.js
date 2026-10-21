// SPDX-License-Identifier: MIT
// Copyright (c) 2026 buildnbrk
//
// HFS plugin: extension-icons
// Gives files a generic document icon carrying their extension, colour-coded by type
// (doc, pdf, xls, ...). It only draws icons: it knows nothing about previews, tiles-mode
// or any other plugin, so it can run on its own alongside anything else.

exports.description = "Draws a generic document icon carrying each file's extension, colour-coded by type"
exports.version = 1
// The field types used below (boolean, number, string, colour) are older than 13; the value
// matches the plugin this feature came from, the version it has actually been used with.
exports.apiRequired = 13
exports.repo = "buildnbrk/hfs-extension-icons"
exports.frontend_js = "main.js"
exports.frontend_css = "style.css"
exports.changelog = [
    { version: 1, message: "First release: colour-coded extension icons for every file, with optional extension text, an adjustable icon size, respect for icons configured on entries in HFS, an optional skip where another plugin already draws a preview or icon, folder paths where every icon is left to HFS, a colour for unknown types and per-extension colours" }
]

// field builders keep the table short and uniform
const number = extra => ({ frontend: true, type: 'number', xs: 12, ...extra })
const toggle = extra => ({ frontend: true, type: 'boolean', xs: 12, ...extra })
const formats = extra => ({ frontend: true, type: 'string', xs: 12, ...extra })

exports.config = {
    enabled: toggle({
        defaultValue: true,
        label: "Extension icons",
        helperText: "Master switch.\nOn: files show a colour-coded icon carrying their extension (doc, pdf, xls, ...).\nOff: everything is left exactly as HFS drew it" }),
    showText: toggle({
        defaultValue: true,
        showIf: values => values.enabled,
        label: "Show extension text",
        helperText: "Draw the extension on the coloured label.\nOff leaves a plain colour-coded page icon" }),
    uppercase: toggle({
        defaultValue: true,
        showIf: values => values.enabled && values.showText,
        label: "Uppercase extension text" }),
    maxLength: number({
        defaultValue: 4, min: 1, max: 5,
        showIf: values => values.enabled && values.showText,
        label: "Extension characters",
        helperText: "How many characters the label may show" }),
    sizePercent: number({
        defaultValue: 100, min: 25, max: 400,
        showIf: values => values.enabled,
        label: "Icon size",
        helperText: "Percentage of the size HFS uses for the icon in the current view.\n100 keeps HFS' own size; larger values may overflow a tight list slot" }),
    respectCustom: toggle({
        defaultValue: true,
        showIf: values => values.enabled,
        label: "Keep icons set in HFS",
        helperText: "Honor an icon configured on an entry in HFS' virtual file system (file properties, icon)" }),
    defaultColor: {
        frontend: true,
        type: 'color',
        xs: 12,
        defaultValue: '#78909c',
        showIf: values => values.enabled,
        label: "Colour for unknown types" },
    customColors: formats({
        defaultValue: '',
        multiline: true,
        showIf: values => values.enabled,
        label: "Custom extension colours",
        helperText: "One per line, in the form extension=colour. Example:\n\n    psd=#b30000\n    sketch=orange\n    myext=teal" }),
    skipPreview: toggle({
        defaultValue: true,
        showIf: values => values.enabled,
        label: "Skip where a preview is drawn",
        helperText: "Don't draw an extension icon when another plugin already draws one for that entry, such as a picture or video preview.\nOff draws the icon as well, so an entry can show both" }),
    ignoreExtensions: formats({
        defaultValue: '',
        showIf: values => values.enabled,
        label: "Extensions to leave alone",
        helperText: "Optional. Comma or space separated extensions that keep HFS' own icon.\nUseful when another plugin already draws something for those files, such as a preview for pictures and videos" }),
    ignoreFolders: {
        frontend: true,
        type: 'array',
        defaultValue: [],
        showIf: values => values.enabled,
        label: "Folders to leave alone",
        helperText: "Optional. Inside these folders nothing is decorated, so HFS' own icons apply to every file there.\nTakes precedence over the extension settings above",
        fields: {
            path: { type: 'vfs_path', files: false, $width: 1 },
            minDepth: { type: 'number', defaultValue: 0, min: 0, $width: 90,
                helperText: "0 applies as soon as you enter the path above.\n1 only on its sub-folders, 2 on sub-sub-folders, and so on" },
        }
    },
}
exports.configDialog = {
    maxWidth: '28em'
}
