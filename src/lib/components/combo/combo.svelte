<script lang="ts">
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../../stores.js' 
    import {informModification, pushChanges} from '../../updates.js'
    import {parseWidthDirective,shouldBeComapact} from '../../utils.js'
    import {afterUpdate, getContext, onMount, setContext} from 'svelte';
    import {rCombo_definition, rCombo_item, cached_sources} from './combo'
    import FaChevronDown from 'svelte-icons/fa/FaChevronDown.svelte'
    import Icon from '../icon.svelte'
    import { reef } from '@humandialog/auth.svelte/dist/index.js';

    export let label = ''
    export let self = null;
    export let a = '';
    export let isAssociation = false;
    export let context = ""
    export let typename = '';
    export let choiceCallback = '';
    export let onSelect = undefined;
    export let definition :rCombo_definition | null = null;
    export let changed = undefined;
    export let onNewItemCreated = undefined;

    export let icon :boolean = false;

    export let placeholder = '';

    export  let s = 'sm'
    export  let c = ''

    export let compact :boolean = false;
    export let inContext :string = 'sel'   // in compact mode
    export let cached :boolean = false;
    export let filtered: boolean = false;
    

    let is_compact :boolean = getContext('rIs-table-component') || compact;
    
    if(!definition)
    {
        definition = new rCombo_definition;
        setContext('rCombo-definition', definition);
    }

    let   is_dropdown_open = false;
    let   dropdown_position      :string = '';
    let   combo;
    let   textbox;
    let   dropdown_height;
    let   filtered_source :rCombo_item[] = null;
    let   mutation_observer : MutationObserver = null;
    let   highlighted_option :rCombo_item = null;
        
    let   item = null
    let   root_element;

    let label_mb = 'mb-1' //
    let input_pt = 'pt-0.5'
    let input_pb = 'pb-1'
    let font_size = 'text-lg sm:text-sm'
    let line_h = 'h-5'
    let chevron_mt = 'mt-2 sm:mt-0'
    
    switch (s)
    {
        case 'md':
            label_mb = 'mb-2';
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';     
            font_size = 'text-lg sm:text-sm'      
            line_h = 'h-7 sm:h-5'
            chevron_mt = 'mt-2 sm:mt-1'
            break;

        case 'xs':
            label_mb = 'mb-0.5';
            input_pt = 'pt-0.5'
            input_pb = 'pb-0.5';
            font_size = 'text-base sm:text-xs'           
            line_h = 'h-6 sm:h-4'
            chevron_mt = ''
            break;
    }

    let background_class = is_compact && !icon ? "" : ""; //bg-stone-900/10 dark:bg-stone-100/10 rounded-lg" : ""

    let appearance_class;
    if(is_compact)
        appearance_class = `${font_size}`;
    else
        appearance_class = `   bg-stone-50 border border-stone-300 text-stone-900 ${font_size} rounded-lg 
                                focus:ring-primary-600 focus:border-primary-600 block w-full  ${input_pb} ${input_pt} px-2.5 dark:bg-stone-700 
                                dark:border-stone-600 dark:placeholder-stone-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`;

   
    let cs =  c ? parseWidthDirective(c) : 'col-span-1';
    let ctx = context ? context : getContext('ctx');
    let can_be_activated :boolean  =true;
    
    let  last_tick = -1    

    $: setup($data_tick_store, $contextItemsStore);


    function setup(...args)
    {
        //if($data_tick_store <= last_tick)
        //    return;

        last_tick = $data_tick_store;
        item = self ?? $contextItemsStore[ctx];    

        if(!typename)
            typename = $contextTypesStore[ctx];

        //if(item && a)    
        //    val = item[a]

        if(!label)
            label = a

        tick_request_internal = tick_request_internal + 1;
        
        if(is_compact)
        {
            can_be_activated = false;

            let contexts = inContext.split(' ');
            contexts.forEach(ctx => 
            {
                if($contextItemsStore[ctx] == item)
                    can_be_activated = true;
            } )
        }
        else
            can_be_activated =  true;
    }

    onMount( () => {

        if(definition.onCollect)
            definition.onCollect().then( (source) => source_fetched(source)  )
        else if(definition.collection_expr)
            fetch_source_from_association().then((source) => source_fetched(source) )
        else if(definition.collection_path)
            get_source_collection(definition.collection_path, `${definition.collection_path}`).then((source) => source_fetched(source) )
        else if(definition.collection)
            source_fetched(definition.collection);
        
        return () => {}
    })


    afterUpdate( () => {
        if(is_dropdown_open && textbox && document.activeElement != textbox)
            textbox.focus();
    });


    function dropdown_action(node :HTMLElement)
    {
        if(is_dropdown_open)
            dropdown_height = node.getBoundingClientRect().height;

        return {
            update()
            {
                if(is_dropdown_open)
                    dropdown_height = node.getBoundingClientRect().height;
            },

            destroy()
            {

            }
        };
    }

    let on_hide_callback = undefined;

    export function show(event, hide_callback)
    {
        if(!can_be_activated)
            return;
        
        
        if(!combo)
            return;
 
        if(is_dropdown_open)
            return;

         
        if(event)
        {
            event.stopPropagation();
            event.preventDefault();
        }

        if(!!hide_callback)
            on_hide_callback = hide_callback;
        else
            on_hide_callback = undefined;

        let client_rect :DOMRect;
        client_rect = new DOMRect;
        client_rect.x = 0;
        client_rect.y = 0;
        client_rect.width = window.innerWidth;
        client_rect.height = window.innerHeight;
        
        let rect = combo.getBoundingClientRect();

        let top_space = rect.y;
        let bottom_space = client_rect.height - (rect.y + rect.height);

        let palette_max_height_px = 500;
        let palette_width_px = rect.width;
        if(palette_width_px < 120)
            palette_width_px = 120

        let preferred_palette_height = dropdown_height > 0 ? dropdown_height : palette_max_height_px;
        let preferred_palette_width = palette_width_px;

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
        else    // like bottom 
            y = rect.y + rect.height;

        if(show_fullscreen)
        {
            dropdown_position =`position: fixed; left: 0px; top: 0px; width: ${client_rect.width}px; height: ${client_rect.height}px;`;
        }
        else
        {
            dropdown_position = `min-width: ${palette_width_px}px; max-height:${palette_max_height_px}px; position: fixed; left:${x}px; top:${y}px;`;
            if(show_above)
                dropdown_position += ' transform: translate(0, -100%);'
        }

        
        /*console.log('dropdown_position', dropdown_position, rect, client_rect)
        console.log('preferred_palette_height', preferred_palette_height)
        console.log('bottom_space', bottom_space)
        console.log('top_space', top_space)
        */

        is_dropdown_open = true;
        
        if(filtered)
        {
            if(!textbox)
                return;

            textbox.innerHTML = '';
            tick_request_internal = tick_request_internal + 1;

            if(!mutation_observer)
                mutation_observer = new MutationObserver( () => { on_input_change(); })

            mutation_observer.observe(   textbox,  {
                                        childList: true,
                                        attributes: true,
                                        characterData: true,
                                        subtree: true } );
        }

        
        //filtered_source = definition.source.map( e => e);
        //highlighted_option = filtered_source.length > 0 ? filtered_source[0] : null;
    }

    export function hide()
    {
        if(mutation_observer)
            mutation_observer.disconnect();

        is_dropdown_open = false;

        combo_text = get_combo_text();
        
        if(!!textbox)
            textbox.innerHtml = combo_text;

        if(!!on_hide_callback)
            on_hide_callback();

        tick_request_internal = tick_request_internal + 1;
    }

   
    function selected_item(itm, a) :rCombo_item
    {
        let choosed_value = itm[a];

        if(typeof choosed_value === 'object' )
        {
            if(choosed_value)
            {
                let itm :rCombo_item = new rCombo_item;
                if(definition.element_key)
                    itm.Key = choosed_value[definition.element_key];
                else
                    itm.Key = choosed_value.$ref;

                if(definition.element_name)
                    itm.Name = choosed_value[definition.element_name];
                else
                    itm.Name = choosed_value.$display;

                if(icon)
                {
                    if(definition.element_avatar)
                        itm.Avatar = choosed_value[definition.element_avatar];
                    else
                        itm.Avatar = choosed_value.$icon;
                }
                
                return itm;
            }   
            else
                return null;
        }
        else
        {
            let found = definition.source.find( e => e.Key == choosed_value);
            if(!found)
                found = definition.source.find( e => e.Name == choosed_value);

            if(found)
                return found;
            else
                return null;
        }
    }

    function get_combo_text() :string
    {
        if(!is_dropdown_open)
        {
            let found = selected_item(item, a);

            if(found)
                return found.Name ?? found.Key;
            else
                return placeholder;
        }
        else
            return textbox.innerHTML;
    }

    async function on_choose(itm :rCombo_item)
    {
        //console.log('on_choose')
        hide();

        if(onSelect)
        {
            if(itm == new_item_option)
                await onNewItemCreated(itm.Key, itm.Name);
            else
                await onSelect(item, itm.Key, itm.Name);
            tick_request_internal = tick_request_internal + 1;
 }
        else
        {
            if( isAssociation )
            {
                if(choiceCallback)
                {
                    let body = {
                        choice :  itm.Key
                    }

                    let path :string;
                    if(item.$ref)
                        path = `${item.$ref}/${choiceCallback}`;
                    else
                        path = `${typename}/${item.Id}/${choiceCallback}`;

                    let fields = calc_path_fields_param();
                    if(fields)
                        path += fields;

                    let result = await reef.post(`/${path}`, body)
                    if(result)
                    {
                        let result_typename = Object.keys(result)[0];
                        item[a] = result[result_typename];

                        tick_request_internal = tick_request_internal + 1;
                    }
                    
                }
                else
                {
                    let path :string;
                    if(item.$ref)
                        path = `/${item.$ref}/set`;
                    else if(typename && item.Id)
                        path = `/${typename}/${item.Id}/set`;


                    let result = await reef.post(path, 
                                        {
                                            [a]: itm.Key
                                        });

                    if(result)
                    {

                        let name = definition.element_name ?? '$display'
                        item[a] = {
                            $ref: itm.Key,
                            [name]: itm.Name
                        }

                        tick_request_internal = tick_request_internal + 1;
                    }

                    
                }
            }
            else    // or simple property
            {
                if(choiceCallback)
                {
                    let path :string;
                    if(item.$ref)
                        path = `/${item.$ref}/${choiceCallback}`;
                    else
                        path = `/${typename}/${item.Id}/${choiceCallback}`;

                    let fields = calc_path_fields_param();
                    if(fields)
                        path += fields;

                    let value = itm.Key ?? itm.Name;

                    let result = await reef.post(path, { choice: value })
                    if(result)
                    {
                        item[a] = result;
                        tick_request_internal = tick_request_internal + 1;
                    }
                }
                else
                {
                    item[a] = itm.Key ?? itm.Name;
                    tick_request_internal = tick_request_internal + 1;

                    if(item && a && typename)
                    {
                        informModification(item, a, typename);
                        pushChanges();
                    }
                }
            }
        }

        if(!!changed)
            changed(itm.Key, itm.Name); 
    }

    function on_keydown(e)
    {
        switch(e.key)
        {
        case 'Esc':
        case 'Escape':
            hide();
            break;
        
        case 'ArrowDown':
            {
                e.cancelBubble = true;
                e.preventDefault();

                const _filtered_source = filtered_source ? filtered_source : definition.source;
                let idx = _filtered_source.findIndex( e => e==highlighted_option);
                
                if(idx < 0)
                    idx = 0;
                else if(idx < _filtered_source.length-1)
                    idx++;

                highlighted_option = _filtered_source[idx];
            }
            break;

        case 'ArrowUp':
            {
                e.cancelBubble = true;
                e.preventDefault();

                const _filtered_source = filtered_source ? filtered_source : definition.source;
                let idx = _filtered_source.findIndex( e => e==highlighted_option);
                
                if(idx < 0)
                    idx = _filtered_source.length-1;
                else if(idx > 0)
                    idx--;

                highlighted_option = _filtered_source[idx];
            }
            break;

        case 'Enter':
            {
                e.cancelBubble = true;
                e.preventDefault();

                if(highlighted_option)
                    on_choose(highlighted_option);
            }
            break;
         }
    }

    function on_input_change()
    {
        if(!is_dropdown_open)
            return;

        filtered_source = get_filtered_source();
        highlighted_option = filtered_source.length > 0 ? filtered_source[0] : null;
    }
    
    let new_item_option: rCombo_item

    function get_filtered_source() :rCombo_item[]
    {
        if(!textbox || !filtered)
            return definition.source;
        else if(textbox.innerHTML)
        {
            let result = definition.source.filter( e =>
            {
                return  (e.Name && e.Name.toLowerCase().includes( textbox.innerHTML.toLowerCase())) ||
                        (e.Key  && e.Key.toString().toLowerCase().includes(textbox.innerHTML.toLowerCase()));
            });

            if(onNewItemCreated)
            {
                if(!new_item_option)
                    new_item_option = new rCombo_item;
                let new_name :string = textbox.innerHTML
                new_item_option.Key = new_name;
                new_item_option.Name = `Create '${new_name}'`

                result = [new_item_option, ...result];
            }

            return result;
        }
        else
            return definition.source;
    }

    let sel_item = null;
    let combo_text = placeholder;
    
    let tick_request_internal = 0;
    let last_tick_internal = -1;

    function on_mouse_move(over :rCombo_item)
    {
        highlighted_option = over;
    }

    async function fetch_source_from_association() :Promise<object>
    {
        if(item.hasOwnProperty(definition.collection_expr))
        {
            let prop = item[definition.collection_expr];
            if(!prop)
                return null;
            else if(Array.isArray(prop))
                return prop;
            else if(typeof prop === 'object')
            {
                if(!prop.$ref)
                    return null;
                
                if(!prop.$col)
                    return null;

                return await get_source_collection(prop.$ref, `${typename}_${definition.collection_expr}`);
            }
            else
                return null;
        }
        else
        {
            let path :string;
            if(item.$ref)
                path = `${item.$ref}/${definition.collection_expr}`;
            else
                path = `${typename}/${item.Id}/${definition.collection_expr}`;

            return await get_source_collection(path, `${typename}_${definition.collection_expr}`);
        }
    }

    function calc_path_fields_param()
    {
        let fields :string = '?fields=';
        if(definition.element_key)
            fields += definition.element_key  
        else
            fields += '$ref';


        if(definition.element_name)
            fields += ','+definition.element_name
        else
            fields += ',$display'

        if(icon)
        {
            if(definition.element_avatar)
                fields += ',' + definition.element_avatar
            else    
                fields += ',$icon'
        }
        
        return fields;
    }

    async function get_source_collection(path :string, cache_key :string) :Promise<object>
    {
        if(!cached_sources.has(cache_key))
        {
            let promise  = new Promise<object>( async (resolve, fail) =>
            {
                let fields = calc_path_fields_param();
                if(fields)
                    path += fields;
                
                let res = await reef.get(path);
                resolve( res );
            });

            if(!cached)
                return await promise;
            else
                cached_sources.set(cache_key, promise);
        }
            
        let promise = cached_sources.get(cache_key);
        return await promise;
    }

    function source_fetched(source)
    {
        if(!source)
            return;

        let array;
        if(Array.isArray(source))
            array = source;
        else
        {
            let type = Object.keys(source)[0];
            array = source[type];
        }

        //item[definition.collection_expr] = [...array];

        definition.source = [];
        array.forEach( e =>
        {
            let el = new rCombo_item;
            if(definition.element_name)
                el.Name = e[definition.element_name];
            else if(e.$display)
                el.Name = e.$display;
            else
                el.Name = e.toString();

            if(definition.element_key)
                el.Key = e[definition.element_key];
            else if(e.$ref)
                el.Key = e.$ref;
            else
                el.Key = el.Name;

            if(icon)
            {
                if(definition.element_avatar)
                    el.Avatar = e[definition.element_avatar];
                else
                    el.Avatar = e.$icon;
            } 
            
            definition.source.push(el);
        })

        filtered_source = definition.source.map( e => e);
        highlighted_option = filtered_source.length > 0 ? filtered_source[0] : null;

    }

    function setup_view(...args)
    {
        if(tick_request_internal <= last_tick_internal)
            return;
        
        last_tick_internal = tick_request_internal;

        sel_item = selected_item(item, a);
        combo_text = get_combo_text();
        
        if(textbox)
            textbox.innerHTML = combo_text;

    }

    function on_focus_out(e)
    {
        //console.log(e)
        if(e.relatedTarget && root_element?.contains(e.relatedTarget))
        {

        }
        else
            hide();
    }


</script>

<slot/>     <!-- definition slot first -->


{#if true}
    {@const c = setup_view(item, a, tick_request_internal) }
    
<div class="{cs} max-w-full inline-block"
    on:focusout={on_focus_out}
    bind:this={root_element}>
    {#if !is_compact}
        <label for="name" class="block {label_mb} text-xs font-small text-stone-900 dark:text-white">{label}</label>
    {/if}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div    bind:this={combo}    
            on:click={(e) => { show(e, undefined) }}
            class:cursor-pointer={can_be_activated && is_compact}
            class="max-w-full {appearance_class} flex flex-row content-between items-center"
         >
            
        <div class="max-w-full flex-1 flex flex-row items-center">
            {#if !is_dropdown_open}
                {#if icon && sel_item}
                    {#if sel_item.Color}
                        <Icon size={5} circle={true} color={sel_item.Color}/>
                    {:else}
                        <Icon size={5} circle={true} symbol={sel_item.Avatar} label={sel_item.Name}/>
                    {/if}
                {/if}
            {/if}

            
            <p  bind:this={textbox}
                class="dark:text-stone-300 {line_h} truncate pl-0 pr-2.5 {background_class} min-w-[2.5rem]"
                class:ml-2={icon}
                class:text-stone-400={ (!is_dropdown_open) && (!sel_item)}
                class:text-stone-700={ is_dropdown_open || sel_item }
                class:w-10={!combo_text}
                contenteditable={is_dropdown_open && filtered}
                on:keydown={on_keydown}
                tabindex="0">
                {combo_text}</p>
        </div>
        
        {#if can_be_activated }
            <div class="w-3 h-3 no-print flex-none text-stone-700 dark:text-stone-300 {chevron_mt}">
                <FaChevronDown/>
            </div>
        {/if}
    </div>

    <div    hidden={!is_dropdown_open} 
            class="{cs} bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg border border-stone-200 dark:border-stone-700 shadow-md overflow-y-auto cursor-pointer z-30"
            style={dropdown_position}
            use:dropdown_action>
        <ul class="py-1">

            {#if definition.source && definition.source.length}
                {@const _filtered_source = filtered_source ? filtered_source : definition.source}
                {#if _filtered_source.length > 0}
                    {#each _filtered_source as item (item.Key)}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li class="rounded p-2 flex flex-row items-center {font_size}" 
                            class:bg-stone-100={highlighted_option == item}
                            class:dark:bg-stone-700={highlighted_option == item}
                            class:dark:hover:bg-stone-700={highlighted_option == item}
                            on:mousemove={() => on_mouse_move(item)}
                            on:click|preventDefault|stopPropagation={async () => await on_choose(item)}
                            tabindex="-1">

                            {#if icon}
                                {#if item.Color}
                                    <Icon size={5} circle={true} color={item.Color}/>
                                {:else if item.Avatar} 
                                    <Icon size={5} circle={true} symbol={item.Avatar}/>
                                {:else if item.Name}
                                    <Icon size={5} circle={true} label={item.Name}/>
                                {:else}
                                    <Icon size={5} circle={true}/>
                                {/if}
                            {/if}
                            <div class="ml-2">
                            {#if item.Name}
                                {item.Name}
                            {:else if item.Key}
                                {item.Key}
                            {/if}
                            </div>
                        </li>
                    {/each}
                {:else}
                    <li class="rounded p-2">No options</li>
                {/if}
            {/if}
        </ul>
    </div>
</div>
{/if}

<style>
    
[contenteditable]:focus {
    outline: 0px solid transparent;
}

@media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }

</style>
