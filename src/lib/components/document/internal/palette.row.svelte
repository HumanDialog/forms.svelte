<svelte:options accessors={true}/>
<script lang="ts">
    import Icon from '../../icon.svelte'
    import type {Document_command} from './Document_command'

    export let id           :string;
    export let cmd          :Document_command;
    export let width_px     :number = 400;
    export let is_highlighted :boolean = false;
    
    let icon_placeholder_size   :number = cmd.description ? 12 : 6;
    let icon_size = cmd.icon_size ? cmd.icon_size : icon_placeholder_size - 6;
    
    let cl = $$props.class ? $$props.class : '';
    
    $: active_class = is_highlighted ? 'bg-gray-200 dark:bg-gray-700': '';

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id={id} class="font-medium m-0 p-0 text-sm w-full text-left flex flew-row cursor-context-menu {active_class} {cl}" on:click on:mousemove>
    <div class="flex items-center justify-center" style:width={`${icon_placeholder_size*0.25}rem`}>
        {#if cmd.icon}
            <Icon size={icon_size} component={cmd.icon}/>
        {/if}
    </div>
    <div class ="">
        <p>{cmd.caption}</p>
        {#if cmd.description}
            {@const shortcut_width_px = cmd.shortcut ? 80 : 0}
            <p  class="text-sm font-normal text-gray-400 dark:text-gray-500 truncate inline-block"
                style:max-width={`calc(${width_px-shortcut_width_px} - 3rem)`} >{cmd.description}</p>
        {/if}
    </div>
    {#if cmd.shortcut}
        <div class="pr-1 text-sm font-mono text-gray-500" 
             style:width={"80px"} >{cmd.shortcut}</div>
    {/if}
</div>

