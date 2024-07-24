<script lang="ts">
    import type {Document_command} from './internal/Document_command'
    import { Selection_helper} from './internal/Selection_helper'
    import { beforeUpdate, afterUpdate, getContext, onDestroy, onMount} from 'svelte'
    import { Selection_range, Selection_edge} from './internal/Selection_range';
    //import { createEventDispatcher } from 'svelte';
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../../stores.js'
    import {informModification, pushChanges} from '../../updates.js'
    import {isDeviceSmallerThan, parseWidthDirective} from '../../utils.js'
    import Palette from './internal/palette.svelte'

    import FaFont from 'svelte-icons/fa/FaFont.svelte'
    import FaRemoveFormat from 'svelte-icons/fa/FaRemoveFormat.svelte'
    import FaHead from 'svelte-icons/fa/FaHeading.svelte'
    import FaCode from 'svelte-icons/fa/FaCode.svelte'
    import FaComments from 'svelte-icons/fa/FaComment.svelte'
    import FaQuote from 'svelte-icons/fa/FaQuoteRight.svelte'
    import FaWarn from 'svelte-icons/fa/FaExclamationTriangle.svelte'
    import FaInfo from 'svelte-icons/fa/FaInfo.svelte'
    import IcH1 from './internal/h1.icon.svelte'
    import IcH2 from './internal/h2.icon.svelte'
    import IcH3 from './internal/h3.icon.svelte'
    import IcH4 from './internal/h4.icon.svelte'
	import { showMenu } from '../menu';

	
    export let value = '';
    export let placeholder = '';
    
    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';
    export let compact = false;

    export let c='';
    export let pushChangesImmediately: boolean = true;

    let onBlur = undefined;
    export function run(onStop=undefined)
    {
        onBlur = onStop;
        editable_div?.focus();
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
    let   changed_value :string;
    let   has_changed_value :boolean = false;

    let additional_class = $$restProps['class'] ?? '';
    
    let editable_div            : HTMLDivElement = null;
    //let active_range            : Selection_range;
    let observer                : MutationObserver;
    
    let palette = null;
    let is_command_palette_visible :boolean = false;
    let palette_focused_node :Node = null;
    let palette_focused_node_org_text :string;
    let palette_focused_selection_pos :number;
    let palette_focused_string_start :number;
    let palette_focused_string_end :number;

    let ctx = context ? context : getContext('ctx');
    let cs = parseWidthDirective(c);

    let appearance_class :string;
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
            if(has_changed_value)
                saveData();
            else
                setup_source();
        }
    }

    function setup_source()
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
            value = '<p>\u200B</p>';

        has_changed_value = false;

        //if(stored_selection)
        //    set_selection(stored_selection);

    }

    onMount( () => 
    {
        if(!editable_div)
            return;
        
        if(!observer)
        {
            observer = new MutationObserver(async () => { await content_changed(true); });

            observer.observe(   editable_div,  {
                                    childList: true,
                                    attributes: true,
                                    characterData: true,
                                    subtree: true } );
        }

        // same as blur in casse when on:blur will not came on dismounting
        return () => {
            on_blur()
        }
    });


    onDestroy( () => 
    {
        if(!editable_div)
            return;

        //active_range = Selection_range.unknown;

        if(observer)
            observer.disconnect();

        if(is_command_palette_visible)
            hide_command_palette();
    });


    let storedSelection :Selection_range | null = null;
    beforeUpdate( () => {

        if(editable_div && document.activeElement == editable_div)
            storedSelection = Selection_helper.get_selection(editable_div);
        else
            storedSelection = null;
        //console.log('before: ', storedSelection, storedSelection.begin.node_index, storedSelection.begin.absolute_index);
        
    })

    afterUpdate( () => {
        
        //console.log('after: ', stored_selection, stored_selection?.begin.node_index, stored_selection?.begin.absolute_index)

        if(storedSelection)
        {
            const range = Selection_helper.create_range(editable_div, storedSelection.begin.absolute_index, storedSelection.end.absolute_index);
            set_selection(range);
        }
    })

    function content_changed(checkZeroWitdhSpaces :boolean)
    {
        if(document.activeElement != editable_div)      // prevents when content is changed outside the component
            return;

        if(checkZeroWitdhSpaces)
        {
            const sel = window.getSelection();
            if(sel.focusNode == editable_div)
            {
                console.log('focusNode is editable_div!', sel.focusNode)
                return;
            }

            let txt :string = sel.focusNode.textContent;
            var exp = /\u200B/g;
            if((txt.length > 1) && (txt.search(exp) >= 0))
            {
                let active_range : Selection_range = Selection_helper.get_selection(editable_div);

                let selection_offset :number = active_range.begin.absolute_index - active_range.begin.node_index;
                //console.log("elemContentChanged selection_offset:" + selection_offset);

                sel.focusNode.textContent = txt.replace(exp, "");
                set_position(selection_offset + sel.focusNode.textContent.length);
            }
        }
        
    
        if(is_command_palette_visible)
        {
            if(palette_focused_node)
            {
                let current_text :string;
                current_text = palette_focused_node.textContent;
                let key :string;
                if(current_text.charAt(palette_focused_string_start) == '/')
                    palette_focused_string_start++;
                
                if(palette_focused_string_end > 0)
                    key = current_text.slice(palette_focused_string_start, -palette_focused_string_end);
                else
                    key = current_text.substr(palette_focused_string_start);
                
                filter_command_palette(key);    
            }
        }

        changed_value = editable_div.innerHTML;
        has_changed_value = true;

      
        
        /* temporary off 
        let sel :Selection = window.getSelection();
        if(sel.focusNode)
        {
            let text_node :Node = sel.focusNode;
            
            if(text_node == null)
                return;

            if(text_node.nodeType != text_node.TEXT_NODE)
                return;

            let element :Element = text_node.parentElement;

            if(element == null)
                return;

            let value :string;
            let propname :string;
            let component_id :string;

            while(element)
            {
                if(!propname)
                {
                    let attr: Attr;
                    attr = element.attributes.getNamedItem("data-hd-propname");
                    if(attr)
                    {
                        propname = attr.value;
                        value = element.innerHTML;
                    }
                }

                if(!component_id)
                {
                    let attr :Attr;
                    attr = element.attributes.getNamedItem("data-hd-editableitem");
                    if(attr)
                    {
                        component_id = attr.value;
                    }
                }

                if(propname && component_id)
                {
                    on_data_changed(component_id, propname, value);
                    break;
                }
                else
                    element = element.parentElement;
            }
        } */
    }

    const on_keyup = () =>
    {
        selection_changed();
    }

    const on_keydown = (event) =>
    {
        // ***  firefox case when sets caret direclty in div not within internal p
        const sel = window.getSelection();
        if(sel.focusNode == editable_div)
        {
            let next_text_editable_node :Node = find_next_editable_node(null, editable_div);
            if(!next_text_editable_node)
            {
                event.preventDefault();
                return;
            }
            
            let range :Range = new Range;
            range.collapse(true);
            range.setStart(next_text_editable_node, 0);
            range.setEnd(next_text_editable_node, 0);
            set_selection(range);
        }
        // *****************


        switch(event.key)
        {
            case 'Enter':
                if(is_command_palette_visible)
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    restore_previous_text_and_position();
                    choose_command_on_palette();
                }
                else
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    if(is_multiline())
                    {
                        if(event.shiftKey)
                            insert_character_at_caret_position('\n')
                        else
                            insert_new_line();
                    }
                    else
                        move_cursor_to_next_editable_element();
                }
                break;

            case '/':
                store_node_text_and_position();
                show_command_palette();
                break;

            case 'Tab':
                event.cancelBubble = true;
                event.preventDefault();
                insert_character_at_caret_position('\t');
                break;

            case 'Backspace':
                if(is_range_selected())
                {
                    if(is_multi_range_selection())
                    {
                        event.cancelBubble = true;
                        event.preventDefault();
                        console.log("Unsupported");
                    }
                    else
                    {
                        event.cancelBubble = true;
                        event.preventDefault();

                        if(is_selection_within_single_paragraph())
                        {
                            if(is_whole_parapraph_selected())
                            {
                                if(is_focused_paragraph_last_in_document())     // last or single
                                {
                                    make_focused_paragraph_empty(true);
                                }
                                else
                                {
                                    let next_paragraph :Node;
                                    next_paragraph = remove_focused_paragraph(true);
                                    set_caret_at_begin_of_paragraph(next_paragraph);
                                }
                            }
                            else
                            {
                                cut_selected_text_in_focused_paragraph();
                            }
                        }
                        else
                        {
                            cut_selected_paragraphs();
                        }
                    }
                }
                else 
                {
                    let hide_commands_palette :boolean = false;
                    if(is_command_palette_visible)
                        hide_commands_palette = will_slash_remove();
                    
                    if(is_last_character_before_caret())
                    {
                        event.cancelBubble = true;
                        event.preventDefault();

                        if(is_focused_paragraph_empty())
                        {
                            if(!is_focused_paragraph_first_in_document())
                            {
                                let prev_paragraph :Node;
                                prev_paragraph = remove_focused_paragraph(false);
                                set_caret_at_end_of_paragraph(prev_paragraph);
                            }
                            else
                                ; // do nothing, it's beginning of document
                        }
                        else
                            make_focused_paragraph_empty(true);
                    }
                    else if(is_caret_at_beginning_of_paragraph())
                    {
                        event.cancelBubble = true;
                        event.preventDefault();

                        if(!is_focused_paragraph_first_in_document())
                        {
                            merge_focused_paragraph_with_previous()
                        }
                        else
                            ; // do nothing, it's beginning of document
                    }

                    if(hide_commands_palette)
                        hide_command_palette();
                }
                break;

            case 'Delete':
                if(is_range_selected())
                {
                    if(is_multi_range_selection())
                    {
                        event.cancelBubble = true;
                        event.preventDefault();
                        console.log("Unsupported");
                    }
                    else
                    {
                        event.cancelBubble = true;
                        event.preventDefault();

                        if(is_selection_within_single_paragraph())
                        {
                            if(is_whole_parapraph_selected())
                            {
                                if(is_focused_paragraph_last_in_document())     // last or single
                                {
                                    make_focused_paragraph_empty(true);
                                }
                                else
                                {
                                    let next_paragraph :Node;
                                    next_paragraph = remove_focused_paragraph(true);
                                    set_caret_at_begin_of_paragraph(next_paragraph);
                                }
                            }
                            else
                            {
                                cut_selected_text_in_focused_paragraph();
                            }
                        }
                        else
                        {
                            cut_selected_paragraphs();
                        }
                    }
                }
                else if(is_last_character_after_caret())
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    make_focused_paragraph_empty(true);
                }
                else if(is_focused_paragraph_empty())
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    
                    if(!is_focused_paragraph_last_in_document())
                    {
                        let next_paragraph :Node;
                        next_paragraph = remove_focused_paragraph(true);
                        set_caret_at_begin_of_paragraph(next_paragraph);
                    }
                    else
                        ; // do nothing, it's ending of document
                }
                else if(is_caret_at_ending_of_paragraph())
                {
                    event.cancelBubble = true;
                    event.preventDefault();

                    if(!is_focused_paragraph_last_in_document())
                    {
                        merge_focused_paragraph_with_next()
                    }
                    else
                        ; // do nothing, it's ending of document
                }
                
                break;

            case 'Esc':
            case 'Escape':
                if(is_command_palette_visible)
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    hide_command_palette();
                }
                break;
            
            case 'ArrowDown':
                if(is_command_palette_visible)
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    navigate_command_palette(event.key);
                }
                break;

            case 'ArrowUp':
                if(is_command_palette_visible)
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    navigate_command_palette(event.key);
                }
                break;

            
        }

        
        
    }

    const on_mouseup = () =>
    {
        selection_changed();
    }


    function set_selection(range :Range)
    {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function set_position(position :number)
    {
        const range = Selection_helper.create_range(editable_div, position, position);
        set_selection(range);
    }

    function get_position() :Selection_range
    {
        return Selection_helper.get_selection(editable_div);
    }

    function selection_changed()
    {
        if (!editable_div || editable_div.textContent.length === 0)
            return;

        on_selection_changed();
    }

    function store_node_text_and_position()
    {
        let sel :Selection;
        sel = window.getSelection();
        if(sel.focusNode.textContent && sel.focusNode.nodeType !== sel.focusNode.COMMENT_NODE)
        {
            palette_focused_node = sel.focusNode;
            palette_focused_node_org_text = sel.focusNode.textContent;
            palette_focused_string_start = sel.focusOffset;
            palette_focused_string_end = sel.focusNode.textContent.length - sel.focusOffset;
            
            let sr :Selection_range;
            sr = get_position();
            palette_focused_selection_pos = sr.end.absolute_index;
        }
    }

    function restore_previous_text_and_position()
    {
        if(palette_focused_node)
        {
            palette_focused_node.textContent = palette_focused_node_org_text;
            content_changed(false);

            set_position(palette_focused_selection_pos);  
            on_selection_changed();  
        }
    }

    function clear_previous_text_and_position()
    {
        palette_focused_node = null;
        palette_focused_node_org_text = "";
    }

    function will_slash_remove() :boolean
    {
        let sel :Selection;
        sel = window.getSelection();
        if(sel.focusNode.textContent && sel.focusNode.nodeType !== sel.focusNode.COMMENT_NODE)
        {
            if((sel.focusOffset > 0) && (sel.focusNode.textContent.charAt(sel.focusOffset - 1) == '/'))
                return true;
        }
        return false;
    }

    function is_last_character_before_caret() :boolean
    {
        let sel :Selection;
        sel = window.getSelection();

        if(sel.focusNode.textContent && sel.focusNode.nodeType !== sel.focusNode.COMMENT_NODE)
        {
            if((sel.focusOffset == 1) && (sel.focusNode.textContent.length == 1))
                return true;
        }
        return false;
    }

    function is_last_character_after_caret() :boolean
    {
        let sel :Selection;
        sel = window.getSelection();
        if(sel.focusNode.textContent && sel.focusNode.nodeType !== sel.focusNode.COMMENT_NODE)
        {
            if((sel.focusOffset == 0) && (sel.focusNode.textContent.length == 1))
                return true;
        }
        return false;
    }

    function is_caret_at_beginning_of_paragraph() :boolean
    {
        let sel :Selection;
        sel = window.getSelection();

        if(sel.focusNode.textContent && sel.focusNode.nodeType !== sel.focusNode.COMMENT_NODE)
        {
            if(sel.focusOffset == 0)
                return true;
        }
        return false;
    }

    function is_caret_at_ending_of_paragraph() :boolean
    {
        let sel :Selection;
        sel = window.getSelection();
        
        if(sel.focusNode.textContent && sel.focusNode.nodeType !== sel.focusNode.COMMENT_NODE)
        {
            if(sel.focusOffset == sel.focusNode.textContent.length)
                return true;
        }
        return false;
    }

    function merge_focused_paragraph_with_previous()
    {
        let sel :Selection;
        sel = window.getSelection();

        let merged_text :string = sel.focusNode.textContent;
        let prev_paragraph = remove_focused_paragraph(false);
        
        let text_node :Node = prev_paragraph.childNodes[0];
        let merging_text :string = text_node.textContent;
        text_node.textContent = merging_text +  merged_text;

        let pos :number = merging_text.length + 0; // space
        let range :Range = new Range;
        range.collapse(true);
        range.setStart(text_node, pos);
        range.setEnd(text_node, pos);
        set_selection(range);
    }

    function merge_focused_paragraph_with_next()
    {
        let sel :Selection;
        sel = window.getSelection();

        let focus_node :Node = sel.focusNode;

        let merging_text :string = focus_node.textContent;

        let focused_paragraph :Node = focus_node.parentNode
        let next_paragraph :Node = focused_paragraph.nextSibling;
        while(next_paragraph.nodeType != Node.ELEMENT_NODE)
            next_paragraph = next_paragraph.nextSibling;

        let text_node :Node = next_paragraph.childNodes[0];
        let merged_text :string = text_node.textContent;

        let root :Node = focused_paragraph.parentNode;
        root.removeChild(next_paragraph);

        focus_node.textContent =  merging_text +  merged_text;

        let pos :number = merging_text.length;
        let range :Range = new Range;
        range.collapse(true);
        range.setStart(focus_node, pos);
        range.setEnd(focus_node, pos);
        set_selection(range);
    }

    function cut_selected_text_in_focused_paragraph()
    {
        let sel :Selection;
        sel = window.getSelection();
        const focus_node: Node = sel.focusNode;
        const whole_text: string = focus_node.textContent;              // <br>: wrong in multi textNodes case when <br> used between them for instance
        const left_idx = Math.min(sel.focusOffset, sel.anchorOffset)
        const right_idx = Math.max(sel.focusOffset, sel.anchorOffset)

        let left_part: string = whole_text.substring(0, left_idx)
        let right_part :string = whole_text.substring(right_idx)

        focus_node.textContent = left_part + right_part;
        let pos :number = left_part.length;
        let range :Range = new Range;
        range.collapse(true);
        range.setStart(focus_node, pos);
        range.setEnd(focus_node, pos);
        set_selection(range);
    }

    function cut_selected_paragraphs()
    {
        let sel: Selection = window.getSelection()

        let first_paragraph;
        let first_offset ;
        let last_paragraph ;
        let last_offset ;
        
        let cmp = sel.anchorNode?.compareDocumentPosition(sel.focusNode)
        switch(cmp)
        {
        case Node.DOCUMENT_POSITION_PRECEDING:
        case Node.DOCUMENT_POSITION_CONTAINS:
            // focus before anchor
            first_paragraph = sel.focusNode.parentNode
            first_offset = sel.focusOffset
            last_paragraph = sel.anchorNode.parentNode
            last_offset = sel.anchorOffset
            break;

        case Node.DOCUMENT_POSITION_FOLLOWING:
        case Node.DOCUMENT_POSITION_CONTAINED_BY:
            // anchor before focus
            first_paragraph = sel.anchorNode.parentNode
            first_offset = sel.anchorOffset
            last_paragraph = sel.focusNode.parentNode
            last_offset = sel.focusOffset
            break;

        default:
            return;
        }
        
        

        let in_selection :boolean = false
        let paragraphs_to_remove :Node[] = [];

        let root = first_paragraph.parentNode;
        const siblings_no = root.childNodes.length
        for(let i=0; i<siblings_no; i++)
        {
            let n :Node = root.childNodes[i];
            if(in_selection)
            {
                if(n == last_paragraph)
                {
                    // handle last p
                    let text_node :Node = n.childNodes[0]
                    let text_in_node :string = text_node.textContent
                    text_in_node = text_in_node.substring(last_offset)
                    if(text_in_node)
                    {
                        text_node.textContent = text_in_node;
                    }
                    else
                    {
                        text_node.textContent = '\u200B';   // empty paragraph
                    }
                    
                    in_selection = false
                    break;
                }
                else
                {
                    paragraphs_to_remove.push(n)
                }
            }
            else if(n == first_paragraph)
            {
                // handle first p
                let text_node :Node = n.childNodes[0]
                let text_in_node :string = text_node.textContent
                text_in_node = text_in_node.substring(0, first_offset)
                if(text_in_node)
                {
                    text_node.textContent = text_in_node;
                }
                else
                {
                    if(n == last_paragraph)
                        text_node.textContent = '\u200B';
                    else
                    {
                        paragraphs_to_remove.push(n)
                        first_paragraph = null;
                    }
                }

                in_selection = true;
            }
            
        }

        if(first_paragraph)
        {
            let last_node = last_paragraph.childNodes[0];
            let merged_text = last_node.textContent;
            
            let text_node = first_paragraph.childNodes[0];
            let merging_text = text_node.textContent;

            text_node.textContent = merging_text + merged_text;
            
            paragraphs_to_remove.push(last_paragraph)

            let pos = merging_text.length
            let range :Range = new Range;
            range.collapse(true);
            range.setStart(text_node, pos);
            range.setEnd(text_node, pos);
            set_selection(range);
        }
        else
        {
            let text_node = last_paragraph.childNodes[0];
            let range :Range = new Range;
            range.collapse(true);
            range.setStart(text_node, 0);
            range.setEnd(text_node, 0);
            set_selection(range);
        }

        paragraphs_to_remove.forEach( c =>
        {
            root.removeChild(c)
        })
    }

    function is_selection_within_single_paragraph() :boolean
    {
        let sel :Selection;
        sel = window.getSelection();
        return sel.focusNode == sel.anchorNode      // what about <br> 
    }

    function is_whole_parapraph_selected() :boolean
    {
        let sel: Selection = window.getSelection()
        const selected_chanacters_no = Math.abs(sel.focusOffset - sel.anchorOffset);
        const node_characters_no = sel.focusNode?.textContent?.length
        return (selected_chanacters_no == node_characters_no);
    }


    function is_multi_range_selection() :boolean
    {
        let sel :Selection = window.getSelection()
        return sel.rangeCount > 1
    }

    function is_range_selected() :boolean
    {
        let sel :Selection;
        sel = window.getSelection();
        
        if(sel.rangeCount == 0)
            return false;

        if(sel.rangeCount > 1)
            return true;

        if(sel.anchorNode !== sel.focusNode)
            return true;

        if(sel.anchorOffset != sel.focusOffset)
            return true;

        return false;
    }

    function make_focused_paragraph_empty(_set_selection :boolean)
    {
        let sel :Selection;
        sel = window.getSelection();

        let node :Node = sel.focusNode;
        if(node.textContent && node.nodeType !== node.COMMENT_NODE)
        {
            node.textContent = "\u200B";
        }

        if(_set_selection)
        {
            let range :Range = new Range;
            range.collapse(true);
            range.setStart(node, 1);
            range.setEnd(node, 1);
            set_selection(range);
        }
    }

    function is_focused_paragraph_empty() :boolean
    {
        let sel :Selection;
        sel = window.getSelection();
        if(sel.focusNode.textContent == "\u200B")
            return true;
        return false;
    }

    function is_focused_paragraph_first_in_document() :boolean
    {
        let text_node :Node = window.getSelection().focusNode;
        let focused_div :Node = text_node.parentNode;
        let prev_div :Node = focused_div.previousSibling;
        if(prev_div != null)
            return false;
        else
            return true;
    }

    function is_focused_paragraph_last_in_document() :boolean
    {
        let text_node :Node = window.getSelection().focusNode;
        let focused_div :Node = text_node.parentNode;
        let next_div :Node = focused_div.nextSibling;
        if(next_div != null)
            return false;
        else
            return true;
    }

    function remove_focused_paragraph(return_next_sibling :boolean = false) :Node 
    {
        let text_node :Node = window.getSelection().focusNode;
        let focused_div :Node = text_node.parentNode;
        let result :Node;
        if(!return_next_sibling)
        {
           	result = focused_div.previousSibling;
            while(result && result.nodeType != Node.ELEMENT_NODE)
                result = result.previousSibling;
        }
        else
        {
            result = focused_div.nextSibling;
            while(result && result.nodeType != Node.ELEMENT_NODE)
                result = result.nextSibling;
        }

        let root :Node = focused_div.parentNode;
        root.removeChild(focused_div);
        return result;
    }

    function set_caret_at_end_of_paragraph(paragraph :Node)
    {
        let text_node :Node = paragraph.childNodes[0];
        if(text_node == null)
            return;

        let pos :number = text_node.textContent.length;
        let range :Range = new Range;
        range.collapse(true);
        range.setStart(text_node, pos);
        range.setEnd(text_node, pos);
        set_selection(range);
    }

    function set_caret_at_begin_of_paragraph(paragraph :Node)
    {
        let text_node :Node = paragraph.childNodes[0];
        if(text_node == null)
            return;

        let range :Range = new Range;
        range.collapse(true);
        range.setStart(text_node, 0);
        range.setEnd(text_node, 0);
        set_selection(range);
    }

    function is_multiline() :boolean
    {
        let sel :Selection = window.getSelection();
        let n :Node = sel.focusNode;
        if(!n)
            return false;
        
        if(n.nodeType !== n.TEXT_NODE)
            return false;

        let element :Element =  n.parentElement;
        if(!element)
            return false;

        let propname_attr :Attr = element.attributes.getNamedItem("data-hd-propname");
        if(!propname_attr)
            return true;
        else
            return false;
    }

    function is_text_node(node :Node) :boolean
    {
        if((node.nodeType == node.TEXT_NODE) && node.textContent)
            return true;
        else
            return false;
    }

    function is_non_editable_element(node :Node) :boolean
    {
        if(node.nodeType != node.ELEMENT_NODE)
            return false;
        
        let element :HTMLElement = <HTMLElement> node;
        if(element.isContentEditable)
            return false;

        if(element.contentEditable == "false")
            return true;

        return false;
    }

    function find_next_editable_node(after :Node, parent :Node, check_upper_nodes :boolean = false) :Node
    {
        let node :Node;
        if(after == null)
            node = parent.childNodes[0];
        else
            node = after.nextSibling;

        while(node)
        {
            if(node.hasChildNodes())
            {
                if(!is_non_editable_element(node))
                {
                    let result :Node;
                    result = find_next_editable_node(null, node);
                    if(result)
                        return result;
                }
                
            }
            else if(is_text_node(node))
                return node;
            
            
            node = node.nextSibling;
        }

        if(check_upper_nodes)
        {
            let upper_after :Node = parent;
            let upper_parent :Node = parent.parentNode;
            while(upper_parent)
            {
                let result :Node = find_next_editable_node(upper_after, upper_parent);
                if(result)
                    return result;

                upper_after = upper_parent;
                upper_parent = upper_after.parentNode;
            }
        }

        return null;
    }

    function move_cursor_to_next_editable_element()
    {
        let sel :Selection = window.getSelection();
        let next_text_editable_node :Node = find_next_editable_node(sel.focusNode, sel.focusNode.parentNode, true);
        if(!next_text_editable_node)
            return;
        
        let range :Range = new Range;
        range.collapse(true);
        range.setStart(next_text_editable_node, 0);
        range.setEnd(next_text_editable_node, 0);
        set_selection(range);
    }

    function set_tag_and_class_for_paragraph(node :Node, tag :string, css_class :string) : boolean
    {
        while(node && node.nodeType !== Node.ELEMENT_NODE)
            node = node.parentNode;
        
        if(!node)
            return false;

        let element :Element = <Element> node;
        if(element.tagName == tag.toUpperCase())
        {
            element.className = css_class;
            return false;
        }
        else
        {
            let old_element :Element = element;
            let new_element :Element = document.createElement(tag);
            new_element.innerHTML = old_element.innerHTML;
            
            const attribs_no = old_element.attributes.length;
            for(let i=0; i<attribs_no; i++)
            {
                let attr :Attr = old_element.attributes[i];
                new_element.setAttribute( attr.name,  attr.value);
            }

            new_element.className = css_class;

            old_element.parentNode.replaceChild(new_element, old_element);
            return true;
        }
    }

    function do_format(tag :string, css_class :string)
    {
        const elem = editable_div
        const editableElem = editable_div;
        let stored_selection :Selection_range = Selection_helper.get_selection(elem);

        let sel :Selection = window.getSelection();
        let should_restore_selection :boolean = false;
        if(sel.isCollapsed || sel.focusNode === sel.anchorNode)
        {
            if(set_tag_and_class_for_paragraph(sel.focusNode, tag, css_class))
                should_restore_selection = true;
        }
        else
        {
            let from :Node;
            let to :Node;
            const flags = sel.focusNode.compareDocumentPosition(sel.anchorNode);
            if(flags & Node.DOCUMENT_POSITION_PRECEDING)
            {
                to = sel.focusNode;
                from = sel.anchorNode;
            }
            else
            {
                from = sel.focusNode;
                to = sel.anchorNode;
            }

            if(set_tag_and_class_for_paragraph(from, tag, css_class))
                should_restore_selection = true;
            let node :Node = from;
            
            do
            {
                node = find_next_editable_node(node, node.parentNode, true);
                if(set_tag_and_class_for_paragraph(node, tag, css_class))
                    should_restore_selection = true;
                if(node == to)
                    break;
            }
            while(node)
        }

        if(should_restore_selection)
        {
            const range = Selection_helper.create_range(editableElem, stored_selection.begin.absolute_index, stored_selection.end.absolute_index);
            set_selection(range);
        }
    }

    function insert_character_at_caret_position(what_to_insert: string)
    {
        if(is_range_selected())
        {
            console.log("Unsupported");
            return false;
        }
        else 
        {
            let sel :Selection;
            sel = window.getSelection();
            const focusNode: Node = sel.focusNode;
            const wholeText: string = focusNode.textContent; 
            const carretPos = sel.focusOffset

            let leftPart: string = wholeText.substring(0, carretPos)
            let rightPart :string = wholeText.substring(carretPos)

            focusNode.textContent = leftPart + what_to_insert + rightPart;
            let pos :number = carretPos + 1;
            let range :Range = new Range;
            range.collapse(true);
            range.setStart(focusNode, pos);
            range.setEnd(focusNode, pos);
            set_selection(range);
        }   
    }

    function insert_new_line()
    {
        const elem = editable_div;
        const editableElem = editable_div;
        const tag = 'p';
        let inTheMiddle: boolean;
        if (editableElem) 
        {
            let active_range : Selection_range = Selection_helper.get_selection(editable_div);
            const rangeNode = Selection_helper.create_cursor_range(editableElem, active_range.begin.absolute_index);

            if (rangeNode) 
            {
                const activeNode = rangeNode[1]
                inTheMiddle = true;
                if (rangeNode[0].startOffset === activeNode.textContent.length) {
                    inTheMiddle = false;
                }
                else if (rangeNode[0].startOffset === activeNode.textContent.length - 1 && activeNode.textContent.substring(activeNode.textContent.length - 1) === "\u200B") {
                    inTheMiddle = false;
                }

                const newTag = document.createElement(tag);
                
                let new_line_cursor_pos :number;

                if (!inTheMiddle) 
                {
                    newTag.innerHTML = "\u200B";
                    new_line_cursor_pos = 1;
                    activeNode.parentElement.insertAdjacentElement('afterend', newTag);
                }
                else
                {
                    let range :Range;
                    range = rangeNode[0];

                    let current_div :HTMLElement;
                    current_div = <HTMLElement> activeNode.parentNode;
                    
                    let current_text :string;
                    current_text = activeNode.textContent;
                   
                    let range_start :number
                    range_start = range.startOffset;

                    let range_end :number;
                    range_end = range.endOffset

                    if(range_start === 0)
                        current_div.innerHTML = "\u200B";  
                    else
                        current_div.innerHTML = current_text.substring(0, range_start);

                    newTag.innerHTML = current_text.substring(range_end);

                    current_div.insertAdjacentElement('afterend', newTag);
                    new_line_cursor_pos = 0;
                }

                let text_node :Node = newTag.childNodes[0];
                rangeNode[0].collapse(true);
                rangeNode[0].setStart(text_node, new_line_cursor_pos);
                rangeNode[0].setEnd(text_node, new_line_cursor_pos);
                set_selection(rangeNode[0]);
                //elem.focus();
                content_changed(false);
            }
        }
    }

    function get_selection_bbox() :DOMRect
    {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        let rect :DOMRect;
        rect = range.getBoundingClientRect();
        return rect;
    }

    function get_window_box() :DOMRect
    {
        let client_rect :DOMRect;
        client_rect = new DOMRect;
        client_rect.x = 0;
        client_rect.y = 0;
        client_rect.width = window.innerWidth;
        client_rect.height = window.innerHeight;
        return client_rect;
    }

    function on_palette_mouse_click()
    {
        restore_previous_text_and_position();
    }

    function on_palette_shown()
    {
        is_command_palette_visible = true;
    }

    function on_palette_hidden()
    {
        is_command_palette_visible = false;
        clear_previous_text_and_position();
    }

    function show_command_palette()
    {
        let rect :DOMRect = get_selection_bbox();
        let client_rect :DOMRect = get_window_box();
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

    function hide_command_palette()
    {
        palette.hide();
    }

    function filter_command_palette(key :string)
    {
        palette.filter(key);
    }

    function choose_command_on_palette()
    {
        palette.execute_selected_command();
    }

    function navigate_command_palette(key :string)
    {
        if(key == "ArrowDown")
            palette.navigate_down();
        else if(key == "ArrowUp")
            palette.navigate_up();
    }

    //let stored_selection: Range | undefined = undefined;
    function on_selection_changed()
    {
        //let active_range : Selection_range = Selection_helper.get_selection(editable_div);
        //stored_selection = window.getSelection()?.getRangeAt(0);

        //stored_selections.set(id, range);
        //console.log('Editor store selection', id, range.begin.absolute_index, range.end.absolute_index);
    }

    let intervalId = 0;
    function on_focus()
    {
        /*if(pushChangesImmediately)
        {
            intervalId = setInterval(() =>
            {
                saveData();
            },
            2000);
        }
        */
    }

    function on_blur()
    {
        let active_range : Selection_range = Selection_helper.get_selection(editable_div);
        //console.log('rich.edit: on_blur', active_range?.begin?.absolute_index)

        storedSelection = null;

        //if(intervalId)
        //{
        //    clearInterval(intervalId)
        //    intervalId = 0;
        //}

        if(onBlur)
        {
            onBlur();
            onBlur = undefined
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
        if(item && a && has_changed_value)
        {
            item[a] = changed_value;
            //value = changed_value;
            has_changed_value = false;

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

    
    let commands         :Document_command[] = [
               {   caption: 'Normal',       description: 'This is normal text style',      tags: 'text',    icon: FaRemoveFormat,                       on_choice: () => { do_format('p', '') } } ,
               
            //   {   caption: 'Heading 1',    description: 'Big section heading',            tags: 'h1',      icon: FaHead,    icon_size: 6,      on_choice: () => { do_format('h2', '') } } ,
            //   {   caption: 'Heading 2',    description: 'Medium section heading',         tags: 'h2',      icon: FaHead,    icon_size: 5,      on_choice: () => { do_format('h3', '') } } ,
            //   {   caption: 'Heading 3',    description: 'Small section heading',          tags: 'h3',      icon: FaHead,    icon_size: 4,      on_choice: () => { do_format('h4', '') } } ,
               {   caption: 'Heading 1',      description: 'Description heading',            tags: 'h1',      icon: IcH1,          on_choice: () => { do_format('h1', '') } } ,
               {   caption: 'Heading 2',      description: 'Description heading',            tags: 'h2',      icon: IcH2,          on_choice: () => { do_format('h2', '') } } ,
            //   {   caption: 'Heading 2',      description: 'Medium description heading',     tags: 'h3',      icon: FaHead,    icon_size: 5,      on_choice: () => { do_format('h3', '') } } ,
            //   {   caption: 'Heading 3',      description: 'Small description heading',      tags: 'h4',      icon: FaHead,    icon_size: 4,      on_choice: () => { do_format('h4', '') } } ,
               
               {   caption: 'Code',         description: 'Source code monospace text',                      icon: FaCode,                       on_choice: () => { do_format('p', 'ml-6 text-sm font-mono break-normal text-pink-700 dark:text-pink-600') } } ,
               {   caption: 'Comment',      description: 'With this you can comment the above paragraph',   icon: FaComments,                   on_choice: () => { do_format('p', 'ml-6 text-sm italic text-lime-700 dark:text-lime-600') } } ,
               {   caption: 'Quote',        description: 'To quote someone',                                icon: FaQuote,                      on_choice: () => { do_format('blockquote', '') } } ,
               {   caption: 'Warning',      description: 'An important warning to above paragraph',         icon: FaWarn,                       on_choice: () => { do_format('p', 'ml-6 px-3 py-1 border-l-2 rounded-md border-orange-500 bg-orange-100 dark:bg-orange-900') } } ,
               {   caption: 'Info',         description: 'An important info about above paragraph',         icon: FaInfo,                       on_choice: () => { do_format('p', 'ml-6 px-3 py-1 border-l-2 rounded-md border-blue-500 bg-blue-100 dark:bg-blue-900') } } 
            ];
    
    

</script>

<div    contenteditable="true" 
        bind:this={editable_div}
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
</div>

<Palette    commands={commands} 
            bind:this={palette} 
            on:palette_shown={on_palette_shown}
            on:palette_hidden={on_palette_hidden}
            on:palette_mouse_click={on_palette_mouse_click}/>



<style>

[contenteditable]:focus {
    outline: 0px solid transparent;
}


/*
:global(.doc-code) {
  margin-left: 3rem;
  font-family: SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
  font-size: 87.5%;
  color: #e83e8c;
  word-wrap: break-word;
}

:global(.doc-quote) {
    margin-left: 3rem;
    font-style: italic;
    color: #6c757d;
}

:global(.doc-comment) {
    margin-left: 3rem;
    font-size: 87.5%;
    color: #28a745;
}

:global(.doc-warn) {
    margin-left: 3rem;
    padding: .75rem 1.25rem;
    border: 1px solid transparent;
    border-radius: .25rem;
    color: #856404;
    background-color: #fff3cd;
    border-color: #ffeeba;
  }

:global(.doc-info) {
    margin-left: 3rem;
    padding: .75rem 1.25rem;
    border: 1px solid transparent;
    border-radius: .25rem;
    color: #0c5460;
    background-color:#d1ecf1;
    border-color: #bee5eb;
}
*/

</style>
