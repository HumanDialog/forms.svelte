<script lang="ts">
    import type {Document_command} from './internal/Document_command'
    import { Selection_helper} from './internal/Selection_helper'
    import { getContext, onDestroy, onMount} from 'svelte'
    import { Selection_range, Selection_edge} from './internal/Selection_range';
    //import { createEventDispatcher } from 'svelte';
    import {data_tick_store, context_items_store, context_types_store} from '../../stores.js'
    import {inform_modification, push_changes} from '../../updates.js'
    import {parse_width_directive} from '../../utils.js'
    import Palette from './internal/palette.svelte'

    import FaFont from 'svelte-icons/fa/FaFont.svelte'
    import FaHead from 'svelte-icons/fa/FaHeading.svelte'
    import FaCode from 'svelte-icons/fa/FaCode.svelte'
    import FaComments from 'svelte-icons/fa/FaComment.svelte'
    import FaQuote from 'svelte-icons/fa/FaQuoteRight.svelte'
    import FaWarn from 'svelte-icons/fa/FaExclamationTriangle.svelte'
    import FaInfo from 'svelte-icons/fa/FaInfo.svelte'

	
    export let value = '';
    export let placeholder = '';
    
    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';

    export let c='';
    
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
    let cs = parse_width_directive(c);
    
    let  last_tick = -1;

    $:{
        if(last_tick < $data_tick_store)
            setup_source();
    }

    function setup_source()
    {
        //console.log('setup_source');

        last_tick = $data_tick_store;

        if(a)
        {
            if(self)
                item = self   
            else
                item = $context_items_store[ctx];
                
            if(!typename)
                typename = $context_types_store[ctx];
            
            if(item != null)
                value = item[a]
        }

        if(!value)
            value = '<div>\u200B</div>';

        has_changed_value = false;
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
                        insert_new_line();
                    else
                        move_cursor_to_next_editable_element();
                }
                break;

            case '/':
                store_node_text_and_position();
                show_command_palette();
                break;

            case 'Backspace':
                if(is_range_selected())
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    console.log("Unsupported");
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
                        }
                        else
                            make_focused_paragraph_empty(true);
                    }

                    if(hide_commands_palette)
                        hide_command_palette();
                }
                break;

            case 'Delete':
                if(is_range_selected())
                {
                    event.cancelBubble = true;
                    event.preventDefault();
                    console.log("Unsupported");
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
           	result = focused_div.previousSibling;
        else
            result = focused_div.nextSibling;

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
        return element.isContentEditable;
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
            return;

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

    function insert_new_line()
    {
        const elem = editable_div;
        const editableElem = editable_div;
        const tag = 'div';
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
        else 
            show_fullscreen = true;

        if(show_fullscreen)
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

    function on_selection_changed()
    {
        //let active_range : Selection_range = Selection_helper.get_selection(editable_div);

        //stored_selections.set(id, range);
        //console.log('Editor store selection', id, range.begin.absolute_index, range.end.absolute_index);
    }

    function on_blur()
    {
        let active_range : Selection_range = Selection_helper.get_selection(editable_div);
        
        if(item && a && has_changed_value)
        {
            item[a] = changed_value;
            //value = changed_value;
            has_changed_value = false;

            if(typename)
            {
                inform_modification(item, a, typename);
                push_changes();
            }

            last_tick = $data_tick_store + 1;
            $data_tick_store = last_tick;
        }
    }

    
    let commands         :Document_command[] = [
               {   caption: 'Normal',       description: 'This is normal text style',      tags: 'text',    icon: FaFont,                       on_choice: () => { do_format('div', '') } } ,
               
               {   caption: 'Heading 1',    description: 'Big section heading',            tags: 'h1',      icon: FaHead,    icon_size: 6,      on_choice: () => { do_format('h2', '') } } ,
               {   caption: 'Heading 2',    description: 'Medium section heading',         tags: 'h2',      icon: FaHead,    icon_size: 5,      on_choice: () => { do_format('h3', '') } } ,
               {   caption: 'Heading 3',    description: 'Small section heading',          tags: 'h3',      icon: FaHead,    icon_size: 4,      on_choice: () => { do_format('h4', '') } } ,
               
               {   caption: 'Code',         description: 'Source code monospace text',                      icon: FaCode,                       on_choice: () => { do_format('div', 'ml-6 text-sm font-mono break-normal text-pink-700 dark:text-pink-600') } } ,
               {   caption: 'Comment',      description: 'With this you can comment the above paragraph',   icon: FaComments,                   on_choice: () => { do_format('div', 'ml-6 text-sm italic text-lime-700 dark:text-lime-600') } } ,
               {   caption: 'Quote',        description: 'To quote someone',                                icon: FaQuote,                      on_choice: () => { do_format('blockquote', '') } } ,
               {   caption: 'Warning',      description: 'An important warning to above paragraph',         icon: FaWarn,                       on_choice: () => { do_format('div', 'ml-6 px-3 py-1 border-l-2 rounded-md border-orange-500 bg-orange-100 dark:bg-orange-900') } } ,
               {   caption: 'Info',         description: 'An important info about above paragraph',         icon: FaInfo,                       on_choice: () => { do_format('div', 'ml-6 px-3 py-1 border-l-2 rounded-md border-blue-500 bg-blue-100 dark:bg-blue-900') } } 
            ];
    

</script>

<div    contenteditable="true" 
        bind:this={editable_div}
        on:keyup={on_keyup}
        on:keydown={on_keydown}
        on:mouseup={on_mouseup}
        class="{cs}     bg-gray-50 border border-gray-300 text-sm rounded-md 
                         px-2.5 dark:bg-gray-700 dark:border-gray-600 
                        prose prose-sm sm:prose-base dark:prose-invert {additional_class} overflow-y-auto"
        on:blur={on_blur}
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
