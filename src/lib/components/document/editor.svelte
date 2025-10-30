<script lang="ts">
    import { onMount, onDestroy,  getContext, afterUpdate, tick } from 'svelte';
    import {reef, session} from '@humandialog/auth.svelte'
	import { Editor } from '@tiptap/core';

    import StarterKit from '@tiptap/starter-kit';
    import Document from '@tiptap/extension-document'
    import Paragraph from '@tiptap/extension-paragraph'
    import Text from '@tiptap/extension-text'
    import Heading from '@tiptap/extension-heading'
    import Blockquote from '@tiptap/extension-blockquote'
    import HardBreak from '@tiptap/extension-hard-break'
    import HorizontalRule from '@tiptap/extension-horizontal-rule'
    import Image from '@tiptap/extension-image'
    import Link from '@tiptap/extension-link'
    import CodeBlock from '@tiptap/extension-code-block'
    import BulletList from '@tiptap/extension-bullet-list'
    import ListItem from '@tiptap/extension-list-item'

    import Table from '@tiptap/extension-table'
    import TableCell from '@tiptap/extension-table-cell'
    import TableHeader from '@tiptap/extension-table-header'
    import TableRow from '@tiptap/extension-table-row'

    import Bold from '@tiptap/extension-bold'
    import Code from '@tiptap/extension-code'
    import Italic from '@tiptap/extension-italic'
    import Strike from '@tiptap/extension-strike'
    import Underline from '@tiptap/extension-underline'
    import Dropcursor from '@tiptap/extension-dropcursor'
    import Gapcursor from '@tiptap/extension-gapcursor'
    import History from '@tiptap/extension-history'

    import { Plugin, PluginKey } from "@tiptap/pm/state";
    import { getAttributes } from "@tiptap/core";

    import {data_tick_store, contextItemsStore, contextTypesStore, onErrorShowAlert, pushToolsActionsOperations, popToolsActionsOperations, fabHiddenDueToPopup} from '../../stores.js'
    import {informModification, pushChanges} from '../../updates.js'
    import {isDeviceSmallerThan, parseWidthDirective, refreshToolbarOperations, UI} from '../../utils.js'
    import Palette from './internal/palette.svelte'

    import {FaFont, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle, FaInfo, FaImage,
            FaBold, FaItalic, FaUnderline, FaStrikethrough, FaArrowLeft, FaGripLines, FaListUl, FaTable, FaTimes } from 'svelte-icons/fa'

    import IcH1 from './internal/h1.icon.svelte'
    import IcH2 from './internal/h2.icon.svelte'
    import IcH3 from './internal/h3.icon.svelte'
    import IcH4 from './internal/h4.icon.svelte'

    import { Extension } from '@tiptap/core'
    import {Suggestion} from './internal/suggestion'
	import { i18n } from '$lib/i18n.js';

    export let value = '';
    export let placeholder = '';

    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';
    export let compact = false;
    export let onSingleChange: Function|undefined = undefined
    export let onApplyChanges: Function|undefined = undefined;

    export let onFocusCb = undefined;
    export let onBlurCb = undefined;
    export let onAddImage = undefined;
    export let onRemoveImage = undefined
    export let onLinkClick :Function | undefined = undefined

    export let c='';
    export let pushChangesImmediately = true;

    export let chat :object|undefined = undefined;
    export let readOnly = false;

    export let extraFrontPaletteCommands = []
    export let extraBackPaletteCommands = []
    export let extraInsertPaletteCommands = []

    let onFinishEditing = undefined;
    export function run(onStop=undefined)
    {
        onFinishEditing = onStop;
        //editorElement?.focus();
        editor.commands.focus();
    }

    let suggestionRange = undefined;
    export function getFormattingOperations(withCaptions = false)
    {
        let result = [];

        /*if(isDeviceSmallerThan("sm"))
        {
            result = [
                {
                    caption: 'Back to edit',
                    icon: FaArrowLeft,
                    action: (fi) => {editor?.commands.focus();}
                },
                {
                    separator: true
                }
            ]
        }
        */

        paletteCommands.forEach( c => {
            if(c.separator)
            {
                result.push({separator: true})
            }
            else
            {
                result.push({
                    caption: withCaptions ? c.caption : '',
                    icon: c.icon,
                    action: (f) => c.on_choice(suggestionRange),
                    activeFunc: c.is_active,
                    tbr: 'B'
                })
            }
        })

        return result;
    }


    export function getMarksOperations(tbr = 'A')
    {
        let operations = []
        paletteMarksCommands().forEach( c => {
            if(!c.separator)
            {
                operations.push({
                    caption: c.caption,
                    icon: c.icon ?? undefined,
                    action: (f) => c.on_choice(suggestionRange),
                    activeFunc: c.is_active,
                })
            }
        })

        return {
            caption: i18n({en: 'Text', es: 'Texto', pl: 'Tekst'}),
            operations: operations,
            preAction: (f) => { if (editor.isFocused) lockNextBlurCallbacks++ },
            tbr: tbr
        }
    }

    export function getStylesOperations(tbr = 'A')
    {
        let operations = []
        paletteStylesCommands().forEach( c => {
            if(!c.separator)
            {
                operations.push({
                    caption: c.caption,
                    icon: c.icon ?? undefined,
                    action: (f) => c.on_choice(suggestionRange),
                    activeFunc: c.is_active,
                })
            }
        })

        return {
            caption: i18n({en: 'Styles', es: 'Estilos', pl: 'Style'}),
            operations: operations,
            preAction: (f) => { if (editor.isFocused) lockNextBlurCallbacks++ },
            tbr: tbr
        }
    }

    export function getInsertOperations(tbr = 'A')
    {
        let operations = []

        if(extraInsertPaletteCommands && extraInsertPaletteCommands.length > 0)
        {
            extraInsertPaletteCommands.forEach(exc => {
                operations = [...operations, exc]
            })
        }

        paletteInsertCommands().forEach( c => {
            if(!c.separator)
            {
                operations.push({
                    caption: c.caption,
                    icon: c.icon ?? undefined,
                    action: (f) => c.on_choice(suggestionRange),
                    activeFunc: c.is_active,
                })
            }
        })

        return {
            caption: i18n({en: 'Insert', es: 'Insertar', pl: 'Wstaw'}),
            operations: operations,
            preAction: (f) => { if (editor.isFocused) lockNextBlurCallbacks++ },
            tbr: tbr
        }
    }



    export function scrollIntoView(param)
    {
        editorElement.scrollIntoView(param);
    }

    let   item = null;
    let   changedValue = '';
    let   hasChangedValue = false;
    let   additional_class = $$restProps['class'] ?? '';

    let ctx = context ? context : getContext('ctx');
    let cs = parseWidthDirective(c);

    let appearance_class;
    if(compact)
        appearance_class = "";
    else
        appearance_class = `bg-stone-50 border border-stone-300 rounded-md
                            dark:bg-stone-700 dark:border-stone-600
                            px-2.5`;

    let  last_tick = -1;
    let  lockNextBlurCallbacks = 0;

    $: updateAfterUIChanges($data_tick_store)

    function updateAfterUIChanges(...args)
    {
        if(last_tick < $data_tick_store)
        {
            if(hasChangedValue)
                saveData();
            else
                setupSource();
        }
    }

    function setupSource()
    {
        last_tick = $data_tick_store;

        if(a)
        {
            if(self)
                item = self
            else
                item = $contextItemsStore[ctx];

            if(!typename)
                typename = $contextTypesStore[ctx];

            if(item != null)
                value = item[a]
        }

        if(!value)
            value = '<p></p>';

        hasChangedValue = false;

        //if(stored_selection)
        //    set_selection(stored_selection);

    }

    const PalletePlugin = Extension.create({
        name: 'palette',

        addOptions() {
            return {
            suggestion: {
                char: '/',
                decorationTag: 'span',
                decorationClass: 'suggestion',
                startOfLine: false,
                allowSpaces: false,
                //prefixSpace: false,
                allowedPrefixes: null,
                command: ({ editor, range, props }) => {
                props.command({ editor, range })
                },
            },
            }
        },

        addProseMirrorPlugins() {
            return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
            ]
        },
    })

    const suggestion = {
        items: ({ query }) => {

        },

        render: () => {

            return {
            onStart: props => {

                if (!props.clientRect) {
                    return
                }

                if(isDeviceSmallerThan("sm"))
                {
                    lockNextBlurCallbacks++;
                    suggestionRange = props.range;
                    editor.commands.blur();
                    //setTimeout(() => UI.fab?.activateMainOperation(), 100)
                    palette.set_current_editor_range(props.range)
                    const cursorRect = props.clientRect();
                    palette.filter('');
                    setTimeout(() => show_command_palette(cursorRect), 100)
                }
                else
                {
                    const cursorRect = props.clientRect();
                    show_command_palette(cursorRect);
                    palette.set_current_editor_range(props.range)
                    palette.filter('');
                }
            },

            onUpdate(props) {
                if(is_command_palette_visible)
                {
                    //console.log('decorationNode', props.decorationNode, props.text)
                    palette.set_current_editor_range(props.range)
                    palette.filter(props.query);
                }

            },

            onKeyDown(props) {

                if(is_command_palette_visible)
                {
                    palette.set_current_editor_range(props.range)
                    switch(props.event.key)
                    {
                    case 'Escape':
                        palette.hide();
                        return true;

                    case 'ArrowUp':
                        palette.navigate_up();
                        return true;

                    case 'ArrowDown':
                        palette.navigate_down();
                        return true;

                    case 'Enter':
                        palette.execute_selected_command();
                        return true;
                    }
                }

                return false;
            },

            onExit() {
                //console.log('onExit')
                if(is_command_palette_visible)
                    palette.hide();
            },
            }
        },
        }

    let editorElement;
	let editor;

    const codeBlockClass = 'ml-6 text-sm font-mono break-normal text-pink-700 dark:text-pink-600'
    const _CodeBlock = Paragraph.extend({
        name: 'CodeBlock',
        priority: 999,
        addAttributes() {
            return {
                class: {
                    default: codeBlockClass,
                }
            }
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', {class: codeBlockClass}, 0]
        },

        parseHTML() {
            return [
                    {
                        tag: 'p',
                        getAttrs: node => node.className === codeBlockClass && null,
                        priority: 51

                    }
            ]
        },

        addCommands() {
            return {
                setAsCode: () => ({ commands }) => {
                    return commands.setNode(this.name)
                },
            }
        }
    })

    const commentBlockClass = 'ml-6 text-sm italic text-lime-700 dark:text-lime-600'
    const CommentBlock = Paragraph.extend({
        name: 'CommentBlock',
        priority: 999,
        addAttributes() {
            return {
                class: {
                    default: commentBlockClass,
                }
            }
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', {class: commentBlockClass}, 0]
        },

        parseHTML() {
            return [
                    {
                        tag: 'p',
                        getAttrs: node => node.className === commentBlockClass && null,
                        priority: 51

                    }
            ]
        },

        addCommands() {
            return {
                setAsComment: () => ({ commands }) => {
                    return commands.setNode(this.name)
                },
            }
        }
    })

    const warnBlockClass = 'ml-6 px-3 py-1 border-l-2 rounded-md border-orange-500 bg-orange-100 dark:bg-orange-900'
    const WarningBlock = Paragraph.extend({
        name: 'WarningBlock',
        priority: 999,
        addAttributes() {
            return {
                class: {
                    default: warnBlockClass,
                }
            }
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', {class: warnBlockClass}, 0]
        },

        parseHTML() {
            return [
                    {
                        tag: 'p',
                        getAttrs: node => node.className === warnBlockClass && null,
                        priority: 51

                    }
            ]
        },

        addCommands() {
            return {
                setAsWarning: () => ({ commands }) => {
                    return commands.setNode(this.name)
                },
            }
        }
    })

    const infoBlockClass = 'ml-6 px-3 py-1 border-l-2 rounded-md border-blue-500 bg-blue-100 dark:bg-blue-900'
    const InfoBlock = Paragraph.extend({
        name: 'InfoBlock',
        priority: 999,
        addAttributes() {
            return {
                class: {
                    default: infoBlockClass,
                }
            }
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', {class: infoBlockClass}, 0]
        },

        parseHTML() {
            return [
                    {
                        tag: 'p',
                        getAttrs: node => node.className === infoBlockClass && null,
                        priority: 51

                    }
            ]
        },

        addCommands() {
            return {
                setAsInfo: () => ({ commands }) => {
                    return commands.setNode(this.name)
                },
            }
        }
    })

    const QuoteBlock = Paragraph.extend({
        name: 'QuoteBlock',
        priority: 998,

        renderHTML({ HTMLAttributes }) {
            return ['blockquote', HTMLAttributes, 0]
        },

        parseHTML() {
            return [
                    {
                        tag: 'blockquote',
                        priority: 51
                    }
            ]
        },

        addCommands() {
            return {
                setAsQuote: () => ({ commands }) => {
                    return commands.setNode(this.name)
                },
            }
        }
    })

    /*function prepareFullImagePath(url)
    {
        if (!url.startsWith('/json/'))
        {
            const apiVer = $session.configuration.api_version ?? 'anyv'

            if (url.startsWith('/'))
                url = `/json/${apiVer}${url}`;
            else
                url = `/json/${apiVer}/${url}`;
        }

        let fullPath = "";
        let absolute_pattern = /^https?:\/\//i;
        if (!absolute_pattern.test(url)) {
            fullPath = $session.apiAddress;
            if (fullPath.endsWith('/')) {
                if (url.startsWith('/'))
                    fullPath = fullPath + url.substr(1);
                else
                    fullPath = fullPath + url;
            }
            else {
                if (url.startsWith('/'))
                    fullPath = fullPath + url;
                else
                    fullPath = fullPath + '/' + url;
            }
        }
        else
            fullPath = url;



        if($session.tenants.length > 0)
        {
            const currentGroupInfo = $session.tenants.find(t => t.id == $session.tid)
            if(currentGroupInfo && currentGroupInfo.headers && currentGroupInfo.headers.length > 0)
            {

                const paramsNo = currentGroupInfo.headers.length
                for(let i=0; i<paramsNo; i++)
                {
                    const param = currentGroupInfo.headers[i]
                    if(i==0)
                    {
                        if(fullPath.includes('?'))     // has other params
                        {
                            fullPath += '&'
                        }
                        else
                        {
                            fullPath += '?'
                        }
                    }
                    else
                        fullPath += '&';

                    fullPath += param.key.toLowerCase()
                    fullPath += '=' + param.value;
                }
            }
        }
        else
        {
            const user = $session.localDevCurrentUser;
            if (user)
            {
                if(fullPath.includes('?'))     // has other params
                {
                    fullPath += '&'
                }
                else
                {
                    fullPath += '?'
                }

                if(user.uid > 0)
                    fullPath += 'x-reef-user-id=' + user.uid
                else
                    fullPath += 'x-reef-as-user=' + user.username

                if(user.role)
                    fullPath += '&x-reef-access-role=' + user.role

                if(user.groupId)
                    fullPath += '&x-reef-group-id=' + user.groupId
            }
        }

        return fullPath;
    }
    */

    let downloadedImages = []

    const CrossImage = Image.extend({
        addAttributes() {
            return {
                //crossorigin: {
                //    default: 'use-credentials'
                //},

                loading: {
                    default: 'lazy'
                },

                dataPath: {
                    default: null,
                    parseHTML: (element) =>
                    {
                        return element.getAttribute('data-path')
                    },

                    renderHTML: (attributes) => {
                        const dataPath = attributes.dataPath;
                        if(dataPath)
                        {
                            let src = '';
                            let found = downloadedImages.find(e => e.dataPath == dataPath)
                            if(found)
                            {
                                if(found.url)
                                    src = found.url;
                            }
                            else
                            {
                                const newEntry = {
                                    dataPath: dataPath,
                                    url: ''
                                }

                                downloadedImages.push(newEntry)

                                reef.fetch(`/json/anyv/${dataPath}`).then( (res) => {
                                    if(res.ok)
                                    {
                                        res.blob().then( blob => {
                                            newEntry.url = URL.createObjectURL(blob);
                                            //console.log('image loaded: ', dataPath, newEntry.url)

                                            editorElement?.querySelectorAll('img').forEach( img => {
                                                if(img.getAttribute('data-path') == dataPath)
                                                    img.src = newEntry.url
                                            })
                                        })
                                    }
                                    else
                                    {
                                        res.text().then( err => onErrorShowAlert(err))
                                    }
                                },

                                (err) => {
                                    onErrorShowAlert(err)
                                })
                            }

                            return {
                                'data-path': dataPath,
                            //    src: prepareFullImagePath(dataPath)
                           //      src: 'http://localhost/_hd_force_img_error'
                                src: src
                            }
                        }
                        else
                        {
                            return {

                            }
                        }
                    }
                },

                temporary: {
                    default: '',
                    parseHTML: (element) =>
                    {
                        return element.getAttribute('temporary')
                    },
                    renderHTML: (attributes) => {
                            const temporary = attributes.temporary;
                            if(temporary)
                            {
                                return {
                                    temporary: temporary,
                                    src: temporary
                                }
                            }
                            else
                                return {
                        }
                    }
                }
            }
        }
    })

    const chatShortcuts = Extension.create({
        name: 'chatShortcuts',
        addKeyboardShortcuts() {
            return {
                Enter: () => {

                    if(chat && chat.onSubmit)
                        chat.onSubmit(changedValue)

                    return this.editor.commands.clearContent();
                },

                'Shift-Enter': () => {
                    console.log('chatShortcut Shift-Enter')
                    /**
                     * currently we do not have an option to show a soft line break in the posts, so we overwrite
                     * the behavior from tiptap with the default behavior on pressing enter
                     */
                    return this.editor.commands.first(({commands}) => [
                        () => commands.newlineInCode(),
                        () => commands.createParagraphNear(),
                        () => commands.liftEmptyBlock(),
                        () => commands.splitBlock(),
                    ]);
                }
            }
        }
    })

    const additionalShortcuts = Extension.create({
        name: 'additionalShortcuts',
        addKeyboardShortcuts() {
            return {
                'Mod-s': () => {
                    console.log('todo: save content')
                }
            }
        }
    })

    interface CustomLinkOptions 
    {
        //showMap: (val: boolean) => void;
        //setMapQuery: (val: string) => void;
    }

    export const CustomLink = Link.extend<CustomLinkOptions>({
        addOptions() {
            return {
            ...this.parent?.(),
            openOnClick: false,
            //showMap: () => {},
            //setMapQuery: () => {},
            };
        },

        addProseMirrorPlugins() {
            const plugins: Plugin[] = this.parent?.() || [];
            const extensionOptions = this.options;

            const clickHandler = new Plugin({
            key: new PluginKey("handleControlClick"),
            props: {
                handleClick(view, pos, event) {
                    if (event.button !== 0) {
                        return false
                    }
                    
                    if (!view.editable) {
                        return false
                    }

                    const attrs = getAttributes(view.state, "link");
                    const link = (event.target as HTMLElement)?.closest("a");
                    
                    if (link && attrs.href) {
                        event.preventDefault();
                        event.stopPropagation();

                        if(onLinkClick)
                            onLinkClick(attrs.href, attrs.target)
                        //window.open(attrs.href, attrs.target);
                        return true;
                    }
                    return false;
                },
            },
            });

            plugins.push(clickHandler);

            return plugins;
        },
    });

    onMount(() => {
		editor = new Editor({
            editable: !readOnly,
            editorProps: {
                attributes: {
                    class: `${cs} ${appearance_class} prose prose-base sm:prose-base dark:prose-invert ${additional_class}  whitespace-pre-wrap focus:outline-none`,
                },
            },
			element: editorElement,
			extensions: [
                Document,
                Paragraph,
                Text,
                Heading.configure({
                    levels: [1, 2, 3, 4],
                }),
                /*Image.configure({
                    HTMLAttributes: {
                        crossorigin: 'use-credentials'
                    }
                }),*/
                CrossImage,
                HardBreak,
                HorizontalRule,
                BulletList,
                ListItem,

                Table.configure({
                    resizable: true,
                }),
                TableRow,
                TableHeader,
                TableCell,

                // custom
                CodeBlock,
                //CommentBlock,
                //WarningBlock,
                //InfoBlock,
                QuoteBlock,

                Bold,
                Code,
                Italic,
                Strike,
                Underline,
                ... onLinkClick ? [
                        CustomLink.configure( {
                            //showMap: () => { showMap(true); },
                        })] :
                    [Link],

                Dropcursor,
                Gapcursor,
                History,

                ... chat ? [chatShortcuts] : [],

                PalletePlugin.configure({
                    suggestion,
                }),
            ],
			content: value,
            injectCSS: false,
			onTransaction({ editor, transaction }) {
                const wasContentChanged = transaction.steps.length > 0
                if(wasContentChanged)
                {
                    hasChangedValue = true;
                    changedValue = editor.getHTML()

                    if(onSingleChange)
                        onSingleChange(changedValue)
                    else
                        logChanges()

                    handleImagesChanges(transaction)
                }
                refreshToolbarOperations()
			},
            onFocus({ editor, event }) {
                // The editor is focused.
                on_focus();
                if(onFocusCb)
                    onFocusCb();
            },
            onBlur({ editor, event }) {
                // The editor isn’t focused anymore.
                if(lockNextBlurCallbacks > 0)
                {
                    lockNextBlurCallbacks--;
                }
                else
                {
                    on_blur();
                    if(onBlurCb)
                        onBlurCb();
                }
            },
            onContentError({ editor, error, disableCollaboration }) {
                // The editor content does not match the schema.
                console.log('editor content error:', error)
            },
            onUpdate({editor}) {
                //setupImgErrorHandlers()
            }
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}

        if(is_command_palette_visible)
            palette.hide();
	});

    /* afterUpdate( () =>
    {
        setupImgErrorHandlers()
    })

    function setupImgErrorHandlers()
    {
        editorElement.querySelectorAll('img').forEach( img =>
            {
                const dataPath = img.getAttribute('data-path')
                if(dataPath)
                {
                    img.onerror = onImgError
                }
            }
        )
    }

    const onImgError = async (e) => {
        const img = e.target;
        if(img.src.endsWith('/_hd_force_img_error'))
        {
            const dataPath = img.getAttribute('data-path')
            if(dataPath)
            {
                const res = await reef.fetch(`json/anyv/${dataPath}`)
                if(res.ok)
                {
                    const blob = await res.blob()
                    img.src = URL.createObjectURL(blob)
                }
            }
            //    img.src = prepareFullImagePath(dataPath)
        }
    } */

    const isAutoSaveEnabled = false;
    let autoSaveTimerId = 0;
    function on_focus()
    {
        if(isAutoSaveEnabled)
        {
            autoSaveTimerId = setInterval(() =>
            {
                if(hasChangedValue)
                    saveData();
            },
            10000);
        }
    }

    function on_blur()
    {
        if(autoSaveTimerId)
        {
            clearInterval(autoSaveTimerId)
            autoSaveTimerId = 0;
        }

        if(onFinishEditing)
        {
            onFinishEditing();
            onFinishEditing = undefined
        }

        if(saveData())
        {
            last_tick = $data_tick_store + 1;
            $data_tick_store = last_tick;
        }
    }

    export async function save()
    {
        if(saveData())
        {
            last_tick = $data_tick_store + 1;
            $data_tick_store = last_tick;
        }
    }

    function saveData()
    {
        if(!hasChangedValue)
            return false;

        hasChangedValue = false;

        //console.log('editor: saveData')

        if(onApplyChanges)
        {
            onApplyChanges(changedValue)
            return true;
        }
        else  if(item && a)
        {
            logChanges()
            if(pushChangesImmediately)
                pushChanges(refreshToolbarOperations);
            return true;
        }

        return false;
    }

    function logChanges()
    {
        item[a] = changedValue;
        //value = changed_value;

        if(typename)
            informModification(item, a, typename);
        else
            informModification(item, a);
    }

    // =========================================== Palette ===========================================================================
    let palette = null;
    let is_command_palette_visible = false;

    function get_selection_bbox()
    {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        const rect = range.getBoundingClientRect();
        return rect;
    }

    function get_window_box()
    {
        let client_rect = new DOMRect;
        client_rect.x = 0;
        client_rect.y = 0;
        client_rect.width = window.innerWidth;
        client_rect.height = window.innerHeight;
        return client_rect;
    }

    function on_palette_mouse_click()
    {
        //restore_previous_text_and_position();
    }

    function on_palette_shown()
    {
        is_command_palette_visible = true;

        if(isDeviceSmallerThan("sm"))
        {
            $fabHiddenDueToPopup = true
            /*pushToolsActionsOperations({
                opver: 1,
                operations: [
                    {
                        caption: 'Palette',
                        operations: [
                            {
                                icon: FaTimes,
                                action: (f) => { palette.hide(); editor?.commands.focus() },
                                fab: 'M00',
                                tbr: 'A'
                            }
                        ]
                    }
                ]
            })*/
        }

    }

    function on_palette_hidden()
    {
        if(is_command_palette_visible)
        {
            $fabHiddenDueToPopup = false
            //popToolsActionsOperations()
        }

        editor?.commands.focus()

        is_command_palette_visible = false;

        //clear_previous_text_and_position();
    }

    function show_command_palette(cursor_rect)
    {
        let client_rect = get_window_box();

        if(isDeviceSmallerThan("sm"))
            show_small_command_palette(client_rect)
        else
            show_big_command_palette(cursor_rect, client_rect)
    }

    function show_small_command_palette(client_rect)
    {
        //palette.max_height_px = client_rect.height - 64;
        //palette.width_px = client_rect.width - 96;
        //let x=64, y=32;
        //let show_above = false;

        const margin = 5

        palette.max_height_px = client_rect.height / 2 - margin;
        palette.width_px = client_rect.width - 2*margin;
        let x=margin;
        let y = client_rect.bottom - margin;
        let show_above = true;

        palette.show(x, y, show_above);
    }

    function show_big_command_palette(cursor_rect, client_rect)
    {
        //editor.commands.blur();
        //return;
        let rect = cursor_rect; //get_selection_bbox();

        let top_space = rect.y;
        let bottom_space = client_rect.height - (rect.y + rect.height);
        //console.log('cu:', rect, ' cl:', client_rect)

        palette.max_height_px = 500;
        palette.width_px = 200;

        let preferred_palette_height = palette.max_height_px;
        let preferred_palette_width = palette.width_px;

        let x=0, y=0;
        let show_above = false;
        let show_fullscreen = false;

        if(client_rect.width < preferred_palette_width)
            show_fullscreen = true;
        else if(rect.x + preferred_palette_width > client_rect.width)
            x = client_rect.width - preferred_palette_width;
        else
            x = rect.x;

        if(client_rect.height < preferred_palette_height)
            show_fullscreen = true;
        else if(bottom_space >= preferred_palette_height)
            y = rect.y + rect.height;
        else if(top_space >= preferred_palette_height)
        {
            y = rect.y;
            show_above = true;
        }
        else if(rect.x  > preferred_palette_width)
        {
            // left side of cursor
            x = rect.x - preferred_palette_width - 5
            y = rect.y - (preferred_palette_height - bottom_space)
        }
        else if(rect.x + preferred_palette_width < client_rect.width)
        {
            // right side of cursor
            x = rect.x + 5;
            y = rect.y - (preferred_palette_height - bottom_space)
        }
        else
            show_fullscreen = true;

        const isSmallDevice = isDeviceSmallerThan("sm")
        if(isSmallDevice)
        {
            palette.showAsToolbox(rect)
        }
        else if(show_fullscreen)
            palette.show_fullscreen(client_rect.width, client_rect.height);
        else
            palette.show(x, y, show_above);
    }

    export function addTemporaryImage(src)
    {
        editor.commands.insertContent({
            type: 'image',
            attrs: {
                src: '',
                temporary: src
            }
        })
    }

    export function replaceTemporaryImage(temporarySrc, dataPath)
    {
        const image = editor.$node('image', {temporary: temporarySrc})
        if(!image)
            return;

        image.setAttribute({
            dataPath: dataPath,
            src: '',
            temporary: ''
        })
    }

    export function removeTemporaryImage(temporarySrc)
    {
        const image = editor.$node('image', {temporary: temporarySrc})
        if(!image)
            return;

        editor.commands.deleteRange(image.range)
    }

    export function addLink(title, href)
    {
        editor
        .chain()
        .setLink({ href })
        .insertContent(title)
        .unsetMark("link")
        .insertContent(' ')
        .focus()
        .run();
    }

    export function getInnerHtml()
    {
        return editor.getHTML();
    }

    export function setInnerHtml(content)
    {
        editor.commands.SetContent(content)
    }

    async function onAddedImageReady(dataPath)
    {
        //const imgFullPath = prepareFullImagePath(dataPath)
        editor.commands.insertContent({
                type: 'image',
                attrs: {
                    src: '',
                    dataPath: dataPath
                },
            })
        /*

        const res = await reef.fetch(`json/anyv/${dataPath}`)
        if(res.ok)
        {
            const blob = await res.blob()
            const src = URL.createObjectURL(blob)

            editor.commands.insertContent({
                type: 'image',
                attrs: {
                    src: src,
                    dataPath: dataPath
                },
            })
        }
        else
        {
            editor.commands.insertContent({
                type: 'image',
                attrs: {
                    src: 'file://_hd_force_img_error',
                    dataPath: dataPath
                },
            })
        }
        */

    }

    function handleImagesChanges(transaction)
    {
        const getImageSrcs = (fragment) => {
            let srcs = new Set();
            fragment.forEach((node) => {
                if (node.type.name === 'image') {
                    if(node.attrs.dataPath)
                        srcs.add(node.attrs.dataPath);
                    else if (node.attrs.temporary)
                        srcs.add(node.attrs.temporary);
                }
            });
                return srcs;
        };

        let currentSrcs = getImageSrcs(transaction.doc.content);
        let previousSrcs = getImageSrcs(transaction.before.content);

        if (currentSrcs.size === 0 && previousSrcs.size === 0) {
            return;
        }

        // Determine which images were deleted
        let deletedImageSrcs = [...previousSrcs].filter((src) => !currentSrcs.has(src));

        if(onRemoveImage)
            deletedImageSrcs.forEach( src => onRemoveImage(src))


    }


    // ================================================================================================================================

    export function setBold()
    {
        makeBold(suggestionRange)
    }

    export function setItalic()
    {
        makeItalic(suggestionRange)
    }

    export function setUnderline()
    {
        makeUnderline(suggestionRange)
    }

    export function setStrikethrough()
    {
        makeStrikethrough(suggestionRange)
    }

    export function setNormal()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).setParagraph().run();
        else
            editor.chain().focus().setParagraph().run()
    }

    export function setHeading(level)
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).setHeading({level: level}).run();
        else
            editor.chain().focus().setHeading({ level: level }).run()
    }


    export function setCode()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).setCodeBlock().run();
        else
            editor.chain().focus().setCodeBlock().run()
    }

    export function setComment()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).setAsComment().run();
        else
            editor.chain().focus().setAsComment().run()
    }

    export function setQuote()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).setAsQuote().run();
        else
            editor.chain().focus().setAsQuote().run()
    }

    export function setWarning()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).setAsWarning().run();
        else
            editor.chain().focus().setAsWarning().run()
    }

    export function setInfo()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).setAsInfo().run();
        else
            editor.chain().focus().setAsInfo().run()
    }

    export function setBulletList()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).toggleBulletList().run();
        else
            editor.chain().focus().toggleBulletList().run()
    }

    export function setImage()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).run();

        if(onAddImage)
            onAddImage(onAddedImageReady);
    }

    export function setTable()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).insertTable().run();
        else
            editor.chain().focus().insertTable().run()
    }

    export function setHorizontalRule()
    {
        if(suggestionRange)
            editor.chain().focus().deleteRange(suggestionRange).setHorizontalRule().run();
        else
            editor.chain().focus().setHorizontalRule().run();
    }

    export function isActiveBold()
    {
        return editor?.isActive('bold')
    }

    export function isActiveItalic()
    {
        return editor?.isActive('italic')
    }

    export function isActiveUnderlie()
    {
        return editor?.isActive('underline')
    }

    export function isActiveStrikethrough()
    {
        return editor?.isActive('strike')
    }

    export function isActiveNormal()
    {
        return editor?.isActive('paragraph')
    }

    export function isActiveHeading(level)
    {
        return editor?.isActive('heading', {level: level})
    }

    export function isActiveH1()
    {
        return editor?.isActive('heading', {level: 1})
    }

    export function isActiveH2()
    {
        return editor?.isActive('heading', {level: 2})
    }

    export function isActiveH3()
    {
        return editor?.isActive('heading', {level: 3})
    }

    export function isActiveH4()
    {
        return editor?.isActive('heading', {level: 4})
    }

    export function isActiveCode()
    {
        return editor?.isActive('CodeBlock')
    }

    export function isActiveComment()
    {
        return  editor?.isActive('CommentBlock')
    }

    export function isActiveQuote()
    {
        return editor?.isActive('QuoteBlock')
    }

    export function isActiveWarning()
    {
        return editor?.isActive('WarningBlock')
    }

    export function isActiveInfo()
    {
        return editor?.isActive('InfoBlock')
    }

    export function isActiveBulletList()
    {
        return editor?.isActive('bulletList')
    }

    export function isActiveImage()
    {
        return false
    }

    export function isActiveTable()
    {
        editor?.isActive('table')
    }

    export function isActiveHorizontalRule()
    {
        return false
    }

    export function preventBlur()
    {
        if(editor.isFocused)
            lockNextBlurCallbacks++;
    }

    export function hasChanged()
    {
        return hasChangedValue
    }


    const paletteMarksCommands = () => [
        {    caption: i18n({en: 'Bold', es: 'Negrita', pl: 'Pogrubiony'}),              description: 'Marks text as bolded',            tags: 'strong,bold', icon: FaBold,                       on_choice: makeBold,            is_active: () => editor?.isActive('bold')  },
        {    caption: i18n({en: 'Italic', es: 'Cursiva', pl: 'Kursywa'}),               description: 'Marks text as italic',            tags: 'italic,em',  icon: FaItalic,                     on_choice: makeItalic,          is_active: () => editor?.isActive('italic')  },
        {    caption: i18n({en: 'Underline', es: 'Subrayar', pl: 'Podkreślenie'}),      description: 'Marks text as underlined',        tags: 'under', icon: FaUnderline,                  on_choice: makeUnderline,       is_active: () => editor?.isActive('underline')    },
        {    caption: i18n({en: 'Strikethrough', es: 'Tachado', pl: 'Przekreślenie'}),  description: 'Marks text as strikethrough',     tags: 'strike', icon: FaStrikethrough,              on_choice: makeStrikethrough,   is_active: () => editor?.isActive('strike')},
    ]

    const paletteStylesCommands = () => [
        {   caption: i18n({en: 'Heading 1', es: 'Título 1', pl: 'Nagłówek 1'}),      description: 'Description heading',           tags: 'h1,head',      icon: IcH1,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 1}).run(); else editor.chain().focus().setHeading({ level: 1 }).run() },   is_active: () => editor?.isActive('heading', {level: 1})  } ,
        {   caption: i18n({en: 'Heading 2', es: 'Título 2', pl: 'Nagłówek 2'}),      description: 'Secondary heading',             tags: 'h2,head',      icon: IcH2,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 2}).run(); else editor.chain().focus().setHeading({ level: 2 }).run() },   is_active: () => editor?.isActive('heading', {level: 2}) } ,
        {   caption: i18n({en: 'Heading 3', es: 'Título 3', pl: 'Nagłówek 3'}),      description: 'Secondary heading',             tags: 'h3,head',      icon: IcH3,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 3}).run(); else editor.chain().focus().setHeading({ level: 3 }).run() },   is_active: () => editor?.isActive('heading', {level: 3}) } ,
        {   caption: i18n({en: 'Heading 4', es: 'Título 4', pl: 'Nagłówek 4'}),      description: 'Secondary heading',             tags: 'h4,head',      icon: IcH4,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 4}).run(); else editor.chain().focus().setHeading({ level: 4 }).run() },   is_active: () => editor?.isActive('heading', {level: 4}) } ,

        {   caption: i18n({en: 'Normal', es: 'Normal', pl: 'Normalny'}),             description: 'This is normal text style',      tags: 'paragraph,text,normal',    icon: FaRemoveFormat,               on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setParagraph().run(); else editor.chain().focus().setParagraph().run() },  is_active: () => editor?.isActive('paragraph')  } ,

        {   caption: i18n({en: 'Code', es: 'Código', pl: 'Kod'}),         description: 'Source code monospace text',               tags: 'code',       icon: FaCode,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setCodeBlock().run(); else editor.chain().focus().setCodeBlock().run() }, is_active: () => editor?.isActive('CodeBlock') },
    //    {   caption: 'Comment',      description: 'With this you can comment the above paragraph',   icon: FaComment,                    on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsComment().run(); else editor.chain().focus().setAsComment().run() }, is_active: () => editor?.isActive('CommentBlock')  } ,
        {   caption: i18n({en: 'Quote', es: 'Cita', pl: 'Cytat'}),        description: 'To quote someone',                         tags: 'quote',       icon: FaQuoteRight,                 on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsQuote().run(); else editor.chain().focus().setAsQuote().run() }, is_active: () => editor?.isActive('QuoteBlock')  } ,
    //    {   caption: 'Warning',      description: 'An important warning to above paragraph',         icon: FaExclamationTriangle,        on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsWarning().run(); else editor.chain().focus().setAsWarning().run() }, is_active: () => editor?.isActive('WarningBlock')  } ,
    //    {   caption: 'Info',         description: 'An important info about above paragraph',         icon: FaInfo,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsInfo().run(); else editor.chain().focus().setAsInfo().run() }, is_active: () => editor?.isActive('InfoBlock')  },
        {   caption: i18n({en: 'BulletList', es: 'Lista con viñetas', pl: 'Lista punktowana'}),  description: 'Unordered list of items',   tags: 'bullet', icon: FaListUl,                     on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).toggleBulletList().run(); else editor.chain().focus().toggleBulletList().run() }, is_active: () => editor?.isActive('bulletList')  },
    ]

    const paletteInsertCommands = () => [
        {   caption: i18n({en: 'Image', es: 'Imagen', pl: 'Obraz'}),        description: 'Add image to document',           tags:'img,picture',      icon: FaImage,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).run(); if(onAddImage) onAddImage(onAddedImageReady);  } } ,
        {   caption: i18n({en: 'Table', es: 'Tabla', pl: 'Tabela'}),        description: 'Table',                           tags: 'table',          icon: FaTable,                      on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).insertTable().run(); else editor.chain().focus().insertTable().run() }, is_active: () => editor?.isActive('table')  },
        {   caption: i18n({en: 'Horizontal rule', es: 'Regla horizontal', pl: 'Pozioma linia'}), description: 'Add horizonal role',           tags: 'hr,line',  icon: FaGripLines,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHorizontalRule().run(); else editor.chain().focus().setHorizontalRule().run();  } }
    ]

    const paletteCommands  = [

                {    caption: i18n({en: 'Styles', es: 'Estilos', pl: 'Style'}),       
                    separator: true },
                ...paletteStylesCommands(),

                {    caption: i18n({en: 'Text', es: 'Texto', pl: 'Tekst'}),         
                    separator: true },
                ...paletteMarksCommands(),

                {   caption: i18n({en: 'Insert', es: 'Insertar', pl: 'Wstaw'}),        
                    separator: true },
                ...paletteInsertCommands()
            ];

    function makeBold(range)
    {
        if(range)
        {
            editor.chain().focus().deleteRange(range).toggleBold().run()
        }
        else
        {
            editor.chain().focus().toggleBold().run()
        }
    }

    function makeItalic(range)
    {
        if(range)
        {
            editor.chain().focus().deleteRange(range).toggleItalic().run()
        }
        else
        {
            editor.chain().focus().toggleItalic().run()
        }
    }

    function makeUnderline(range)
    {
        if(range)
        {
            editor.chain().focus().deleteRange(range).toggleUnderline().run()
        }
        else
        {
            editor.chain().focus().toggleUnderline().run()
        }
    }

    function makeStrikethrough(range)
    {
        if(range)
        {
            editor.chain().focus().deleteRange(range).toggleStrike().run()
        }
        else
        {
            editor.chain().focus().toggleStrike().run()
        }
    }

    function getPaletteCommands()
    {
        let commands = [];
        if(extraFrontPaletteCommands && extraFrontPaletteCommands.length > 0)
        {
            extraFrontPaletteCommands.forEach(exc => {
                commands.push({
                    caption: exc.caption,
                    description: exc.description,
                    tags: exc.tags,
                    icon: exc.icon,
                    on_choice: (range) =>
                        {
                            if(range)
                                editor.chain().focus().deleteRange(range).run();

                            let stayFocused = false
                            if(exc.action)
                                stayFocused = exc.action();

                            if(!stayFocused)
                                editor.commands.blur()
                        },
                    is_active: () => {
                        if(exc.is_active)
                            return exc.is_active()
                        else
                            return false;
                    }
                })
            })

            commands.push({ separator: true})
        }

        commands = [...commands, { caption: i18n({en: 'Styles', es: 'Estilos', pl: 'Style'}),   separator: true }]
        commands = [...commands, ...paletteStylesCommands()]

        commands = [...commands, { caption: i18n({en: 'Text', es: 'Texto', pl: 'Tekst'}),     separator: true }]
        commands = [...commands, ...paletteMarksCommands()]
        

        commands = [...commands, {   caption: i18n({en: 'Insert', es: 'Insertar', pl: 'Wstaw'}),  separator: true }]
        if(extraInsertPaletteCommands && extraInsertPaletteCommands.length > 0)
        {
            extraInsertPaletteCommands.forEach(exc => {
                commands.push({
                    caption: exc.caption,
                    description: exc.description,
                    tags: exc.tags,
                    icon: exc.icon,
                    on_choice: (range) =>
                        {
                            if(range)
                                editor.chain().focus().deleteRange(range).run();

                            let stayFocused = false
                            if(exc.action)
                                stayFocused = exc.action();

                            if(!stayFocused)
                                editor.commands.blur()
                        },
                    is_active: () => {
                        if(exc.is_active)
                            return exc.is_active()
                        else
                            return false;
                    }
                })
            })
        }

        commands = [...commands, ...paletteInsertCommands()]

        if(extraBackPaletteCommands && extraBackPaletteCommands.length > 0)
        {
            commands.push({ separator: true})

            extraBackPaletteCommands.forEach(exc => {
                commands.push({
                    caption: exc.caption,
                    description: exc.description,
                    tags: exc.tags,
                    icon: exc.icon,
                    on_choice: (range) =>
                        {
                            if(range)
                                editor.chain().focus().deleteRange(range).run();

                            let stayFocused = false
                            if(exc.action)
                                stayFocused = exc.action();

                            if(!stayFocused)
                                editor.commands.blur()
                        },
                    is_active: () => {
                        if(exc.is_active)
                            return exc.is_active()
                        else
                            return false;
                    }
                })
            })
        }

        return commands;
    }


</script>



<div bind:this={editorElement} />

<Palette    commands={getPaletteCommands()}
            bind:this={palette}
            on:palette_shown={on_palette_shown}
            on:palette_hidden={on_palette_hidden}
            on:palette_mouse_click={on_palette_mouse_click}/>

<!--div    contenteditable="true"
        bind:this={editorElement}
        on:keyup={on_keyup}
        on:keydown={on_keydown}
        on:mouseup={on_mouseup}
        class="{cs}     {appearance_class}
                        prose prose-base sm:prose-base dark:prose-invert {additional_class} overflow-y-auto whitespace-pre-wrap"
        on:blur={on_blur}
        on:focus={on_focus}
        on:focus
        on:blur
        >
   {@html value}
</div-->
