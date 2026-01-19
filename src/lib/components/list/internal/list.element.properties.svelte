
<script lang="ts">
    import RIcon from '$lib/components/r.icon.svelte';
    import {getNiceStringDate} from '../../date_utils'
    import DatePicker from '../../date.svelte'
    import Combo from '../../combo/combo.svelte'

    export let self;
    export let properties:  object | undefined = undefined;
    export let icons_size = 's';



    function properties_visible(group)
    {
        if(!group)
            return false;

        if(group.length > 0)
        {
            let prop = group[0]
            if(prop[0]=='#' || prop[0] == '&' || prop[0] == ':')
                prop = prop.substr(1)
            else if(prop[0] == '^')
                prop = prop_combo_a(prop)
            
            if(self[prop])
                return true
        }
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
        if(properties_visible(properties.r))
            return true;

        return false;
    }


    function prop_is_text(prop)
    {
        if(prop[0]!='#' && prop[0] != '&' && prop[0] != ':' && prop[0] != '^')
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

    function prop_is_date(prop)
    {
        if(prop[0]==':' )
            return true;
        return false;
    }

    function prop_is_combo(prop)
    {
        if(prop[0]=='^' )
            return true;
        return false;
    }

    function prop_combo_a(prop)
    {
        const segments = prop.split(';')
        if(segments.length < 2)
            return null
        const a = segments[0].substr(1)
        return a
    }

    function prop_combo_info(prop)
    {
        const segments = prop.split(';')
        if(segments.length < 2)
            return null

        let entries = []

        const a = segments[0].substr(1)
        const collection_a = segments[1]
        
        let name_a = 'Name'
        if(segments.length > 2)
            name_a = segments[2]

        let key_a = '$ref'
        if(segments.length > 3)
            key_a = segments[3]

        const isAssoc = key_a == '$ref'

        if(collection_a[0] == '#')
        {
            // todo
        }
        else
        {
            entries = self[collection_a]
        }

        let combo_info = {
            a: a,
            def: {
                source: [],
                collection: entries, 
                element_key: key_a,
                element_name: name_a
            },
            association: isAssoc
        }

        return combo_info
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
            {:else if prop_is_date(prop)}
                <DatePicker {self} a={prop.substr(1)} typo compact inContext="props"/>
            {:else if prop_is_combo(prop)}
                {@const info=prop_combo_info(prop)}
                {#if info}
                <Combo compact typo inContext="props"
                        {self} a={info.a}
                        isAssociation={info.association}
                        definition={info.def}/>
                {/if}
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
            {:else if prop_is_date(prop)}
                <DatePicker {self} a={prop.substr(1)} typo compact inContext="props"/>
            {:else if prop_is_combo(prop)}
                {@const info=prop_combo_info(prop)}
                {#if info}
                <Combo compact typo inContext="props"
                        {self} a={info.a}
                        isAssociation={info.association}
                        definition={info.def}/>
                {/if}
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
            {:else if prop_is_date(prop)}
                <DatePicker {self} a={prop.substr(1)} typo compact inContext="props"/>
            {:else if prop_is_combo(prop)}
                {@const info=prop_combo_info(prop)}
                {#if info}
                <Combo compact typo inContext="props"
                        {self} a={info.a}
                        isAssociation={info.association}
                        definition={info.def}/>
                {/if}
            {:else}
                <span>{prop}</span>
            {/if}
        {/each}
        </div>
    {/if}

</div>
{/if}
