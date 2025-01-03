<script lang="ts">
    import { onMount, onDestroy,  getContext } from 'svelte';
	import { Editor } from '@tiptap/core';
	
    import StarterKit from '@tiptap/starter-kit';
    import Document from '@tiptap/extension-document'
    import Paragraph from '@tiptap/extension-paragraph'
    import Text from '@tiptap/extension-text'
    import Heading from '@tiptap/extension-heading'
    import Blockquote from '@tiptap/extension-blockquote'
    import HardBreak from '@tiptap/extension-hard-break'
    import HorizontalRule from '@tiptap/extension-horizontal-rule'

    import Bold from '@tiptap/extension-bold'
    import Code from '@tiptap/extension-code'
    import Italic from '@tiptap/extension-italic'
    import Strike from '@tiptap/extension-strike'
    import Dropcursor from '@tiptap/extension-dropcursor'
    import Gapcursor from '@tiptap/extension-gapcursor'
    import History from '@tiptap/extension-history'
    
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../../stores.js'
    import {informModification, pushChanges} from '../../updates.js'
    import {isDeviceSmallerThan, parseWidthDirective} from '../../utils.js'
    import Palette from './internal/palette.svelte'

    import {FaFont, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle, FaInfo} from 'svelte-icons/fa'
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
    
    export let c='';
    export let pushChangesImmediately = true;

    let onFinishEditing = undefined;
    export function run(onStop=undefined)
    {
        onFinishEditing = onStop;
        //editorElement?.focus();
        editor.commands.focus();
    }

    export function getFormattingOperations(withCaptions = false)
    {
        let result = [];
        commands.forEach( c => {
            result.push({
                caption: withCaptions ? c.caption : '',
                icon: c.icon,
                action: c.on_choice
            })
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

    $:{
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

                //console.log('decorationNode', props.decorationNode, props.text)
                show_command_palette();
                palette.set_current_editor_range(props.range)
                palette.filter('');
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
    const CodeBlock = Paragraph.extend({
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

    onMount(() => {
		editor = new Editor({
            editorProps: {
                attributes: {
                    class: `${cs} ${appearance_class} prose prose-base sm:prose-base dark:prose-invert ${additional_class} overflow-y-auto whitespace-pre-wrap focus:outline-none`,
                },
            },
			element: editorElement,
			extensions: [
                Document,
                Paragraph,
                Text,
                Heading.configure({
                    levels: [1, 2],
                }),
                HardBreak,
                HorizontalRule,
                
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
			},
            onFocus({ editor, event }) {
                // The editor is focused.
                if(onFocusCb)
                    onFocusCb();
            },
            onBlur({ editor, event }) {
                // The editor isn’t focused anymore.
                on_blur();
                if(onBlurCb)
                    onBlurCb();
            },
            onContentError({ editor, error, disableCollaboration }) {
                // The editor content does not match the schema.
                console.log('editor content error:', error)
            },
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}

        if(is_command_palette_visible)
            palette.hide();
	});

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

    function show_command_palette()
    {
        let rect = get_selection_bbox();
        let client_rect = get_window_box();
        let top_space = rect.y;
        let bottom_space = client_rect.height - (rect.y + rect.height);
        
        palette.max_height_px = 500;
        palette.width_px = 400;

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



    // ================================================================================================================================

    
    let commands  = [
               {   caption: 'Normal',       description: 'This is normal text style',      tags: 'text',    icon: FaRemoveFormat,               on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setParagraph().run(); else editor.commands.setParagraph() } } ,
               
               {   caption: 'Heading 1',      description: 'Description heading',            tags: 'h1',      icon: IcH1,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 1}).run(); else editor.commands.setHeading({ level: 1 }) } } ,
               {   caption: 'Heading 2',      description: 'Description heading',            tags: 'h2',      icon: IcH2,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setHeading({level: 2}).run(); else editor.commands.setHeading({ level: 2 }) } } ,
              
               {   caption: 'Code',         description: 'Source code monospace text',                      icon: FaCode,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsCode().run(); else editor.commands.setAsCode() } },
               {   caption: 'Comment',      description: 'With this you can comment the above paragraph',   icon: FaComment,                    on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsComment().run(); else editor.commands.setAsComment() } } ,
               {   caption: 'Quote',        description: 'To quote someone',                                icon: FaQuoteRight,                 on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsQuote().run(); else editor.commands.setAsQuote() } } ,
               {   caption: 'Warning',      description: 'An important warning to above paragraph',         icon: FaExclamationTriangle,        on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsWarning().run(); else editor.commands.setAsWarning() } } ,
               {   caption: 'Info',         description: 'An important info about above paragraph',         icon: FaInfo,                       on_choice: (range) => { if(range) editor.chain().focus().deleteRange(range).setAsInfo().run(); else editor.commands.setAsInfo() } } 
            ];
    
    
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
