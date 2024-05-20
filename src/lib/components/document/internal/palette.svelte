<svelte:options accessors={true}/>
<script lang="ts">
    import { tick } from 'svelte';
    import type {Document_command} from './Document_command'
    import Pallete_row from './palette.row.svelte'
    import { createEventDispatcher } from 'svelte';
    import Icon from '../../icon.svelte'
    import { isDeviceSmallerThan} from '../../../utils.js'

    export let commands         :Document_command[];

    export let width_px        :number = 400;
    export let max_height_px   :number = 500;
    let visible         :boolean = false;
    let css_style       :string = '';

    let filtered_commands       : Document_command[] = [...commands];
    let current_command         : Document_command = (filtered_commands.length ? filtered_commands[0] : null);

    let isToolbox: boolean = false;

    const dispatch = createEventDispatcher();
    

    let toolboxX: number;
    let toolboxY: number;
    export function showAsToolbox(rect: DOMRect)
    {
        isToolbox = true;
        visible = true;

        const margin = 15;
        const windowWidth = window.innerWidth - 2*margin;

        toolboxX = margin;
        toolboxY = rect.bottom;

        css_style = `position: fixed; left:${toolboxX}px; top:${toolboxY}px;`;

        dispatch('palette_shown');
    }

    export function show(x :number, y :number, up :boolean = false)
    {
        isToolbox = false;
        css_style = `width: ${width_px}px; max-height:${max_height_px}px; position: fixed; left:${x}px; top:${y}px;`;
        
        if(up)
            css_style += ' transform: translate(0, -100%);'

        visible = true;
        dispatch('palette_shown');
    }

    export function show_fullscreen(_width_px :number, _height_px :number)
    {
        isToolbox = false;
        width_px = _width_px;
        max_height_px = _height_px;
        css_style =`position: fixed; left: 0px; top: 0px; width: ${_width_px}px; height: ${_height_px}px; z-index: 1055;`;

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
        current_command.on_choice();
    }

    export function filter(key :string)
    {
        if(!filtered_commands)
            return;

        if(!key)
        {
            filtered_commands = [...commands];
            return;
        }

        let was_any_items_before = filtered_commands.length > 0;
        filtered_commands = [];
        commands.forEach( (cmd) =>
        {
            if(cmd.caption.toLowerCase().includes(key.toLowerCase()))
                filtered_commands.push(cmd);
            else if(cmd.tags && cmd.tags.toLowerCase().includes(key.toLowerCase()))
            filtered_commands.push(cmd);
        });

        // jeśli poprzednio podświetlony element znalazł się w podownie nowym zestawie to zostaje dalej jako podświetlony
        // w przeciwym wypadku podświetlamy pierwszy element na liście.
        if(!current_command || filtered_commands.every( v => v != current_command))
        {
            if(filtered_commands.length)
                current_command = filtered_commands[0];
            else
                current_command = null;
        }

        // jeśli poprzednio nie było juz nic do wyświetlenia i tym razem też tak wyszło, wówczas zamykamy zupełnie paletę. 
        // Najwidoczniej użytkownik nie jest zainteresowany wybieraniem czegokolwiek z palety.
        if((!was_any_items_before) && (filtered_commands.length == 0))
            hide();
    }

    export function navigate_up()
    {
        if(!current_command)
        {
            if(filtered_commands.length > 0)
            update_current_command(filtered_commands[filtered_commands.length-1]);

            return;
        }

        let idx = filtered_commands.findIndex((c) => c == current_command);
        if(idx > 0)
            update_current_command(filtered_commands[idx-1]);

    }

    export function navigate_down()
    {
        if(!current_command)
        {
            if(filtered_commands.length > 0)
                update_current_command(filtered_commands[0]);
                
            return;
        }

        let idx = filtered_commands.findIndex((c) => c == current_command);
        if(idx < filtered_commands.length-1)
            update_current_command(filtered_commands[idx+1]);

    }

    async function execute_mouse_click(on_choice)
    {
        if(!visible)
            return;

        dispatch('palette_mouse_click')
        //await tick();
        
        hide();
        on_choice();
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
            rows.find((r) => r.cmd == prev_current).is_highlighted = false;

        if(cmd)
            rows.find((r) => r.cmd == cmd).is_highlighted = true;

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

            css_style = `position: fixed; left:${toolboxX}px; top:${toolboxY}px;`;
        }
    }

    function mouseup(e)
    {
        isMoving = false;
        beforeTrackingClient = null
        beforeTrackingPos = null
    }


    
</script>

{#if isToolbox}
    <menu   class=" not-prose bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg border border-stone-200 dark:border-stone-700 shadow-md 
                    z-30
                    flex flex-row flex-nowrap"
            style={css_style}
            hidden={!visible}
            on:touchstart={mousedown}
            on:touchmove={mousemove}
            on:touchend={mouseup}>
        {#if filtered_commands && filtered_commands.length}
            {#each filtered_commands as cmd, idx (cmd.caption)}
                {@const id = "cpi_" + idx}
                {@const mobile = isDeviceSmallerThan("sm")}
                {@const icon_placeholder_size = mobile ? 12 : 10}
                <button class="font-medium m-0 py-2 pr-4 text-lg sm:text-sm w-full text-left flex flex-row cursor-context-menu focus:outline-none"
                        {id}
                        bind:this={rows[idx]}
                        on:click={ () => { execute_mouse_click(cmd.on_choice); }}
                        on:mousedown={buttonMousedown}>
                
                    <div class="flex items-center justify-center mt-1 sm:mt-0.5" style:width={`${icon_placeholder_size*0.25}rem`}>
                        {#if cmd.icon}
                            {@const cc = mobile ? 7 : 6}
                            {@const icon_size = icon_placeholder_size - cc}
                            <Icon size={icon_size} component={cmd.icon}/>
                        {/if}
                    </div>
                </button>
            {/each}
        {/if}
    </menu>
{:else}
    <div    class="not-prose bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg border border-stone-200 dark:border-stone-700 shadow-md z-30" 
            hidden={!visible}
            style={css_style}>
        {#if filtered_commands && filtered_commands.length}
            {#each filtered_commands as cmd, idx (cmd.caption)}
                {@const id = "cpi_" + idx}
                <Pallete_row    {id}
                                cmd={cmd}
                                is_highlighted={cmd == current_command}
                                on:click={ () => { execute_mouse_click(cmd.on_choice); }}
                                on:mousemove={ () => { on_mouse_over(cmd); }}
                                on:mousedown={buttonMousedown}
                                bind:this={rows[idx]}
                                />
            {/each}
        {:else}
            <p class="text-sm text-stone-500">No results</p>
        {/if}

    </div>
{/if}