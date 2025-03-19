<svelte:options accessors={true}/>
<script lang="ts">
    import Icon from '../../icon.svelte'
    import type {Document_command} from './Document_command'

    export let id           :string;
    export let cmd          :Document_command;
    export let width_px     :number = 400;
    export let is_highlighted :boolean = false;
    export let active       :boolean = false;
    
    
    let icon_size = cmd.icon_size ? cmd.icon_size : 4;
    let icon_placeholder_size = icon_size + 4
    
    let cl = $$props.class ?? '';
    
    $: active_class = calculateBackground(is_highlighted, active)
        
    function calculateBackground(...args)
    {
        if(is_highlighted)
        {   
            if(active)
                return 'bg-stone-400/40 dark:bg-stone-400/40';
            else
                return 'bg-stone-400/30 dark:bg-stone-400/30';
        }
        else
        {
            if(active)
                return 'bg-stone-400/20 dark:bg-stone-400/20';
            else
                return '';
        }
    }

    let element;
    export function scrollToView()
    {
        element?.scrollIntoView({
                    block: "nearest",
                    inline: "nearest"
                });
    } 

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id={id} class="w-full text-left flex flew-row cursor-context-menu {active_class} {cl}" 
     on:click 
     on:mousemove
     on:mousedown
     bind:this={element}>
    <div class="flex items-center justify-center space-x-10 px-4 py-2 ml-12 sm:ml-0" >
        {#if cmd.icon}
            <Icon size={icon_size} component={cmd.icon}/>
        {/if}
    </div>
    
    <h4>{cmd.caption}</h4>
</div>

