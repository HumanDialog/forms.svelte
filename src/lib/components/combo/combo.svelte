<script lang="ts">
    import {data_tick_store, context_items_store, context_types_store} from '../../stores.js' 
    import {inform_modification, push_changes} from '../../updates.js'
    import {parse_width_directive,should_be_comapact} from '../../utils.js'
    import {afterUpdate, getContext, setContext} from 'svelte';
    import {rCombo_definition, rCombo_item, cached_sources} from './combo'
    import FaChevronDown from 'svelte-icons/fa/FaChevronDown.svelte'
    import Icon from '../icon.svelte'
    import { Auth } from '@humandialog/auth.svelte/dist/index.js';

    export let label = ''
    export let self = null;
    export let a = '';
    export let context = ""
    export let typename = '';
    export let choice_callback = '';
    export let on_select = undefined;

    export let icon :boolean = false;

    export let placeholder = 'Choose wisely...';

    export  let s = 'sm'
    export  let c = ''

    let is_table_component :boolean = getContext('rIs-table-component');
    
    let definition :rCombo_definition = new rCombo_definition;
    setContext('rCombo-definition', definition);

    let   is_dropdown_open = false;
    let   dropdown_position      :string = '';
    let   combo;
    let   textbox;
    let   dropdown_height;
    let   filtered_source :rCombo_item[] = null;
    let   mutation_observer : MutationObserver = null;
    let   highlighted_option :rCombo_item = null;
        
    let   item = null

    let label_mb = 'mb-1' //
    let input_pt = 'pt-0.5'
    let input_pb = 'pb-1'
    
    switch (s)
    {
        case 'md':
            label_mb = 'mb-2';
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';           
            break;
    }

    let appearance_class;
    if(is_table_component)
        appearance_class = `   text-gray-900 text-sm 
                                focus:ring-primary-600 block w-full  ${input_pb} ${input_pt} px-2.5 dark:bg-gray-700 
                                dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500`;
    else
        appearance_class = `   bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                                focus:ring-primary-600 focus:border-primary-600 block w-full  ${input_pb} ${input_pt} px-2.5 dark:bg-gray-700 
                                dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`;

   
    let cs =  c ? parse_width_directive(c) : 'col-span-1';
    let ctx = context ? context : getContext('ctx');
    let can_be_activated :boolean  =true;

    let  last_tick = -1    

    $: setup($data_tick_store);


    function setup(...args)
    {
        if($data_tick_store <= last_tick)
            return;

        last_tick = $data_tick_store;
        item = self ?? $context_items_store[ctx];    

        if(!typename)
            typename = $context_types_store[ctx];

        //if(item && a)    
        //    val = item[a]

        if(!label)
            label = a

        tick_request_internal = tick_request_internal + 1;
        
        if(is_table_component)
        {
            if($context_items_store['sel'] != self)
                can_be_activated = false;
            else
                can_be_activated = true;
        }
        else
            can_be_activated =  true;
    }


    afterUpdate( () => {
        if(is_dropdown_open && textbox && document.activeElement != textbox)
            textbox.focus();
    });


    function toggle()
    {
        if(is_dropdown_open)
            hide();
        else
            show();
    }

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

    function show()
    {
        if(!can_be_activated)
            return;
        
        if(!combo)
            return;

        if(is_dropdown_open)
            return;

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
        else 
            show_fullscreen = true;

        if(false && show_fullscreen)
        {
            dropdown_position =`position: fixed; left: 0px; top: 0px; width: ${client_rect.width}px; height: ${client_rect.height}px;`;
        }
        else
        {
            dropdown_position = `width: ${rect.width}px; max-height:${palette_max_height_px}px; position: fixed; left:${x}px; top:${y}px;`;
            if(show_above)
                dropdown_position += ' transform: translate(0, -100%);'
        }

        is_dropdown_open = true;
        
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

        if(definition.collection_expr)
            fetch_source().then((source) => source_fetched(source) )
        else if(definition.on_collect)
        {
            definition.on_collect().then( (source) => source_fetched(source)  )
        }
        else
        {
            filtered_source = definition.source.map( e => e);
            highlighted_option = filtered_source.length > 0 ? filtered_source[0] : null;
        }
    }

    function hide()
    {
        if(mutation_observer)
            mutation_observer.disconnect();

        is_dropdown_open = false;

        combo_text = get_combo_text();
        textbox.innerHtml = combo_text;

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
                return !is_table_component ? placeholder : '';
        }
        else
            return textbox.innerHTML;
    }

    async function on_choose(itm :rCombo_item)
    {
        hide();

        if(choice_callback)
        {
            let body = {
                choice :
                {
                    $ref: itm.Key
                }
            }

            let path = `${typename}/${item.Id}/${choice_callback}`;
            let fields = calc_path_fields_param();
            if(fields)
                path += fields;
            
            let res = await Auth.fetch(`json/yav1/${path}`,
                            {
                                method: 'POST',
                                body: JSON.stringify(body)
                            });
            if(res.ok)
            {
                let result_item = await res.json();
                let result_typename = Object.keys(result_item)[0];
                item[a] = result_item[result_typename];
                tick_request_internal = tick_request_internal + 1;
            }
            else
                console.error(res);
        }
        else if(on_select)
        {
            await on_select(item, itm.Key, itm.Name);
            tick_request_internal = tick_request_internal + 1;
        }
        else
        {
            item[a] = itm.Key ?? itm.Name;
            tick_request_internal = tick_request_internal + 1;

            if(item && a && typename)
            {
                inform_modification(item, a, typename);
                push_changes();
            }
        }
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
    
    function get_filtered_source() :rCombo_item[]
    {
        if(!textbox)
            return definition.source;
        else if(textbox.innerHTML)
        {
            return definition.source.filter( e =>
            {
                return  (e.Name && e.Name.toLowerCase().includes( textbox.innerHTML.toLowerCase())) ||
                        (e.Key  && e.Key.toString().toLowerCase().includes(textbox.innerHTML.toLowerCase()));
            });
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

    async function fetch_source() :Promise<object>
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
            let path :string = `${typename}/${item.Id}/${definition.collection_expr}`;
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
                try
                {   
                    let fields = calc_path_fields_param();
                    if(fields)
                        path += fields;
                    
                    let res = await Auth.fetch(`json/yav1/${path}`, {
                                    method: 'POST'
                    });
                    if(res.ok)
                        resolve( await res.json() );
                    else
                        resolve(null);
                }
                catch(err)
                {
                    console.error(err);
                    resolve(null);
                }   
            });

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

        item[definition.collection_expr] = [...array];

        definition.source = [];
        array.forEach( e =>
        {
            let el = new rCombo_item;
            if(definition.element_name)
                el.Name = e[definition.element_name];
            else
                el.Name = e.$display;

            if(definition.element_key)
                el.Key = e[definition.element_key];
            else
                el.Key = e.$ref;

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

</script>

<slot/>     <!-- definition slot first -->


{#if true}
    {@const c = setup_view(item, a, tick_request_internal) }

<div class={cs}
    on:focusout={(e) => setTimeout(() => {hide()}, 100)}>
    {#if !is_table_component}
        <label for="name" class="block {label_mb} text-xs font-small text-gray-900 dark:text-white">{label}</label>
    {/if}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div    bind:this={combo}    
            on:click|preventDefault|stopPropagation={show}
            class="{appearance_class} flex flex-row content-between items-center"
         >
            
        <div class="flex-1 flex flex-row items-center">
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
                class="ml-2 dark:text-white"
                class:text-gray-400={ (!is_dropdown_open) && (!sel_item)}
                class:text-gray-700={ is_dropdown_open || sel_item }
                contenteditable={is_dropdown_open}
                on:keydown={on_keydown}>
                {combo_text}</p>
        </div>
        
        {#if can_be_activated }
            <Icon size={3} component={FaChevronDown} class="flex-none text-gray-700 dark:text-gray-200"/>
        {/if}
    </div>

    <div    hidden={!is_dropdown_open} 
            class="{cs} bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md overflow-y-auto cursor-pointer z-20"
            style={dropdown_position}
            use:dropdown_action>
        <ul class="py-1">
<!--        {#if is_dropdown_open && definition.collection_expr}
                {#await fetch_source()}
                    <p>Loading...</p>
                {:then source} 
                    {@const c = source_fetched(source)}
                {/await}
            {/if}  -->

            {#if definition.source && definition.source.length}
                {@const _filtered_source = filtered_source ? filtered_source : definition.source}
                {#if _filtered_source.length > 0}
                    {#each _filtered_source as item (item.Key)}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li class="rounded p-2 flex flex-row items-center" 
                            class:bg-gray-100={highlighted_option == item}
                            class:dark:bg-gray-700={highlighted_option == item}
                            class:dark:hover:bg-gray-700={highlighted_option == item}
                            on:mousemove={() => on_mouse_move(item)}
                            on:click|preventDefault|stopPropagation={async () => await on_choose(item)}>

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

</style>
