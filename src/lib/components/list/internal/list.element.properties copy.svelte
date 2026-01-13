
<script lang="ts">
    import RIcon from '$lib/components/r.icon.svelte';

    export let self;
    export let properties:  object | undefined = undefined;
    export let icons_size = 's';



    function properties_visible(index)
    {
        if(!properties)
            return false;
        if(properties.length == 0 )
            return false;
        if(properties.length - 1 < index )
            return false;

        if(!properties[index])
            return false;

        if(properties[index].length > 0)
            if(self[properties[index][0]])
                return true;
        return false;
    }

    function properties_line_visible()
    {

        if(!properties)
            return false;
        if(properties_visible(0))
            return true;
        if(properties_visible(1))
            return true;

        return true;
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
    {#if properties_visible(0)}
        <div class="flex flex-row text-orange-800 dark:text-orange-200">
        {#each properties[0] as prop}
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
            <div class="flex flex-row text-orange-800 dark:text-orange-200">
            <span>{prop}</span>
        </div>

    <!---------------------------------------------------------------------->
    <!--PROPERTY SECTION COPIEC 3 TIMES BECOUSE.... ------------------------>
    <!---------------------------------------------------------------------->

        <div class="flex flex-row text-orange-800 dark:text-orange-200">
            <span>{prop}</span>
        </div>


</div>
{/if}
