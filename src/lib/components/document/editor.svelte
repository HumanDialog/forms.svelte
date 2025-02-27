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
    
    import {data_tick_store, contextItemsStore, contextTypesStore, onErrorShowAlert} from '../../stores.js'
    import {informModification, pushChanges} from '../../updates.js'
    import {isDeviceSmallerThan, parseWidthDirective, refreshToolbarOperations, UI} from '../../utils.js'
    import Palette from './internal/palette.svelte'

    import {FaFont, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle, FaInfo, FaImage,
            FaBold, FaItalic, FaUnderline, FaStrikethrough, FaArrowLeft, FaGripLines, FaListUl, FaTable } from 'svelte-icons/fa'
            
    import IcH1 from './internal/h1.icon.svelte'
    import IcH2 from './internal/h2.icon.svelte'
    import IcH3 from './internal/h3.icon.svelte'
    import IcH4 from './internal/h4.icon.svelte'

    import { Extension } from '@tiptap/core'
    import {Suggestion} from './internal/suggestion'
	
    export let value = '';
    export let placeholder = '';
    
    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';
    export let compact = false;

    export let onFocusCb = undefined;
    export let onBlurCb = undefined;
    export let onAddImage = undefined;
    export let onRemoveImage = undefined

    export let c='';
    export let pushChangesImmediately = true;

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

        if(isDeviceSmallerThan("sm"))
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

        commands.forEach( c => {
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
                    activeFunc: c.is_active
                })
            }
        })
        
        return result;
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
                    const cursorRect = props.clientRect();
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
                    parseHTML: (element) => {  return element.getAttribute('data-path') },
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
                                            console.log('image loaded: ', dataPath, newEntry.url)

                                            editorElement.querySelectorAll('img').forEach( img => {
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
                }
            }
        }
    })

    onMount(() => {
		editor = new Editor({
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
                CommentBlock,
                WarningBlock,
                InfoBlock,
                QuoteBlock,

                Bold,
                Code,
                Italic,
                Strike,
                Underline,
                Link,

                Dropcursor,
                Gapcursor,
                History,

                PalletePlugin.configure({
                    suggestion,
                }),
            ],
			content: value,
            injectCSS: false,
			onTransaction({ editor, transaction }) {
				hasChangedValue = true;
                changedValue = editor.getHTML()
                handleImagesChanges(transaction)
                refreshToolbarOperations()
			},
            onFocus({ editor, event }) {
                // The editor is focused.
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

    function on_blur()
    {
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

    export function save()
    {
        if(saveData())
        {
            last_tick = $data_tick_store + 1;
            $data_tick_store = last_tick;
        }
    }

    function saveData()
    {
        if(item && a && hasChangedValue)
        {
            item[a] = changedValue;
            //value = changed_value;
            hasChangedValue = false;

            if(typename)
                informModification(item, a, typename);
            else
                informModification(item, a);
            
            if(pushChangesImmediately)
                pushChanges();

            return true;
        }
        return false;
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
    }

    function on_palette_hidden()
    {
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
        palette.max_height_px = client_rect.height - 64;
        palette.width_px = client_rect.width - 96;
        let x=64, y=32;
        let show_above = false;        
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
                    srcs.add(node.attrs.dataPath);
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

    
    let commands  = [
               
               
               //{    caption: 'Styles',       separator: true },
               
               {   caption: 'Normal',       description: 'This is normal text style',      tags: 'text',    icon: FaRemoveFormat,               on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setParagraph().run(); else editor.commands.setParagraph() },  is_active: () => editor?.isActive('paragraph')  } ,
               
               {   caption: 'Heading 1',      description: 'Description heading',           tags: 'h1',      icon: IcH1,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 1}).run(); else editor.commands.setHeading({ level: 1 }) },   is_active: () => editor?.isActive('heading', {level: 1})  } ,
               {   caption: 'Heading 2',      description: 'Secondary heading',             tags: 'h2',      icon: IcH2,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 2}).run(); else editor.commands.setHeading({ level: 2 }) },   is_active: () => editor?.isActive('heading', {level: 2}) } ,
               {   caption: 'Heading 3',      description: 'Secondary heading',             tags: 'h3',      icon: IcH3,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 3}).run(); else editor.commands.setHeading({ level: 3 }) },   is_active: () => editor?.isActive('heading', {level: 3}) } ,
               {   caption: 'Heading 4',      description: 'Secondary heading',             tags: 'h4',      icon: IcH4,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 4}).run(); else editor.commands.setHeading({ level: 4 }) },   is_active: () => editor?.isActive('heading', {level: 4}) } ,
              
               {   caption: 'Code',         description: 'Source code monospace text',                      icon: FaCode,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setCodeBlock().run(); else editor.commands.setCodeBlock() }, is_active: () => editor?.isActive('CodeBlock') },
               {   caption: 'Comment',      description: 'With this you can comment the above paragraph',   icon: FaComment,                    on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsComment().run(); else editor.commands.setAsComment() }, is_active: () => editor?.isActive('CommentBlock')  } ,
               {   caption: 'Quote',        description: 'To quote someone',                                icon: FaQuoteRight,                 on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsQuote().run(); else editor.commands.setAsQuote() }, is_active: () => editor?.isActive('QuoteBlock')  } ,
               {   caption: 'Warning',      description: 'An important warning to above paragraph',         icon: FaExclamationTriangle,        on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsWarning().run(); else editor.commands.setAsWarning() }, is_active: () => editor?.isActive('WarningBlock')  } ,
               {   caption: 'Info',         description: 'An important info about above paragraph',         icon: FaInfo,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsInfo().run(); else editor.commands.setAsInfo() }, is_active: () => editor?.isActive('InfoBlock')  }, 
               {   caption: 'Bullet list',  description: 'Unordered list of items',                         icon: FaListUl,                     on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).toggleBulletList().run(); else editor.commands.toggleBulletList() }, is_active: () => editor?.isActive('bulletList')  }, 
               {   caption: 'Table',        description: 'Table',                                           icon: FaTable,                      on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).insertTable().run(); else editor.commands.insertTable() }, is_active: () => editor?.isActive('table')  }, 
               
               
               {    caption: 'Format',       separator: true },
               {    caption: 'Bold',        description: 'Marks text as bolded',            tags: 'strong', icon: FaBold,                       on_choice: makeBold,            is_active: () => editor?.isActive('bold')  },
               {    caption: 'Italic',      description: 'Marks text as italic',            tags: 'strong', icon: FaItalic,                     on_choice: makeItalic,          is_active: () => editor?.isActive('italic')  },
               {    caption: 'Underlie',    description: 'Marks text as underlined',                        icon: FaUnderline,                  on_choice: makeUnderline,       is_active: () => editor?.isActive('underline')    },
               {    caption: 'Strikethrough',description: 'Marks text as strikethrough',                    icon: FaStrikethrough,              on_choice: makeStrikethrough,   is_active: () => editor?.isActive('strike')},    
               
               
               {    caption: 'Other blocks', separator: true },
               {   caption: 'Image',        description: 'Add image to document',                           icon: FaImage,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).run(); if(onAddImage) onAddImage(onAddedImageReady);  } } ,
               {   caption: 'Horizontal rule', description: 'Add horizonal role',           tags: 'hr',      icon: FaGripLines,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHorizontalRule().run(); else editor.commands.setHorizontalRule();  } } 
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

    
</script>



<div bind:this={editorElement} />

<Palette    commands={commands} 
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
