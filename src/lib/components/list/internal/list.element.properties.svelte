
<script lang="ts">
    import RIcon from '$lib/components/r.icon.svelte';
    //import getNiceStringDate from

    export let self;
    export let properties:  object | undefined = undefined;
    export let icons_size = 's';



    function properties_visible(group)
    {
        if(!group)
            return false;
        if(group.length > 0)
            if(self[group[0]])
                return true;
        return false;
    }

    function properties_line_visible()
    {
        if(!properties)
            return false;
        //console.log("plf1")
        if(properties_visible(properties.l))
            return true;
        if(properties_visible(properties.c))
            return true;

        return false;
    }


    function prop_is_text(prop)
    {
        if(prop[0]!='#' && prop[0] != '&')
            return true;
        return false;
    }

    function prop_is_icon(prop)
    {
        if(prop[0]=='#' )
            return true;
        return false;
    }

    function prop_is_tnumber(prop)
    {
        if(prop[0]=='&' )
            return true;
        return false;
    }


</script>

{#if properties_line_visible() }
<div class="w-full flex flex-row justify-between">
    <!---------------------------------------------------------------------->
    <!--PROPERTY SECTION COPIEC 3 TIMES BECOUSE.... ------------------------>
    <!---------------------------------------------------------------------->
    {#if properties_visible(properties.l)}
        <div class="flex flex-row text-orange-800 dark:text-orange-200">
        {#each properties.l as prop}
            {#if prop_is_text(prop)}
                <span>{self[prop]}&nbsp</span>
            {:else if prop_is_icon(prop)}
                <span><RIcon icon={prop.substr(1)} size = {icons_size}/></span>
            {:else if prop_is_tnumber(prop)}
                <span>{ Number(self[prop.substr(1)]/1000) }</span>
            {:else}
                <span>{prop}</span>
            {/if}
        {/each}
        </div>
    {/if}
    <!---------------------------------------------------------------------->
    <!--PROPERTY SECTION COPIEC 3 TIMES BECOUSE.... ------------------------>
    <!---------------------------------------------------------------------->
    {#if properties_visible(properties.c)}
        <div class="flex flex-row text-orange-800 dark:text-orange-200">
        {#each properties.c as prop}
            {#if prop_is_text(prop)}
                <span>{self[prop]}&nbsp</span>
            {:else if prop_is_icon(prop)}
                <span><RIcon icon={prop.substr(1)} size = {icons_size}/></span>
            {:else if prop_is_tnumber(prop)}
                <span>{ Number(self[prop.substr(1)]/1000) }</span>
            {:else}
                <span>{prop}</span>
            {/if}
        {/each}
        </div>
    {/if}
    <!---------------------------------------------------------------------->
    <!--PROPERTY SECTION COPIEC 3 TIMES BECOUSE.... ------------------------>
    <!---------------------------------------------------------------------->
    {#if properties_visible(properties.r)}
        <div class="flex flex-row text-orange-800 dark:text-orange-200">
        {#each properties.r as prop}
            {#if prop_is_text(prop)}
                <span>{self[prop]}&nbsp</span>
            {:else if prop_is_icon(prop)}
                <span><RIcon icon={prop.substr(1)} size = {icons_size}/></span>
            {:else if prop_is_tnumber(prop)}
                <span>{ Number(self[prop.substr(1)]/1000) }</span>
            {:else}
                <span>{prop}</span>
            {/if}
        {/each}
        </div>
    {/if}

</div>
{/if}
