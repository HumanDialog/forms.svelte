<svelte:options accessors={true}/>
<script lang="ts">
    import { tick, afterUpdate, onMount } from 'svelte';
    import type {Document_command} from './Document_command'
    import Pallete_row from './palette.row.svelte'
    import { createEventDispatcher } from 'svelte';
    import Icon from '../../icon.svelte'
    import { isDeviceSmallerThan, UI} from '../../../utils.js'
    import {FaTimes} from 'svelte-icons/fa'
    
    export let commands         :Document_command[];

    export let width_px        :number = 400;
    export let max_height_px   :number = 500;
    let visible         :boolean = false;
    let css_style       :string = '';

    let filtered_commands       : Document_command[] = [...commands];
    let current_command         : Document_command = (filtered_commands.length ? filtered_commands[0] : null);

    let isToolbox: boolean = false;

    const dispatch = createEventDispatcher();

    let current_editor_range = undefined;
    export function set_current_editor_range(range)
    {
        current_editor_range = range;
    }
    

    let toolboxX: number;
    let toolboxY: number;
    export function showAsToolbox(rect: DOMRect)
    {
        isToolbox = true;
        visible = true;

        const margin = 0; //15;
        const windowWidth = window.innerWidth - 2*margin;

        toolboxX = margin;
        toolboxY = rect.bottom + margin;

        //const mainContentDiv = document.getElementById('__hd_svelte_main_content_container')

        /*console.log('window.scrollY', window.scrollY, window.pageYOffset)
        console.log('window.screenTop, window.screenY', window.screenTop, window.screenY)

        
        console.log('mainContentDiv.scrollTop', mainContentDiv?.scrollTop, mainContentDiv.offsetTop, mainContentDiv.clientTop)

        let parentElement = mainContentDiv?.parentElement
        while(parentElement)
        {
            console.log('p scrollTop:', parentElement.scrollTop, parentElement.offsetTop, parentElement.clientTop);
            parentElement = parentElement.parentElement;
        }
        */

        //toolboxY += window.scrollY
        //css_style = `left:${toolboxX}px; top:${toolboxY}px;`;
        
        toolboxY += window.scrollY /*+ mainContentDiv?.scrollTop*/;
        //css_style = `position: absolute; left:${toolboxX}px; top:${toolboxY}px;`;
        css_style = `left:${toolboxX}px; top:${toolboxY}px;`;
        //console.log("toolbox: ", css_style)
        dispatch('palette_shown');
    }

    let paletteElement;
    afterUpdate(
      async () =>
      {
        // OCT-273: not only for toolbox case. Z order problems are also for large screen, full palette case
          if(/*isToolbox && */visible && paletteElement)
          {
              const layoutRoot = getLayoutElement()

              if(layoutRoot && paletteElement.parentElement != layoutRoot)
              {
                await tick();
                layoutRoot.appendChild(paletteElement)
              }
          }
      }
    )

    onMount(
        () => {

            return () => {
                
                // i.e.
                // when palette is visible and user clicks 'back' in browser nav
                // palette stays visible on screen
                if(paletteElement)
                {
                    const layoutRoot = getLayoutElement()

                    visible = false
                    if(layoutRoot && paletteElement.parentElement == layoutRoot)
                        layoutRoot.removeChild(paletteElement)
                }
            }
        }
    )

    function getLayoutElement()
    {
        let layoutRoot = document.getElementById("__hd_svelte_layout_root")
        if(!layoutRoot)
            layoutRoot = document.getElementById("app")
        return layoutRoot;
    }

    let closeButtonPos = ''
    export function show(x :number, y :number, up :boolean = false)
    {
        isToolbox = false;
        css_style = `width: ${width_px}px; max-height:${max_height_px}px; left:${x}px; top:${y}px;`;
        
        if(up)
            css_style += ' transform: translate(0, -100%);'
        //console.log("show:", css_style)
        visible = true;
        dispatch('palette_shown');

        closeButtonPos = ''

        if(isDeviceSmallerThan("sm"))
        {
            setTimeout(() => {
                const rect = paletteElement.getBoundingClientRect()
                //closeButtonPos = `right: ${15}px; top: calc(${rect.y}px - 1.75rem)`
                closeButtonPos = `right: 0.5rem; top: 0.25rem`
                console.log('closeButtonPos', closeButtonPos)
            },0)
        }


        //console.trace()
    }

    export function show_fullscreen(_width_px :number, _height_px :number)
    {
        isToolbox = false;
        width_px = _width_px;
        max_height_px = _height_px;
        css_style =`left: 0px; top: 0px; width: ${_width_px}px; height: ${_height_px}px; z-index: 1055;`;

        visible = true;
        dispatch('palette_shown');
        
    }

    export function hide()
    {
        visible = false;
        isToolbox = false;
        dispatch('palette_hidden');
    }

    export function execute_selected_command()
    {
        if(!visible)
            return;

        if(!current_command)
            return;

        hide(); // await tick here?
        current_command.on_choice(current_editor_range);
    }

    export function filter(key :string) :Document_command[]
    {
        if(!filtered_commands)
            return filtered_commands;

        let was_any_items_before = filtered_commands.length > 0;

        if(!key)
        {
            filtered_commands = [...commands];
        }
        else
        {
            filtered_commands = [];
            commands.forEach( (cmd) =>
            {
                if(cmd.separator)
                    filtered_commands.push(cmd);
                else if(cmd.caption.toLowerCase().includes(key.toLowerCase()))
                    filtered_commands.push(cmd);
                else if(cmd.tags && cmd.tags.toLowerCase().includes(key.toLowerCase()))
                    filtered_commands.push(cmd);
            });
        }

        // sprawdzamy zdefiniowany warunek widoczności
        filtered_commands = filtered_commands.filter(c => {
            if(c.is_visible)
                return c.is_visible()
            else
                return true;
        })

        // usuwamy separatory na początku i na koncu listy i zgrupowane obok siebie
        let lastSeparatorIdx = -1;
        let commandsNo = filtered_commands.length;
        for(let i=0; i<commandsNo; i++)
        {
            if(filtered_commands[i].separator == true)
            {
                if(i == 0)
                {
                    filtered_commands.splice(i, 1);
                    commandsNo--;
                    i--;
                }
                else if(lastSeparatorIdx < 0)
                    lastSeparatorIdx = i;
                else if(lastSeparatorIdx == i-1)
                {
                    filtered_commands.splice(i, 1);
                    commandsNo--;
                    i--;
                }   
                else
                    lastSeparatorIdx = i;     
            }
        }

        if(filtered_commands[commandsNo-1].separator == true)
            filtered_commands.splice(commandsNo-1, 1)

        
        // jeśli poprzednio podświetlony element znalazł się w podownie nowym zestawie to zostaje dalej jako podświetlony
        // w przeciwym wypadku podświetlamy pierwszy element na liście.
        if(!current_command || filtered_commands.every( v => v != current_command))
        {
            if(filtered_commands.length)
                current_command = get_operation_or_next_valid(0);
            else
                current_command = null;
        }


        // jeśli poprzednio nie było juz nic do wyświetlenia i tym razem też tak wyszło, wówczas zamykamy zupełnie paletę. 
        // Najwidoczniej użytkownik nie jest zainteresowany wybieraniem czegokolwiek z palety.
        if((!was_any_items_before) && (filtered_commands.length == 0))
            hide();

        return filtered_commands;
    }

    

    export function get_filtered_commands() :Document_command[]
    {
        return filtered_commands;
    }

    function get_operation_or_next_valid(idx: number) :Document_command|null
    {
        let op :Document_command|null = filtered_commands[idx];
        while(op.separator && idx < filtered_commands.length-1)
        {   
            idx++;
            op = filtered_commands[idx];
        }

        if(op.separator)
            return null;
        else
            return op;
    }

    function get_operation_or_prev_valid(idx: number) :Document_command|null
    {
        let op :Document_command|null = filtered_commands[idx];
        while(op.separator && idx > 0)
        {
            idx--;
            op = filtered_commands[idx];
        }

        if(op.separator)
            return null;
        else
            return op;
    }

    export function navigate_up()
    {
        if(!current_command)
        {
            if(filtered_commands.length > 0)
            {
                let op :Document_command|null = get_operation_or_prev_valid(filtered_commands.length-1);
                if(op)
                    update_current_command(op);
            }

            return;
        }

        let idx = filtered_commands.findIndex((c) => c == current_command);
        if(idx > 0)
        {
            let op :Document_command|null = get_operation_or_prev_valid(idx-1)
            if(op)
                update_current_command(op);
        }

    }

    export function navigate_down()
    {
        if(!current_command)
        {
            if(filtered_commands.length > 0)
            {
                let op :Document_command|null = get_operation_or_next_valid(0);
                if(op)
                    update_current_command(op);
            }
                
            return;
        }

        let idx = filtered_commands.findIndex((c) => c == current_command);
        if(idx < filtered_commands.length-1)
        {
            let op :Document_command|null = get_operation_or_next_valid(idx+1);
            if(op)
                update_current_command(op);
        }

    }

    async function execute_mouse_click(on_choice)
    {
        if(!visible)
            return;

        dispatch('palette_mouse_click')
        //await tick();
        
        hide();
        on_choice(current_editor_range);
    }

    function on_mouse_over(cmd :Document_command)
    {
        current_command = cmd;
    }

    let rows    :Pallete_row[] = [];
    
    function update_current_command(cmd :Document_command)
    {
        let prev_current = current_command;
        
        if(prev_current)
            rows.find((r) => !!r && r.cmd == prev_current).is_highlighted = false;

        if(cmd)
        {
            const row = rows.find((r) => !!r && r.cmd == cmd);
            row.is_highlighted = true;
            row?.scrollToView();
        }

        current_command = cmd;
    }

    function buttonMousedown(e: MouseEvent)
    {
        // preventDefault on mousedown avoids focusing the button
        // so it keeps focus (and text selection) 
        e.preventDefault()
    }

    let isMoving: boolean = false;
    let beforeTrackingClient: DOMPoint | null = null;
    let beforeTrackingPos: DOMPoint | null = null;
    function mousedown(e)
    {
        if(e.touches.length != 1)
            return;

        const touch = e.touches.item(0);
        beforeTrackingClient = new DOMPoint(touch.clientX, touch.clientY);
        beforeTrackingPos = new DOMPoint(toolboxX, toolboxY);
        isMoving = true;
        e.stopPropagation()
    }

    function mousemove(e)
    {
        if(isMoving && beforeTrackingClient && beforeTrackingPos)
        {
            if(e.touches.length != 1)
                return;

            const touch = e.touches.item(0);
            
            const trackDelta = new DOMPoint(touch.clientX - beforeTrackingClient.x, touch.clientY - beforeTrackingClient.y);
            
            toolboxX = beforeTrackingPos.x + trackDelta.x;
            //toolboxY = beforeTrackingPos.y + trackDelta.y;

            //css_style = `position: absolute; left:${toolboxX}px; top:${toolboxY}px;`;
            css_style = `left:${toolboxX}px; top:${toolboxY}px;`;
            e.stopPropagation()
        }
    }

    function mouseup(e)
    {
        isMoving = false;
        beforeTrackingClient = null
        beforeTrackingPos = null
    }


    function isRowActive(cmd)
    {
        if(cmd.is_active)
            return cmd.is_active()
        else
            return false;
    }

   
    
</script>

{#if isToolbox}
    <menu   class="  bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg border border-stone-200 dark:border-stone-700 shadow-md 
                    z-40
                    flex flex-row flex-nowrap fixed"
            style={css_style}
            hidden={!visible}
            on:touchstart={mousedown}
            on:touchmove={mousemove}
            on:touchend={mouseup}
            bind:this={paletteElement}>
        {#if filtered_commands && filtered_commands.length}
            {#each filtered_commands as cmd, idx (cmd.caption)}
                {#if !cmd.separator}
                    {@const id = "cpi_" + idx}
                    {@const mobile = isDeviceSmallerThan("sm")}
                    {@const icon_placeholder_size = mobile ? 12 : 10}
                    {@const active=isRowActive(cmd)}
                    <button class="font-medium m-0 py-2 mr-4 text-lg sm:text-sm w-full text-left flex flex-row cursor-context-menu focus:outline-none"
                            class:dark:bg-stone-700={active}
                            class:bg-stone-300={active}
                            {id}
                            bind:this={rows[idx]}
                            on:click={ () => { execute_mouse_click(cmd.on_choice); }}
                            on:mousedown={buttonMousedown}>
                    
                        <div class="flex items-center justify-center mt-1 sm:mt-0.5" style:width={`${icon_placeholder_size*0.25}rem`}>
                            {#if cmd.icon}
                                {@const cc = mobile ? 7 : 6}
                                {@const default_icon_size = icon_placeholder_size - cc}
                                {@const icon_size = cmd.icon_size ? cmd.icon_size : default_icon_size}
                                <Icon s="md" component={cmd.icon}/>
                            {/if}
                        </div>
                    </button>
                {/if}
            {/each}
        {/if}
    </menu>
{:else}
    <!--div hidden={!visible}-->

        <div    hidden={!visible}
                class=" bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg border border-stone-200 dark:border-stone-700 shadow-md 
                        z-40 fixed"
                id="__hd_FormattingPalette"
                bind:this={paletteElement}
                style={css_style} >

             {#if visible &&  closeButtonPos}
                {#key closeButtonPos}
                    <button class="     text-stone-800 dark:text-stone-400
                                        fixed w-6 h-6 flex items-center justify-center
                                        focus:outline-none font-medium  text-sm text-center" 
                            style={closeButtonPos}
                            on:mousedown={buttonMousedown}
                            on:click={ () => hide() }>  <!-- rounded-full text-stone-500 bg-stone-200/70 hover:bg-stone-200  dark:text-stone-500 dark:bg-stone-700/80 dark:hover:bg-stone-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 -->
                        <Icon component={FaTimes} s="md"/>
                    </button>
                {/key}
            {/if}

            <div class="w-full overflow-y-auto overscroll-contain" style="max-height: {max_height_px}px">

                {#if filtered_commands && filtered_commands.length}
                    {#each filtered_commands as cmd, idx }
                        {#if cmd.separator}
                            {#if idx>0 && idx<filtered_commands.length-1}   <!-- not first or last place -->
                                <hr class="mx-4 my-1 border-stone-300 dark:border-stone-700"/>
                            {/if}
                        {:else}
                            {@const id = "cpi_" + idx}
                            {@const active=isRowActive(cmd)}
                            <Pallete_row    {id}
                                            cmd={cmd}
                                            is_highlighted={cmd == current_command}
                                            on:click={ () => { execute_mouse_click(cmd.on_choice); }}
                                            on:mousemove={ () => { on_mouse_over(cmd); }}
                                            on:mousedown={buttonMousedown}
                                            bind:this={rows[idx]}
                                            {active}
                                            />
                        {/if}
                    {/each}
                {:else}
                    <p class="text-sm text-stone-500">No results</p>
                {/if}
            </div>

        </div>
    <!---/div-->
    
    
{/if}

